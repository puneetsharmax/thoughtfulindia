import Link from 'next/link'
import { slugifyCategory } from '@/lib/posts'

const FOOTER_CATEGORY_NAMES = [
  'Featured Stories', 'Politics', 'World Politics', 'Business',
  'Lifestyle', 'Health & Spirituality', 'Entertainment', 'Food',
  'Interesting', 'Education',
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t-4 border-stone-900 bg-stone-900 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Top section */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="group">
              <h2 className="font-serif text-2xl font-bold text-white group-hover:text-stone-300">
                Thoughtful India
              </h2>
              <p className="mt-1 text-xs tracking-widest text-stone-400 uppercase">
                Insight · Analysis · Perspective
              </p>
            </Link>
            <p className="mt-4 text-sm text-stone-400 leading-relaxed">
              Thoughtful India brings you thoughtful perspectives on politics, society, culture,
              and life from across the subcontinent and beyond.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
              Sections
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {FOOTER_CATEGORY_NAMES.map((name) => (
                <li key={name}>
                  <Link
                    href={`/category/${slugifyCategory(name)}/`}
                    className="text-sm text-stone-300 hover:text-white transition-colors"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-stone-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/category/featured-stories/" className="text-sm text-stone-300 hover:text-white transition-colors">
                  Featured Stories
                </Link>
              </li>
              <li>
                <Link href="/category/interesting/" className="text-sm text-stone-300 hover:text-white transition-colors">
                  Interesting Reads
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 border-t border-stone-700 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
            <p className="text-xs text-stone-500">
              © {currentYear} Thoughtful India. All rights reserved.
            </p>
            <p className="text-xs text-stone-600">
              1,959 articles · Est. thoughtfulindia.com
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
