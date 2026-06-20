# AGENTS.md

Codex가 이 워크스페이스에서 작업할 때 따르는 운영 규칙입니다.

## 기본 응답

- 한국어로 응답한다.
- 코드 주석과 커밋 메시지도 한국어를 기본으로 하되, 식별자는 프로젝트 관례를 따른다.
- 변경 전에는 현재 저장소와 브랜치를 확인하고, 사용자 변경사항을 되돌리지 않는다.

## 지식 탐색 순서

도메인, 정책, 기능, 코드 변경과 관련된 요청은 바로 코드를 뒤지기 전에 아래 순서로 확인한다.

1. `ontology/index.yaml`에서 관련 도메인을 찾는다.
2. 관련 `ontology/abox/*.yaml` 파일에서 entity, relation, repo, package, wiki 위치를 확인한다.
3. 정책이나 의사결정 맥락이 필요하면 `wiki/` 문서를 확인한다.
4. 실제 구현 확인이나 수정이 필요할 때 `projects/` 하위 코드를 탐색한다.

탐색 중 ontology/wiki에 없는 도메인 지식을 발견하면 후보로 제안한다. 사용자 승인 없이 ontology/wiki를 임의로 보강하지 않는다.

## 워크스페이스 구조

- `ontology/`: 개념, 관계, 코드 위치를 담는 YAML 지식 계층이다.
- `wiki/`: 비즈니스 정책, 의사결정, 플로우를 담는 Markdown 문서 계층이다.
- `projects/`: 실제 코드 저장소들이 위치한다. 이 디렉토리는 워크스페이스 저장소의 커밋 대상이 아니다.

`projects/{repo}/`는 격리 구조로 운영한다.

```text
projects/{repo}/
├── main/       # 기본 브랜치 checkout, 읽기 전용
└── worktrees/  # 기능별 작업 브랜치
```

## 코드 수정 규칙

- `projects/*/main/`은 읽기 전용으로 취급한다.
- 프로젝트 코드는 반드시 `projects/{repo}/worktrees/{name}/` 아래에서 수정한다.
- 워크트리가 없으면 기존 `.claude/skills/worktree/SKILL.md`의 규칙을 참고해 `git worktree`로 생성한다.
- 워크스페이스 파일(`AGENTS.md`, `CLAUDE.md`, `.claude/`, `wiki/`, `ontology/` 등)을 수정할 때는 먼저 `git branch --show-current`를 확인한다.
- 워크스페이스 저장소가 `main`이면 작업 브랜치를 만든 뒤 수정한다.
- `projects/` 하위 파일을 워크스페이스 저장소에 커밋하지 않는다.

## Git 및 PR 안전 규칙

- PR 생성까지만 수행한다. PR merge는 수행하지 않는다.
- `gh pr merge`, `gh pr close`, `gh issue close`는 실행하지 않는다.
- `git push --force` 또는 `git push -f`는 실행하지 않는다.
- `git reset --hard`, `git clean`, 강제 브랜치 삭제는 사용자가 명시적으로 요청한 경우에만 실행한다.
- 커밋이나 push 전에 현재 저장소가 워크스페이스인지 프로젝트 repo인지 확인한다.
- 보호 브랜치(`main`, `master`, `develop`)에서 직접 커밋하지 않는다.

## Claude 구성 참고 방식

이 저장소에는 Claude Code용 설정이 포함되어 있다.

- `CLAUDE.md`: 워크스페이스 개요와 핵심 운영 원칙
- `.claude/rules/`: 세부 규칙
- `.claude/skills/`: Claude slash command용 절차 문서
- `.claude/hooks/`: Claude Code 권한 및 안전장치

Codex는 Claude slash command나 hook을 자동 실행하지 않는다. 다만 필요한 경우 `.claude/skills/*/SKILL.md`와 `.claude/rules/*.md`를 절차 문서로 읽고, Codex에서 실행 가능한 명령과 파일 수정으로 옮겨 수행한다.

## 역할별 작업 방식

- 코드 리뷰는 Codex가 직접 수행한다. 리뷰 요청을 받으면 버그, 회귀 위험, 누락된 테스트, 유지보수 리스크를 우선순위로 보고한다.
- `qa-manager`는 코드 리뷰어가 아니라 프로젝트 품질 관리자 역할로 참고한다. 릴리스 준비도, 테스트 전략, 품질 게이트, 결함 추적, 운영 리스크를 다룬다.
- 요구사항/PRD는 `.claude/agents/product-owner.md`를 참고한다.
- 기술 설계는 `.claude/agents/architect.md`를 참고한다.
- 설계 비판은 `.claude/agents/design-critic.md`를 참고한다.
- 보안/정책 감사는 `.claude/agents/security-auditor.md`를 참고한다.
- 조사/원인 분석은 `.claude/agents/researcher.md`를 참고한다.
- 정체 상황 우회는 `.claude/agents/hacker.md`를 참고한다.
- 복잡도 축소는 `.claude/agents/simplifier.md`를 참고한다.
- UI/UX 검토는 `.claude/agents/designer.md`를 참고한다.

## 작업 검증

- 코드 변경 후에는 해당 프로젝트의 빌드 도구와 테스트 규칙을 확인한 뒤 가능한 범위에서 검증한다.
- Kotlin/Java 프로젝트는 `build.gradle`, `build.gradle.kts`, `gradlew`를 우선 확인한다.
- Node.js 프로젝트는 `package.json`의 scripts와 lockfile을 확인한다.
- 검증을 실행하지 못했으면 이유를 최종 응답에 명확히 적는다.
