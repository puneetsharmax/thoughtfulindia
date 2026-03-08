'use client'
import Link from 'next/link'
import { useState } from 'react'

const NAV_CATEGORIES = [
  'Featured Stories', 'Politics', 'World Politics', 'Business',
  'Lifestyle', 'Health & Spirituality', 'Entertainment', 'Food'
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <Link href="/" className="text-center flex-1">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Thoughtful India
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 tracking-widest uppercase">
              Best of Global News for the Thoughtful Indian
            </p>
          </Link>
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
        {/* Nav */}
        <nav className={`${menuOpen ? 'block' : 'hidden'} md:block`}>
          <ul className="flex flex-col md:flex-row md:items-center md:justify-center gap-0 md:gap-1 py-2">
            {NAV_CATEGORIES.map(cat => (
              <li key={cat}>
                <Link
                  href={`/category/${encodeURIComponent(cat.toLowerCase().replace(/[&\s]+/g, '-'))}`}
                  className="block px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-red-700 hover:bg-gray-50 rounded transition-colors whitespace-nowrap"
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
