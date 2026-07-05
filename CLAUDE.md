# CLAUDE.md

## Command Center

팀을 위한 AI 기반 공용 작업 공간입니다.
PO, 디자이너, FE, BE 등 역할에 관계없이 이 디렉토리에서 Claude Code를 실행합니다.

한국어로 응답하세요. 코드와 커밋 메시지도 한국어를 기본으로 합니다.

---

## 3계층 지식 구조

| 계층 | 디렉토리 | 담는 것 | 언제 참조 |
|------|----------|---------|----------|
| **ontology** | `ontology/` | What(개념), Where(코드 위치), How(관계) — YAML | 코드 작업 전 항상 먼저 |
| **wiki** | `wiki/` | Why(의사결정), Rule(비즈니스 정책), Flow(시나리오) — Markdown | "왜?"가 필요할 때 |
| **code** | `projects/` | 실제 구현 | 수정/상세 확인할 때 |

### 탐색 순서 (모든 도메인 관련 요청에 적용)

1. `ontology/index.yaml`을 읽어 관련 도메인을 찾는다
2. 해당 도메인의 abox 파일(`ontology/abox/{file}`)을 읽어 개념/관계/코드 위치를 파악한다
3. 도메인 간 관계가 필요하면 `index.yaml`의 `cross_domain` 필드가 가리키는 파일을 참조한다
4. 비즈니스 정책이 필요하면 entity의 `wiki_doc`으로 이동한다
5. 코드가 필요하면 entity의 `repo` + `package`로 탐색한다
6. 새 entity/relation 작성 시에만 `ontology/tbox.yaml`로 타입/규칙을 확인한다

### 지식 축적 (대화 중 발견한 것을 놓치지 않기)

코드 탐색이나 대화 중 ontology/wiki에 없는 도메인 지식을 발견하면:
- **ontology 갱신 후보**: 새 entity, 변경된 relation, 사라진 개념 → `ontology/abox/` 수정 제안
- **wiki 갱신 후보**: 새 비즈니스 정책, 의사결정 근거 → `wiki/` 문서 작성/수정 제안
- 모든 제안은 사용자 승인 후 반영. 임의 반영 금지

상세 규칙: `ontology/` → `.claude/rules/ontology-rules.md`, `wiki/` → `.claude/rules/wiki-docs.md`

## 작업 범위

이 워크스페이스에서 Claude가 할 수 있는 작업의 범위입니다.

- **PR 생성까지만.** PR 머지(`gh pr merge` 등)는 절대 실행하지 마세요. 사용자가 직접 머지를 요청하더라도 거절하고, PR 링크를 제공하여 직접 머지하도록 안내하세요.
- 역할(PO, PD, FE, BE)에 관계없이 누구든 wiki/ontology 문서 작업, 필요시 코드 작업, PR 생성까지 동일한 흐름을 사용합니다.
