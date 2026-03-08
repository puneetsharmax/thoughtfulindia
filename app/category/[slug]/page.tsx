import { getAllPosts, getAllCategories, slugifyCategory } from '@/lib/posts'
import { formatCategoryName } from '@/lib/utils'
import { notFound } from 'next/navigation'
import PostCard from '@/components/PostCard'
import Link from 'next/link'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

function slugToCategory(slug: string, allCategories: { name: string }[]): string | null {
  const match = allCategories.find((cat) => slugifyCategory(cat.name) === slug)
  return match ? match.name : null
}

export async function generateStaticParams() {
  const categories = getAllCategories()
  return categories.map((cat) => ({
    slug: slugifyCategory(cat.name),
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const cats = getAllCategories()
  const catName = slugToCategory(slug, cats)
  if (!catName) return { title: 'Not Found' }
  return {
    title: formatCategoryName(catName),
    description: `Read all ${formatCategoryName(catName)} articles on Thoughtful India.`,
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const allPosts = getAllPosts()
  const allCategories = getAllCategories()

  const catName = slugToCategory(slug, allCategories)
  if (!catName) notFound()

  const posts = allPosts.filter((p) =>
    p.categories.filter(Boolean).map((c) => c.toLowerCase()).includes(catName.toLowerCase())
  )

  const featuredPost = posts[0]
  const restPosts = posts.slice(1)

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 border-b-4 border-stone-900 pb-4">
        <nav className="mb-2 text-xs text-stone-500">
          <Link href="/" className="hover:text-red-700">Home</Link>
          <span className="mx-2">›</span>
          <span>{formatCategoryName(catName)}</span>
        </nav>
        <h1 className="font-serif text-4xl font-black text-stone-900">{formatCategoryName(catName)}</h1>
        <p className="mt-1 text-sm text-stone-500">{posts.length} articles</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-stone-500">No articles found in this category.</p>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          <div className="lg:col-span-3">
            {featuredPost && (
              <div className="mb-8">
                <PostCard post={featuredPost} variant="featured" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              {restPosts.map((post) => (
                <PostCard key={post.slug} post={post} variant="default" />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-20">
              <h2 className="mb-3 border-b-2 border-stone-800 pb-1 text-xs font-bold uppercase tracking-widest text-stone-800">
                Other Sections
              </h2>
              <ul className="space-y-2">
                {allCategories
                  .filter((c) => c.name !== catName)
                  .slice(0, 15)
                  .map((cat) => (
                    <li key={cat.name}>
                      <Link
                        href={`/category/${slugifyCategory(cat.name)}/`}
                        className="flex items-center justify-between text-sm text-stone-700 hover:text-red-700"
                      >
                        <span>{formatCategoryName(cat.name)}</span>
                        <span className="text-xs text-stone-400">{cat.count}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}
