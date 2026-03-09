import Link from 'next/link'
import { slugifyCategory } from '@/lib/utils'

const FOOTER_CATEGORY_NAMES = [
  'Featured Stories', 'Politics', 'World Politics', 'Business',
  'Lifestyle', 'Health & Spirituality', 'Entertainment', 'Food',
  'Interesting', 'Education',
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-16" style={{ backgroundColor: '#1A1A2E', borderTop: '4px solid #C8540A' }}>
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Top section */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="group">
              <h2 className="font-serif text-2xl font-bold group-hover:opacity-90 transition-opacity" style={{ color: '#F4A620' }}>
                Thoughtful India
              </h2>
              <p className="mt-1 text-xs tracking-widest uppercase" style={{ color: '#C8540A' }}>
                Insight · Analysis · Perspective
              </p>
            </Link>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: '#D4D4D8' }}>
              Thoughtful India brings you thoughtful perspectives on politics, society, culture,
              and life from across the subcontinent and beyond.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C8540A' }}>
              Sections
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {FOOTER_CATEGORY_NAMES.map((name) => (
                <li key={name}>
                  <Link
                    href={`/category/${slugifyCategory(name)}/`}
                    className="text-sm transition-colors hover:text-yellow-400"
                    style={{ color: '#F4A620' }}
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#C8540A' }}>
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm transition-colors hover:text-yellow-400" style={{ color: '#F4A620' }}>
                  Home
                </Link>
              </li>
              <li>
                <Link href="/category/featured-stories/" className="text-sm transition-colors hover:text-yellow-400" style={{ color: '#F4A620' }}>
                  Featured Stories
                </Link>
              </li>
              <li>
                <Link href="/category/interesting/" className="text-sm transition-colors hover:text-yellow-400" style={{ color: '#F4A620' }}>
                  Interesting Reads
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-10 pt-6" style={{ borderTop: '1px solid #C8540A' }}>
          <div className="flex flex-col items-center justify-between gap-3 text-center md:flex-row md:text-left">
            <p className="text-xs" style={{ color: '#888888' }}>
              © {currentYear} Thoughtful India. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: '#666666' }}>
              1,959 articles · Est. thoughtfulindia.com
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
