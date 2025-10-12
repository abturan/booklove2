// scripts/patch-apply.mjs
import fs from 'fs/promises'
import path from 'path'
import process from 'process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = process.cwd()

function banner() {
  const isWin = process.platform === 'win32'
  const eofHint = isWin ? 'Ctrl+Z sonra Enter' : 'Ctrl+D'
  console.log(' ')
  console.log('🩹  Patch Uygulayıcı')
  console.log('────────────────────')
  console.log('Aşağıya blokları yapıştırın ve bitirmek için ' + eofHint + ' tuşlayın.')
  console.log('Biçim:')
  console.log('  <<<FILE: relative/path.ext')
  console.log('  ...dosya içeriği...')
  console.log('  >>>END')
  console.log('Not: Yoksa dosya oluşturulur. Mevcut dosyalar .bak.<timestamp> ile yedeklenir.\n')
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (c) => (data += c))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

function sanitizeRaw(raw) {
  // Kullanıcı yanlışlıkla Markdown fence yapıştırırsa etkisizleştir
  return raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((ln) => !/^```/.test(ln.trim()))
    .join('\n')
    .trim()
}

function parseBlocks(text) {
  const lines = text.split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const m = line && line.startsWith('<<<FILE:') ? line.match(/^<<<FILE:\s*(.+)\s*$/) : null
    if (!m) { i++; continue }
    const relPath = m[1]
    if (!relPath) throw new Error('<<<FILE: > yol boş olamaz')
    i++
    const start = i
    while (i < lines.length && lines[i] !== '>>>END') i++
    if (i >= lines.length) {
      throw new Error(`Blok kapatılmadı: ${relPath} (>>>END eksik)`)
    }
    const content = lines.slice(start, i).join('\n')
    blocks.push({ relPath, content })
    i++ // >>>END
  }
  return blocks
}

function ensureInsideRoot(absPath, rootDir) {
  const norm = path.normalize(absPath)
  return norm.startsWith(rootDir + path.sep)
}

async function applyBlocks(blocks) {
  const results = []
  for (const b of blocks) {
    const targetAbs = path.resolve(root, b.relPath)
    if (!ensureInsideRoot(targetAbs, root)) {
      throw new Error(`Güvenlik: root dışına yazılamaz → ${b.relPath}`)
    }

    await fs.mkdir(path.dirname(targetAbs), { recursive: true })

    const exists = await fs.stat(targetAbs).then(() => true).catch(() => false)
    if (exists) {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const bak = `${targetAbs}.bak.${stamp}`
      await fs.cp(targetAbs, bak)
    }
    await fs.writeFile(targetAbs, b.content, 'utf8')
    results.push({ path: b.relPath, status: exists ? 'updated' : 'created' })
  }
  return results
}

async function main() {
  banner()
  const raw = sanitizeRaw(await readStdin())
  if (!raw) {
    console.error('Hiç giriş alınamadı. Çıkılıyor.')
    process.exit(2)
  }
  const blocks = parseBlocks(raw)
  if (!blocks.length) {
    console.error('Blok bulunamadı. Biçimi kontrol edin: <<<FILE: ... >>>END')
    process.exit(2)
  }
  const res = await applyBlocks(blocks)
  const created = res.filter(r => r.status === 'created').length
  const updated = res.filter(r => r.status === 'updated').length
  console.log('\n✅ Bitti.')
  console.log(`• ${created} yeni dosya, ${updated} güncelleme yapıldı.`)
  console.log('• Değişikliklerin yedeği aynı klasörde .bak.<timestamp> uzantısıyla duruyor.')
}

main().catch((e) => {
  console.error('\n❌ Hata:', e?.message || e)
  process.exit(1)
})
