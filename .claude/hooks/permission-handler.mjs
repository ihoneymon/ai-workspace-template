#!/usr/bin/env node
/**
 * PermissionRequest Hook — Bash 명령 종합 판단
 *
 * 단일 책임: settings.allow에서 빠진 Bash 명령의 안전성을 종합 판단.
 * 경로 + 명령 내용 + 메타문자를 분석하여 safe한 것만 auto-allow.
 *
 * 실행 시점: settings.allow에 매칭되지 않은 Bash 명령이 사용자 확인으로
 * 넘어가기 직전에 실행됨. 여기서 allow하면 사용자 확인 없이 실행.
 */

import { resolve } from 'node:path';
import {
  readStdin, resolveCCRoot, isInsideCC, isWriteAllowed,
  stripEnvPrefix, matchesAny, resolveExecDir, extractInnerCommands,
  extractChainedCommands, extractLoopBody, hasWriteOutput, extractWriteTarget,
  SAFE_COMMANDS, BUILD_TEST, GIT_WRITE, FILE_WRITE, DANGEROUS, DENY_PATTERNS,
  DANGEROUS_SHELL_CHARS,
  permAllow, permPassThrough,
} from './config.mjs';

function decideBash(cmd, cwd, ccRoot) {
  const trimmed = cmd.trim();
  const effective = stripEnvPrefix(trimmed);
  const execDir = resolveExecDir(trimmed, cwd);

  // --- 위험 패턴 → pass-through ---
  if (matchesAny(trimmed, DANGEROUS)) {
    permPassThrough();
    return;
  }

  // --- 서브셸 (cd path && ...) ---
  const innerCmds = extractInnerCommands(trimmed);
  if (innerCmds) {
    if (innerCmds.some(c => matchesAny(c, DENY_PATTERNS))) {
      permPassThrough();
      return;
    }
    if (innerCmds.some(c => matchesAny(c, DANGEROUS))) {
      permPassThrough();
      return;
    }
    if (innerCmds.some(c => hasWriteOutput(c))) {
      const writeTargets = innerCmds
        .filter(c => hasWriteOutput(c))
        .map(c => extractWriteTarget(c))
        .filter(Boolean);
      const allTargetsAllowed = writeTargets.length > 0 && writeTargets.every(t => {
        const abs = resolve(execDir, t);
        return isWriteAllowed(abs, ccRoot);
      });
      if (allTargetsAllowed) {
        permAllow('허용 경로 내 리다이렉트 (서브셸)');
        return;
      }
      permPassThrough();
      return;
    }
    const knownPatterns = [...SAFE_COMMANDS, ...BUILD_TEST, ...GIT_WRITE];
    const allKnown = innerCmds.every(c => {
      const s = stripEnvPrefix(c.trim());
      return matchesAny(c, knownPatterns) || FILE_WRITE.test(s);
    });

    if (allKnown) {
      if (innerCmds.every(c => matchesAny(c, SAFE_COMMANDS))) {
        permAllow('읽기 전용 명령 (서브셸)');
        return;
      }
      if (isWriteAllowed(execDir, ccRoot)) {
        permAllow('허용 경로 내 명령 (서브셸)');
        return;
      }
    }
    permPassThrough();
    return;
  }

  // --- && 체인 (괄호 없음) → 각 명령 개별 검증 ---
  const chainedCmds = extractChainedCommands(trimmed);
  if (chainedCmds) {
    if (chainedCmds.some(c => matchesAny(c, DENY_PATTERNS))) {
      permPassThrough();
      return;
    }
    if (chainedCmds.some(c => matchesAny(c, DANGEROUS))) {
      permPassThrough();
      return;
    }
    const knownPatterns = [...SAFE_COMMANDS, ...BUILD_TEST, ...GIT_WRITE];
    const allKnown = chainedCmds.every(c => {
      const s = stripEnvPrefix(c.trim());
      return matchesAny(c, knownPatterns) || FILE_WRITE.test(s) || hasWriteOutput(c);
    });
    if (allKnown) {
      const allWritesAllowed = chainedCmds.every(c => {
        const s = stripEnvPrefix(c.trim());
        const cmdExecDir = resolveExecDir(c, cwd);
        if (matchesAny(c, GIT_WRITE)) return isWriteAllowed(cmdExecDir, ccRoot);
        if (matchesAny(c, BUILD_TEST)) return isWriteAllowed(cmdExecDir, ccRoot);
        if (FILE_WRITE.test(s)) {
          const parts = s.split(/\s+/);
          const args = parts.slice(1).filter(a => !a.startsWith('-') && !a.includes('$'));
          const target = args.length > 0 ? args[args.length - 1] : null;
          return target ? isWriteAllowed(resolve(cmdExecDir, target), ccRoot) : false;
        }
        if (hasWriteOutput(c)) {
          const target = extractWriteTarget(c);
          return target ? isWriteAllowed(resolve(cmdExecDir, target), ccRoot) : false;
        }
        return true;
      });
      if (allWritesAllowed) {
        permAllow('체인 명령 (모두 허용 경로 내부)');
        return;
      }
    }
    permPassThrough();
    return;
  }

  // --- 리다이렉트/파이프 쓰기 (단일 명령) ---
  if (hasWriteOutput(trimmed)) {
    const target = extractWriteTarget(trimmed);
    if (target) {
      const abs = resolve(execDir, target);
      if (isWriteAllowed(abs, ccRoot)) {
        permAllow('리다이렉트/파이프 쓰기 (허용 경로 내부)');
        return;
      }
    }
    permPassThrough();
    return;
  }

  // --- for/while 루프 → body 명령을 개별 검증 ---
  const loopBody = extractLoopBody(trimmed);
  if (loopBody) {
    if (loopBody.some(c => matchesAny(c, DENY_PATTERNS))) {
      permPassThrough();
      return;
    }
    const knownPatterns = [...SAFE_COMMANDS, ...BUILD_TEST, ...GIT_WRITE];
    const allKnown = loopBody.every(c => {
      const s = stripEnvPrefix(c.trim());
      return matchesAny(c, knownPatterns) || FILE_WRITE.test(s);
    });
    if (allKnown) {
      const writeTargets = loopBody
        .filter(c => FILE_WRITE.test(stripEnvPrefix(c.trim())))
        .map(c => {
          const parts = stripEnvPrefix(c.trim()).split(/\s+/);
          const args = parts.slice(1).filter(a => !a.startsWith('-') && !a.includes('$'));
          return args.length > 0 ? args[args.length - 1] : null;
        })
        .filter(Boolean);
      const hasFileWrite = loopBody.some(c => FILE_WRITE.test(stripEnvPrefix(c.trim())));
      if ((!hasFileWrite && writeTargets.length === 0) || (writeTargets.length > 0 && writeTargets.every(t => isWriteAllowed(resolve(execDir, t), ccRoot)))) {
        permAllow('루프 내 알려진 명령 (허용 경로)');
        return;
      }
    }
    permPassThrough();
    return;
  }

  // --- 메타문자 있으면 복합 명령 → pass-through ---
  if (DANGEROUS_SHELL_CHARS.test(trimmed)) {
    permPassThrough();
    return;
  }

  // --- 단순 명령 (메타문자 없음) ---

  // safe 읽기 → allow
  if (matchesAny(trimmed, SAFE_COMMANDS)) {
    permAllow('읽기 전용 명령');
    return;
  }

  // 빌드/테스트 → 허용 경로면 allow
  if (matchesAny(trimmed, BUILD_TEST)) {
    if (isWriteAllowed(execDir, ccRoot)) {
      permAllow('빌드/테스트 명령 (허용 경로 내부)');
      return;
    }
    permPassThrough();
    return;
  }

  // Git 쓰기 → 허용 경로면 allow
  if (matchesAny(trimmed, GIT_WRITE)) {
    if (isWriteAllowed(execDir, ccRoot)) {
      permAllow('Git 명령 (허용 경로 내부)');
      return;
    }
    permPassThrough();
    return;
  }

  // 파일 쓰기 → 대상 경로가 허용 경로면 allow
  if (FILE_WRITE.test(effective)) {
    const parts = effective.split(/\s+/);
    const args = parts.slice(1).filter(a => !a.startsWith('-'));
    const target = args.length > 0 ? args[args.length - 1] : null;

    if (target) {
      const abs = resolve(execDir, target);
      if (isWriteAllowed(abs, ccRoot)) {
        permAllow('파일 명령 (허용 경로 내부)');
        return;
      }
    }
    permPassThrough();
    return;
  }

  // 그 외 → pass-through
  permPassThrough();
}

async function main() {
  const input = await readStdin();

  let data;
  try { data = JSON.parse(input); } catch { permPassThrough(); return; }

  const command = data?.tool_input?.command;
  if (typeof command !== 'string' || !command.trim()) { permPassThrough(); return; }

  const cwd = data.cwd || process.cwd();
  const ccRoot = resolveCCRoot(cwd);

  decideBash(command, cwd, ccRoot);
}

main();
