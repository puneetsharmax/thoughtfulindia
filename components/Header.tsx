'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugifyCategory } from '@/lib/utils'

const NAV_CATEGORIES = [
  'Featured Stories', 'Politics', 'World Politics', 'Business',
  'Lifestyle', 'Health & Spirituality', 'Entertainment', 'Food'
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      router.push(`/search/?q=${encodeURIComponent(searchInput.trim())}`)
      setSearchOpen(false)
      setSearchInput('')
    }
  }

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          {/* Search icon — left on desktop, hidden on mobile (hamburger takes that side) */}
          <div className="hidden md:flex items-center w-32">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-500 hover:text-red-700 transition-colors"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </button>
          </div>

          <Link href="/" className="text-center flex-1">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Thoughtful India
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 tracking-widest uppercase">
              Best of Global News for the Thoughtful Indian
            </p>
          </Link>

          {/* Right side: search icon (mobile) + hamburger (mobile) */}
          <div className="flex items-center gap-1 md:w-32 md:justify-end">
            <Link href="/search/" className="md:hidden p-2 text-gray-500 hover:text-red-700" aria-label="Search">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
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
        </div>

        {/* Inline search bar (desktop, expands below header row) */}
        {searchOpen && (
          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2 py-2 border-b border-gray-100">
            <input
              type="search"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search articles…"
              autoFocus
              className="flex-1 rounded border border-stone-300 px-3 py-1.5 text-sm focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-100"
            />
            <button type="submit" className="px-4 py-1.5 bg-red-700 text-white text-sm rounded hover:bg-red-800 transition-colors">
              Go
            </button>
            <button type="button" onClick={() => setSearchOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </form>
        )}
        {/* Category Nav */}
        <nav className={`${menuOpen ? 'block' : 'hidden'} md:block`}>
          <ul className="flex flex-col md:flex-row md:items-center md:justify-center gap-0 md:gap-1 py-2">
            {NAV_CATEGORIES.map(cat => (
              <li key={cat}>
                <Link
                  href={`/category/${slugifyCategory(cat)}/`}
                  className="block px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-600 hover:text-red-700 hover:bg-gray-50 rounded transition-colors whitespace-nowrap"
                >
                  {cat}
                </Link>
              </li>
            ))}
            <li><span className="hidden md:block text-gray-300 mx-1">|</span></li>
            <li>
              <Link href="/for-students/" className="block px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-red-700 hover:bg-gray-50 rounded transition-colors whitespace-nowrap">
                For Students
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}
