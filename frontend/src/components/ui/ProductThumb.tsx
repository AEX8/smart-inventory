import { useState } from 'react'

type ProductThumbProps = {
  name: string | null
  src: string | null | undefined
  size?: number
}

// "Dinner Plate 27cm" -> "DP", "Espresso" -> "ES"
const initials = (name: string | null) => {
  if (!name) return '?'
  const words = name.trim().split(/\s+/).filter((w) => /^[a-z]/i.test(w))
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return (words[0] ?? name).slice(0, 2).toUpperCase()
}

const ProductThumb = ({ name, src, size = 44 }: ProductThumbProps) => {
  // remember which src failed so a new src gets a fresh attempt
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showImage = !!src && failedSrc !== src

  return (
    <div
      className="flex-shrink-0 flex items-center justify-center overflow-hidden rounded"
      style={{
        width: size,
        height: size,
        background: 'var(--surface-subtle)',
        border: '1px solid var(--border)',
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="font-serif select-none"
          style={{ fontSize: Math.round(size * 0.32), color: 'var(--text-secondary)' }}
          aria-hidden="true"
        >
          {initials(name)}
        </span>
      )}
    </div>
  )
}

export default ProductThumb
