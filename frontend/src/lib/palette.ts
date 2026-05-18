export interface Palette {
  c1: string
  c2: string
}

const cache = new Map<string, Palette | null>()

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  const d = max - min
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h /= 6
  }
  return [h, s, l]
}

function toHex(r: number, g: number, b: number): string {
  const h = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

// Hue-bucket the pixels, weighting vibrant mid-light pixels, then pick the two
// most prominent and hue-distinct buckets.
function pickColors(data: Uint8ClampedArray): Palette | null {
  const BUCKETS = 12
  const sumR = new Array(BUCKETS).fill(0)
  const sumG = new Array(BUCKETS).fill(0)
  const sumB = new Array(BUCKETS).fill(0)
  const weight = new Array(BUCKETS).fill(0)
  let anySaturated = false
  let avgR = 0; let avgG = 0; let avgB = 0; let avgN = 0

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]; const g = data[i + 1]; const b = data[i + 2]
    if (data[i + 3] < 125) continue
    avgR += r; avgG += g; avgB += b; avgN++
    const [h, s, l] = rgbToHsl(r, g, b)
    if (l > 0.93 || l < 0.07 || s < 0.15) continue
    anySaturated = true
    const bucket = Math.min(BUCKETS - 1, Math.floor(h * BUCKETS))
    const w = s * (1 - Math.abs(l - 0.5))
    sumR[bucket] += r * w
    sumG[bucket] += g * w
    sumB[bucket] += b * w
    weight[bucket] += w
  }

  if (avgN === 0) return null

  if (!anySaturated) {
    const r = avgR / avgN; const g = avgG / avgN; const b = avgB / avgN
    return { c1: toHex(r, g, b), c2: toHex(r * 0.7, g * 0.7, b * 0.78) }
  }

  const order = weight
    .map((w, i) => ({ i, w }))
    .sort((a, b) => b.w - a.w)
  const bucketColor = (i: number) => toHex(sumR[i] / weight[i], sumG[i] / weight[i], sumB[i] / weight[i])
  const top = order[0].i
  const c1 = bucketColor(top)

  let secondIdx = top
  for (const { i, w } of order) {
    if (w <= 0) break
    const dist = Math.min(Math.abs(i - top), BUCKETS - Math.abs(i - top))
    if (dist >= 2) { secondIdx = i; break }
  }
  const c2 = secondIdx === top
    ? toHex(sumR[top] / weight[top] * 0.72, sumG[top] / weight[top] * 0.72, sumB[top] / weight[top] * 0.8)
    : bucketColor(secondIdx)

  return { c1, c2 }
}

// Extract two dominant colours from an album cover. Resolves null on load
// failure or when CORS taints the canvas — callers fall back to a hash palette.
export async function extractPalette(url: string): Promise<Palette | null> {
  if (!url) return null
  const cached = cache.get(url)
  if (cached !== undefined) return cached

  const result = await new Promise<Palette | null>((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const size = 32
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve(null)
        ctx.drawImage(img, 0, 0, size, size)
        resolve(pickColors(ctx.getImageData(0, 0, size, size).data))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })

  cache.set(url, result)
  return result
}
