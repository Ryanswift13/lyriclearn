export interface LyricLine {
  time: number
  text: string
}

const TIME_REGEX = /\[(\d{2}):(\d{2}[.,]\d+)\]/g

export function parseLRC(lrc: string): LyricLine[] {
  const result: LyricLine[] = []

  for (const line of lrc.split('\n')) {
    const matches = [...line.matchAll(TIME_REGEX)]
    if (!matches.length) continue
    const text = line.replace(TIME_REGEX, '').trim()
    if (!text) continue

    for (const m of matches) {
      const minutes = parseInt(m[1])
      const seconds = parseFloat(m[2].replace(',', '.'))
      result.push({ time: minutes * 60 + seconds, text })
    }
  }

  return result.sort((a, b) => a.time - b.time)
}
