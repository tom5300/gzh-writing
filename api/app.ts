import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { getStyleList } from './services/styleLoader.js'
import articleRoutes from './routes/article.js'
import titlesRoutes from './routes/titles.js'
import coverRoutes from './routes/cover.js'
import styleRoutes from './routes/style.js'
import humanizeRoutes from './routes/humanize.js'
import wechatRoutes from './routes/wechat.js'
import fetchArticleRoutes from './routes/fetchArticle.js'
import sensitiveRoutes from './routes/sensitive.js'
import testRoutes from './routes/test.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// API Routes
app.use('/api', articleRoutes)
app.use('/api', titlesRoutes)
app.use('/api', coverRoutes)
app.use('/api', styleRoutes)
app.use('/api', humanizeRoutes)
app.use('/api', wechatRoutes)
app.use('/api', fetchArticleRoutes)
app.use('/api', sensitiveRoutes)
app.use('/api', testRoutes)

// 获取写作风格列表
app.get('/api/styles', (_req: Request, res: Response) => {
  res.json({ styles: getStyleList() })
})

// 健康检查
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'ok' })
})

// 服务前端静态文件
const distPath = path.join(__dirname, '../../dist')
app.use(express.static(distPath))

// 前端路由重定向（SPA）
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// 错误处理
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

export default app
