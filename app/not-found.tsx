import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found',
}

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="text-8xl font-black text-stone-200">404</p>
      <h1 className="mt-4 font-serif text-3xl font-bold text-stone-900">Page Not Found</h1>
      <p className="mt-4 text-stone-500">
        The article or page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link
          href="/"
          className="inline-block bg-stone-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 transition-colors"
        >
          Go to Home
        </Link>
        <Link
          href="/category/featured-stories/"
          className="inline-block border border-stone-300 px-6 py-2.5 text-sm font-semibold text-stone-700 hover:border-stone-900 transition-colors"
        >
          Featured Stories
        </Link>
      </div>
    </main>
  )
}
