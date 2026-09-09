---
name: cmux-browser
description: cmux 안에서 오른쪽(측면) 브라우저 pane을 열어 웹을 자동화한다. 사이트 열기, 페이지 상태 대기, snapshot으로 요소 탐색, 클릭/입력, 데이터 추출, 스크린샷을 포커스를 뺏지 않고 수행. 트리거 - "cmux 브라우저 열어", "오른쪽에 브라우저 띄워", "웹페이지 열어서 클릭/입력해", "사이트 스크린샷 찍어", "페이지에서 데이터 추출해", "웹 자동화". Chrome 확장(claude-in-chrome)이나 agent-browser 대신 cmux 내부 pane으로 브라우징할 때 사용.
allowed-tools:
  - "Bash(cmux:*)"
  - "Bash(jq:*)"
  - "Bash(printf:*)"
---

# cmux 브라우저 자동화

cmux 워크스페이스 안에 **브라우저 pane**을 띄우고, 그 pane을 `surface` 핸들로 조작한다.
`claude-in-chrome`(별도 Chrome 창)이나 `agent-browser`(별도 데몬)와 달리, **현재 cmux 워크스페이스의 오른쪽 측면 pane** 안에서 브라우징한다.

> **전제:** cmux 안에서 실행 중이어야 한다(`$CMUX_WORKSPACE_ID`가 설정되어 있음). 아니면 `cmux browser` 명령이 대상 워크스페이스를 찾지 못한다.

## CLI 계약을 먼저 확인하라

정확한 명령을 만들기 전에 실제로 실행될 바이너리를 확인한다. 버전에 따라 하위명령이 다를 수 있다.

```bash
cmux --version
cmux browser --help
```

명령은 두 종류로 나뉜다.

- **pane(surface) 생성**: `new-pane`, `browser open-split`, `browser open` — surface 핸들 없이 워크스페이스 범위로 동작한다.
- **기존 surface 조작**: 그 외 모든 탐색/조작/상태 명령 — 반드시 `--surface <handle>`(또는 첫 위치 인자)로 대상을 명시한다. 포커스로 대상을 추측하지 마라.

## 1. 오른쪽 측면 브라우저 pane 열기 (핵심)

사용자가 요청하는 "오른쪽 pane 브라우징"의 정본 명령이다. `--direction right`로 오른쪽에 새 pane을 만들고, `--focus false`로 현재 터미널 포커스를 유지한다.

```bash
# JSON으로 열고 surface_ref를 추출 (스크립트 권장 — --json은 전역 플래그라 하위명령 앞에 온다)
OPEN_JSON="$(cmux --json new-pane --type browser --direction right --url https://example.com --focus false)"
SURFACE="$(printf '%s' "$OPEN_JSON" | jq -r '.surface_ref // empty')"
[ -n "$SURFACE" ] || { echo 'new-pane가 surface_ref를 반환하지 않음' >&2; exit 1; }
echo "브라우저 surface: $SURFACE"   # 예: surface:31
```

반환 JSON 형태:

```json
{ "pane_ref": "pane:23", "surface_ref": "surface:31", "type": "browser",
  "window_ref": "window:1", "workspace_ref": "workspace:13" }
```

**단축형 `open-split`(주의해서 사용):** `cmux browser open-split <url>`도 분할 pane을 만들지만, **항상 새 pane을 만들지는 않는다.** 오른쪽에 형제 pane이 이미 있으면 그 안으로 들어간다(`"placement_strategy": "reuse_right_sibling"`, `"created_split": false`). 확실히 새 오른쪽 pane을 원하면 위의 `new-pane --direction right`를 써라.

```bash
# 단축형 — 재사용 동작을 감수할 때만
cmux browser open-split https://example.com     # → OK surface=surface:25 pane=pane:21 placement=split
```

> **평문 출력 형식이 다르다:** `open-split`은 `surface=surface:25`(등호), `new-pane`은 `surface:31`(공백). 파싱이 필요하면 `--json`을 써라.

## 2. 핵심 워크플로

surface를 잡았으면 그 핸들로 반복한다. **스크립트에서는 위치 인자보다 `--surface` 플래그를 써서 대상을 놓치지 않게 한다.**

```bash
cmux browser --surface "$SURFACE" get url
cmux browser --surface "$SURFACE" wait --load-state complete --timeout-ms 15000
cmux browser --surface "$SURFACE" snapshot --interactive     # ref(e1, e2 …) 획득
cmux browser --surface "$SURFACE" fill e1 --text "hello"
cmux browser --surface "$SURFACE" click e2 --snapshot-after  # 클릭 후 자동 재-snapshot
cmux browser --surface "$SURFACE" snapshot --interactive     # 이동/DOM 변화 후 재-snapshot
```

snapshot 출력 예 (요소는 `[ref=e1]` 형태로 매겨지고, 클릭/입력에 `e1`을 그대로 쓴다):

```
- document "Example Domain"
      - link "Learn more" [ref=e1]
```

**ref 수명:** ref는 페이지가 바뀌면 무효화된다(세션 내에서 재번호됨). 다음 후에는 반드시 재-snapshot 하라.
- 링크/버튼 클릭으로 페이지 이동
- 폼 제출
- 모달/드롭다운 등 동적 DOM 변화

## 3. 대기 (wait)

```bash
cmux browser --surface "$SURFACE" wait --selector "#ready" --timeout-ms 10000
cmux browser --surface "$SURFACE" wait --text "Success" --timeout-ms 10000
cmux browser --surface "$SURFACE" wait --url-contains "/dashboard" --timeout-ms 10000
cmux browser --surface "$SURFACE" wait --load-state complete --timeout-ms 15000
cmux browser --surface "$SURFACE" wait --function "document.readyState === 'complete'" --timeout-ms 10000
```

