# AI Workspace Template

Claude Code를 기본 실행 환경으로 삼되, Codex, Cursor 등 다른 AI 에이전트도 함께 사용할 수 있는 팀 공용 AI 작업 공간 스타터 템플릿입니다.

PO, 디자이너, FE, BE 등 역할에 관계없이 이 디렉토리에서 AI 에이전트를 실행하고,
코드 분석, 정책 문서화, 도메인 지식 축적, 기획부터 구현까지 한 곳에서 작업합니다.

---

## 빠른 시작 (Quick Start)

### Step 1. 필수 도구 설치 (터미널)

```bash
# Homebrew (Mac 패키지 관리자)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Git, GitHub CLI, Node.js
brew install git gh node

# GitHub 인증
gh auth login

# Claude Code 설치
npm install -g @anthropic-ai/claude-code
```

### Step 2. 이 저장소 clone

```bash
git clone https://github.com/YOUR_ORG/YOUR_WORKSPACE.git my-workspace
cd my-workspace
claude
```

### Step 3. 초기 세팅

Claude Code를 사용하는 경우 프롬프트에서:

```
/setup
```

도구 설치, GitHub 인증, 프로젝트 clone을 자동으로 수행합니다.

Codex, Cursor 등 slash command를 실행하지 않는 에이전트는 `AGENTS.md`를 먼저 읽고, `.claude/skills/setup/SKILL.md`를 절차 문서로 참고해 실행 가능한 명령으로 옮겨 수행합니다.

### Step 4. 도메인 정의

```
/new-domain <도메인명>
```

Claude가 몇 가지 질문을 통해 `wiki/`와 `ontology/`에 도메인 구조를 자동 생성합니다.
비-Claude 에이전트는 `.claude/skills/new-domain/SKILL.md`의 절차를 따라 동일한 파일을 직접 생성합니다.

---

## Codex/Cursor 사용 가이드

Claude Code 외의 AI 에이전트는 루트의 `AGENTS.md`를 우선 규칙으로 사용합니다.

- slash command(`/setup`, `/worktree`, `/commit`, `/pull-request` 등)는 자동 실행하지 않습니다.
- `.claude/skills/*/SKILL.md`와 `.claude/rules/*.md`는 절차 문서로 읽고, 각 에이전트가 실행 가능한 명령과 파일 수정으로 옮겨 수행합니다.
- `.claude/hooks/*`와 `.claude/settings.json`의 권한 가드는 Claude Code에서만 자동 실행됩니다. 다른 에이전트는 `AGENTS.md`의 금지 명령, 브랜치, worktree, PR 규칙을 직접 지켜야 합니다.
- 도메인/정책/기능/코드 변경 요청은 `CLAUDE.md`의 탐색 순서대로 `ontology/index.yaml` → 관련 `ontology/abox/*.yaml` → `wiki/` → `projects/` 순으로 확인합니다.
- 프로젝트 코드는 `projects/{repo}/main/`에서 읽고, 수정은 반드시 `projects/{repo}/worktrees/{name}/`에서 수행합니다.

---

## 초기 설정 가이드

### 1. 워크스페이스 설정 (`workspace.json`)

`.claude/workspace.json`에 팀 정보와 코드 레포를 등록하세요:

```json
{
  "team": "my-team",
  "ghe_host": "github.com",
  "projects": {
    "required": [
      { "repo": "org/my-api", "desc": "백엔드 API 서버" }
    ],
    "optional": [
      { "repo": "org/my-web", "desc": "프론트엔드 웹앱" }
    ]
  }
}
```

### 2. 이슈 키 패턴 설정 (`config.json`)

`.claude/config.json`의 `issueKey.pattern`은 기본값 `^[A-Z]+-[0-9]+$`으로 설정되어 있습니다.
Jira 프로젝트 키가 다르다면 그대로 사용하면 됩니다 (예: `PROJ-123`, `ABC-456` 모두 매칭).

### 3. Atlassian 연동 (선택)

Jira를 사용하는 경우 `.claude/rules/atlassian.md`에 cloudId를 설정하세요:

```markdown
- **cloudId**: `your-cloud-id`
- **site**: `your-org.atlassian.net`
```

Atlassian MCP가 설치된 경우에만 필요합니다. 설치하지 않으면 Jira 조회 없이 wiki 문서 기반으로 작동합니다.

### 4. 배포 설정 (선택)

CI/CD 배포 자동화가 필요한 경우 `.claude/skills/deploy/references/deploy-config.yaml`에
프로젝트별 브랜치 매핑을 설정하세요.

---

## 3계층 지식 구조

v2 핵심 아키텍처입니다. 도메인 지식을 세 계층으로 분리하여 관리합니다.

| 계층 | 디렉토리 | 담는 것 | 언제 참조 |
|------|----------|---------|----------|
| **ontology** | `ontology/` | What(개념), Where(코드 위치), How(관계) — YAML | 코드 작업 전 항상 먼저 |
| **wiki** | `wiki/` | Why(의사결정), Rule(비즈니스 정책), Flow(시나리오) — Markdown | "왜?"가 필요할 때 |
| **code** | `projects/` | 실제 구현 | 수정/상세 확인할 때 |

