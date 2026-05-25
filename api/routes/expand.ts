import { Router, type Request, type Response } from 'express'
import { createChatCompletion } from '../services/ai.js'

const router = Router()

router.post('/expand', async (req: Request, res: Response) => {
  try {
    const { text, apiUrl, apiKey, modelName } = req.body
    if (!text || !apiUrl || !apiKey || !modelName) {
      res.status(400).json({ error: '缺少必要参数' })
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    const systemContent = `你是一个专业的文章扩写专家。用户会输入一段文字，你需要将其扩写成1000-3000字的完整文章。

扩写要求：
1. 保持原文的核心观点和主题不变
2. 适当添加案例、数据、细节描写来丰富内容
3. 补充相关背景信息，让读者更好理解
4. 完善文章结构，包括开头、发展、高潮、结尾
5. 使用生动形象的语言，提升可读性
6. 保持原文的语气风格
7. 扩写后的文章要有深度、有价值，不是简单的重复堆砌

请直接输出扩写后的完整文章内容，不要添加任何前缀说明。`

    const messages = [
      { role: 'system', content: systemContent },
      { role: 'user', content: text },
    ]

    const response = await createChatCompletion({
      apiUrl, apiKey, modelName, messages, stream: true,
    })

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()!

        for (const line of lines) {
          const trimmed = line.trim()
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`)
              }
            } catch (_) { /* skip */ }
          }
        }
      }
      res.write('data: [DONE]\n\n')
      res.end()
    } catch (streamErr: unknown) {
      const msg = streamErr instanceof Error ? streamErr.message : String(streamErr)
      console.error('Stream read error:', streamErr)
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
      res.end()
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Expand error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: msg })
    } else {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
      res.end()
    }
  }
})

export default router
