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
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src

    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      const outSize = Math.max(64, Math.min(96, size))
      canvas.width = outSize
      canvas.height = outSize

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2

      const bg = hexToRgb(BG_COLOR)
      const ink = hexToRgb(INK_COLOR)

      // Draw high-res source
      const bufSize = outSize * 2
      const buf = document.createElement('canvas')
      buf.width = bufSize
      buf.height = bufSize
      const bctx = buf.getContext('2d')
      if (!bctx) return

      bctx.imageSmoothingEnabled = true
      bctx.drawImage(img, sx, sy, side, side, 0, 0, bufSize, bufSize)
      const imageData = bctx.getImageData(0, 0, bufSize, bufSize)
      const data = imageData.data

      ctx.fillStyle = BG_COLOR
      ctx.fillRect(0, 0, outSize, outSize)

      // Map to blue-gray gradient with smooth quantization (16+ shades)
      for (let y = 0; y < bufSize; y += 2) {
        for (let x = 0; x < bufSize; x += 2) {
          const idx = (y * bufSize + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
          const t = Math.max(0, Math.min(1, lum / 255))
          const nr = Math.round(ink.r + (bg.r - ink.r) * t)
          const ng = Math.round(ink.g + (bg.g - ink.g) * t)
          const nb = Math.round(ink.b + (bg.b - ink.b) * t)
          ctx.fillStyle = `rgb(${nr},${ng},${nb})`
          ctx.fillRect(Math.floor(x / 2), Math.floor(y / 2), 1, 1)
        }
      }

      // Very subtle LCD grid
      ctx.globalAlpha = 0.08
      ctx.fillStyle = ink.r + ',' + ink.g + ',' + ink.b
      // simple overlay via fill with low alpha not straightforward; skip heavy grid
      ctx.globalAlpha = 1
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
