import { Router, type Request, type Response } from 'express'

const router = Router()

// 简单的 HTTP 客户端用于获取网页内容
async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!res.ok) {
    throw new Error(`获取页面失败: ${res.status}`)
  }

  return res.text()
}

// 下载图片并转为 base64
async function downloadImageAsBase64(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`下载图片失败: ${res.status}`)
  const buffer = await res.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = res.headers.get('content-type') || 'image/jpeg'
  return `data:${mimeType};base64,${base64}`
}

// 使用视觉 API 提取图片内容
async function extractImageText(imageData: string, apiUrl: string, apiKey: string, modelName: string): Promise<string> {
  const cleanUrl = apiUrl.replace('/chat/completions', '/vision')

  const body = {
    model: modelName.includes('gpt') ? 'gpt-4o' : modelName,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: '请描述这张图片的内容，如果是截图或包含文字的图片，请完整提取所有文字。直接输出图片中的文字，不要解释。',
          },
          {
            type: 'image_url',
            image_url: { url: imageData },
          },
        ],
      },
    ],
    max_tokens: 2000,
  }

  const res = await fetch(cleanUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`视觉 API 错误: ${err}`)
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content || ''
}

// 从微信文章页面提取内容
function extractWechatContent(html: string): { title: string; author: string; content: string; digest: string; imageUrls: string[] } {
  // 提取标题
  let titleMatch = html.match(/<h1[^>]*id="activity-name"[^>]*>([^<]+)<\/h1>/)
  if (!titleMatch) {
    titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/)
  }
  if (!titleMatch) {
    titleMatch = html.match(/"title"\s*:\s*"([^"]+)"/)
  }
  const title = titleMatch ? titleMatch[1].trim() : '未获取到标题'

  // 提取作者
  let authorMatch = html.match(/<span[^>]*id="js_name"[^>]*>([^<]+)<\/span>/)
  if (!authorMatch) {
    authorMatch = html.match(/"author"\s*:\s*"([^"]+)"/)
  }
  const author = authorMatch ? authorMatch[1].trim() : ''

  // 提取摘要
  let digestMatch = html.match(/"digest"\s*:\s*"([^"]+)"/)
  const digest = digestMatch ? digestMatch[1].trim() : ''

  // 提取正文内容 - 微信文章在 #js_content 里
  let contentMatch = html.match(/<div[^>]*id="js_content"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*id="js_pc_qr_code"/)
  if (!contentMatch) {
    contentMatch = html.match(/id="js_content"[^>]*>([\s\S]*?)id="js_pc_qr_code"/)
  }

  // 提取图片 URL
  const imageUrls: string[] = []
  if (contentMatch) {
    const imgMatches = contentMatch[1].match(/data-src="([^"]+)"/g) || []
    for (const match of imgMatches) {
      const url = match.match(/data-src="([^"]+)"/)?.[1]
      if (url && !url.includes('qrcode') && !url.includes('qr_code')) {
        imageUrls.push(url)
      }
    }
  }

  let content = ''
  if (contentMatch) {
    // 移除所有 HTML 标签但保留文本
    content = contentMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim()
  }

  return { title, author, content, digest, imageUrls }
}

// 抓取微信文章内容（支持图片内容提取）
router.post('/fetch-article', async (req: Request, res: Response) => {
  try {
    const { url, apiUrl, apiKey, modelName, extractImages } = req.body

    if (!url) {
      res.status(400).json({ error: '请提供文章链接' })
      return
    }

    // 验证 URL 是否为微信文章链接
    if (!url.includes('mp.weixin.qq.com')) {
      res.status(400).json({ error: '仅支持微信公众平台文章链接' })
      return
    }

    // 获取页面内容
    const html = await fetchPage(url)

    // 提取内容
    const { title, author, content, digest, imageUrls } = extractWechatContent(html)

    if (!content || content.length < 50) {
      res.status(400).json({ error: '无法解析文章内容，请确认链接是否有效' })
      return
    }

    let finalContent = content
    let imageTexts: string[] = []

    // 如果需要提取图片内容，且提供了 API 配置
    if (extractImages && apiUrl && apiKey && modelName && imageUrls.length > 0) {
      try {
        // 限制处理的图片数量（最多 5 张，避免 API 调用过多）
        const imagesToProcess = imageUrls.slice(0, 5)

        for (const imgUrl of imagesToProcess) {
          try {
            const imageData = await downloadImageAsBase64(imgUrl)
            const imageText = await extractImageText(imageData, apiUrl, apiKey, modelName)
            if (imageText && imageText.trim()) {
              imageTexts.push(imageText.trim())
            }
          } catch (imgErr) {
            console.error('提取图片内容失败:', imgErr)
            // 继续处理下一张图片
          }
        }
      } catch (apiErr) {
        console.error('图片内容提取失败:', apiErr)
        // 不阻止返回，只是没有图片内容
      }
    }

    res.json({
      title,
      author,
      content: finalContent,
      imageTexts,
      imageCount: imageUrls.length,
      processedImageCount: imageTexts.length,
      digest,
      url,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Fetch article error:', msg)
    res.status(500).json({ error: `获取文章失败: ${msg}` })
  }
})

export default router