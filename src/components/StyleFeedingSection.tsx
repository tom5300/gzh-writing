import { useState } from 'react'
import { useWritingStore } from '../store/writingStore'
import { Plus, Sparkles, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react'

export default function StyleFeedingSection() {
  const {
    styleArticles, styleFeatures, styleAnalyzing,
    addStyleArticle, removeStyleArticle, setStyleFeatures, setStyleAnalyzing, clearStyleData,
    addToast, settings: storeSettings
  } = useWritingStore()

  const [articleInput, setArticleInput] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [expanded, setExpanded] = useState(false)

  const handleAddArticle = () => {
    if (!articleInput.trim()) {
      addToast('请输入文章内容', 'error')
      return
    }
    if (articleInput.trim().length < 100) {
      addToast('文章内容太短，无法分析风格特征', 'error')
      return
    }
    addStyleArticle({
      id: Date.now().toString(),
      title: articleTitle.trim() || `文章 ${styleArticles.length + 1}`,
      content: articleInput.trim(),
      addedAt: Date.now(),
    })
    setArticleInput('')
    setArticleTitle('')
    addToast('文章已添加')
  }

  const handleAnalyzeStyle = async () => {
    if (styleArticles.length === 0) {
      addToast('请先添加文章', 'error')
      return
    }
    if (!storeSettings.apiUrl || !storeSettings.apiKey || !storeSettings.modelName) {
      addToast('请先在设置中配置文本模型 API', 'error')
      return
    }

    setStyleAnalyzing(true)
    try {
      const res = await fetch('/api/analyze-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articles: styleArticles.map(a => a.content),
          apiUrl: storeSettings.apiUrl,
          apiKey: storeSettings.apiKey,
          modelName: storeSettings.modelName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '分析失败')
      setStyleFeatures(data)
      addToast('风格分析完成！')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '分析失败'
      addToast(msg, 'error')
    } finally {
      setStyleAnalyzing(false)
    }
  }

  // 始终渲染头部（用于展示功能入口），只有内容区域根据状态显示/隐藏
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* 头部 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-800">风格喂养</span>
          {styleArticles.length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
              {styleArticles.length} 篇
            </span>
          )}
          {styleFeatures && (
            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
              已分析
            </span>
          )}
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* 展开内容 */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4">
          {/* 添加文章表单 */}
          <div className="space-y-2">
            <input
              type="text"
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
              placeholder="文章标题（选填）"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
            />
            <textarea
              value={articleInput}
              onChange={(e) => setArticleInput(e.target.value)}
              placeholder="粘贴文章内容（至少100字）..."
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddArticle}
                disabled={!articleInput.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={14} />
                添加文章
              </button>
              {styleArticles.length >= 3 && !styleFeatures && (
                <button
                  onClick={handleAnalyzeStyle}
                  disabled={styleAnalyzing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
                >
                  {styleAnalyzing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      分析风格
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 空状态提示 */}
          {styleArticles.length === 0 && (
            <div className="text-center py-4 text-slate-400">
              <p className="text-sm">添加文章，学习你的写作风格</p>
              <p className="text-xs mt-1">让 AI 写出更像你风格的内容</p>
            </div>
          )}

          {/* 风格特征预览 */}
          {styleFeatures && (
            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={12} className="text-amber-500" />
                  <span className="text-xs font-semibold text-amber-700">风格特征</span>
                </div>
                <button
                  onClick={clearStyleData}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  清空
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-amber-800">
                <p><span className="font-medium">标题：</span>{styleFeatures.titlePattern}</p>
                <p><span className="font-medium">开头：</span>{styleFeatures.openingStyle}</p>
                <p><span className="font-medium">结构：</span>{styleFeatures.structure}</p>
                <p><span className="font-medium">语言：</span>{styleFeatures.languageStyle}</p>
                <p><span className="font-medium">结尾：</span>{styleFeatures.closingStyle}</p>
                <p><span className="font-medium">语气：</span>{styleFeatures.tone}</p>
              </div>
            </div>
          )}

          {/* 文章列表 */}
          {styleArticles.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">
                  已添加 {styleArticles.length} 篇文章
                </span>
                <button
                  onClick={clearStyleData}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  清空全部
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {styleArticles.map((article) => (
                  <div key={article.id} className="flex items-start justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{article.title}</p>
                      <p className="text-xs text-slate-400">
                        {article.content.length} 字
                      </p>
                    </div>
                    <button
                      onClick={() => removeStyleArticle(article.id)}
                      className="flex-shrink-0 ml-2 w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
