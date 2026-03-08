import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import remarkHtml from 'remark-html'

const postsDirectory = path.join(process.cwd(), 'content/posts')

export interface Post {
  slug: string
  title: string
  date: string
  categories: string[]
  tags: string[]
  featured_image: string
  excerpt: string
  content?: string
}

function safeCategories(raw: unknown): string[] {
  if (!raw) return []
  if (!Array.isArray(raw)) return []
  return raw.filter((c): c is string => typeof c === 'string' && c.length > 0)
}

function safeTags(raw: unknown): string[] {
  if (!raw) return []
  if (!Array.isArray(raw)) return []
  return raw.filter((t): t is string => typeof t === 'string' && t.length > 0)
}

function safeString(raw: unknown): string {
  if (raw === null || raw === undefined) return ''
  if (raw instanceof Date) return raw.toISOString().split('T')[0]
  return String(raw)
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDirectory)) return []
  const fileNames = fs.readdirSync(postsDirectory)
  const posts = fileNames
    .filter(f => f.endsWith('.md'))
    .map(fileName => {
      try {
        const fullPath = path.join(postsDirectory, fileName)
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContents)
        const excerpt = content
          .replace(/!\[.*?\]\(.*?\)/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[#*_>`]/g, '')
          .trim().slice(0, 200) + '...'
        return {
          slug: safeString(data.slug) || fileName.replace(/\.md$/, ''),
          title: safeString(data.title),
          date: safeString(data.date),
          categories: safeCategories(data.categories),
          tags: safeTags(data.tags),
          featured_image: safeString(data.featured_image),
          excerpt,
        } as Post
      } catch {
        return null
      }
    })
    .filter((p): p is Post => p !== null)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  return posts
}

export function getPostBySlug(slug: string): Post | null {
  if (!fs.existsSync(postsDirectory)) return null
  const fileNames = fs.readdirSync(postsDirectory)
  const fileName = fileNames.find(f => {
    try {
      const filePath = path.join(postsDirectory, f)
      const { data } = matter(fs.readFileSync(filePath, 'utf8'))
      return safeString(data.slug) === slug
    } catch {
      return false
    }
  })
  if (!fileName) return null
  try {
    const fullPath = path.join(postsDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)
    return {
      slug: safeString(data.slug) || slug,
      title: safeString(data.title),
      date: safeString(data.date),
      categories: safeCategories(data.categories),
      tags: safeTags(data.tags),
      featured_image: safeString(data.featured_image),
      excerpt: '',
      content,
    }
  } catch {
    return null
  }
}

export async function getPostContent(slug: string): Promise<{ post: Post; htmlContent: string } | null> {
  const post = getPostBySlug(slug)
  if (!post || !post.content) return null
  const processed = await remark().use(remarkHtml, { sanitize: false }).process(post.content)
  return { post, htmlContent: processed.toString() }
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter(p =>
    p.categories.some(c => c.toLowerCase() === category.toLowerCase())
  )
}

export function getAllCategories(): { name: string; count: number }[] {
  const posts = getAllPosts()
  const map: Record<string, number> = {}
  posts.forEach(p => p.categories.forEach(c => {
    if (c && c.toLowerCase() !== 'uncategorized') map[c] = (map[c] || 0) + 1
  }))
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}
