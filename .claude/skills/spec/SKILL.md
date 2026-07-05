---
name: spec
version: 2.0.0
description: "Jira 티켓을 분석하고 구현 계획서를 작성합니다. 티켓키(예: PROJ-2850)를 주면 wiki 문서와 코드를 탐색하여 요구사항을 정리하고, 코드 스니핏이 포함된 설계 문서를 생성합니다. 승인 후 /dev --resume으로 구현을 이어갑니다. 트리거: 티켓 구현 요청, 티켓 분석, 구현 계획 수립, '이 티켓 살펴봐', 'XX-123 구현해줘', 기존 계획서 수정/검토 요청 등. .dev/ 디렉토리에 기존 계획서가 있는 상태에서 '수정해줘', '다시 봐줘' 등의 요청에도 이 스킬을 사용하라."
argument-hint: "<티켓키> [도메인힌트]  예: /spec PROJ-2850 근무지원"
allowed-tools: ["Bash(git *)", "Bash(test *)", "Bash(mkdir *)", "Bash(cp *)", "Bash(ls *)", "Bash(find *)", "Bash(pwd *)", "Bash(basename *)", "Bash(dirname *)", "Bash(which *)", "Bash(./gradlew *)", "Bash(npm *)", "Bash(bun *)", "Bash(gh *)", "Bash(GH_HOST= *)", "Read", "Edit", "Write", "Glob", "Grep", "Agent", "AskUserQuestion", "mcp__atlassian__getJiraIssue", "mcp__atlassian__searchJiraIssuesUsingJql"]
---

티켓 기반으로 wiki 문서를 탐색하고, 요구사항을 분석하여 구현 계획서를 작성하는 스킬.
계획서 승인 후 `/dev --resume`으로 구현을 위임한다. spec 자체는 구현하지 않는다.

항상 한국어로 응답한다.

## 인자

- `ARGS[0]` (필수): 티켓키 (e.g., `PROJ-2850`)
- `ARGS[1]` (선택): 도메인 힌트 (e.g., `근무지원`). wiki 디렉토리 탐색 범위를 좁힌다.

ARGS[0]이 없으면:
"티켓키를 입력해주세요. 예: `/spec PROJ-2850 근무지원`"

## 재진입 감지

스킬 진입 시 가장 먼저 `.dev/{ARGS[0]}/design.md` 존재 여부를 확인한다.

- **존재하면**: 기존 계획서가 있다. design.md를 Read하여 사용자에게 표시하고 Phase 4(검토 루프)로 바로 진입한다. Phase 1~3을 건너뛴다.
- **존재하지 않으면**: Phase 1부터 정상 진행한다.

## 전체 흐름

```
Phase 1: Wiki 탐색 + 요구사항 수집
  1.0 실행 위치 감지
  1.1 도메인 특정
  1.2 레포 특정 + base 브랜치 + CODE_ROOT 확보
  1.3 티켓 정보 수집 (Wiki 우선, Jira fallback)
  1.4 프로젝트 타입 감지 + 코드 맵 생성
Phase 2: 요구사항 분석 + 정리
Phase 3: 계획서 작성 (.dev/ 문서 생성)
Phase 4: 검토 루프 (사용자 승인 → state.md 작성 → 종료)
```

---

## Phase 1: Wiki 탐색 + 요구사항 수집

### Step 1.0: 실행 위치 감지

spec 스킬은 **command-center** 또는 **프로젝트 workspace** 또는 **일반 git repo** 세 곳에서 실행될 수 있다.

**실행 위치 판별:**
1. `test -d projects/` → **command-center에서 실행**. `CONTEXT_PATH = wiki/`.
2. `test -d main/.git` → **프로젝트 workspace에서 실행**. command-center를 역추적한다.
   - `pwd` 기준으로 상위 경로에서 `projects/` 디렉토리를 찾고, 그 형제에 `wiki/`가 있는지 확인.
   - 있으면 `CONTEXT_PATH`를 설정. 없으면 `CONTEXT_PATH` 없이 진행.
3. `git rev-parse --is-inside-work-tree` → **일반 git repo에서 실행**. `CONTEXT_PATH` 없음.
4. 모두 실패 → "Git 저장소에서 실행해주세요." 후 중단.

### Step 1.1: 도메인 특정

`CONTEXT_PATH`가 없으면 이 Step을 건너뛴다 (도메인 없이 진행).

