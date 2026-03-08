'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Post } from '@/lib/posts'
import { useState } from 'react'

interface PostCardProps {
  post: Post
  variant?: 'default' | 'featured' | 'compact' | 'horizontal'
}

function toCatSlug(name: string | undefined | null): string | null {
  if (!name || typeof name !== 'string') return null
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || null
}

function PostImage({
  src,
  alt,
  fill,
  sizes,
  priority,
  className,
}: {
  src: string
  alt: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  className?: string
}) {
  const [errored, setErrored] = useState(false)
  if (errored) return null
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setErrored(true)}
    />
  )
}

export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  const safeDate = post.date ? new Date(post.date) : new Date()
  const formattedDate = safeDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const firstCat = Array.isArray(post.categories) ? post.categories.find(c => typeof c === 'string') : undefined
  const categorySlug = toCatSlug(firstCat)

  if (variant === 'featured') {
    return (
      <article className="group relative overflow-hidden rounded-sm">
        <Link href={`/post/${post.slug}`}>
          <div className="relative h-96 w-full bg-stone-800">
            {post.featured_image && (
              <PostImage
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {categorySlug && firstCat && (
                <span className="mb-2 inline-block bg-red-700 px-2 py-0.5 text-xs font-semibold uppercase tracking-widest">
                  {firstCat}
                </span>
              )}
              <h2 className="mt-2 font-serif text-2xl font-bold leading-tight md:text-3xl group-hover:underline decoration-1 underline-offset-2">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 text-sm text-stone-200 line-clamp-2">{post.excerpt}</p>
              )}
              <time className="mt-3 block text-xs text-stone-300">{formattedDate}</time>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  if (variant === 'horizontal') {
    return (
      <article className="group flex gap-4 border-b border-stone-200 pb-4">
        {post.featured_image && (
          <HorizontalImage post={post} />
        )}
        <div className="min-w-0 flex-1">
          {categorySlug && firstCat && (
            <Link
              href={`/category/${categorySlug}`}
              className="text-xs font-semibold uppercase tracking-widest text-red-700 hover:text-red-900"
            >
              {firstCat}
            </Link>
          )}
          <Link href={`/post/${post.slug}`}>
            <h3 className="mt-0.5 font-serif text-base font-semibold leading-snug text-stone-900 group-hover:text-red-800 line-clamp-2">
              {post.title}
            </h3>
          </Link>
          <time className="mt-1 block text-xs text-stone-400">{formattedDate}</time>
        </div>
      </article>
    )
  }

  if (variant === 'compact') {
    return (
      <article className="group border-b border-stone-200 py-3">
        {categorySlug && firstCat && (
          <Link
            href={`/category/${categorySlug}`}
            className="text-xs font-semibold uppercase tracking-widest text-red-700 hover:text-red-900"
          >
            {firstCat}
          </Link>
        )}
        <Link href={`/post/${post.slug}`}>
          <h3 className="mt-0.5 font-serif text-sm font-semibold leading-snug text-stone-900 group-hover:text-red-800 line-clamp-2">
            {post.title}
          </h3>
        </Link>
        <time className="mt-1 block text-xs text-stone-400">{formattedDate}</time>
      </article>
    )
  }

  // default card
  return (
    <article className="group">
      <DefaultImage post={post} />
      <div className="mt-3">
        {categorySlug && firstCat && (
          <Link
            href={`/category/${categorySlug}`}
            className="text-xs font-semibold uppercase tracking-widest text-red-700 hover:text-red-900"
          >
            {firstCat}
          </Link>
        )}
        <Link href={`/post/${post.slug}`}>
          <h2 className="mt-1 font-serif text-lg font-bold leading-snug text-stone-900 group-hover:text-red-800 line-clamp-3">
            {post.title}
          </h2>
        </Link>
        {post.excerpt && (
          <p className="mt-1.5 text-sm text-stone-500 line-clamp-2">{post.excerpt}</p>
        )}
        <time className="mt-2 block text-xs text-stone-400">{formattedDate}</time>
      </div>
    </article>
  )
}

// Separate client sub-components so each image has independent error state

function DefaultImage({ post }: { post: Post }) {
  const [errored, setErrored] = useState(false)
  if (!post.featured_image || errored) return null
  return (
    <Link href={`/post/${post.slug}`} className="block overflow-hidden rounded-sm">
      <div className="relative h-52 w-full bg-stone-200">
        <Image
          src={post.featured_image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={() => setErrored(true)}
        />
      </div>
    </Link>
  )
}

function HorizontalImage({ post }: { post: Post }) {
  const [errored, setErrored] = useState(false)
  if (!post.featured_image || errored) return null
  return (
    <Link href={`/post/${post.slug}`} className="flex-shrink-0">
      <div className="relative h-20 w-28 overflow-hidden rounded-sm bg-stone-200">
        <Image
          src={post.featured_image}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="112px"
          onError={() => setErrored(true)}
        />
      </div>
    </Link>
  )
}
