#!/usr/bin/env node
// Kill any process listening on the given TCP port (macOS/Linux/Windows).
// Usage: node scripts/kill-port.mjs 3000

import { execSync, exec } from 'node:child_process'

const arg = process.argv[2]
const port = Number(arg || process.env.PORT || process.env.DEV_PORT || 3000)
if (!Number.isFinite(port) || port <= 0) {
  console.error('[kill-port] Invalid port:', arg)
  process.exit(2)
}

function unique(arr) { return [...new Set(arr.filter(Boolean))] }

function pidsViaLsof(p) {
  try {
    const out = execSync(`lsof -nPiTCP:${p} -sTCP:LISTEN -t`, { stdio: ['ignore','pipe','ignore'] }).toString()
    return unique(out.split(/\s+/).map((x) => x.trim()))
  } catch { return [] }
}

function pidsViaFuser(p) {
  try {
    const out = execSync(`fuser -n tcp ${p} 2>/dev/null || true`, { shell: '/bin/bash', stdio: ['ignore','pipe','ignore'] }).toString()
    return unique(out.split(/\s+/).map((x) => x.trim()))
  } catch { return [] }
}

function pidsViaNetstatWin(p) {
  try {
    const out = execSync(`netstat -ano | findstr :${p}`, { stdio: ['ignore','pipe','ignore'] }).toString()
    const lines = out.split(/\r?\n/)
    const pids = []
    for (const line of lines) {
      const m = line.trim().match(/\s+(\d+)\s*$/)
      if (m) pids.push(m[1])
    }
    return unique(pids)
  } catch { return [] }
}

function selfPidFilter(pid) {
  const me = String(process.pid)
  return pid && pid !== me
}

const platform = process.platform
let pids = []
if (platform === 'win32') pids = pidsViaNetstatWin(port)
else pids = [...pidsViaLsof(port), ...pidsViaFuser(port)]

pids = unique(pids).filter(selfPidFilter)

if (!pids.length) {
  console.log(`[kill-port] No process on port ${port}`)
  process.exit(0)
}

console.log(`[kill-port] Killing ${pids.length} process(es) on port ${port}: ${pids.join(', ')}`)

for (const pid of pids) {
  try {
    process.kill(Number(pid), 'SIGTERM')
  } catch {}
}

setTimeout(() => {
  // Verify and escalate if needed
  let still = []
  try {
    if (platform === 'win32') still = pidsViaNetstatWin(port)
    else still = [...pidsViaLsof(port), ...pidsViaFuser(port)]
  } catch {}
  still = unique(still).filter(selfPidFilter)
  if (still.length) {
    console.log(`[kill-port] Escalating SIGKILL for: ${still.join(', ')}`)
    for (const pid of still) { try { process.kill(Number(pid), 'SIGKILL') } catch {} }
  }
  setTimeout(() => process.exit(0), 200)
}, 800)