1. **도메인 힌트가 있으면** (`ARGS[1]`): `${CONTEXT_PATH}{ARGS[1]}/` 존재 확인.
   - 존재 → 해당 도메인 사용.
   - 미존재 → 경고 후 아래 자동 탐색으로 fallback.

2. **도메인 힌트가 없으면**: 자동 탐색.
   - `${CONTEXT_PATH}*/PROJECTS.md`를 Grep하여 현재 프로젝트 레포를 참조하는 도메인을 찾는다.
   - 매칭 없으면 AskUserQuestion: 선택지 = `${CONTEXT_PATH}` 하위 도메인 목록 + "해당 없음 (Jira만 조회)".

3. 도메인이 특정되면 `glossary.md`, `architecture.md`를 Read하여 `DOMAIN_CONTEXT`에 저장한다.

### Step 1.2: 레포 특정 + base 브랜치 + CODE_ROOT 확보

실행 위치에 따라 프로젝트 레포와 base 브랜치를 확정하고, 코드 탐색 경로(`CODE_ROOT`)를 확보한다.

**A. command-center에서 실행 시:**
1. `${CONTEXT_PATH}{도메인}/PROJECTS.md`에서 레포 목록을 확인한다.
   - 레포가 1개면 자동 선택, 여러 개면 AskUserQuestion으로 선택.
2. 선택된 레포의 workspace 경로: `projects/{레포명}/`.
   - `test -d projects/{레포명}/main/.git` 확인. 없으면 "`/sync-projects`로 clone해주세요." 후 중단.
3. `PROJECT_GIT = git -C projects/{레포명}/main`.

**B. 프로젝트 workspace에서 실행 시:**
1. `PROJECT_GIT = git -C main`.

**C. 일반 git repo에서 실행 시:**
1. `PROJECT_GIT = git`.

**base 브랜치 결정:**
1. `${CONTEXT_PATH}{도메인}/PROJECTS.md`에서 선택된 레포의 `baseBranch` 컬럼을 확인한다.
   - 값이 있으면 해당 브랜치를 base로 사용.
   - 값이 없거나 PROJECTS.md가 없으면 → fallback.
2. **Fallback**: AskUserQuestion으로 base 브랜치를 확인한다.
   - `${PROJECT_GIT} branch -r --list 'origin/epic/*' 'origin/main' 'origin/master' 'origin/develop'`로 후보 조회.
   - 선택지로 제시. 직접 입력도 허용.

**CODE_ROOT 확보:**
1. `${PROJECT_GIT} worktree list`로 base 브랜치가 이미 체크아웃된 워크트리가 있는지 확인한다.
   - 있으면 → 해당 워크트리 경로를 `CODE_ROOT`로 사용. checkout/pull 불필요.
2. 없으면 → `${PROJECT_GIT} fetch origin` + `${PROJECT_GIT} checkout {base}` + `${PROJECT_GIT} pull origin {base}`.
   - `already used by worktree` 에러 발생 시 → 에러 메시지에서 워크트리 경로를 추출하여 `CODE_ROOT`로 사용.
3. command-center 실행 시 `CODE_ROOT = projects/{레포명}/main/` (또는 워크트리 경로).
   프로젝트 workspace 실행 시 `CODE_ROOT = main/` (또는 워크트리 경로).
   일반 모드 시 `CODE_ROOT = ./`.

`CODE_ROOT`는 Phase 1~4에서 코드 탐색(읽기 전용)에만 사용한다. **base 브랜치 상태의 코드**를 기준으로 탐색한다.

> **주의**: `PROJECT_GIT`는 프로젝트 레포에 대한 git 명령이다. command-center의 git 상태(브랜치, 커밋 등)는 변경하지 않는다.

### Step 1.3: 티켓 정보 수집 (Wiki 우선)

**Wiki 문서를 먼저 탐색하고, 부족할 때만 Jira를 조회한다.**

**1차: Wiki 문서 검색** (도메인이 특정된 경우):
1. `${CONTEXT_PATH}{도메인}/status.md`에서 티켓키(ARGS[0])를 Grep한다. 매칭되면 해당 항목의 상태와 관련 주제를 파악한다.
2. 도메인 하위 `*/README.md`에서 티켓키를 Grep한다. 매칭 문서가 있으면 Read.
3. 매칭 문서가 없으면 도메인 README.md에서 주제 목록을 파악하고 관련 주제 문서를 Read하여 도메인 전반을 파악한다.

