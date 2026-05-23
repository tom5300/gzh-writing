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

// 从微信文章页面提取内容
function extractWechatContent(html: string): { title: string; author: string; content: string; digest: string } {
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

  return { title, author, content, digest }
}

// 抓取微信文章内容
router.post('/fetch-article', async (req: Request, res: Response) => {
  try {
    const { url } = req.body

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
    const { title, author, content, digest } = extractWechatContent(html)

    if (!content || content.length < 50) {
      res.status(400).json({ error: '无法解析文章内容，请确认链接是否有效' })
      return
    }

    res.json({
      title,
      author,
      content,
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