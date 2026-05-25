import { useWritingStore } from '../store/writingStore'

const store = useWritingStore.getState

export async function fetchStyles() {
  const res = await fetch('/api/styles')
  const data = await res.json()
  useWritingStore.getState().setStyles(data.styles || [])
}

export async function generateArticle() {
  const { topic, selectedStyleId, settings, styleFeatures, personalStyles } = store()
  if (!topic.trim()) return
  if (!settings.apiUrl || !settings.apiKey || !settings.modelName) {
    store().openSettings()
    store().addToast('请先配置 API 设置', 'error')
    return
  }

  // 如果选择了个人风格，使用该风格的 features
  let finalStyleFeatures = styleFeatures
  if (selectedStyleId.startsWith('personal_')) {
    const personalStyle = personalStyles.find(s => s.id === selectedStyleId)
    if (personalStyle) {
      finalStyleFeatures = personalStyle.features
    }
  }

  store().resetWorkflow()
  store().setArticleGenerating(true)

  try {
    const response = await fetch('/api/article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic,
        styleId: selectedStyleId,
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        modelName: settings.modelName,
        styleFeatures: finalStyleFeatures,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || '生成失败')
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

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
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.content) {
              store().appendArticle(parsed.content)
            }
          } catch (e) {
            if (e instanceof Error && !e.message.includes('JSON')) throw e
          }
        }
      }
    }

    store().addToast('文章生成完成')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    store().addToast(msg, 'error')
  } finally {
    store().setArticleGenerating(false)
  }
}

export async function generateTitles() {
  const { currentArticle, settings, styleFeatures } = store()
  if (!currentArticle) return

  store().setTitlesGenerating(true)
  try {
    const res = await fetch('/api/titles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article: currentArticle,
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        modelName: settings.modelName,
        styleFeatures,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '生成失败')
    store().setTitles(data.titles)
    store().addToast('标题摘要生成完成')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    store().addToast(msg, 'error')
  } finally {
    store().setTitlesGenerating(false)
  }
}

export async function generateCoverPrompts() {
  const { currentArticle, settings } = store()
  if (!currentArticle) return

  store().setCoverPromptsGenerating(true)
  try {
    const res = await fetch('/api/cover/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article: currentArticle,
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        modelName: settings.modelName,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '生成失败')
    store().setKeyPoints(data.keyPoints || [])
    store().setCoverPrompts(data.prompts || [])
    store().addToast('封面 Prompt 生成完成')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    store().addToast(msg, 'error')
  } finally {
    store().setCoverPromptsGenerating(false)
  }
}

export async function generateCoverImage(promptIndex: number) {
  const { coverPrompts, settings } = store()
  const prompt = coverPrompts[promptIndex]
  if (!prompt) return

  if (!settings.imageUrl || !settings.imageApiKey || !settings.imageModel) {
    store().addToast('请先在设置中配置图片生成模型', 'error')
    store().openSettings()
    return
  }

  store().setCoverImageGenerating(promptIndex, true)

  try {
    const res = await fetch('/api/cover/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        apiUrl: settings.imageUrl,
        apiKey: settings.imageApiKey,
        modelName: settings.imageModel,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '生成失败')
    store().setCoverImage(promptIndex, data)
    store().addToast('封面图生成完成')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    store().addToast(msg, 'error')
  } finally {
    store().setCoverImageGenerating(promptIndex, false)
  }
}

export async function downloadCoverImage(index: number) {
  const { coverImages, topic } = store()
  const coverImageData = coverImages.get(index)
  if (!coverImageData) return

  try {
    let blob: Blob
    if (coverImageData.url) {
      const res = await fetch('/api/cover/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: coverImageData.url }),
      })
      blob = await res.blob()
    } else if (coverImageData.b64_json) {
      const byteChars = atob(coverImageData.b64_json)
      const byteNums = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) {
        byteNums[i] = byteChars.charCodeAt(i)
      }
      blob = new Blob([new Uint8Array(byteNums)], { type: 'image/png' })
    } else {
      return
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover_${index + 1}_${topic.trim().slice(0, 20) || 'image'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    store().addToast('图片下载中...')
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    store().addToast('下载失败: ' + msg, 'error')
  }
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    store().addToast('已复制到剪贴板')
  }).catch(() => {
    store().addToast('复制失败', 'error')
  })
}