**Jira 조회 판단 기준:**
- wiki 문서에서 티켓키가 매칭되고 **요구사항 상세**(단순 상태 기록이 아닌 구체적 요구사항)가 **1건 이상** 확인됨 → Jira 조회 **건너뜀**.
- status.md에 티켓 번호만 있고 요구사항 상세가 없음 → Jira 조회 **실행**.
- 티켓키가 매칭되지 않음 → Jira 조회 **실행**.

**2차: Jira 티켓 조회** (필요 시에만):
- `mcp__atlassian__getJiraIssue` (cloudId: `.claude/rules/atlassian.md`에 정의된 cloudId, issueIdOrKey: ARGS[0]).
- summary, description, acceptance criteria, 상위 이슈(epic), 하위 이슈를 수집한다.
- 조회 실패 시 경고만 표시하고 wiki 문서 결과로 계속 진행.

### Step 1.4: 프로젝트 타입 감지 + 코드 맵 생성

**프로젝트 타입 감지:**
`CODE_ROOT`에서 빌드/설정 파일을 스캔하여 프로젝트 타입을 결정한다:
- `build.gradle.kts` 또는 `build.gradle` → `kotlin-java`
- `package.json` → `nodejs`
- `pyproject.toml` 또는 `setup.py` → `python`
- 해당 없음 → `unknown`

프로젝트 타입과 `CODE_ROOT`의 최상위 2레벨 디렉토리 구조를 수집하여 `PROJECT_TYPE`과 `PROJECT_STRUCTURE`에 저장한다.

**프로젝트 규칙 로드:**
`${CODE_ROOT}/.claude/rules/` 하위 `.md` 파일을 모두 Read하여 `PROJECT_RULES`에 저장한다. 디렉토리가 없으면 빈 상태로 진행.

**코드 맵 생성:**
dev의 phase-setup Step 0.4와 동일한 방식으로 `CODE_ROOT` 기준 초기 코드 맵을 생성한다.
- wiki 문서 또는 Jira 제목에서 도메인 키워드를 추출하여 관련 코드를 Grep.
- 핵심 ≤ 5, 참조 ≤ 7, 설정 ≤ 3 파일로 제한.

---

## Phase 2: 요구사항 분석 + 정리

### Step 2.1: researcher agent로 코드 패턴 조사

기존 코드의 패턴(네이밍, 레이어 구조, DIP 적용 방식, 테스트 전략)을 사전에 조사한다. 코드 패턴 조사가 architect 설계 품질의 핵심 재료이므로, 티켓 규모와 무관하게 항상 실행한다.

`Agent(subagent_type="researcher")` — prompt:
- 티켓 정보 (Jira summary + description 또는 context에서 추출한 요구사항)
- 코드 맵
- 프로젝트 루트 경로 (`CODE_ROOT`)
- `PROJECT_RULES` (프로젝트 규칙)
- "이 티켓을 구현하려면 어떤 코드를 변경해야 하는지 조사하라. 또한 코드 맵의 핵심 파일에서 다음 패턴을 파악하라: 네이밍 컨벤션, 레이어 구조 (의존성 방향), 인터페이스/추상화 사용 방식, 테스트 전략 (단위/통합 비율, 사용 프레임워크)."

researcher 결과에서:
- 코드 맵을 갱신한다.
- 코드 패턴 요약을 `CODE_PATTERNS`에 저장한다 (architect에게 전달할 용도).

### Step 2.2: 요구사항 요약 표시

수집한 정보를 종합하여 사용자에게 표시한다:

```
## 요구사항 분석: {티켓키} - {제목}

### 티켓 정보
- 제목: {summary}
- 설명: {description 요약}
- 수용 기준: {acceptance criteria, 있으면}

### Wiki에서 확인된 사항
- 관련 문서: {매칭된 문서 목록 + 경로}
- 핵심 요구사항: {wiki에서 추출}
- 관련 정책/제약: {정책 정의서 등에서 추출, 있으면}

### 코드 영향 범위 (추정)
- {코드 맵 기반 변경 예상 파일 — 프로덕션 코드뿐 아니라 테스트 파일도 명시}

### 테스트 작성 범위
- Controller MockTest
- Service/Facade 통합테스트
- 정상/에러 케이스 구분

### 기존 코드 패턴
- {researcher가 파악한 네이밍, 레이어, 테스트 패턴 요약}

### 추가 확인 필요
- {wiki에 없거나 모호한 부분}
```

