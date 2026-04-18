---
name: pull-request
description: PR 생성 시 반드시 이 스킬을 사용. 커밋 히스토리에서 제목과 본문을 자동 생성하여 PR 생성. gh pr create를 직접 실행하지 말 것
model: sonnet
argument-hint: [base-branch] [--target <경로>]
allowed-tools:
  - Read
  - "Bash(git log *)"
  - "Bash(git diff *)"
  - "Bash(git push *)"
  - "Bash(git remote *)"
  - "Bash(git branch *)"
  - "Bash(git status *)"
  - "Bash(git rev-parse *)"
  # --target 사용 시 git -C <path> <subcommand> 형태
  - "Bash(git -C *)"
  - "Bash(gh *)"
  # GH_HOST=<host> gh <cmd> 형태의 환경변수 prefix 명령 허용 (GHE 호스트 지정 시 사용)
  - "Bash(GH_HOST=* gh *)"
  # --target 사용 시 서브셸로 gh 실행: (cd <path> && gh ...)
  - "Bash((cd *)"
  - "Bash(which *)"
  - "Bash(brew install *)"
  - AskUserQuestion
---

현재 브랜치의 커밋 히스토리를 분석하여 PR을 자동 생성한다.

Arguments:
- ARGS[0] (optional): 베이스 브랜치. 미지정 시 자동 감지:
  1. `git branch --list main master develop`로 존재하는 브랜치 확인
  2. `main`이 존재하면 → 베이스로 자동 선택
  3. `main`이 없으면 → 존재하는 `master`/`develop`을 선택지로 사용자에게 제시. 하나도 없으면 직접 입력 요청
- `--target <경로>`: 작업 대상 디렉토리 (optional). CWD 기준 상대 경로.
  - 예: `--target projects/my-api/worktrees/PROJ-123`
  - 예: `--target worktrees/refactor/skill-project-flag`
  - 다른 인자와 위치 무관하게 파싱 (앞/뒤 어디든 가능).
- `--label <라벨>`: PR 라벨을 직접 지정 (optional). 쉼표 구분으로 복수 지정 가능. 지정 시 자동 라벨 감지를 오버라이드한다.

## 작업 디렉토리 결정

1. `--target`이 지정되면: 해당 경로를 작업 디렉토리(`WORK_DIR`)로 사용. `test -d`로 존재 확인, 실패 시 에러.
2. `--target`이 없으면: `git rev-parse --show-toplevel`로 Git 루트를 확인하여 `WORK_DIR`로 사용.

`WORK_DIR`이 결정되면 이후 **모든 git 명령은 `git -C ${WORK_DIR}`**, **gh 명령은 `(cd ${WORK_DIR} && gh ...)`** 로 실행한다.

## 사전 확인 (반드시 순차 실행)

**Step 1** (게이트 — 반드시 순차 실행):

1. `which gh`로 gh CLI 존재 확인.
   - **없으면**: AskUserQuestion — "gh CLI가 설치되어 있지 않습니다. 설치할까요?"
     - 예 → `brew install gh` 실행 (`timeout: 300000`). 설치 실패 시 "gh 설치에 실패했습니다. PR 생성을 건너뜁니다." 출력 후 **즉시 종료**.
     - 아니오 → "PR 생성을 건너뜁니다. 수동으로 PR을 생성해주세요." 출력 후 **즉시 종료**.

2. `gh auth status`로 인증 확인.
   - **미인증이면**: "gh 인증이 필요합니다. `gh auth login`을 실행하겠습니다." 안내 후 `gh auth login` 실행.
     - 인증 완료 → 다음 단계 진행.
     - 인증 실패/취소 → "PR 생성을 건너뜁니다." 출력 후 **즉시 종료**.

**Step 2**: 아래를 순차 확인:
- Git 저장소인지 확인
- `git rev-parse --abbrev-ref HEAD`로 현재 브랜치 확인 — 결과가 `HEAD`(detached 상태)이면: "detached HEAD 상태에서는 PR을 생성할 수 없습니다. 브랜치를 checkout한 후 다시 시도해주세요." 출력 후 **즉시 종료**
- `git remote get-url origin` 으로 origin remote 존재 확인 — **없으면**: "origin remote가 설정되어 있지 않습니다. `git remote add origin <URL>`로 설정해주세요." 출력 후 **즉시 종료**
- 베이스 브랜치명 검증: `^[a-zA-Z0-9._/-]+$` 패턴 매칭. 영문자, 숫자, `-`, `_`, `.`, `/`만 허용. 그 외 문자 포함 시 "잘못된 브랜치명 형식입니다." 출력 후 즉시 종료
- 현재 브랜치가 베이스 브랜치가 아닌지 확인 — 같으면: "베이스 브랜치에서는 PR을 생성할 수 없습니다."
- 베이스 브랜치 대비 커밋이 있는지 확인 — 없으면: "PR을 생성할 커밋이 없습니다."
- 미커밋 변경사항이 있으면 경고하고, 커밋 먼저 할지 진행할지 확인