// 根据文章内容生成配图
export async function generateArticleImages() {
  const { currentArticle, topic, settings } = store()

  if (!currentArticle) {
    store().addToast('请先生成文章', 'error')
    return
  }

  if (!settings.imageUrl || !settings.imageApiKey || !settings.imageModel) {
    store().addToast('请先在设置中配置图片生成模型', 'error')
    return
  }

  store().setAddingArticleImages(true)
  store().clearArticleImages()

  try {
    // 根据文章字数决定生成图片数量 (1-5张)
    const wordCount = currentArticle.length
    let imageCount = 1
    if (wordCount > 500) imageCount = 2
    if (wordCount > 1000) imageCount = 3
    if (wordCount > 2000) imageCount = 4
    if (wordCount > 3000) imageCount = 5

    // 调用 API 生成配图提示词
    const promptRes = await fetch('/api/cover/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article: currentArticle,
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        modelName: settings.modelName,
        imageCount, // 传递图片数量需求
      }),
    })

    if (!promptRes.ok) {
      throw new Error('生成配图提示词失败')
    }

    const promptData = await promptRes.json() as { prompts?: string[] }
    const prompts = promptData.prompts || []

    // 如果没有返回足够提示词，使用默认值
    while (prompts.length < imageCount) {
      prompts.push(`文章配图：${topic || '相关主题'}，写实风格，高清`)
    }

    // 计算插入位置（均匀分布）
    const positions: number[] = []
    for (let i = 1; i <= imageCount; i++) {
      positions.push(Math.floor((currentArticle.length / (imageCount + 1)) * i))
    }

    // 生成每张图片
    for (let i = 0; i < imageCount && i < prompts.length; i++) {
      const imageRes = await fetch('/api/cover/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompts[i],
          apiUrl: settings.imageUrl,
          apiKey: settings.imageApiKey,
          modelName: settings.imageModel,
        }),
      })

      if (!imageRes.ok) {
        console.error(`生成第 ${i + 1} 张图片失败`)
        continue
      }

      const imageData = await imageRes.json() as { url?: string; b64_json?: string; revised_prompt?: string }

      store().addArticleImage({
        position: positions[i],
        url: imageData.url,
        b64_json: imageData.b64_json,
        revised_prompt: imageData.revised_prompt,
        prompt: prompts[i],
      })
    }

    const generatedCount = store().articleImages.length
    if (generatedCount > 0) {
      store().addToast(`已生成 ${generatedCount} 张配图，可插入到文章中`)
    } else {
      store().addToast('配图生成失败，请重试', 'error')
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '配图生成失败'
    store().addToast(msg, 'error')
  } finally {
    store().setAddingArticleImages(false)
  }
}

// 敏感词检测
export async function checkSensitiveWords(): Promise<{
  isSensitive: boolean
  riskLevel: string
  issues: Array<{
    type: string
    description: string
    keywords: string[]
    suggestion: string
  }>
  summary: string
} | null> {
  const { currentArticle, settings } = store()

  if (!currentArticle) {
    store().addToast('请先生成文章', 'error')
    return null
  }

  if (!settings.apiUrl || !settings.apiKey || !settings.modelName) {
    store().addToast('请先配置 API 设置', 'error')
    return null
  }

  try {
    const res = await fetch('/api/check-sensitive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article: currentArticle,
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        modelName: settings.modelName,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || '检测失败')
    }

    return await res.json()
  } catch (err) {
    const msg = err instanceof Error ? err.message : '检测失败'
    store().addToast(msg, 'error')
    return null
  }
}

// 一键排版 - 将 Markdown 转换为公众号风格 HTML
export async function formatArticle(): Promise<string | null> {
  const { currentArticle, settings } = store()

  if (!currentArticle) {
    store().addToast('请先生成文章', 'error')
    return null
  }

  if (!settings.apiUrl || !settings.apiKey || !settings.modelName) {
    store().addToast('请先配置 API 设置', 'error')
    return null
  }

  try {
    const res = await fetch('/api/format-article', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        article: currentArticle,
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        modelName: settings.modelName,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || '排版失败')
    }

    const data = await res.json()
    return data.formattedHtml || null
  } catch (err) {
    const msg = err instanceof Error ? err.message : '排版失败'
    store().addToast(msg, 'error')
    return null
  }
}

// 一键扩写 - 将文本扩写到 1000-3000 字
export async function expandText(text: string): Promise<void> {
  const { settings } = store()

  if (!text || !text.trim()) {
    store().addToast('请输入要扩写的内容', 'error')
    return
  }

  if (!settings.apiUrl || !settings.apiKey || !settings.modelName) {
    store().addToast('请先在设置中配置 API', 'error')
    store().openSettings()
    return
  }

  // 保存当前文章状态（扩写会替换当前文章）
  const currentArticle = store().currentArticle

  store().setCurrentArticle('')
  store().setArticleGenerating(true)

  try {
    const response = await fetch('/api/expand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        apiUrl: settings.apiUrl,
        apiKey: settings.apiKey,
        modelName: settings.modelName,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || '扩写失败')
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

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
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.content) {
              store().appendArticle(parsed.content)
            }
          } catch (e) {
            if (e instanceof Error && !e.message.includes('JSON')) throw e
          }
        }
      }
    }

    store().addToast('扩写完成！')
  } catch (err) {
    // 扩写失败时恢复原文章
    if (currentArticle) {
      store().setCurrentArticle(currentArticle)
    }
    const msg = err instanceof Error ? err.message : String(err)
    store().addToast(msg, 'error')
  } finally {
    store().setArticleGenerating(false)
  }
}
