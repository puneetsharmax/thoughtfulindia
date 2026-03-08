import { getAllPosts, getPostContent } from '@/lib/posts'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import PostCard from '@/components/PostCard'
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
                  href={`/category/${post.categories[0].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                  className="hover:text-red-700"
                >
                  {post.categories[0]}
                </Link>
              </>
            )}
          </nav>

          {post.categories[0] && (
            <Link
              href={`/category/${post.categories[0].toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
              className="mb-3 inline-block bg-red-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest text-white hover:bg-red-800"
            >
              {post.categories[0]}
            </Link>
          )}

          <h1 className="font-serif text-3xl font-bold leading-tight text-stone-900 md:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-b border-stone-200 pb-4">
            <time className="text-sm text-stone-500">{formattedDate}</time>
          </div>

          {post.featured_image && (
            <div className="relative mt-6 h-64 w-full overflow-hidden rounded-sm bg-stone-200 sm:h-80 md:h-96">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 75vw"
              />
            </div>
          )}

          <div
            className="prose prose-stone prose-lg mt-8 max-w-none
              prose-headings:font-serif prose-headings:font-bold
              prose-a:text-red-700 prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-sm
              prose-blockquote:border-l-red-700 prose-blockquote:italic"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

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
