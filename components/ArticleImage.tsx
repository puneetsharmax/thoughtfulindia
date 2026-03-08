'use client'

import Image from 'next/image'
import { useState } from 'react'

interface ArticleImageProps {
  src: string
  alt: string
}

export default function ArticleImage({ src, alt }: ArticleImageProps) {
  const [errored, setErrored] = useState(false)
  if (errored) return null
  return (
    <div className="relative mt-6 h-64 w-full overflow-hidden rounded-sm bg-stone-200 sm:h-80 md:h-96">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, 75vw"
        onError={() => setErrored(true)}
      />
    </div>
  )
}
