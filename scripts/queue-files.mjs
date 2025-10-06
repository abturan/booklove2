#!/usr/bin/env node
import { promises as fs } from "fs"
import path from "path"
import process from "process"
import { createInterface } from "readline/promises"
import { stdin as input, stdout as output } from "process"

function normalizeList(s) {
  return s.replace(/^["']|["']$/g, "").split(",").map((x) => x.trim()).filter(Boolean)
}

function ensureLeadingPathComment(content, relPath) {
  let bom = ""
  let body = content
  if (body.startsWith("\ufeff")) { bom = "\ufeff"; body = body.slice(1) }
  const nl = body.indexOf("\n")
  const first = nl === -1 ? body : body.slice(0, nl)
  const want = `// ${relPath}`
  if (first.trim() === want) return bom + body
  return bom + `${want}\n` + body
}

async function copyToClipboard(text) {
  try {
    const { default: clipboardy } = await import("clipboardy")
    await clipboardy.write(text)
    console.log("📋 Panoya kopyalandı.")
    return
  } catch {}
  try {
    const { spawn } = await import("child_process")
    const cmd = process.platform === "darwin" ? "pbcopy" : process.platform === "win32" ? "clip" : "xclip"
    const args = cmd === "xclip" ? ["-selection", "clipboard"] : []
    const p = spawn(cmd, args)
    p.stdin.end(text)
    console.log(`📋 Panoya kopyalandı (${cmd}).`)
  } catch {
    console.warn("⚠️ Clipboard’a kopyalanamadı. Metin aşağıda:\n")
    console.log(text)
  }
}

async function promptList() {
  const argv = process.argv.slice(2)
  const arg = argv[0] && !argv[0].startsWith("--") ? argv[0] : ""
  if (arg) return normalizeList(arg)
  const rl = createInterface({ input, output })
  try {
    const typed = await rl.question("Virgülle ayrılmış relative path listesi yapıştırın:\n> ")
    return normalizeList(typed)
  } finally {
    await rl.close()
  }
}

async function readOne(rel) {
  if (path.isAbsolute(rel) || rel.includes("..")) return { rel, ok: false, reason: "geçersiz yol" }
  const abs = path.resolve(process.cwd(), rel)
  try {
    const content = await fs.readFile(abs, "utf8")
    return { rel, ok: true, data: ensureLeadingPathComment(content, rel) }
  } catch {
    return { rel, ok: false, reason: "bulunamadı" }
  }
}

async function main() {
  const list = await promptList()
  if (!list.length) {
    console.error("En az bir dosya yolu verin.")
    process.exit(1)
  }

  const results = await Promise.all(list.map(readOne))
  const okParts = results.filter(r => r.ok).map(r => r.data)
  const missing = results.filter(r => !r.ok)

  let bundle = okParts.join("\n\n")
  if (missing.length) {
    const missText = missing.map(m => `- ${m.rel} (${m.reason})`).join("\n")
    bundle += `\n\n---\nŞu dosyalar bulunamadı:\n${missText}\n`
    console.warn("\n⚠️ Bulunamayan dosyalar:")
    console.warn(missText)
  }

  if (!bundle.trim()) {
    console.error("Hiç içerik üretilemedi.")
    process.exit(1)
  }

  await copyToClipboard(bundle)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
