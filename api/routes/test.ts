import { Router, type Request, type Response } from 'express'

const router = Router()

let testResults: unknown = null

router.post('/test-results', (req: Request, res: Response) => {
  testResults = req.body
  res.json({ ok: true })
})

router.get('/test-results', (_req: Request, res: Response) => {
  res.json(testResults || { status: 'waiting' })
})

export default router
