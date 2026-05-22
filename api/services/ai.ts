/**
 * AI Service - OpenAI Compatible API Wrapper
 */

function buildEndpoint(apiUrl: string, defaultPath: string): string {
  const base = apiUrl.replace(/\/+$/, '')

  if (base.includes('/chat/completions') || base.includes('/images/generations')) {
    return base
  }

  // Ends with a version prefix like /v1, /v4, /compatible-mode/v1 etc.
  if (/\/v\d+(?:beta|alpha)?$/.test(base) || /\/compatible-mode\/v\d+$/.test(base)) {
    return `${base}${defaultPath}`
  }

  if (!base.includes('/') || /^https?:\/\/[^/]+$/.test(base)) {
    return `${base}/v1${defaultPath}`
  }

  // Has a path but doesn't match any known endpoint pattern
  // → append the default path (they may have entered a base URL with a custom path)
  return `${base}${defaultPath}`
}

interface ChatCompletionParams {
  apiUrl: string
  apiKey: string
  modelName: string
  messages: Array<{ role: string; content: string }>
  stream?: boolean
}

export async function createChatCompletion(params: ChatCompletionParams): Promise<Response> {
  const { apiUrl, apiKey, modelName, messages, stream = false } = params
  const url = buildEndpoint(apiUrl, '/chat/completions')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: modelName, messages, stream }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI API Error (${response.status}) [${url}]: ${errorText}`)
  }

  return response
}

export async function createChatCompletionJSON(params: Omit<ChatCompletionParams, 'stream'>): Promise<string> {
  const { apiUrl, apiKey, modelName, messages } = params
  const url = buildEndpoint(apiUrl, '/chat/completions')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: modelName, messages, stream: false }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`AI API Error (${response.status}) [${url}]: ${errorText}`)
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  return data.choices?.[0]?.message?.content || ''
}

interface CreateImageParams {
  apiUrl: string
  apiKey: string
  modelName: string
  prompt: string
  size?: string
}

interface ImageResult {
  url: string | null
  b64_json: string | null
  revised_prompt: string
  async?: boolean
  taskId?: string
}

export async function createImage(params: CreateImageParams): Promise<ImageResult> {
  const { apiUrl, apiKey, modelName, prompt, size = '1024x1024' } = params
  const isDashScope = /dashscope/i.test(apiUrl)

  if (isDashScope) {
    return createDashScopeImage(params, size)
  }

  // OpenAI compatible
  const url = buildEndpoint(apiUrl, '/images/generations')
  const requestBody = { model: modelName, prompt, n: 1, size }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Image API Error (${response.status}) [${url}]: ${errorText}`)
  }

  const result = await response.json() as Record<string, unknown>
  const data = result.data as Array<Record<string, unknown>> | undefined
  const imageData = data?.[0]
  return {
    url: (imageData?.url as string) || null,
    b64_json: (imageData?.b64_json as string) || null,
    revised_prompt: (imageData?.revised_prompt as string) || prompt,
  }
}

/**
 * DashScope 原生 API 图片生成（异步模式）
 * wanx-v1 等模型不支持 OpenAI 兼容格式，需要使用 DashScope 原生 API
 * 流程：创建异步任务 → 轮询任务状态 → 获取图片 URL
 */
async function createDashScopeImage(params: CreateImageParams, size: string): Promise<ImageResult> {
  const { apiUrl, apiKey, modelName, prompt } = params

  // 提取 DashScope 基础 URL
  const baseUrl = apiUrl.replace(/\/compatible-mode\/v\d+\/?$/, '').replace(/\/+$/, '')

  // 步骤1：创建异步任务
  const createUrl = `${baseUrl}/api/v1/services/aigc/text2image/image-synthesis`
  const createBody = {
    model: modelName,
    input: { prompt },
    parameters: {
      size: size.replace('x', '*'),
      n: 1,
    },
  }

  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify(createBody),
  })

  if (!createResponse.ok) {
    const errorText = await createResponse.text()
    throw new Error(`DashScope Image API Error (${createResponse.status}) [${createUrl}]: ${errorText}`)
  }

  const createResult = await createResponse.json() as Record<string, unknown>
  const output = createResult.output as Record<string, unknown> | undefined
  const taskId = output?.task_id as string | undefined

  if (!taskId) {
    // 可能是同步返回了结果
    const results = output?.results as Array<Record<string, unknown>> | undefined
    const imageUrl = (results?.[0]?.url as string) || null
    if (imageUrl) {
      return { url: imageUrl, b64_json: null, revised_prompt: prompt }
    }
    throw new Error(`DashScope 未返回 task_id: ${JSON.stringify(createResult)}`)
  }

  // 步骤2：轮询任务状态
  const pollUrl = `${baseUrl}/api/v1/tasks/${taskId}`
  const maxAttempts = 60  // 最多轮询 60 次
  const pollInterval = 2000  // 每 2 秒轮询一次

  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval))

    const pollResponse = await fetch(pollUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!pollResponse.ok) {
      const errorText = await pollResponse.text()
      throw new Error(`DashScope Poll Error (${pollResponse.status}): ${errorText}`)
    }

    const pollResult = await pollResponse.json() as Record<string, unknown>
    const pollOutput = pollResult.output as Record<string, unknown> | undefined
    const taskStatus = pollOutput?.task_status as string

    if (taskStatus === 'SUCCEEDED') {
      const results = pollOutput?.results as Array<Record<string, unknown>> | undefined
      const imageUrl = (results?.[0]?.url as string) || null
      return { url: imageUrl, b64_json: null, revised_prompt: prompt }
    }

    if (taskStatus === 'FAILED') {
      const message = (pollOutput?.message as string) || '未知错误'
      throw new Error(`DashScope 图片生成失败: ${message}`)
    }

    // PENDING / RUNNING 继续轮询
  }

  throw new Error('DashScope 图片生成超时')
}

export function parseJSON(raw: string): unknown {
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')

  const match = text.match(/[\[{][\s\S]*[\]}]/)
  if (!match) throw new Error('未找到有效的 JSON 结构')

  let jsonStr = match[0]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1')

  try { return JSON.parse(jsonStr) } catch (_) { /* continue */ }

  let fixed = ''
  let inStr = false
  let esc = false
  for (let i = 0; i < jsonStr.length; i++) {
    const ch = jsonStr[i]
    if (esc) { fixed += ch; esc = false; continue }
    if (ch === '\\' && inStr) { fixed += ch; esc = true; continue }
    if (ch === '"') { inStr = !inStr; fixed += ch; continue }
    if (inStr) {
      if (ch === '\n') fixed += '\\n'
      else if (ch === '\r') fixed += '\\r'
      else if (ch === '\t') fixed += '\\t'
      else fixed += ch
    } else {
      fixed += ch
    }
  }

  try { return JSON.parse(fixed) } catch (_) { /* continue */ }
  throw new Error(`JSON 解析失败。原始返回前200字符: ${text.substring(0, 200)}`)
}
