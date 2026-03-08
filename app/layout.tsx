import type { Metadata } from 'next'
import { Merriweather, Source_Serif_4, Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const merriweather = Merriweather({
  weight: ['300', '400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Thoughtful India — Insight · Analysis · Perspective',
    template: '%s | Thoughtful India',
  },
  description:
    'Thoughtful perspectives on India — politics, society, culture, lifestyle, and life from across the subcontinent and beyond.',
  metadataBase: new URL('https://thoughtfulindia.com'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://thoughtfulindia.com',
    siteName: 'Thoughtful India',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${merriweather.variable} ${sourceSerif.variable} ${inter.variable}`}>
      <body className="bg-stone-50 font-sans text-stone-900 antialiased">
        <Header />
        <div className="min-h-screen">{children}</div>
        <Footer />
      </body>
    </html>
  )
}
