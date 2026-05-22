import { useState, useEffect } from 'react'
import { X, Copy, Check, RefreshCw } from 'lucide-react'
import { useWritingStore } from '../store/writingStore'

export default function HumanizerModal() {
  const {
    currentArticle,
    humanizedArticle,
    humanizing,
    showHumanizerModal,
    closeHumanizerModal,
    setHumanizing,
    setHumanizedArticle,
    settings,
    addToast,
  } = useWritingStore()

  const [copiedLeft, setCopiedLeft] = useState(false)
  const [copiedRight, setCopiedRight] = useState(false)

  // 模态框打开时自动处理
  useEffect(() => {
    if (showHumanizerModal && currentArticle.trim() && settings.apiUrl && settings.apiKey && settings.modelName) {
      handleHumanize()
    }
  }, [showHumanizerModal])

  const handleHumanize = async () => {
    if (!currentArticle.trim()) {
      addToast('请先生成文章', 'error')
      return
    }

    if (!settings.apiUrl || !settings.apiKey || !settings.modelName) {
      addToast('请先配置 API 设置', 'error')
      return
    }

    setHumanizing(true)
    try {
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: currentArticle,
          apiUrl: settings.apiUrl,
          apiKey: settings.apiKey,
          modelName: settings.modelName,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || '处理失败')
      }

      const data = await response.json()
      setHumanizedArticle(data.humanized || '')
      addToast('人性化处理完成')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addToast(msg, 'error')
    } finally {
      setHumanizing(false)
    }
  }

  const copyToClipboard = async (text: string, isLeft: boolean) => {
    try {
      await navigator.clipboard.writeText(text)
      if (isLeft) {
        setCopiedLeft(true)
        setTimeout(() => setCopiedLeft(false), 2000)
      } else {
        setCopiedRight(true)
        setTimeout(() => setCopiedRight(false), 2000)
      }
      addToast('已复制到剪贴板')
    } catch {
      addToast('复制失败', 'error')
    }
  }

  if (!showHumanizerModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeHumanizerModal}
      />

      {/* 模态框内容 */}
      <div className="relative w-full max-w-5xl max-h-[85vh] mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">去除 AI 味道</h2>
          <button
            onClick={closeHumanizerModal}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
          <button
            onClick={handleHumanize}
            disabled={humanizing || !currentArticle.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {humanizing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                重新处理
              </>
            )}
          </button>
          <span className="text-sm text-slate-500">
            对比原文与去除 AI 味道后的版本
          </span>
        </div>

        {/* 双栏对比区域 */}
        <div className="flex h-[60vh] overflow-hidden">
          {/* 左栏 - 原文 */}
          <div className="flex-1 border-r border-slate-100 flex flex-col">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-medium text-slate-700">原文</span>
              <button
                onClick={() => copyToClipboard(currentArticle, true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-slate-700 hover:bg-white rounded transition-colors"
              >
                {copiedLeft ? (
                  <>
                    <Check size={12} className="text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    复制
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                {currentArticle || '暂无文章内容'}
              </pre>
            </div>
          </div>

          {/* 右栏 - 修改后 */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <span className="font-medium text-amber-700">修改后</span>
              <button
                onClick={() => copyToClipboard(humanizedArticle, false)}
                disabled={!humanizedArticle}
                className="flex items-center gap-1 px-2 py-1 text-xs text-amber-600 hover:text-amber-800 hover:bg-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copiedRight ? (
                  <>
                    <Check size={12} className="text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy size={12} />
                    复制
                  </>
                )}
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {humanizedArticle ? (
                <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                  {humanizedArticle}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <RefreshCw size={32} className="mb-2 opacity-50" />
                  <p className="text-sm">点击上方按钮开始处理</p>
                  <p className="text-xs mt-1">去除 AI 写作痕迹，让文章更自然</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
