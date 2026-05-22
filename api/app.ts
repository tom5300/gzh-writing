import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getStyleList } from './services/styleLoader.js'
import articleRoutes from './routes/article.js'
import titlesRoutes from './routes/titles.js'
import coverRoutes from './routes/cover.js'
import testRoutes from './routes/test.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// API Routes
app.use('/api', articleRoutes)
app.use('/api', titlesRoutes)
app.use('/api', coverRoutes)
app.use('/api', testRoutes)

// 获取写作风格列表
app.get('/api/styles', (_req: Request, res: Response) => {
  res.json({ styles: getStyleList() })
})

// 健康检查
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'ok' })
})

// 错误处理
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ success: false, error: 'Server internal error' })
})

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' })
})

export default app
