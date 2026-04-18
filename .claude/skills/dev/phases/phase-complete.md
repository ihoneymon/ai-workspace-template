# phase-complete: 완료

각 단계가 실패하면 사용자에게 보고하고 진행 여부를 확인한다.
서브 스킬의 명령을 실행할 때: git 명령에는 `GIT_PREFIX`를, 빌드/린트/테스트 명령(`./gradlew`, `npm`, `pytest` 등)은 `PROJECT_ROOT` 디렉토리에서 실행한다.

**독립 스킬 실행 컨텍스트**: commit, pull-request 등 독립 스킬은 `GIT_PREFIX`를 인지하지 못한다. 이 스킬들의 git/빌드 명령이 올바른 저장소에서 실행되도록, 스킬 프로세스의 모든 Bash 명령을 `PROJECT_ROOT` 서브셸 안에서 실행한다: `(cd ${PROJECT_ROOT} && <명령>)`. 공유 규칙의 "빌드 명령 실행 규칙"과 동일한 원칙이며, git 명령에도 적용한다.

## 5.1 인수 검증 (ProductOwner)
PRD가 없으면 이 단계를 건너뛴다.

PRD가 있으면 (`${PROJECT_ROOT}/.dev/prd.md`), product-owner에게 인수 검증을 요청한다.

**diff 갱신**: phase-review 이후 coder 수정이 있었을 수 있으므로, `${GIT_PREFIX} add -A`로 스테이징한 후 **Diff 수집 규칙**에 따라 diff를 `DIFF_FILE`에 리다이렉트하여 갱신한다.

`Task(subagent_type="product-owner")` — prompt에 다음을 포함:
- PRD의 "요구사항" + "수용 기준" (Context Slicing 규칙 참조)
- 변경사항 diff 파일 경로 (`DIFF_FILE`) + Read 지시
- 코드 맵
- "인수 검증"으로 동작할 것

**결과를 사용자에게 요약만 보고한다** (Agent 전문 출력 금지):
- **ACCEPT**: "인수 검증 통과. 모든 [Must] 수용 기준 충족." 다음 단계 진행.
- **REJECT**: "인수 검증 미통과. [Must] 미충족 N건:" + 미충족 항목 목록만 표시. 수정 여부를 확인한다.
  - 수정 선택 → coder로 수정 후 인수 검증 1회 재실행.
  - 건너뛰기 선택 → 다음 단계 진행.

위 5.1 진입 조건에 의해 PRD 부재 또는 `--hotfix` 모드이면 이 단계 전체가 건너뛰어진다.

## 5.2 Commit
`commit` 스킬을 Read하여 프로세스를 실행한다 (lint → test → commit 일괄).

**test 실패 시 자동 수정 (1회):**
1. commit이 test 실패로 중단하면, 실패 로그와 코드 맵, PROJECT_ROOT를 `Task(subagent_type="coder")`에 전달하여 수정 요청.
2. 수정 완료 후 commit을 재호출한다.
3. 재호출도 실패하면 사용자에게 실패 목록을 보고하고 진행 여부를 확인한다.

## 5.2a 사용자 검토

커밋 완료 후, PR 생성 전에 사용자에게 검토 기회를 제공한다.

AskUserQuestion으로 확인:
- "커밋이 완료되었습니다. PR 생성 전에 코드를 검토하시겠습니까?"
- 선택지: "검토 없이 진행" / "검토 후 계속"

**"검토 없이 진행"**: 바로 5.3 PR 생성으로 진행한다.

**"검토 후 계속"**: 사용자가 다음 메시지를 보낼 때까지 대기한다.
- 사용자가 수정 요청을 하면: coder로 수정 → `${GIT_PREFIX} add -A` → `${GIT_PREFIX} commit --amend --no-edit`로 커밋에 반영. 수정 후 다시 검토 여부를 확인한다.
- 사용자가 "계속" 또는 진행 의사를 밝히면: 5.3 PR 생성으로 진행한다.

## 5.3 PR 생성

`pull-request` 스킬을 Read하여 프로세스를 실행한다. pull-request은 독립 스킬이므로 dev 컨텍스트를 알지 못한다. 오케스트레이터는 `pr-context.md` 파일을 통해 비즈니스 맥락을 전달한다.

### 5.3a pr-context.md 작성

`${PROJECT_ROOT}/.dev/pr-context.md`에 PR 본문의 원본 콘텐츠를 Write한다.

**템플릿 감지**: `${PROJECT_ROOT}/.github/pull_request_template.md`를 Read한다.

**프로젝트 PR 템플릿이 있으면**: 그 섹션 구조를 그대로 사용하여 pr-context.md를 작성한다.
- 각 섹션의 플레이스홀더 텍스트를 PRD/설계서/Trust Ledger 기반으로 채운다.
- 매핑 원칙:
  - **목적/배경 성격의 섹션** (작업목적, Background, Why 등) ← PRD의 "배경" + "요구사항" 요약
  - **내용/변경 성격의 섹션** (작업내용, Changes, Summary 등) ← 설계서의 "변경 범위" 요약
  - **부가 정보 섹션** (기타의견, Notes 등) ← 제외 범위, 참고 사항
  - **참조/이슈 섹션** (참조, Related Issues 등) ← 이슈 키로 Jira 링크 생성
  - **체크리스트 섹션** (Testing, Checklist 등) ← 변경 내용에 맞게 항목 체크