사용자에게 "요구사항 분석이 맞는지 확인해주세요. 수정/보완할 부분이 있으면 알려주세요."
- 수정 요청 → 반영 후 재표시 (최대 2회).
- 승인 → Phase 3으로. 승인된 요구사항은 Phase 3에서 architect에게 전달할 텍스트로 보관한다.

---

## Phase 3: 계획서 작성

### Step 3.1: .dev/ 디렉토리 준비

티켓키를 하위 디렉토리로 사용하여 티켓별로 문서를 격리한다.

- `mkdir -p .dev/{ARGS[0]}/`  →  `DEV_PATH = .dev/{ARGS[0]}/`

command-center에서 실행 시에도 프로젝트 레포의 main/(읽기 전용)이 아닌 command-center 루트에 생성한다.

### Step 3.2: architect agent로 구현 계획서 작성

architect에게 규칙과 코드 패턴을 사전 전달하여, 프로젝트 관례에 맞는 설계를 처음부터 만들도록 한다. 사후 교정보다 사전 주입이 설계 품질에 훨씬 효과적이다.

`Agent(subagent_type="architect")` — prompt에 다음을 포함:
- Phase 2에서 승인된 요구사항
- 코드 맵
- `PROJECT_TYPE`, `PROJECT_STRUCTURE`
- 프로젝트 루트 경로 (`CODE_ROOT`)
- `DOMAIN_CONTEXT` (glossary, architecture — 있으면)
- **`PROJECT_RULES`** (프로젝트 규칙 전문 — 네이밍, 레이어, 테스트, 컨벤션)
- **`CODE_PATTERNS`** (researcher가 파악한 기존 코드 패턴)
- "프로젝트 규칙(PROJECT_RULES)과 기존 코드 패턴(CODE_PATTERNS)을 반드시 준수하여 설계하라. 코드 스니핏의 네이밍, 레이어 의존 방향, 인터페이스 사용, 테스트 전략이 기존 코드와 일관되어야 한다."

**계획서 포맷 지시 (architect에게 전달):**
```
아래 포맷으로 구현 계획서를 작성하라. "Before" 코드는 포함하지 않는다.

## 구현 계획: {티켓키} {제목}

### 설계 규모
소형 / 중형 / 대형 (파일 수와 복잡도 기준)

### 변경 범위
| 구분 | 파일 | 설명 |
|------|------|------|
| 신규 | {경로} | {역할} |
| 수정 | {경로} | {변경 내용} |

### 구현 순서

#### Step 1: {단계명}
설명: {무엇을 왜 하는지}

**{파일경로}** (신규|수정)
\`\`\`{언어}
// 구현할 코드 또는 변경할 코드
\`\`\`

#### Step 2: ...
(모든 Step에 코드 스니핏 포함)

### 테스트 계획
- {테스트 대상}: {검증 방법}

### 주의사항
- {엣지케이스, 성능 고려, 의존성 등}
```

### Step 3.3: design-critic 설계 검증

architect의 계획서가 프로젝트 규칙과 설계 원칙(DIP, OCP 등)을 준수하는지 검증한다. 규모와 무관하게 항상 실행한다.

`Agent(subagent_type="design-critic")` — prompt:
- architect의 계획서
- Phase 2의 요구사항
- 코드 맵
- 프로젝트 루트 경로
- `PROJECT_RULES`
- `CODE_PATTERNS`
- "설계가 프로젝트 규칙을 준수하는지, SOLID 원칙(특히 DIP, OCP)을 따르는지, 네이밍/레이어 구조/테스트 전략이 기존 코드 패턴과 일관되는지 검증하라."

결과 처리:
- **MUST-ADDRESS 있음**: architect를 1회 재호출하여 지적 사항을 수정한 계획서를 받는다.
- **CONSIDER만**: 사용자에게 요약만 표시.
- **문제 없음**: "설계 검증 통과." 한 줄 안내.

### Step 3.4: 문서 저장 + 요약 표시

1. Phase 2의 요구사항을 PRD 형태로 `${DEV_PATH}prd.md`에 Write.
2. 완성된 계획서를 `${DEV_PATH}design.md`에 Write.
3. 코드 맵을 `${DEV_PATH}codemap.md`에 Write.
4. 사용자에게 **계획서 전문을 표시**하고 저장 경로를 안내한다.

