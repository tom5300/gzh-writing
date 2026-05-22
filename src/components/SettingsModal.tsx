import { useState } from 'react'
import { useWritingStore } from '../store/writingStore'
import { X, Plus, Trash2, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

export default function SettingsModal() {
  const { settingsOpen, closeSettings, settings, saveSettings } = useWritingStore()
  const {
    styleArticles, styleFeatures, styleAnalyzing,
    addStyleArticle, removeStyleArticle, setStyleFeatures, setStyleAnalyzing, clearStyleData,
    addToast, settings: storeSettings
  } = useWritingStore()

  const [articleInput, setArticleInput] = useState('')
  const [articleTitle, setArticleTitle] = useState('')
  const [showStyleSection, setShowStyleSection] = useState(false)

  if (!settingsOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    saveSettings({
      apiUrl: form.get('apiUrl') as string,
      apiKey: form.get('apiKey') as string,
      modelName: form.get('modelName') as string,
      imageUrl: form.get('imageUrl') as string,
      imageApiKey: form.get('imageApiKey') as string,
      imageModel: form.get('imageModel') as string,
    })
  }

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
      addToast('请先配置文本模型 API', 'error')
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeSettings} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modal-in">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">设置</h2>
          <button onClick={closeSettings} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 文本模型 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">T</span>
              文本模型
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">API URL</label>
                <input
                  name="apiUrl"
                  defaultValue={settings.apiUrl}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">API Key</label>
                <input
                  name="apiKey"
                  type="password"
                  defaultValue={settings.apiKey}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">模型名称</label>
                <input
                  name="modelName"
                  defaultValue={settings.modelName}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="gpt-4o / qwen-plus / deepseek-chat"
                />
              </div>
            </div>
          </div>

          {/* 图片模型 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">I</span>
              图片模型
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">API URL</label>
                <input
                  name="imageUrl"
                  defaultValue={settings.imageUrl}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://api.openai.com/v1/images/generations"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">API Key</label>
                <input
                  name="imageApiKey"
                  type="password"
                  defaultValue={settings.imageApiKey}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">模型名称</label>
                <input
                  name="imageModel"
                  defaultValue={settings.imageModel}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="dall-e-3 / doubao-seedream"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400">设置保存在浏览器本地，不会传给服务器。</p>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={closeSettings}
              className="px-5 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all"
            >
              保存设置
            </button>
          </div>
        </form>

        {/* 风格喂养区域 */}
        <div className="border-t border-slate-100">
          <button
            onClick={() => setShowStyleSection(!showStyleSection)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
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
            {showStyleSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showStyleSection && (
            <div className="px-6 pb-6 space-y-4">
              <p className="text-xs text-slate-500">
                喂养对标账号或自己的公众号历史文章，系统会学习其风格特点，生成时自动应用。
              </p>

              {/* 添加文章 */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">文章标题（可选）</label>
                  <input
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="例如：我的第一篇爆款文章"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">文章内容</label>
                  <textarea
                    value={articleInput}
                    onChange={(e) => setArticleInput(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    placeholder="粘贴公众号历史文章的内容..."
                  />
                </div>
                <button
                  onClick={handleAddArticle}
                  className="w-full px-4 py-2 border border-dashed border-slate-300 text-slate-600 text-sm font-medium rounded-lg hover:border-amber-400 hover:text-amber-600 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  添加文章
                </button>
              </div>

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
                  {styleArticles.map((article) => (
                    <div key={article.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{article.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {article.content.length} 字 · {new Date(article.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => removeStyleArticle(article.id)}
                        className="flex-shrink-0 ml-2 w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 分析风格按钮 */}
              {styleArticles.length > 0 && (
                <button
                  onClick={handleAnalyzeStyle}
                  disabled={styleAnalyzing}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                >
                  {styleAnalyzing ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      学习风格特征
                    </>
                  )}
                </button>
              )}

              {/* 风格特征预览 */}
              {styleFeatures && (
                <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} className="text-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">风格特征</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-amber-800">
                    <p><span className="font-medium">标题风格：</span>{styleFeatures.titlePattern}</p>
                    <p><span className="font-medium">开头方式：</span>{styleFeatures.openingStyle}</p>
                    <p><span className="font-medium">文章结构：</span>{styleFeatures.structure}</p>
                    <p><span className="font-medium">语言风格：</span>{styleFeatures.languageStyle}</p>
                    <p><span className="font-medium">结尾方式：</span>{styleFeatures.closingStyle}</p>
                    <p><span className="font-medium">语气特点：</span>{styleFeatures.tone}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