## GH_HOST 감지

```bash
git remote get-url origin
```
- URL에서 호스트를 추출한다
- `github.com`이면 → 기본값 (GH_HOST 불필요)
- 그 외 → `GH_HOST={추출된 호스트}` 설정

## 이슈 키 파싱

`.claude/rules/issue-key.md` 규칙을 따른다. 이슈 키 정규식은 `.claude/config.json`의 `issueKey.pattern`을 참조한다.

## PR 템플릿 감지

본문 생성 전에 프로젝트의 PR 템플릿을 탐색한다. 템플릿이 있으면 프로젝트의 양식을 우선 사용하고, 없으면 내장 템플릿을 사용한다.

1. `${WORK_DIR}/.github/pull_request_template.md`를 Read 시도한다.
2. **파일이 있으면**: `PROJECT_PR_TEMPLATE`에 저장. "PR 본문 생성" 단계에서 이 템플릿의 섹션 구조를 따른다.
3. **파일이 없으면**: `PROJECT_PR_TEMPLATE`은 빈 상태. 내장 템플릿을 사용한다.

## 라벨 결정

라벨은 다음 우선순위로 결정한다:

1. **`--label` 직접 지정** → 이 값만 사용 (아래 단계 건너뜀)
2. **브랜치명 패턴 매칭** → `${WORK_DIR}/.claude/config.json`의 `pullRequest.labels.branchPattern`에서 현재 브랜치명과 매칭되는 패턴의 라벨을 수집한다. 패턴은 prefix 매칭 (예: `"feature/"` → 브랜치명이 `feature/`로 시작하면 매칭).
3. **프로젝트 기본 라벨** → `pullRequest.labels.default` 배열.

2번과 3번은 합산한다 (중복 제거). config.json이 없거나 `pullRequest` 섹션이 없으면 라벨 없이 진행한다.

config.json 예시:
```json
{
  "pullRequest": {
    "labels": {
      "default": ["backend"],
      "branchPattern": {
        "feature/": ["enhancement"],
        "fix/": ["bug"],
        "hotfix/": ["bug", "urgent"]
      }
    }
  }
}
```

## PR 제목 생성

```bash
git log <base-branch>..HEAD --oneline -n 50
```

- 커밋 1개: 해당 커밋 제목을 PR 제목으로 사용
- 커밋 여러 개: 전체 변경을 한국어로 요약
- 커밋 50개 초과: `--oneline` 요약만으로 제목 생성
- 포맷: `[ISSUE-KEY] 제목` (이슈 키 있을 때) 또는 `제목`
- 50자 이내

## PR 본문 생성

```bash
git log <base-branch>..HEAD -n 50
git diff <base-branch>...HEAD --stat
```

- 커밋 50개 이하: 전체 log로 본문 작성
- 커밋 50개 초과: `--oneline` 요약과 `--stat`만으로 본문 작성

커밋 메시지와 diff 통계를 분석하여 본문 작성. 템플릿 선택은 아래 우선순위를 따른다:
1. **프로젝트 PR 템플릿** (`PROJECT_PR_TEMPLATE`이 있으면): 프로젝트 템플릿의 섹션 구조를 그대로 사용한다. 각 섹션의 플레이스홀더 텍스트를 커밋 히스토리와 diff 기반으로 채운다.
2. **프로젝트 PR 템플릿이 없으면**: 아래 "내장 템플릿"을 사용한다.

### 추가 맥락 파일 (optional)

`${WORK_DIR}/.dev/pr-context.md`가 존재하면 Read하여 본문 생성에 반영한다. 이 파일은 `/dev` 오케스트레이터 등 외부에서 비즈니스 맥락을 전달하기 위해 사용한다.

