import { Router, type Request, type Response } from 'express'
import { createChatCompletionJSON } from '../services/ai.js'

const router = Router()

interface StyleFeatures {
  titlePattern: string
  openingStyle: string
  structure: string
  languageStyle: string
  closingStyle: string
  tone: string
}

// 分析文章风格
router.post('/analyze-style', async (req: Request, res: Response) => {
  try {
    const { articles, apiUrl, apiKey, modelName } = req.body

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      res.status(400).json({ error: '请提供至少一篇文章' })
      return
    }

    if (!apiUrl || !apiKey || !modelName) {
      res.status(400).json({ error: '缺少 API 配置' })
      return
    }

    const combinedArticles = articles.join('\n\n---\n\n')

    const systemPrompt = `你是一位专业的公众号内容风格分析师。
请分析用户提供的公众号文章，提取出以下6个维度的风格特征：

1. **标题风格 (titlePattern)**: 标题的命名规律、长度特点、是否使用数字/疑问/感叹等修辞
2. **开头方式 (openingStyle)**: 文章开头的吸引读者方式，如故事引入、痛点共鸣、数据展示等
3. **文章结构 (structure)**: 段落组织方式，如总分总、层层递进、并列论述等
4. **语言风格 (languageStyle)**: 用词特点，如口语化/书面化、专业术语使用、网络用语等
5. **结尾方式 (closingStyle)**: 文章结尾的收尾方式，如总结升华、呼吁行动、金句点睛等
6. **语气特点 (tone)**: 整体语气，如亲切随和、严肃专业、幽默风趣、情感充沛等

请严格按以下JSON格式返回，不要返回任何其他内容：
{
  "titlePattern": "...",
  "openingStyle": "...",
  "structure": "...",
  "languageStyle": "...",
  "closingStyle": "...",
  "tone": "..."
}`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请分析以下公众号文章的风格特征：\n\n${combinedArticles}` },
    ]

    const raw = await createChatCompletionJSON({ apiUrl, apiKey, modelName, messages })
    
    // 尝试解析 JSON
    let result: StyleFeatures
    try {
      result = JSON.parse(raw) as StyleFeatures
    } catch {
      // 如果直接解析失败，尝试提取 JSON 部分
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        result = JSON.parse(match[0]) as StyleFeatures
      } else {
        res.status(500).json({ error: '风格分析结果格式异常', raw: raw.substring(0, 200) })
        return
      }
    }

    // 验证必需字段
    const requiredFields: (keyof StyleFeatures)[] = ['titlePattern', 'openingStyle', 'structure', 'languageStyle', 'closingStyle', 'tone']
    for (const field of requiredFields) {
      if (!result[field]) {
        res.status(500).json({ error: `风格分析结果缺少字段: ${field}`, result })
        return
      }
    }

    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Analyze style error:', err)
    res.status(500).json({ error: msg })
  }
})

export default router