```
계획서 작성 완료.
- PRD: {DEV_PATH}prd.md
- 설계: {DEV_PATH}design.md
- 코드 맵: {DEV_PATH}codemap.md

수정할 부분이 있으면 알려주세요.
```

---

## Phase 4: 검토 루프

**핵심 규칙: 사용자가 명시적으로 승인할 때까지 구현을 시작하지 않는다. "구현을 시작할까요?", "진행할까요?" 등의 제안을 하지 않는다.**

### 검토 사이클 (최대 3회 수정)

사용자의 다음 입력을 기다린다:

- **명시적 승인** ("이대로 진행", "승인", "LGTM", "ㄱㄱ" 등) → state.md 작성 → 종료.
- **수정 요청** → architect 재호출하여 반영 (`PROJECT_RULES` + `CODE_PATTERNS` 포함). `${DEV_PATH}design.md`를 갱신하고 수정된 계획서를 전문 표시. **피드백 학습**(아래)도 수행.
- **질문** → 답변. 계획서 수정이 필요하면 반영.

매 사이클에서 "수정할 부분이 있으면 알려주세요."만 덧붙인다.

3회 수정 후에도 승인이 없으면: "3회 수정했습니다. 추가 수정이 필요하시면 계속 말씀해주세요."

### 승인 시 처리

1. `${DEV_PATH}state.md`에 Write:
```yaml
phase: approved
ticket: {ARGS[0]}
title: {제목}
base: {베이스 브랜치}
project-type: {PROJECT_TYPE}
code-root: {CODE_ROOT}
project-git: {PROJECT_GIT}
context-path: {CONTEXT_PATH 또는 빈 문자열}
domain: {도메인명 또는 빈 문자열}
approved: {현재 시각}
```

2. 사용자에게 안내:
```
계획서 승인 완료.
구현을 시작하려면: /dev --resume {ARGS[0]}
```

### 피드백 학습

사용자가 계획서를 수정하면, 그 수정이 **일회성 조정인지 반복 가능한 패턴인지** 판단한다.

**반복 가능한 패턴의 예:**
- 네이밍 컨벤션 위반 (예: "Service가 아니라 CommandHandler로 해야 해")
- 레이어 구조 오류 (예: "Facade에서 직접 Repository를 호출하면 안 돼")
- 테스트 전략 수정 (예: "이 경우엔 통합테스트가 필요해")
- 설계 패턴 선호 (예: "이 도메인에선 이벤트 기반으로 해야 해")

**일회성 조정의 예:**
- 특정 파일 경로 수정
- 이 티켓에만 해당하는 비즈니스 로직 변경

**반복 패턴으로 판단되면:**
1. 프로젝트 workspace root의 `.claude/rules/` 하위에 저장한다.
   - command-center 실행 시: `projects/{레포명}/.claude/rules/`
   - 프로젝트 workspace 실행 시: `.claude/rules/` (workspace root)
   - 일반 git repo 실행 시: `.claude/rules/`
   - 기존 `design-conventions.md`가 있으면 Read로 중복 여부를 확인한 뒤, **Bash append**로 항목을 추가한다:
     `echo '\n### {요약}\n상황: ...\n교훈: ...\n' >> {rules경로}/design-conventions.md`
   - 없으면 `design-conventions.md`를 생성한다 (Write).
2. 저장 포맷:
   ```
   ### {한 줄 요약}
   상황: {어떤 설계에서 발생했는지}
   교훈: {앞으로 어떻게 해야 하는지}
   ```
3. 사용자에게 "이 피드백을 프로젝트 규칙에 저장했습니다: `{한 줄 요약}`"로 안내한다.
4. 다음 architect 호출 시 `PROJECT_RULES`에 포함되어 자동으로 반영된다.

**일회성이면** 저장하지 않고 architect 재호출에만 반영한다.

---

## 에러 처리

- Wiki 문서가 없고 Jira 조회도 실패: 사용자에게 수동으로 요구사항 입력을 요청.
- researcher/architect agent 실패: 에러 표시 후 재시도 여부 확인.
- design-critic에서 MUST-ADDRESS → architect 재호출 실패: 지적 사항을 사용자에게 표시하고 수동 수정 요청.