파일 구조 예시:
```
## Background
PRD/설계서에서 추출한 배경과 요구사항.

## Audit Summary
- 총 N건 (CRITICAL: n, HIGH: n, MEDIUM: n)
- [주요 발견 항목 1줄 요약]
```

- 파일이 있으면: 파일의 `## Background` 내용을 PR 본문의 Background 섹션에 우선 사용한다 (커밋 메시지 기반 추론보다 우선). 그 외 섹션(`## Audit Summary` 등)은 Checklist 앞에 삽입한다.
- 파일이 없으면: 기존대로 커밋 메시지와 diff에서 Background를 추론한다.

### 내장 템플릿

프로젝트 PR 템플릿이 없을 때 사용하는 기본 양식이다.

```
## Background
이 변경이 필요한 배경을 설명한다. 어떤 문제가 있었는지, 비즈니스 맥락은 무엇인지를
리뷰어가 코드를 읽기 전에 이해할 수 있도록 자연스러운 문장으로 서술한다.

## Summary
이 PR에서 무엇을 했는지 요약한다. 핵심 접근 방식과 설계 판단을
간결한 문장으로 설명한다. 리뷰어가 diff를 열기 전에 전체 그림을 잡을 수 있어야 한다.

## Changes
구체적으로 무엇이 바뀌었는지를 기능 단위로 설명한다. 파일 단위가 아니라
"무엇을 왜 그렇게 바꿨는지"를 문장으로 풀어쓴다.

## Checklist
- [ ] 주요 기능이 로컬에서 정상 동작하는지 확인
- [ ] 기존 테스트가 통과하는지 확인
- [ ] (해당 시) 새로운 테스트를 추가했는지 확인
- [ ] (해당 시) 마이그레이션/설정 변경이 문서화되었는지 확인
```

**작성 규칙**:
1. **문장형 서술**: 모든 섹션은 `-` bullet이 아닌 자연스러운 한국어 문장으로 쓴다. 단, Checklist는 체크박스 형태.
2. **Background ≠ Summary**: Background는 "왜(문제/맥락)", Summary는 "무엇을(해결책)". 둘을 혼합하지 않는다.
3. **Changes는 기능 단위**: 파일명 나열이 아니라 기능 관점에서 "무엇이 어떻게 바뀌었고, 왜 그 방식을 선택했는지".
4. **Checklist는 동적 생성**: 변경 내용에 따라 항목을 조정한다. 테스트가 없는 변경이면 테스트 항목 생략. 마이그레이션이 없으면 마이그레이션 항목 생략.

## PR 생성

1. 기존 PR 확인: `gh pr view --json url` — 이미 존재하면 URL을 표시하고 선택지 제시:
   - "업데이트": push 후 기존 PR 본문을 `gh pr edit`으로 갱신
   - "신규 생성": push 후 `gh pr create` (기존 PR은 열린 상태로 유지됨을 안내)
   - "취소": 스킬 종료
2. 브랜치 푸시: `git push -u origin <branch-name>` (`timeout: 120000`)
   - push 실패 시: 에러 메시지를 표시하고 "PR 생성을 건너뜁니다." 출력 후 **즉시 종료**
3. PR 생성 (`--body` 인자에 본문을 직접 전달):
   ```bash
   gh pr create --draft --base <base-branch> --title "<title>" --body "<본문 전체>" --assignee @me [--label <labels>]
   ```
   - **`--draft`는 항상 포함한다.** PR은 항상 draft 상태로 생성한다.
   - **`--assignee @me`는 항상 포함한다.** PR 생성자를 담당자로 자동 지정한다.
   - **`--label`**: "라벨 결정" 단계에서 라벨이 결정되었으면 `--label label1 --label label2` 형태로 추가한다. 라벨이 없으면 생략.
   - 본문에 개행이 포함되므로 쉘 문자열로 전달한다. HEREDOC 중첩(`"$(cat <<'EOF'...)"`)은 zsh에서 파싱 에러를 일으키므로 사용하지 않는다.
   - (GH_HOST가 필요하면 `GH_HOST=<host>` 환경변수 prefix)
   - gh pr create 실패 시: "PR 생성에 실패했습니다. push는 완료되었으므로 수동으로 PR을 생성해주세요." 안내 후 **즉시 종료**. push는 의도적으로 유지한다 (브랜치가 원격에 존재해야 수동 PR 생성이 가능하므로 롤백하지 않음).
4. PR URL을 사용자에게 표시
