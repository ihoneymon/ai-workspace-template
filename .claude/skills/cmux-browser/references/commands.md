# cmux browser 전체 명령 레퍼런스

`cmux browser --help` 출력(0.64.22 기준)을 그대로 옮긴 것이다. 실제 값은 실행 중인 바이너리에서 `cmux browser --help`로 재확인하라.

## 대상(surface) 지정

```
cmux browser [--surface <id|ref|index> | <surface>] <subcommand> [args]
```

- `open` / `open-split` / `new` / `identify`는 surface 없이 실행 가능(워크스페이스 라우팅).
- 그 외 모든 하위명령은 surface 핸들 필요. `--surface <handle>` 또는 첫 위치 인자로 전달.
- 스크립트에서는 `--surface` 플래그 형태를 권장.

## pane 생성 (surface 불필요)

| 명령 | 설명 |
|------|------|
| `cmux new-pane --type browser --direction right --url <url> --focus false` | **오른쪽 브라우저 pane 생성(권장).** JSON에 `surface_ref`·`pane_ref` 반환. `--direction`은 left/right/up/down(기본 right) |
| `cmux browser open-split [url]` | 분할 pane. 단, 오른쪽 형제 pane이 있으면 재사용(`reuse_right_sibling`) |
| `cmux browser open [url]` | 새 브라우저 surface |
| `cmux browser new [url]` | open과 유사 |

공통 옵션: `[--workspace <id|ref|index>] [--window <id|ref|index>] [--focus <true|false>] [--profile <name|uuid>]`
`--focus`는 기본 false. workspace 생략 시 `$CMUX_WORKSPACE_ID` 사용.

전역 `--json`(예: `cmux --json new-pane …`, `cmux --json browser open-split …`)으로 구조화 출력을 얻는다. `--json`은 하위명령이 아니라 `cmux` 바로 뒤에 온다.

## surface 조작 (surface 필요)

### 상태/활성화
```
disable | enable | status
```

### 탐색
```
goto|navigate <url> [--snapshot-after]
back|forward|reload [--snapshot-after]
url|get-url
focus-webview | is-webview-focused
```

### snapshot
```
snapshot [--interactive|-i] [--cursor] [--compact] [--max-depth <n>] [--selector <css>]
```
요소는 `[ref=e1]` 형태로 매겨진다. 클릭/입력에서 `e1`을 위치 인자로 그대로 사용.

### 대기
```
wait [--selector <css>] [--text <text>] [--url-contains <text>|--url <text>]
     [--load-state <interactive|complete>] [--function <js>]
     [--timeout-ms <ms>|--timeout <seconds>]
```

### DOM 조작
```
click|dblclick|hover|focus|check|uncheck|scroll-into-view [--selector <css> | <css>] [--snapshot-after]
type|fill [--selector <css> | <css>] [--text <text> | <text>] [--snapshot-after]
press|key|keydown|keyup [--key <key> | <key>] [--snapshot-after]
select [--selector <css> | <css>] [--value <value> | <value>] [--snapshot-after]
scroll [--selector <css>] [--dx <n>] [--dy <n>] [--snapshot-after]
```
`--snapshot-after`: 조작 직후 자동 재-snapshot으로 결과 확인. 키 이름은 Playwright/W3C 규칙.

### 조회
```
get <url|title|text|html|value|attr|count|box|styles> [...]
  text|html|value|count|box|styles|attr: [--selector <css> | <css>]
  attr: [--attr <name> | <name>]
  styles: [--property <name>]
is <visible|enabled|checked> [--selector <css> | <css>]
find <role|text|label|placeholder|alt|title|testid|first|last|nth> [...]
  role: [--name <text>] [--exact] <role>
  text|label|placeholder|alt|title|testid: [--exact] <text>
  first|last: [--selector <css> | <css>]
  nth: [--index <n> | <n>] [--selector <css> | <css>]
highlight [--selector <css> | <css>]
```

### 캡처
```
screenshot [--out <path>]
```

### JavaScript
```
eval [--script <js> | <js>]
addinitscript|addscript [--script <js> | <js>]
addstyle [--css <css> | <css>]
```

### 프레임/다이얼로그/다운로드
```
frame <main|selector> [--selector <css>]
dialog <accept|dismiss> [text]
download [wait] [--path <path>] [--timeout-ms <ms>|--timeout <seconds>]
```

### 상태/저장소
```
cookies <get|set|clear> [--name <name>] [--value <value>] [--url <url>] [--domain <domain>] [--path <path>] [--expires <unix>] [--secure] [--all]
storage <local|session> <get|set|clear> [...]
state <save|load> <path>
history
```

### 탭/로깅
```
tab <new|list|switch|close|<index>> [...]
console <list|clear>
errors <list|clear>
```

### 뷰포트/에뮬레이션
```
viewport <width> <height> | reset
  1~4096 CSS 픽셀 논리 뷰포트를 pane 크기 변경 없이 에뮬레이트(aspect-fit). reset은 원복.
geolocation|geo <latitude> <longitude>
```

### 프로필/임포트
```
profiles <list|add|rename|clear|delete> [...]
import [--interactive|--non-interactive|-y|--yes] [--from <browser>] [--profile <name>]
       [--all-profiles] [--to-profile <name|uuid>] [--create-profile] [--domain <domain>]
```

## WKWebView 미지원 (이 빌드에서 `not_supported` 반환)

`--help`에는 나열되지만 이 로컬 빌드(0.64.22, WKWebView)에서 실행하면 `not_supported`를 반환한다:

```
offline <true|false>          → not_supported: browser.offline.set …
network <route|unroute|requests> …  → not_supported: browser.network.requests …
trace <start|stop> [path]     → not_supported: browser.trace.start …
```

Chrome/CDP 전용 기능이라 그렇다. `click`/`fill`/`press`/`scroll`/`wait`/`snapshot`으로 대체하라.

## pane 관리 (cmux 최상위 명령, `browser` 하위 아님)

| 명령 | 설명 |
|------|------|
| `cmux tree --all --json` | 전체 window/workspace/pane/surface 트리(읽기 전용). 브라우저 surface 탐색에 사용 |
| `cmux list-pane-surfaces --workspace <ref> --json` | 특정 워크스페이스의 surface만 조회 |
| `cmux close-surface --surface <ref>` | surface(pane) 닫기. **반환 ref가 요청 ref와 다를 수 있으니 `tree`로 재확인** |
| `cmux new-pane --type browser --direction right --url <url> --focus false` | 오른쪽 브라우저 pane 생성 |

## agent-browser 대응 참고

| agent-browser | cmux browser |
|---------------|--------------|
| `agent-browser open <url>` | `cmux browser open-split <url>` 또는 `cmux new-pane --type browser --direction right --url <url>` |
| `agent-browser snapshot -i` | `cmux browser --surface <s> snapshot --interactive` |
| `agent-browser click @e1` | `cmux browser --surface <s> click e1` |
| `agent-browser fill @e1 "x"` | `cmux browser --surface <s> fill e1 --text "x"` |
| `agent-browser get url` | `cmux browser --surface <s> get url` |
| `agent-browser screenshot f.png` | `cmux browser --surface <s> screenshot --out f.png` |
| `agent-browser close` | `cmux close-surface --surface <s>` |
| (해당 없음) | `cmux tree --all --json`로 surface 탐색 |

핵심 차이: agent-browser는 세션당 단일 암묵 브라우저, cmux는 **surface 핸들로 여러 pane을 명시 지정**한다.
