import { Router, type Request, type Response } from 'express'
import { createChatCompletionJSON, parseJSON } from '../services/ai.js'

const router = Router()

router.post('/titles', async (req: Request, res: Response) => {
  try {
    const { article, apiUrl, apiKey, modelName, styleFeatures } = req.body
    if (!article || !apiUrl || !apiKey || !modelName) {
      res.status(400).json({ error: '缺少必要参数' })
      return
    }

    let systemPrompt = `你是一位资深的新媒体编辑，擅长写出吸引眼球的标题和精炼的摘要。
请根据用户提供的文章内容，生成 5 组标题和摘要。
要求：
1. 标题要有吸引力，适合公众号、头条等新媒体平台发布，风格多样（可包含疑问句、数字型、反差型等）
2. 摘要要在1-2句话内概括文章核心观点，语言精炼有力
3. 标题和摘要必须严格对应`

    // 如果有风格特征，注入到 prompt
    if (styleFeatures) {
      systemPrompt += `

## 额外风格要求（必须严格遵循）

**标题风格**：${styleFeatures.titlePattern}
**语言风格**：${styleFeatures.languageStyle}
**语气特点**：${styleFeatures.tone}

请确保生成的标题和摘要完全符合上述风格特征。`
    }

    systemPrompt += `
请严格按以下 JSON 格式返回，不要返回任何其他内容：
[
  {"title": "标题1", "summary": "摘要1"},
  {"title": "标题2", "summary": "摘要2"},
  {"title": "标题3", "summary": "摘要3"},
  {"title": "标题4", "summary": "摘要4"},
  {"title": "标题5", "summary": "摘要5"}
]`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: article },
    ]

    const raw = await createChatCompletionJSON({ apiUrl, apiKey, modelName, messages })
    const titles = parseJSON(raw) as Array<{ title: string; summary: string }>

    if (!Array.isArray(titles)) {
      res.status(500).json({ error: 'AI 返回格式异常，期望数组', raw: raw.substring(0, 200) })
      return
    }

    res.json({ titles })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Titles generation error:', err)
    res.status(500).json({ error: msg })
  }
})

export default router
