import { Router, type Request, type Response } from 'express'
import { createChatCompletionJSON, parseJSON } from '../services/ai.js'

const router = Router()

router.post('/humanize', async (req: Request, res: Response) => {
  try {
    const { text, apiUrl, apiKey, modelName } = req.body

    if (!text || !apiUrl || !apiKey || !modelName) {
      res.status(400).json({ error: '缺少必要参数' })
      return
    }

    const systemPrompt = `你是一位专业的文字编辑，专门识别和去除 AI 生成文本的痕迹，使文字听起来更自然、更像人类书写。

请根据以下指南处理文本：

## 核心规则：
1. **删除填充短语** - 去除开场白和强调性拐杖词
2. **打破公式结构** - 避免二元对比、戏剧性分段、修辞性设置
3. **变化节奏** - 混合句子长度。两项优于三项。段落结尾要多样化
4. **信任读者** - 直接陈述事实，跳过软化、辩解和手把手引导
5. **删除金句** - 如果听起来像可引用的语句，重写它

## 需要识别并修复的 AI 模式：
- 夸大的象征意义（如"作为...的证明"、"标志着..."）
- 宣传性语言（如"充满活力的"、"令人叹为观止的"）
- 以 -ing 结尾的肤浅分析（如"确保..."、"反映..."）
- 模糊的归因（如"专家认为"、"行业报告显示"）
- 破折号过度使用
- 三段式法则过度使用（如"无缝、直观和强大"）
- AI 词汇（如"此外"、"至关重要"、"深入探讨"、"格局"、"关键性的"）
- 否定式排比（如"不仅...而且..."、"不仅仅是...而是..."）
- 协作交流痕迹（如"希望这对您有帮助"、"请告诉我"）
- 通用积极结论（如"激动人心的时代即将到来"）

## 处理要求：
1. 识别 AI 模式并重写问题片段
2. 保留核心含义和信息完整性
3. 维持原有的语气风格（正式/随意/技术等）
4. 使文字更自然、更有"人味"

请只返回重写后的文本，不要返回任何解释或其他内容。`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `请帮我人性化以下文本：\n\n${text}` },
    ]

    const raw = await createChatCompletionJSON({ apiUrl, apiKey, modelName, messages })
    
    // 清理 markdown 代码块
    let result = raw.trim()
    result = result.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
    
    // 清理单独的反引号
    if ((result.startsWith('`') && result.endsWith('`')) || 
        (result.startsWith('"') && result.endsWith('"')) || 
        (result.startsWith("'") && result.endsWith("'"))) {
      // 尝试提取内部内容
      try {
        // 如果是 JSON 格式，尝试解析
        if (result.startsWith('{') || result.startsWith('[')) {
          const parsed = JSON.parse(result)
          // 检查常见的文本字段
          if (typeof parsed === 'object' && parsed !== null) {
            const textField = parsed.text || parsed.content || parsed.result || parsed.output || parsed.response
            if (typeof textField === 'string') {
              result = textField
            } else {
              result = typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)
            }
          } else {
            result = String(parsed)
          }
        } else {
          // 不是 JSON，去掉包裹的反引号或引号
          result = result.slice(1, -1)
        }
      } catch {
        // 不是 JSON 或解析失败，尝试去掉包裹的引号/反引号
        if ((result.startsWith('"') && result.endsWith('"')) || 
            (result.startsWith("'") && result.endsWith("'")) ||
            (result.startsWith('`') && result.endsWith('`'))) {
          result = result.slice(1, -1)
        }
      }
    }
    
    // 处理可能的 "答案:" 或 "结果:" 前缀
    result = result.replace(/^(?:答案|结果|修改后|重写后)[:：]\s*/i, '')
    
    // 移除任何残留的 markdown 格式
    result = result.replace(/\*\*(.+?)\*\*/g, '$1')  // 粗体
    result = result.replace(/\*(.+?)\*/g, '$1')      // 斜体
    result = result.replace(/_(.+?)_/g, '$1')        // 下划线
    result = result.replace(/`(.+?)`/g, '$1')        // 行内代码
    
    res.json({ humanized: result })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Humanize error:', err)
    res.status(500).json({ error: msg })
  }
})

export default router
