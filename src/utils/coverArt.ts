let coverDataUrlPromise: Promise<string | null> | null = null

function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '')
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export function getCoverDataUrl() {
  if (typeof window === 'undefined') {
    return Promise.resolve(null)
  }

  if (!coverDataUrlPromise) {
    coverDataUrlPromise = fetch('/for-astha.jpg')
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => (blob ? readAsDataUrl(blob) : null))
      .catch(() => null)
  }

  return coverDataUrlPromise
}
