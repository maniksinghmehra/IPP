import { useEffect, useRef } from 'react'

interface LcdCoverProps {
  src: string
  alt: string
  size?: number
  subtle?: boolean
}

const BG_COLOR = '#C4D8EE'
const INK_COLOR = '#536274'

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h, 16)
  if (h.length === 6) {
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    }
  }
  return { r: 196, g: 216, b: 238 }
}

export function LcdCover({ src, alt, size = 72 }: LcdCoverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src

    img.onload = () => {
      if (cancelled) return

      const canvas = canvasRef.current
      if (!canvas) return

      const dpr =
        typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
      const outSize = Math.min(512, Math.max(128, Math.round(size * dpr)))
      canvas.width = outSize
      canvas.height = outSize

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2

      const bg = hexToRgb(BG_COLOR)
      const ink = hexToRgb(INK_COLOR)

      const buf = document.createElement('canvas')
      buf.width = outSize
      buf.height = outSize
      const bctx = buf.getContext('2d', { willReadFrequently: true })
      if (!bctx) return

      bctx.imageSmoothingEnabled = true
      bctx.imageSmoothingQuality = 'high'
      bctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize)

      const source = bctx.getImageData(0, 0, outSize, outSize)
      const srcData = source.data
      const mapped = ctx.createImageData(outSize, outSize)
      const outData = mapped.data

      for (let i = 0; i < srcData.length; i += 4) {
        const lum =
          0.2126 * srcData[i] + 0.7152 * srcData[i + 1] + 0.0722 * srcData[i + 2]
        const t = Math.max(0, Math.min(1, lum / 255))
        outData[i] = Math.round(ink.r + (bg.r - ink.r) * t)
        outData[i + 1] = Math.round(ink.g + (bg.g - ink.g) * t)
        outData[i + 2] = Math.round(ink.b + (bg.b - ink.b) * t)
        outData[i + 3] = 255
      }

      ctx.putImageData(mapped, 0, 0)
    }

    return () => {
      cancelled = true
    }
  }, [src, size])

  return (
    <canvas
      ref={canvasRef}
      aria-label={alt}
      role="img"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        imageRendering: 'auto',
      }}
    />
  )
}
