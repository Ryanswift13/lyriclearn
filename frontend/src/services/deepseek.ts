export interface WordExplanation {
  definition: string
  example: string
  culture: string
  memory_tip: string
}

const cache = new Map<string, WordExplanation>()

export async function explainWord(
  word: string,
  sentence: string,
  songName: string,
  artist: string,
  apiKey: string,
): Promise<WordExplanation> {
  const cacheKey = `${word.toLowerCase()}::${songName}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)!

  const prompt = `你是一位英语老师，帮助用户通过音乐学英语。
歌曲：《${songName}》- ${artist}
歌词句子：${sentence}
目标单词：${word}

请用JSON格式回复（只输出JSON，不要任何其他内容）：
{
  "definition": "词义（中文，简明扼要）",
  "example": "这句歌词中的用法说明（1-2句中文解释）",
  "culture": "相关俚语或文化背景（如无则填空字符串\"\"）",
  "memory_tip": "一句话记忆技巧（中文）"
}`

  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`DeepSeek API 错误 ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek 返回空内容')

  const explanation = JSON.parse(content) as WordExplanation
  cache.set(cacheKey, explanation)
  return explanation
}
