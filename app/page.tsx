import { getAllPosts, getAllCategories, slugifyCategory } from '@/lib/posts'
import { formatCategoryName } from '@/lib/utils'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

export const revalidate = 3600

export default function HomePage() {
  const allPosts = getAllPosts()
  const categories = getAllCategories().slice(0, 8)

  // Pin 2026 articles to top regardless of original order
  const postsFrom2026 = allPosts.filter(p => p.date.startsWith('2026'))
  const otherPosts = allPosts.filter(p => !p.date.startsWith('2026'))
  const reorderedPosts = [...postsFrom2026, ...otherPosts]

  const featuredPost = reorderedPosts[0]
  const topStories = reorderedPosts.slice(1, 4)
  const secondaryFeatured = reorderedPosts.slice(4, 6)
  const latestPosts = reorderedPosts.slice(6, 18)
  const sidebarPosts = reorderedPosts.slice(18, 28)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Category nav bar */}
      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 py-3" style={{ borderTop: '2px solid #C8540A', borderBottom: '2px solid #C8540A' }}>
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={`/category/${slugifyCategory(cat.name)}/`}
            className="text-xs font-semibold uppercase tracking-widest transition-colors"
            style={{ color: '#C8540A' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#B91C1C')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#C8540A')}
          >
            {formatCategoryName(cat.name)}
          </Link>
        ))}
      </div>

      {/* Hero grid */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main featured story */}
        <div className="lg:col-span-2">
          {featuredPost && <PostCard post={featuredPost} variant="featured" />}
        </div>

        {/* Top stories sidebar */}
        <div className="flex flex-col">
          <h2 className="mb-3 pb-1 text-xs font-bold uppercase tracking-widest" style={{ borderBottom: '2px solid #C8540A', color: '#C8540A' }}>
            Top Stories
          </h2>
          <div className="space-y-0">
            {topStories.map((post) => (
              <PostCard key={post.slug} post={post} variant="horizontal" />
            ))}
          </div>
        </div>
      </section>

      {/* Section divider */}
      <div className="my-8 flex items-center gap-3">
        <div className="h-px flex-1" style={{ backgroundColor: '#C8540A' }} />
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#C8540A' }}>Latest</h2>
        <div className="h-px flex-1" style={{ backgroundColor: '#C8540A' }} />
      </div>

      {/* Content + sidebar */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Main content */}
        <div className="lg:col-span-3">
          {/* Secondary featured row */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
            {secondaryFeatured.map((post) => (
              <PostCard key={post.slug} post={post} variant="default" />
            ))}
          </div>

          {/* Latest grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} variant="default" />
            ))}
          </div>

          {/* View more */}
          <div className="mt-10 text-center">
            <Link
              href="/category/featured-stories/"
              className="inline-block px-8 py-2.5 text-sm font-semibold uppercase tracking-widest transition hover:opacity-80"
              style={{ border: '2px solid #C8540A', color: '#C8540A', backgroundColor: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#C8540A'
                ;(e.currentTarget as HTMLAnchorElement).style.color = 'white'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent'
                ;(e.currentTarget as HTMLAnchorElement).style.color = '#C8540A'
              }}
            >
              View All Stories
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20">
            <h2 className="mb-3 pb-1 text-xs font-bold uppercase tracking-widest" style={{ borderBottom: '2px solid #C8540A', color: '#C8540A' }}>
              More Stories
            </h2>
            <div className="space-y-0">
              {sidebarPosts.map((post) => (
                <PostCard key={post.slug} post={post} variant="compact" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
