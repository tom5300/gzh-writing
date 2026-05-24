import { Router, type Request, type Response } from 'express'
import { createChatCompletionJSON, createImage, parseJSON } from '../services/ai.js'

const router = Router()

// 生成封面图 Prompt
router.post('/cover/prompts', async (req: Request, res: Response) => {
  try {
    const { article, apiUrl, apiKey, modelName, imageCount } = req.body
    if (!article || !apiUrl || !apiKey || !modelName) {
      res.status(400).json({ error: '缺少必要参数' })
      return
    }

    const count = Math.min(Math.max(imageCount || 3, 1), 5) // 限制 1-5 个

    const systemPrompt = `你是一位视觉设计专家和 AI 绘图 Prompt 工程师。
请根据用户提供的文章内容完成以下任务：
1. 提炼 ${count} 个关键内容点（简短概括，每个不超过15个字）
2. 生成 ${count} 个不同风格的配图 Prompt
Prompt 要求：
- 统一宽高比 16:9（横版图片，适合文章配图）
- 风格各不相同，例如：写实摄影、插画风格、扁平设计、电影感等
- 每个 Prompt 用英文撰写，包含详细的视觉描述、风格、色调、构图等
- Prompt 中明确标注 aspect ratio 16:9
请严格按以下 JSON 格式返回，不要返回任何其他内容：
{
  "keyPoints": ["关键点1", "关键点2", ...],
  "prompts": [
    "Prompt 1 in English...",
    "Prompt 2 in English...",
    ...
  ]
}`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: article },
    ]

    const raw = await createChatCompletionJSON({ apiUrl, apiKey, modelName, messages })
    const result = parseJSON(raw) as { keyPoints?: string[]; prompts?: string[] }

    if (!result.keyPoints || !result.prompts) {
      res.status(500).json({ error: 'AI 返回格式异常，缺少 keyPoints 或 prompts', raw: (raw as string).substring(0, 200) })
      return
    }

    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Cover prompts error:', err)
    res.status(500).json({ error: msg })
  }
})

// 生成封面图
router.post('/cover/generate', async (req: Request, res: Response) => {
  try {
    const { prompt, apiUrl, apiKey, modelName } = req.body
    if (!prompt || !apiUrl || !apiKey || !modelName) {
      res.status(400).json({ error: '缺少必要参数' })
      return
    }

    const result = await createImage({ apiUrl, apiKey, modelName, prompt })

    if (!result.url && !result.b64_json) {
      if (result.async) {
        res.status(202).json({ error: '该接口为异步模式，暂不支持，请更换同步图片生成接口' })
        return
      }
      res.status(500).json({ error: '图片生成失败：未返回图片数据' })
      return
    }

    res.json(result)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Cover generate error:', err)
    res.status(500).json({ error: msg })
  }
})

// 图片代理 - 显示 (GET)
router.get('/cover/proxy', async (req: Request, res: Response) => {
  try {
    const imageUrl = req.query.url as string
    if (!imageUrl) {
      res.status(400).send('Missing url parameter')
      return
    }

    const response = await fetch(imageUrl)
    if (!response.ok) {
      res.status(502).send('Failed to fetch image')
      return
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const buffer = Buffer.from(await response.arrayBuffer())
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(buffer)
  } catch (err: unknown) {
    console.error('Image proxy error:', err)
    res.status(500).send('Proxy error')
  }
})

// 图片代理 - 下载 (POST)
router.post('/cover/proxy', async (req: Request, res: Response) => {
  try {
    const { imageUrl } = req.body
    if (!imageUrl) {
      res.status(400).json({ error: '缺少图片 URL' })
      return
    }

    const response = await fetch(imageUrl)
    if (!response.ok) {
      res.status(502).json({ error: '下载图片失败' })
      return
    }

    const contentType = response.headers.get('content-type') || 'image/png'
    const buffer = Buffer.from(await response.arrayBuffer())
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Length', buffer.length)
    res.send(buffer)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Image proxy error:', err)
    res.status(500).json({ error: msg })
  }
})

export default router
