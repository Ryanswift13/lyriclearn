export interface WordExplanation {
  ipa: string
  pos: string
  cefr: string
  cn: string
  def: string
  example_en: string
  example_cn: string
  memory_tip: string
}

const cache = new Map<string, WordExplanation>()

function buildBody(word: string, sentence: string, songName: string, artist: string) {
  const prompt = `你是英语老师，帮用户通过音乐学英语。
歌曲：《${songName}》- ${artist}
歌词原句：${sentence}
目标单词：${word}

请用JSON格式回复（只输出JSON，不含其他内容）：
{
  "ipa": "IPA发音（如 /wɜːd/）",
  "pos": "词性（verb / noun / adj / adv 等）",
  "cefr": "CEFR等级（A1/A2/B1/B2/C1）",
  "cn": "中文释义（简明，如：使柔和；变温和）",
  "def": "英文释义（1句简单英语）",
  "example_en": "直接引用上面的歌词原句",
  "example_cn": "歌词原句的中文翻译",
  "memory_tip": "一句话记忆技巧（中文）"
}`
  return JSON.stringify({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })
}

async function parseExplanation(res: Response): Promise<WordExplanation> {
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`)
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('DeepSeek 返回空内容')
  return JSON.parse(content) as WordExplanation
}

export async function explainWord(
  word: string,
  sentence: string,
  songName: string,
  artist: string,
  apiKey: string,
): Promise<WordExplanation> {
  const cacheKey = `${word.toLowerCase()}::${songName}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)!

  const body = buildBody(word, sentence, songName, artist)
  let explanation: WordExplanation

  if (apiKey) {
    // User provided their own key — call DeepSeek directly
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body,
    })
    explanation = await parseExplanation(res)
  } else {
    // Fallback: use backend proxy (Vite middleware / future server route)
    const res = await fetch('/ai/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })
    explanation = await parseExplanation(res)
  }

  cache.set(cacheKey, explanation)
  return explanation
}