- Trust Ledger가 있으면: 부가 정보 섹션 하위에 `### 감사 요약`으로 삽입한다. 부가 정보 섹션이 없으면 마지막 콘텐츠 섹션 뒤에 삽입한다.
- 템플릿의 HTML 주석(`<!-- ... -->`)은 그대로 유지한다.
- pr-context.md가 프로젝트 템플릿 구조를 따르고 있으므로, pull-request 스킬은 pr-context.md를 PR 본문으로 직접 사용한다.

**프로젝트 PR 템플릿이 없으면**: 내장 구조를 사용한다:
```
## Background
{PRD의 "배경"과 "요구사항" 요약. --hotfix이면 ARGS[0] 사용.}

## Summary
{설계서의 "변경 범위" 요약.}

## Audit Summary
{Trust Ledger가 있으면 요약 삽입. 없으면 이 섹션 생략.}
- 총 N건 (CRITICAL: n, HIGH: n, MEDIUM: n)
- [주요 발견 항목 1줄 요약] (최대 5건)
```

### 5.3b pull-request 스킬 실행

`pull-request` 스킬의 SKILL.md를 Read하여 프로세스를 실행한다. **`--target ${PROJECT_ROOT}` 인자를 전달한다** — 이를 통해 pull-request 스킬이 워크트리의 `.claude/config.json`을 읽어 라벨을 올바르게 결정한다. `--target` 없이 실행하면 스킬이 커맨드센터 루트의 config.json을 읽어 라벨 설정이 무시된다.

pull-request 스킬은 자동으로:
- `pr-context.md`를 감지하여 본문에 반영한다
- `.github/pull_request_template.md`를 감지하여 프로젝트 템플릿을 사용한다
- `.claude/config.json`의 `pullRequest.labels` 설정으로 라벨을 결정한다
- PR을 항상 draft로 생성한다

오케스트레이터는 `gh pr create`를 직접 실행하지 않는다. 반드시 pull-request 스킬에 위임한다.

pull-request이 전제조건 미충족(gh 미설치, remote 미설정 등)으로 종료하면, 오케스트레이터는 후속 안내를 추가한다: "나중에 `/pull-request`로 PR을 생성할 수 있습니다."

## 5.4 도메인 status.md 갱신

`DOMAIN_CONTEXT`가 있고 (phase-setup에서 도메인 매칭 성공), 5.1 인수 검증이 ACCEPT이면 실행한다. 그 외에는 건너뛴다.

1. 5.1 인수 검증 결과에서 **통과한 AC 목록**을 추출한다 (예: AC-1, AC-4, AC-7).
2. 매칭된 도메인의 `wiki/{domain}/status.md`를 Read한다.
3. 통과한 AC와 일치하는 행의 상태를 `⬜`→`✅`로, PR 열에 생성된 PR 링크를 기입한다.
4. AC가 `-`인 행은 변경하지 않는다 (PR 머지 시 수동 판정).
5. Edit으로 status.md를 갱신한다.
6. 갱신 결과를 사용자에게 보고한다:
   ```
   status.md 갱신: ✅ AC-1, AC-4, AC-7 (FR-1, FR-16, FR-19)
   ```

## 5.5 wiki 환류 제안

`DOMAIN_CONTEXT`가 있으면 실행한다. 없으면 건너뛴다.

PRD와 설계서에서 wiki 갱신 후보를 추출하여 사용자에게 제안한다:

1. **glossary 후보**: PRD/설계서에 등장하는 도메인 용어 중, 현재 `glossary.md`에 없는 것을 추출한다.
2. **주제 문서 후보**: PRD 제목과 배경을 기반으로, 주제 문서 생성을 제안한다.
3. **architecture.md 갱신 후보**: 설계서에 새로운 구조적 결정(레이어, 의존관계 등)이 있으면 인덱스 갱신을 제안한다.

사용자에게 AskUserQuestion으로 제안:
- "wiki 문서에 반영할까요?" + 후보 목록 표시
- 반영 선택 → 해당 파일 Edit/Write. 주제 문서 생성 시 architecture.md 인덱스에 링크 추가.
- 건너뛰기 선택 → 다음 단계 진행.

**임의 반영 금지**: 사용자 승인 없이 wiki 문서를 수정하지 않는다.

## 5.6 진행 상태 완료
`${PROJECT_ROOT}/.dev/state.md`의 `status`를 `completed`, `phases.complete`를 `completed`로 갱신한다.

## 5.7 다음 단계

PR이 생성되었으면 완료이다. **PR 머지는 절대 실행하지 않는다** — 머지는 리뷰어가 직접 수행한다.

리뷰 수정 요청에 대비하여 작업환경 유지를 안내한다:

**워크스페이스 모드** (`PROJECT_ROOT`가 `worktrees/` 하위인 경우):
"리뷰 피드백 대응을 위해 워크트리를 유지합니다. 리뷰 완료 후 `/worktree done`으로 정리하세요."

**일반 모드** (브랜치만 사용 시):
"리뷰 피드백 대응을 위해 현재 브랜치를 유지합니다. 리뷰 완료 후 베이스 브랜치로 전환하세요."