**탐색 순서**: ontology → wiki → code. 코드를 바로 뒤지기 전에 이미 정리된 지식부터 확인합니다.

---

## 디렉토리 구조

```
ai-workspace/
├── CLAUDE.md              ← 프로젝트 소개 및 3계층 구조 정의
├── README.md              ← 지금 이 파일
├── .gitignore
│
├── .claude/
│   ├── workspace.json     ← 팀, GitHub 호스트, 프로젝트 목록
│   ├── settings.json      ← Claude Code 권한/훅 설정 (Zero Trust)
│   ├── config.json        ← 이슈키 패턴, 프로젝트 타입, 타임아웃
│   ├── rules/             ← 행동 규칙 (자동 로드)
│   ├── hooks/             ← 안전장치 (Node.js 기반)
│   ├── agents/            ← 서브에이전트 정의
│   └── skills/            ← Claude slash command 및 타 에이전트용 절차 문서
│
├── ontology/              ← 도메인 개념/관계 (YAML, 기계용)
│   ├── tbox.yaml          ← 용어 정의 (클래스, 프로퍼티, Axiom)
│   ├── index.yaml         ← 탐색 진입점 (도메인 목록)
│   └── abox/              ← 도메인별 entity + relation
│
├── wiki/                  ← 비즈니스 정책 (Markdown, 사람용)
│   ├── README.md          ← 도메인 목록 인덱스
│   ├── glossary.md        ← 공통 용어 사전
│   └── {도메인}/           ← 도메인별 wiki (/new-domain으로 생성)
│       ├── README.md      ← 도메인 개요
│       ├── architecture.md← 정책 인덱스 + 데이터 흐름
│       ├── glossary.md    ← 용어 사전
│       └── status.md      ← 구현 추적 (AC별 ✅/⬜)
│
└── projects/              ← 코드 레포 (.gitignore 대상)
    └── {name}/
        ├── main/          ← 기본 브랜치 (읽기 전용)
        └── worktrees/     ← 기능별 작업 브랜치
```

---

## 스킬 목록

| 스킬 | 설명 |
|------|------|
| `/setup` | 초기 세팅 (도구 설치, GitHub 인증, 프로젝트 clone) |
| `/sync-projects` | 레포 clone 및 최신화 |
| `/new-domain` | 새 도메인 생성 (wiki + ontology 동시) |
| `/domain-audit` | wiki/ontology 정합성 점검 |
| `/domain-cleanup` | 문서 생애주기 정리 (stale, 완료 항목) |
| `/dev` | PRD → 설계 → 구현 → 리뷰 → 커밋/PR 전체 사이클 |
| `/spec` | Jira 티켓 분석 → 구현 계획서 작성 |
| `/commit` | 한국어 커밋 메시지로 Git 커밋 |
| `/pull-request` | 커밋 히스토리 기반 PR 자동 생성 |
| `/worktree` | projects/ 코드 레포의 Git worktree 자동화 |
| `/deploy` | 소스 브랜치를 배포 브랜치에 push (CI/CD 트리거) |
| `/lens` | 코드 속 비즈니스 정책 탐지 → PO/PD 보고서 |
| `/humanizer` | AI 글쓰기 패턴 감지 및 교정 |
| `/agent-browser` | 브라우저 자동화 (탐색, 폼 입력, 스크린샷) |

---

## 사용 예시

**도메인 질의**
```
주문 도메인의 취소 정책이 어떻게 되어 있어?
```

**정책 문서 작성**
```
배송비 정책 문서 만들어줘
```

**기획부터 구현까지**
```
/spec PROJ-1234 주문취소
```

**변경사항 반영**
```
/commit
/pull-request
```

---

## 자주 묻는 질문

**Claude Code를 종료하려면?**
`Ctrl + C` 또는 `/exit`

**다음에 다시 시작하려면?**
```bash
cd my-workspace
claude
```

**이전 작업을 이어서 하고 싶으면?**
Claude Code 실행 후 `/resume`을 입력하면 이전 세션 목록이 나옵니다.

**`/setup`을 다시 실행해도 되나요?**
네. 이미 설치된 것은 건너뛰고, 새로 추가된 것만 처리합니다.

**도메인을 여러 개 추가하려면?**
`/new-domain <도메인명>`을 원하는 만큼 반복 실행하세요.
각 도메인은 독립적인 `wiki/` 디렉토리와 `ontology/abox/` 파일로 관리됩니다.

---

## 안전장치

이 워크스페이스에는 Claude의 위험한 동작을 막는 안전장치가 내장되어 있습니다. Codex/Cursor 등은 이 훅이 자동 실행되지 않으므로 `AGENTS.md`의 안전 규칙을 직접 따릅니다:

- **branch-guard**: main/master 브랜치에 직접 커밋/push 차단
- **pre-tool-use**: 파일 쓰기 경로 기반 허용/차단
- **permission-handler**: Bash 명령 안전성 판단 (서브셸, 체인, 루프 분석)
- **Zero Trust 권한**: 명시적 허용 목록 외 모든 도구 차단
- **PR 머지 금지**: `gh pr merge` 명령 실행 불가 (사용자가 직접 머지)
