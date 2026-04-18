/**
 * 훅 공유 설정 — 상수 + 유틸
 *
 * 모든 훅(branch-guard, pre-tool-use, permission-handler)이 이 파일을 참조한다.
 * 허용 경로, 보호 브랜치, 명령 패턴 등을 한 곳에서 관리한다.
 */

import { execSync } from 'node:child_process';
import { resolve, relative, dirname } from 'node:path';

// ============================================================================
// 경로 패턴
// ============================================================================

/** 쓰기 허용 경로 (CC_ROOT 기준 상대경로) */
export const WRITE_ALLOW_PATTERNS = [
  // 워크트리
  /^worktrees\//,
  /^projects\/[^/]+\/worktrees\//,
  /^projects\/[^/]+\/[^/]+\/worktrees\//,
  // CC 워크스페이스 파일 (문서, 설정, 스킬 등)
  /^\.claude\//,
  /^wiki\//,
  /^ontology\//,
  /^context\//,
  /^\.github\//,
  /^\.dev\//,
  // 세션/임시 디렉토리
  /^\.lens\//,
  /^\.slack-digest\//,
  // 루트 레벨 설정 파일
  /^[^/]+\.(md|json|yaml|yml)$/,
  /^\.gitignore$/,
  /^\.mcp\.json$/,
];

// ============================================================================
// 보호 브랜치
// ============================================================================

export const PROTECTED_BRANCHES = /^(develop|main|master)$/;

// ============================================================================
// Bash 명령 패턴
// ============================================================================

/** 환경변수 prefix: VAR=value cmd 또는 env VAR=value cmd */
export const ENV_PREFIX = /^(env\s+)?([a-zA-Z_][a-zA-Z_0-9]*=[^\s]*\s+)+/;

