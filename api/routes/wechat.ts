import { Router, type Request, type Response } from 'express'

const router = Router()

// 获取 Access Token
async function getAccessToken(appId: string, appSecret: string): Promise<string> {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`
  const res = await fetch(url)
  const data = await res.json() as { access_token?: string; errcode?: number; errmsg?: string }

  if (data.errcode) {
    throw new Error(`微信 API 错误: ${data.errmsg || data.errcode}`)
  }

  if (!data.access_token) {
    throw new Error('获取 access_token 失败')
  }

  return data.access_token
}

// 获取素材列表（图文消息）
async function getArticles(accessToken: string, offset: number = 0, count: number = 20) {
  const url = 'https://api.weixin.qq.com/cgi-bin/material/batchget_material?access_token=' + accessToken
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'news', offset, count }),
  })
  return res.json()
}

// 获取文章内容（通过 URL）
async function fetchArticleContent(url: string): Promise<string> {
  // 由于跨域限制，这里返回一个提示让用户手动复制内容
  // 实际生产环境中可能需要通过后端代理
  throw new Error('ARTICLE_URL_NEEDED')
}

// 获取公众号文章列表
router.post('/articles', async (req: Request, res: Response) => {
  try {
    const { appId, appSecret } = req.body

    if (!appId || !appSecret) {
      res.status(400).json({ error: '请提供 AppID 和 AppSecret' })
      return
    }

    // 获取 access_token
    const accessToken = await getAccessToken(appId, appSecret)

    // 获取素材列表
    const data = await getArticles(accessToken, 0, 20) as {
      item?: Array<{
        media_id: string
        update_time: number
        news_item: Array<{
          title: string
          author: string
          digest: string
          url: string
          thumb_url: string
          show_cover_pic: number
          content: string
        }>
      }>
      total_count?: number
      item_count?: number
    }

    if (!data.item) {
      res.json({ articles: [], total: 0 })
      return
    }

    // 转换数据格式
    const articles = data.item.map((item) => {
      const newsItem = item.news_item[0] // 取第一个图文
      return {
        mediaId: item.media_id,
        updateTime: item.update_time,
        title: newsItem.title,
        author: newsItem.author,
        digest: newsItem.digest,
        url: newsItem.url,
        thumbUrl: newsItem.thumb_url,
        showCoverPic: newsItem.show_cover_pic,
      }
    })

    res.json({
      articles,
      total: data.total_count || articles.length,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('WeChat API error:', msg)
    res.status(500).json({ error: msg })
  }
})

export default router