느린 페이지는 기본 타임아웃에 기대지 말고 `wait --load-state complete` 또는 특정 요소 `wait --selector`를 명시하라.

## 4. 탐색·추출·캡처

```bash
cmux browser --surface "$SURFACE" snapshot --interactive --compact   # ref 목록(간결)
cmux browser --surface "$SURFACE" get text "h1"
cmux browser --surface "$SURFACE" get url
cmux browser --surface "$SURFACE" is visible "#login"
cmux browser --surface "$SURFACE" find role button --name "Submit"
cmux browser --surface "$SURFACE" screenshot --out /tmp/page.png
```

## 5. 기존 브라우저 surface 찾기 (포커스 변경 없이)

`cmux browser identify`는 터미널에서 호출하면 `Error: invalid_params: Surface is not a browser`를 내고, surface를 줘도 `OK`만 반환해 탐색에 쓸모없다. **대신 현재 워크스페이스의 `tree`를 파싱하라** — 읽기 전용이며 포커스/선택을 바꾸지 않는다. `--all`은 다른 창과 워크스페이스의 surface까지 노출하므로 사용자가 대상 범위를 명시하지 않은 탐색에는 사용하지 마라.

```bash
cmux --json tree --workspace "$CMUX_WORKSPACE_ID" | jq -r '
  .windows[]?.workspaces[]?.panes[]?.surfaces[]?
  | select(.type == "browser")
  | [.ref, (.url // ""), (.title // "")] | @tsv'
# 출력: surface:31 <TAB> https://example.com/ <TAB> Example Domain
```

원하는 surface의 `ref`를 골라 `--surface`로 대상 지정한다. 변경·종료 명령에는 `--workspace "$CMUX_WORKSPACE_ID"`도 함께 전달한다. raw tree에는 URL·제목이 담기니 로그/붙여넣기 전에 필요하면 가려라.

## 6. pane 닫기 (정리)

작업이 끝나면 만든 pane을 닫는다.

```bash
cmux close-surface --workspace "$CMUX_WORKSPACE_ID" --surface "$SURFACE"
```

> **주의 — 반환 ref가 요청 ref와 다르다:** `close-surface --surface surface:31`이 `OK surface:32 …`처럼 **다른 ref**를 반환할 수 있다(정상). 성공 여부는 반환값이 아니라 `tree`로 재확인하라.

```bash
cmux --json tree --workspace "$CMUX_WORKSPACE_ID" | jq --arg surface "$SURFACE" -e '
  [.windows[]?.workspaces[]?.panes[]?.surfaces[]?.ref]
  | index($surface) == null' >/dev/null
# 종료 코드 0이면 대상 surface가 사라져 정리 완료
```

## WKWebView 한계 (이 빌드에서 검증됨)

cmux 브라우저는 WKWebView 기반이라 Chrome/CDP 전용 기능은 지원하지 않는다. 다음은 `not_supported`를 반환한다(0.64.22에서 확인):

- `offline true|false` → `not_supported: browser.offline.set …`
- `network requests|route|unroute` → `not_supported: browser.network.requests …`
- `trace start|stop` → `not_supported: browser.trace.start …`

대신 `click`, `fill`, `press`, `scroll`, `wait`, `snapshot`으로 처리하라.

## js_error 대응

일부 복잡한 페이지는 `snapshot --interactive`/`eval` 뒤의 JS를 거부한다. 페이지가 실제로 이동했는지 먼저 확인하고 raw text/html로 대체하라.

```bash
cmux browser --surface "$SURFACE" get url
cmux browser --surface "$SURFACE" get text body
cmux browser --surface "$SURFACE" get html body
```

여전히 실패하면 더 단순한 중간 페이지로 이동해 재시도한다. CLI와 이 문서가 어긋나면 `cmux browser --help`로 최신 계약을 다시 확인하라.

## 주의사항

- **포커스 뺏기 금지:** 생성 시 `--focus false`를 기본으로 하라. 사용자가 명시적으로 볼 필요가 없으면 현재 작업 포커스를 유지한다.
- **현재 워크스페이스를 벗어나지 마라:** 탐색과 변경에는 `--workspace "$CMUX_WORKSPACE_ID"`를 명시한다. 사용자가 다른 대상을 지정하지 않았다면 `tree --all`로 찾은 surface를 조작하지 마라.
- **사용자의 기존 pane 건드리지 마라:** `open-split`의 `reuse_right_sibling` 때문에 사용자가 이미 열어둔 브라우저 pane 안으로 들어갈 수 있다. 스모크 테스트가 필요하면 `new-pane --direction right`로 별도 pane을 만들고, `tree`로 확인 후 닫아라.
- **ref/surface 추측 금지:** 생성 명령이 반환한 값을 잡아두고, 재사용 전 `tree`로 재검증하라. 세션 내에서 ref는 재번호된다.

## 참고 문서

| 문서 | 용도 |
|------|------|
| [references/commands.md](references/commands.md) | `cmux browser` 전체 하위명령·플래그 (verbatim), agent-browser 대응 |

## 공식 스킬 참고

manaflow-ai/cmux 저장소에 유지관리되는 공식 `cmux-browser` 스킬과 설치기가 있다. 이 워크스페이스 사본 대신 공식본으로 갱신하려면:

```bash
npx --yes skills@1.5.23 add manaflow-ai/cmux --global --yes --skill cmux-browser --agent claude-code codex --copy
```