/** 쉘 메타문자 — 있으면 복합 명령이므로 단순 파싱 불가 */
export const DANGEROUS_SHELL_CHARS = /[;&|`$()<>\n\r\t\0\\]/;

/** 자동 허용 패턴 — 경로 검증 없이 어디서든 허용. 읽기 명령 + 비파괴적 쓰기(PR/이슈 생성, git pull) */
export const SAFE_COMMANDS = [
  /^git\s+(-C\s+\S+\s+)?(status|diff|log|branch|show|fetch|rev-parse|show-ref|remote|ls-files|ls-tree|cat-file|describe|tag\s+-l|symbolic-ref|config\s+--get|stash\s+list|pull)\b/,
  /^(ls|cat|head|tail|wc|test|find|grep|sort|diff|pwd|which|command|basename|dirname|realpath|date|file|uuidgen|stat|du|df|id|whoami|printenv|lsof|ps)\b/,
  /^sed\s+(?!-i\b)/,
  /^(awk|tr|cut|jq|diffstat|md5|uniq|column)\b/,
  /^cd\s/,
  /^echo\s/,
  /^gh\s+(pr|issue|run|repo)\s+(view|list|checks|diff|status|create|edit|comment)\b/,
  /^gh\s+auth\s+status\b/,
  /^gh\s+api\s+(?!.*(-X\s+(POST|PUT|DELETE|PATCH)|--method\s+(POST|PUT|DELETE|PATCH)))/,
];

/** 빌드/테스트 */
export const BUILD_TEST = [
  /^\.\/gradlew\s/,
  /^npm\s+(test|run|install|ci|exec|ls|outdated|audit)/,
  /^npx\s/,
  /^bun\s+(test|run|install|add|remove|x|pm)/,
  /^bunx\s/,
  /^yarn\s+(test|run|install|add|remove)/,
  /^pnpm\s+(test|run|install|add|remove|exec)/,
  /^pytest/,
  /^python3?\s+-m\s+pytest/,
  /^tsc(\s|$)/,
  /^eslint\s/,
  /^prettier\s/,
  /^\.\/node_modules\/\.bin\//,
  /^ruff\s/,
];

/** Git 쓰기 (위험하지 않은 것만, push 포함 — 보호 브랜치는 branch-guard에서 deny) */
export const GIT_WRITE = [
  /^git\s+(-C\s+\S+\s+)?(add|commit|push|checkout|switch|stash|merge|rebase|cherry-pick|reset(?!\s+--hard)|worktree|restore|tag(?!\s+-l))\b/,
];

/** 파일 쓰기 */
export const FILE_WRITE = /^(mkdir|cp|mv|rm|touch|chmod|ln|rsync|tee)\b/;

/** 금지 키워드 — 단일 소스. 앵커 없이 정의하여 어디서든 매칭 가능 */
const DENY_KEYWORDS = [
  /gh\s+pr\s+(merge|close|reopen|review)/,
  /gh\s+issue\s+(close|reopen)/,
  /gh\s+api\s+.*(-X\s+(POST|PUT|DELETE|PATCH)|--method\s+(POST|PUT|DELETE|PATCH))/,
];

/** 금지 패턴 → 단순 명령 매칭 (^ 앵커 추가). DENY_KEYWORDS에서 자동 생성 */
export const DENY_PATTERNS = DENY_KEYWORDS.map(r =>
  new RegExp('^' + r.source, r.flags)
);

/** 금지 키워드 → 명령 전체 문자열 검색 (서브셸, 인터프리터 내부 포함). DENY_KEYWORDS 그대로 사용 */
export const DENY_ANYWHERE = DENY_KEYWORDS;

/** 위험 패턴 → 사용자 확인 (pass-through) */
export const DANGEROUS = [
  /^git\s+(-C\s+\S+\s+)?reset\s+--hard\b/,
  /^git\s+(-C\s+\S+\s+)?clean\b/,
  /^git\s+(-C\s+\S+\s+)?branch\s+-[dD]\b/,
  /^git\s+(-C\s+\S+\s+)?push\s+.*(-f\b|--force\b)/,
];

// ============================================================================
// 공유 유틸
// ============================================================================

/** CC 프로젝트 루트 반환 (worktree에서도 정확) */
export function resolveCCRoot(cwd) {
  try {
    const gitCommonDir = execSync('git rev-parse --git-common-dir', {
      cwd, encoding: 'utf-8', timeout: 3000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return dirname(resolve(cwd, gitCommonDir));
  } catch {
    return resolve(cwd);
  }
}

/** absPath가 CC 루트 하위인지 */
export function isInsideCC(absPath, ccRoot) {
  return absPath === ccRoot || absPath.startsWith(ccRoot + '/');
}

/** absPath가 worktree 하위인지 */
export function isWriteAllowed(absPath, ccRoot) {
  if (!isInsideCC(absPath, ccRoot)) return false;
  const rel = relative(ccRoot, absPath);
  return WRITE_ALLOW_PATTERNS.some(p => p.test(rel));
}

/** 환경변수 prefix 제거 */
export function stripEnvPrefix(cmd) {
  return cmd.replace(ENV_PREFIX, '');
}

/** 패턴 매칭 (stripEnvPrefix 후) */
export function matchesAny(cmd, patterns) {
  return patterns.some(p => p.test(stripEnvPrefix(cmd.trim())));
}

/** git -C path 또는 cd path && ... 에서 실행 디렉토리 추출 */
export function resolveExecDir(cmd, cwd) {
  const gitC = cmd.match(/\bgit\s+-C\s+(\S+)/);
  if (gitC) return resolve(cwd, gitC[1]);

  // (cd path && ...) 또는 cd path && ... (괄호 유무 모두)
  const cd = cmd.match(/^\(?cd\s+(\S+)\s+&&/);
  if (cd) return resolve(cwd, cd[1]);

  return cwd;
}

/** 서브셸 (cd path && cmd1 && cmd2) → [cmd1, cmd2] */
export function extractInnerCommands(cmd) {
  const m = cmd.match(/^\(cd\s+\S+\s+&&\s+(.+)\)\s*$/);
  if (!m) return null;
  return m[1].split(/\s*&&\s*/).map(c => c.trim());
}

/** && 체인 (cmd1 && cmd2 && cmd3) → [cmd1, cmd2, cmd3]. 괄호 없는 순수 체인만 */
export function extractChainedCommands(cmd) {
  // &&만 포함하고 위험 메타문자(;|`$() 등)는 없어야 함. > < 는 리다이렉트로 허용
  if (!/&&/.test(cmd)) return null;
  if (/[;|`$()<\n\r\t\0\\]/.test(cmd)) return null;
  return cmd.split(/\s*&&\s*/).map(c => c.trim()).filter(c => c.length > 0);
}

/** for/while 루프 body 추출: for ...; do cmd1 && cmd2; done → [cmd1, cmd2] */
export function extractLoopBody(cmd) {
  // for ...; do ... done 또는 while ...; do ... done
  const m = cmd.match(/^(?:for|while)\s+.*;\s*do\s+(.+?);\s*done/);
  if (!m) return null;
  // body 내의 && 구분 명령 추출 ([ -f ... ] 조건문은 안전하므로 제거)
  return m[1].split(/\s*&&\s*/)
    .map(c => c.trim())
    .filter(c => !c.startsWith('[') && !c.startsWith('echo ') && c.length > 0);
}

/** 리다이렉트/파이프 쓰기 감지. FD 리다이렉트(2>&1, >&2)와 /dev/null은 제외 */
export function hasWriteOutput(cmd) {
  // FD redirect (2>&1, >&2)와 /dev/null 제거 후 파일 리다이렉트만 감지
  const cleaned = cmd.replace(/\d*>&\d+/g, '').replace(/\d*>\s*\/dev\/null/g, '');
  return />{1,2}\s*\S+/.test(cleaned) || /\|\s*tee\s/.test(cmd);
}

/** 리다이렉트/tee 대상 경로 추출 */
export function extractWriteTarget(cmd) {
  let m = cmd.match(/\|\s*tee\s+(?:-a\s+)?(\S+)/);
  if (m) return m[1];
  m = cmd.match(/>{1,2}\s*(\S+)\s*$/);
  if (m) return m[1];
  return null;
}

/** git 명령 실행 */
export function gitExec(dir, args) {
  try {
    return execSync(`git -C "${dir}" ${args}`, {
      encoding: 'utf-8', timeout: 3000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch { return ''; }
}

/** stdin 읽기 */
export async function readStdin() {
  let data = '';
  for await (const chunk of process.stdin) {
    data += chunk;
  }
  return data;
}

// ============================================================================
// 응답 헬퍼
// ============================================================================

/** PreToolUse deny */
export function deny(reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

/** PreToolUse allow */
export function allow(reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'allow',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

/** PreToolUse pass-through */
export function passThrough() {
  process.exit(0);
}

/** PermissionRequest allow */
export function permAllow(reason) {
  console.log(JSON.stringify({
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'PermissionRequest',
      decision: { behavior: 'allow', reason },
    },
  }));
  process.exit(0);
}

/** PermissionRequest pass-through */
export function permPassThrough() {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}
