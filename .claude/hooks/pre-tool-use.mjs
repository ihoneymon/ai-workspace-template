#!/usr/bin/env node
/**
 * PreToolUse Hook — 도구 타입 + 경로 기반 허용
 *
 * 단일 책임: 도구 타입(Read/Edit/Write)과 file_path 경로만으로 판단.
 * Bash 명령 내용은 분석하지 않음 (PermissionRequest가 담당).
 */

import { resolve } from 'node:path';
import {
  readStdin, resolveCCRoot, isInsideCC, isWriteAllowed,
  allow, deny, passThrough,
} from './config.mjs';

const READ_TOOLS = new Set(['Read', 'Glob', 'Grep']);
const WRITE_TOOLS = new Set(['Edit', 'Write', 'NotebookEdit']);

async function main() {
  const input = await readStdin();

  let data;
  try { data = JSON.parse(input); } catch { passThrough(); return; }

  const toolName = data?.tool_name;
  const cwd = data?.cwd || process.cwd();
  const ccRoot = resolveCCRoot(cwd);

  // 읽기 도구 → 어디서든 allow
  if (READ_TOOLS.has(toolName)) {
    allow(`${toolName} (읽기 도구)`);
    return;
  }

  // 쓰기 도구 → 경로 기반 판단
  if (WRITE_TOOLS.has(toolName)) {
    const filePath = data?.tool_input?.file_path;
    if (filePath) {
      const absPath = resolve(cwd, filePath);
      // CC 외부 경로 → pass-through (settings.allow 또는 사용자 확인으로 위임)
      if (!isInsideCC(absPath, ccRoot)) {
        passThrough();
        return;
      }
      // CC 내부 허용 경로 → allow
      if (isWriteAllowed(absPath, ccRoot)) {
        allow(`${toolName} (허용 경로)`);
        return;
      }
    }
    deny(`${toolName}은 허용된 경로에서만 사용 가능합니다. projects/*/main/은 읽기 전용입니다.`);
    return;
  }

  // 그 외 (Bash 포함) → pass-through
  passThrough();
}

main();
