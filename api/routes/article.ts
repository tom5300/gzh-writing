import { Router, type Request, type Response } from 'express'
import { getStyle } from '../services/styleLoader.js'
import { createChatCompletion } from '../services/ai.js'

const router = Router()

router.post('/article', async (req: Request, res: Response) => {
  try {
    const { topic, styleId, apiUrl, apiKey, modelName, styleFeatures } = req.body
    if (!topic || !apiUrl || !apiKey || !modelName) {
      res.status(400).json({ error: '缺少必要参数' })
      return
    }

    const style = getStyle(styleId)
    if (!style) {
      res.status(404).json({ error: '未找到写作风格' })
      return
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    // 构建 system prompt
    let systemContent = style.content
    
    // 如果有风格特征，注入到 system prompt
    if (styleFeatures) {
      const styleInjection = `

## 额外风格要求（必须严格遵循）

请严格按照以下风格特征生成文章：

**标题风格**：${styleFeatures.titlePattern}
**开头方式**：${styleFeatures.openingStyle}
**文章结构**：${styleFeatures.structure}
**语言风格**：${styleFeatures.languageStyle}
**结尾方式**：${styleFeatures.closingStyle}
**语气特点**：${styleFeatures.tone}

请确保生成的文章完全符合上述风格特征。`

      systemContent += styleInjection
    }

    const messages = [
      { role: 'system', content: systemContent },
      { role: 'user', content: topic },
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
    console.error('Article generation error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: msg })
    } else {
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`)
      res.end()
    }
  }
})

export default router
