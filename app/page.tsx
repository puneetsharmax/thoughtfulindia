import { getAllPosts, getAllCategories, slugifyCategory } from '@/lib/posts'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

export const revalidate = 3600

export default function HomePage() {
  const allPosts = getAllPosts()
  const categories = getAllCategories().slice(0, 8)

  const featuredPost = allPosts[0]
  const topStories = allPosts.slice(1, 4)
  const secondaryFeatured = allPosts.slice(4, 6)
  const latestPosts = allPosts.slice(6, 18)
  const sidebarPosts = allPosts.slice(18, 28)

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      {/* Category nav bar */}
      <div className="mb-6 flex flex-wrap gap-x-4 gap-y-2 border-y border-stone-200 py-3">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={`/category/${slugifyCategory(cat.name)}/`}
            className="text-xs font-semibold uppercase tracking-widest text-stone-600 hover:text-red-700 transition-colors"
          >
            {cat.name}
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
          <h2 className="mb-3 border-b-2 border-red-700 pb-1 text-xs font-bold uppercase tracking-widest text-red-700">
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
        <div className="h-px flex-1 bg-stone-300" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500">Latest</h2>
        <div className="h-px flex-1 bg-stone-300" />
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
              href="/category/featured-stories"
              className="inline-block border border-stone-800 px-8 py-2.5 text-sm font-semibold uppercase tracking-widest text-stone-800 transition hover:bg-stone-800 hover:text-white"
            >
              View All Stories
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-20">
            <h2 className="mb-3 border-b-2 border-stone-800 pb-1 text-xs font-bold uppercase tracking-widest text-stone-800">
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
