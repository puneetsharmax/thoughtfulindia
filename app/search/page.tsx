'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { slugifyCategory, formatCategoryName } from '@/lib/utils'

interface SearchEntry {
  slug: string
  title: string
  date: string
  categories: string[]
  featured_image: string
  excerpt: string
}

function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="bg-yellow-200 text-yellow-900 rounded px-0.5">$1</mark>')
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQ = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQ)
  const [input, setInput] = useState(initialQ)
  const [index, setIndex] = useState<SearchEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<SearchEntry[]>([])

  useEffect(() => {
    fetch('/search-index.json')
      .then(r => r.json())
      .then((data: SearchEntry[]) => { setIndex(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const runSearch = useCallback((q: string, idx: SearchEntry[]) => {
    if (!q.trim() || idx.length === 0) { setResults([]); return }
    const terms = q.toLowerCase().trim().split(/\s+/)
    const scored = idx
      .map(post => {
        const titleLower = post.title.toLowerCase()
        const excerptLower = post.excerpt.toLowerCase()
        const catLower = post.categories.join(' ').toLowerCase()
        let score = 0
        for (const term of terms) {
          if (titleLower.includes(term)) score += 10
          if (titleLower.startsWith(term)) score += 5
          if (catLower.includes(term)) score += 3
          if (excerptLower.includes(term)) score += 1
        }
        return { post, score }
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.post)
    setResults(scored.slice(0, 50))
  }, [])

  useEffect(() => { runSearch(query, index) }, [query, index, runSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setQuery(input)
    router.replace(`/search/?q=${encodeURIComponent(input)}`, { scroll: false })
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="search"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Search 1,959 articles…"
            autoFocus
            className="flex-1 rounded-lg border border-stone-300 px-4 py-3 text-base font-sans shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          <button
            type="submit"
            className="rounded-lg bg-red-700 px-6 py-3 text-sm font-semibold text-white hover:bg-red-800 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {loading && <p className="text-stone-500 text-sm">Loading search index…</p>}

      {!loading && query && (
        <p className="mb-6 text-sm text-stone-500">
          {results.length === 0
            ? `No results for "${query}"`
            : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      {!loading && !query && (
        <p className="text-stone-400 text-sm">Type something to search across all articles.</p>
      )}

      <div className="divide-y divide-stone-100">
        {results.map(post => (
          <article key={post.slug} className="py-5 flex gap-4">
            {post.featured_image && (
              <div className="hidden sm:block flex-shrink-0 w-24 h-20 relative rounded overflow-hidden bg-stone-100">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1 mb-1">
                {post.categories.slice(0, 2).map(cat => (
                  <Link key={cat} href={`/category/${slugifyCategory(cat)}/`}
                    className="text-xs font-semibold uppercase tracking-wider text-red-700 hover:underline">
                    {formatCategoryName(cat)}
                  </Link>
                ))}
              </div>
              <Link href={`/post/${post.slug}/`}>
                <h2 className="font-serif text-lg font-bold text-stone-900 hover:text-red-700 leading-snug mb-1 transition-colors"
                  dangerouslySetInnerHTML={{ __html: highlightMatch(post.title, query) }} />
              </Link>
              {post.excerpt && (
                <p className="text-sm text-stone-600 line-clamp-2"
                  dangerouslySetInnerHTML={{ __html: highlightMatch(post.excerpt, query) }} />
              )}
              <p className="mt-1 text-xs text-stone-400">
                {new Date(post.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-stone-500">Loading…</div>}>
      <SearchResults />
    </Suspense>
  )
}
