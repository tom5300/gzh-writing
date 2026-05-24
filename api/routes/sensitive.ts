import { Router, type Request, type Response } from 'express'
import { createChatCompletionJSON, parseJSON } from '../services/ai.js'

const router = Router()

// 敏感词检测
router.post('/check-sensitive', async (req: Request, res: Response) => {
  try {
    const { article, apiUrl, apiKey, modelName } = req.body

    if (!article || !apiUrl || !apiKey || !modelName) {
      res.status(400).json({ error: '缺少必要参数' })
      return
    }

    const systemPrompt = `你是一位专业的内容安全审查专家，负责检测公众号文章中的敏感内容。
请仔细分析用户提供的文章内容，识别可能存在问题的部分。

需要检测的敏感类型包括但不限于：
1. 政治敏感：涉及领导人、政党、历史事件、政治制度等
2. 社会事件：重大事故、群体事件、维权活动等
3. 宗教问题：邪教组织、宗教极端思想等
4. 色情低俗：性暗示、色情内容等
5. 暴力血腥：暴力描述、血腥场景等
6. 虚假信息：未经证实的谣言、虚假新闻等
7. 侵权内容：侵犯他人隐私、知识产权等
8. 违规广告：非法集资、虚假宣传等
9. 其他违规：涉及赌博、毒品、武器等

请严格按以下 JSON 格式返回：
{
  "isSensitive": true 或 false,
  "riskLevel": "low" / "medium" / "high",
  "issues": [
    {
      "type": "问题类型",
      "description": "问题描述",
      "keywords": ["关键词1", "关键词2"],
      "suggestion": "修改建议"
    }
  ],
  "summary": "总体评估摘要"
}

如果文章没有问题，isSensitive 返回 false，issues 返回空数组。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: article },
    ]

    const raw = await createChatCompletionJSON({ apiUrl, apiKey, modelName, messages })
    const result = parseJSON(raw) as {
      isSensitive?: boolean
      riskLevel?: string
      issues?: Array<{
        type: string
        description: string
        keywords: string[]
        suggestion: string
      }>
      summary?: string
    }

    res.json({
      isSensitive: result.isSensitive ?? false,
      riskLevel: result.riskLevel ?? 'low',
      issues: result.issues ?? [],
      summary: result.summary ?? '未检测到敏感内容',
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Sensitive check error:', err)
    res.status(500).json({ error: msg })
  }
})

export default router