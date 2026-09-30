'use client'

import { useState } from 'react'

interface NewsCardImageProps {
  src?: string | null
  alt: string
  className?: string
}

export function NewsCardImage({ src, alt, className }: NewsCardImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src || '/news-placeholder.png')

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className || 'object-cover opacity-90 w-full h-full group-hover:scale-105 transition-transform duration-700 absolute inset-0'}
      onError={() => {
        if (imgSrc !== '/news-placeholder.png') {
          setImgSrc('/news-placeholder.png')
        }
      }}
    />
  )
}
