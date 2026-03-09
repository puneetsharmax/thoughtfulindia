import { getAllPosts, getPostContent, slugifyCategory } from '@/lib/posts'
import { formatCategoryName } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PostCard from '@/components/PostCard'
import ArticleImage from '@/components/ArticleImage'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const result = await getPostContent(slug)
  if (!result) return { title: 'Not Found' }
  const { post } = result
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      images: post.featured_image ? [post.featured_image] : [],
      type: 'article',
      publishedTime: post.date,
    },
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const result = await getPostContent(slug)
  if (!result) notFound()

  const { post, htmlContent } = result
  const allPosts = getAllPosts()

  const related = allPosts
    .filter(
      (p) =>
        p.slug !== post.slug &&
        p.categories.some((c) => post.categories.includes(c))
    )
    .slice(0, 3)

  const formattedDate = post.date
    ? new Date(post.date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
        <article className="lg:col-span-3">
          <nav className="mb-4 text-xs text-stone-500">
            <Link href="/" className="hover:text-red-700">Home</Link>
            {post.categories[0] && (
              <>
                <span className="mx-2">›</span>
                <Link
                  href={`/category/${slugifyCategory(post.categories[0])}/`}
                  className="hover:text-red-700"
                >
                  {formatCategoryName(post.categories[0])}
                </Link>
              </>
            )}
          </nav>

          {post.categories[0] && (
            <Link
              href={`/category/${slugifyCategory(post.categories[0])}/`}
              className="mb-3 inline-block bg-red-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-red-800"
            >
              {formatCategoryName(post.categories[0])}
            </Link>
          )}

          <h1 className="font-serif text-3xl font-bold leading-tight text-stone-900 md:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-stone-200 pb-4">
            <time className="text-sm text-stone-500">{formattedDate}</time>
          </div>

          {post.featured_image && (
            <ArticleImage src={post.featured_image} alt={post.title} />
          )}

          {htmlContent.trim() ? (
            <>
              <div
                className="prose prose-stone prose-lg mt-8 max-w-none
                  prose-headings:font-serif prose-headings:font-bold
                  prose-a:text-red-700 prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-sm
                  prose-blockquote:border-l-red-700 prose-blockquote:italic"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
              {htmlContent.replace(/<[^>]+>/g, '').trim().length < 150 && (
                <p className="mt-6 text-stone-400 text-sm italic border-t border-stone-100 pt-4">
                  This was a brief note or link originally published on Thoughtful India.
                </p>
              )}
            </>
          ) : (
            <div className="mt-8 border-l-4 border-stone-200 pl-4 py-2">
              <p className="text-stone-400 text-sm italic">
                This article was originally published on Thoughtful India. The full content is no longer available in our archives.
              </p>
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="mt-8 border-t border-stone-200 pt-6">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="border border-stone-300 px-2 py-0.5 text-xs text-stone-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-4 border-b-2 border-red-700 pb-1 text-xs font-bold uppercase tracking-widest text-red-700">
                Related Stories
              </h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {related.map((p) => (
                  <PostCard key={p.slug} post={p} variant="default" />
                ))}
              </div>
            </section>
          )}
        </article>

        <aside className="lg:col-span-1">
          <div className="sticky top-20">
            <h2 className="mb-3 border-b-2 border-stone-800 pb-1 text-xs font-bold uppercase tracking-widest text-stone-800">
              More Stories
            </h2>
            {allPosts
              .filter((p) => p.slug !== post.slug)
              .slice(0, 10)
              .map((p) => (
                <PostCard key={p.slug} post={p} variant="compact" />
              ))}
          </div>
        </aside>
      </div>
    </main>
  )
}
