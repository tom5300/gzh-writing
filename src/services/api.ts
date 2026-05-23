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
