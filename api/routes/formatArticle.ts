import { Router, type Request, type Response } from 'express'
import { createChatCompletionJSON, parseJSON } from '../services/ai.js'

const router = Router()

// 一键排版
router.post('/format-article', async (req: Request, res: Response) => {
  try {
    const { article, apiUrl, apiKey, modelName } = req.body

    if (!article || !apiUrl || !apiKey || !modelName) {
      res.status(400).json({ error: '缺少必要参数' })
      return
    }

    const systemPrompt = `你是一位专业的微信公众号排版专家，擅长将文章内容转换为美观、专业的公众号格式。

请根据以下排版规范，将用户提供的 Markdown 文章转换为微信公众号可用的 HTML 代码：

## 排版规范

### 1. 字体与字号
- 正文字号：15-16px，颜色 #3f3f3f（深灰，非纯黑）
- 标题层级：
  - H1（文章标题）：20-22px，加粗，#1a1a1a，居中
  - H2（章节标题）：17-18px，加粗，#2c3e50，左对齐
  - H3（子标题）：15-16px，加粗，#34495e
- 引言/导语：14px，#595959，斜体

### 2. 段落与间距
- 段落间距：段前12px，段后8px
- 行高：1.8倍
- 每段长度：2-4行，避免长段落
- 首行缩进：不使用

### 3. 颜色系统
- 主色调：#4a90a4（沉稳蓝绿）
- 强调色：#e74c3c（红色，用于重点）
- 引用背景：#f8f9fa（浅灰）
- 分割线：#e0e0e0
- 重点高亮：#fff3cd（浅黄背景）

### 4. 引言块
- 左侧4px实线，颜色#4a90a4
- 背景色：#f8f9fa
- 内边距：12px 16px
- 圆角：4px

### 5. 重点标注
- 使用加粗+红色标注关键句
- 使用黄色背景标注数据/术语
- 每屏不超过2-3处强调

### 6. 列表样式
- 无序列表：圆点符号
- 有序列表：数字序号
- 缩进：16px

### 7. 图片处理
- 如果文章中有图片，用 [图片] 占位符标注
- 保留 alt 文本作为图片说明

### 8. 分割元素
- 章节之间用分割线分隔
- 分割线样式：1px 实线，颜色 #e0e0e0，上下margin 24px

## 输出格式

请严格返回以下 JSON 格式，不要返回任何其他内容：
{
  "formattedHtml": "完整的HTML代码，包含<style>标签内的样式"
}

## 注意事项
1. HTML 必须是可以直接在公众号后台编辑器粘贴使用的
2. 不要使用复杂的 CSS（避免微信过滤）
3. 图片保持原始 markdown 中的格式：![](url)
4. 代码块保留原始格式
5. 整体风格：简约、专业、有呼吸感
6. 确保中文显示正常，使用 UTF-8 编码`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: article },
    ]

    const raw = await createChatCompletionJSON({ apiUrl, apiKey, modelName, messages })
    const result = parseJSON(raw) as { formattedHtml?: string }

    if (!result.formattedHtml) {
      res.status(500).json({ error: 'AI 返回格式异常', raw: (raw as string).substring(0, 200) })
      return
    }

    res.json({ formattedHtml: result.formattedHtml })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Format article error:', err)
    res.status(500).json({ error: msg })
  }
})

export default router