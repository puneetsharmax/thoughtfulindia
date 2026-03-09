/**
 * build-search-index.mjs
 * Run at build time: generates public/search-index.json
 * Each entry: { slug, title, date, categories, excerpt }
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const postsDir = path.join(__dirname, '../content/posts')
const outDir = path.join(__dirname, '../public')
const outFile = path.join(outDir, 'search-index.json')

function decodeEntities(str) {
  return str
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#039;/gi, "'").replace(/&apos;/gi, "'")
}

function extractFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {}, content: raw }
  const parts = raw.split('---')
  if (parts.length < 3) return { data: {}, content: raw }
  const fm = parts[1]
  const content = parts.slice(2).join('---')
  const data = {}
  for (const line of fm.split('\n')) {
    const m = line.match(/^(\w+):\s*(.+)/)
    if (!m) continue
    const [, key, val] = m
    if (val.trim().startsWith('[')) {
      data[key] = (val.match(/"([^"]+)"/g) || []).map(s => s.replace(/"/g, ''))
    } else {
      data[key] = val.trim().replace(/^["']|["']$/g, '')
    }
  }
  return { data, content }
}

function generateExcerpt(content) {
  let text = content
  text = text.replace(/!\[(?:[^\]\[]|\[[^\]]*\])*\]\([^)]*\)/g, '')
  text = text.replace(/!\[(?:[^\]\[]|\[[^\]]*\])*\]\([^)]*\)/g, '')
  text = text.replace(/\[caption[^\]]*\][\s\S]*?\[\/caption\]/gi, '')
  text = text.replace(/\[youtube[^\]]*\][\s\S]*?\[\/youtube\]/gi, '')
  text = text.replace(/\[video[^\]]*\][\s\S]*?\[\/video\]/gi, '')
  text = text.replace(/\[audio[^\]]*\][\s\S]*?\[\/audio\]/gi, '')
  text = text.replace(/\[embed[^\]]*\][\s\S]*?\[\/embed\]/gi, '')
  text = text.replace(/\[gallery[^\]]*\]/gi, '')
  text = text.replace(/\[\/?\w[a-z_-]*[^\]]*\]/gi, '')
  text = text.replace(/\[([^\]]*)\]\([^)]*\)/g, (_, t) => t.trim() || '')
  text = text.replace(/https?:\/\/\S+/g, '')
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/^#{1,6}\s+/gm, '')
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1').replace(/_([^_]+)_/g, '$1')
  text = text.replace(/`([^`]+)`/g, '$1')
  text = text.replace(/^[\s>*\-+|]+/gm, '')
  text = text.replace(/\s+/g, ' ').trim()
  const m = text.match(/[A-Za-z0-9\u0900-\u097F]/)
  if (m && m.index > 0) text = text.slice(m.index)
  return text.slice(0, 300).trim()
}

const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md')).sort()
const index = []

for (const file of files) {
  const raw = fs.readFileSync(path.join(postsDir, file), 'utf8')
  const { data, content } = extractFrontmatter(raw)
  if (data.draft === 'true') continue
  const slug = data.slug || file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '')
  const title = decodeEntities(String(data.title || ''))
  const date = String(data.date || '').slice(0, 10)
  const categories = (data.categories || []).map(c => decodeEntities(c))
  const featured_image = String(data.featured_image || '')
  const excerpt = generateExcerpt(content)
  if (!title) continue
  index.push({ slug, title, date, categories, featured_image, excerpt })
}

// Sort newest first
index.sort((a, b) => (a.date < b.date ? 1 : -1))

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outFile, JSON.stringify(index))
console.log(`✅ search-index.json written: ${index.length} posts, ${(fs.statSync(outFile).size / 1024).toFixed(0)}KB`)
