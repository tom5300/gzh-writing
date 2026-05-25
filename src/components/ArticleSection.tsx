import { useWritingStore } from '../store/writingStore'
import { marked } from 'marked'
import { Copy, List, Loader2, Sparkles, Image, Check, X, Shield, AlertTriangle, AlertCircle, Layout, Trash2, Save, Expand } from 'lucide-react'
import { copyToClipboard, generateTitles, generateArticleImages, checkSensitiveWords, formatArticle, expandText } from '../services/api'
import { useState } from 'react'

export default function ArticleSection() {
  const {
    currentArticle,
    articleGenerating,
    titlesGenerating,
    styles,
    selectedStyleId,
    openHumanizerModal,
    articleImages,
    addingArticleImages,
    setCurrentArticle,
    sensitiveCheckResult,
    sensitiveChecking,
    setSensitiveCheckResult,
    saveDraft,
    resetWorkflow,
  } = useWritingStore()

  const [formattedHtml, setFormattedHtml] = useState<string | null>(null)
  const [formatting, setFormatting] = useState(false)
  const [expanding, setExpanding] = useState(false)

  if (!currentArticle && !articleGenerating) return null

  const styleName = styles.find(s => s.id === selectedStyleId)?.name || ''

  // 插入配图到文章
  const insertImagesToArticle = () => {
    if (articleImages.length === 0) return

    // 按位置排序
    const sortedImages = [...articleImages].sort((a, b) => a.position - b.position)

    let newArticle = ''
    let lastIndex = 0

    for (const img of sortedImages) {
      // 在当前位置插入图片（使用 markdown 图片格式）
      const imageMd = `\n\n![配图](${img.url || img.b64_json ? `data:image/png;base64,${img.b64_json}` : ''})\n\n`
      newArticle += currentArticle.slice(lastIndex, img.position) + imageMd
      lastIndex = img.position
    }
    // 添加剩余内容
    newArticle += currentArticle.slice(lastIndex)

    setCurrentArticle(newArticle)
    useWritingStore.getState().clearArticleImages()
    useWritingStore.getState().addToast('配图已插入文章')
  }

  // 执行敏感词检测
  const handleSensitiveCheck = async () => {
    const result = await checkSensitiveWords()
    if (result) {
      setSensitiveCheckResult(result)
    }
  }

  // 执行一键排版
  const handleFormatArticle = async () => {
    setFormatting(true)
    try {
      const html = await formatArticle()
      if (html) {
        setFormattedHtml(html)
        useWritingStore.getState().addToast('排版完成，可复制到公众号使用')
      }
    } finally {
      setFormatting(false)
    }
  }

  // 执行一键扩写
  const handleExpand = async () => {
    if (!currentArticle.trim()) {
      useWritingStore.getState().addToast('请先生成或输入文章内容', 'error')
      return
    }
    setExpanding(true)
    try {
      await expandText(currentArticle)
    } finally {
      setExpanding(false)
    }
  }

  // 复制排版后的 HTML
  const copyFormattedHtml = () => {
    if (formattedHtml) {
      copyToClipboard(formattedHtml)
    }
  }

  // 获取风险等级颜色
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-amber-600 bg-amber-50'
      default: return 'text-green-600 bg-green-50'
    }
  }

  // 获取风险图标
  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertCircle size={16} />
      case 'medium': return <AlertTriangle size={16} />
      default: return <Shield size={16} />
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium text-slate-700">正文</span>
          {styleName && (
            <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{styleName}</span>
          )}
        </div>
        {currentArticle && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => saveDraft()}
              className="px-3 py-1.5 text-sm text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg flex items-center gap-1.5 transition-all"
              title="保存草稿"
            >
              <Save size={14} />
              <span>保存</span>
            </button>
            <button
              onClick={() => {
                if (confirm('确定要删除这篇文章吗？')) {
                  resetWorkflow()
                }
              }}
              className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-all"
              title="删除文章"
            >
              <Trash2 size={14} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button
              onClick={handleSensitiveCheck}
              disabled={sensitiveChecking}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {sensitiveChecking ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              <span>{sensitiveChecking ? '检测中...' : '敏感词'}</span>
            </button>
            <button
              onClick={handleFormatArticle}
              disabled={formatting}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {formatting ? <Loader2 size={14} className="animate-spin" /> : <Layout size={14} />}
              <span>{formatting ? '排版中...' : '排版'}</span>
            </button>
            <button
              onClick={handleExpand}
              disabled={expanding}
              className="px-3 py-1.5 text-sm text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {expanding ? <Loader2 size={14} className="animate-spin" /> : <Expand size={14} />}
              <span>{expanding ? '扩写中...' : '扩写'}</span>
            </button>
            <button
              onClick={() => copyToClipboard(currentArticle)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Copy size={14} />
              <span>复制</span>
            </button>
            <button
              onClick={openHumanizerModal}
              className="px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Sparkles size={14} />
              <span>去AI味</span>
            </button>
          </div>
        )}
      </div>

      {/* 敏感词检测结果 */}
      {sensitiveCheckResult && (
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getRiskIcon(sensitiveCheckResult.riskLevel)}
              <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getRiskColor(sensitiveCheckResult.riskLevel)}`}>
                {sensitiveCheckResult.riskLevel === 'high' ? '高风险' : sensitiveCheckResult.riskLevel === 'medium' ? '中风险' : '低风险'}
              </span>
              <span className="text-sm text-slate-600">{sensitiveCheckResult.summary}</span>
            </div>
            <button
              onClick={() => setSensitiveCheckResult(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          </div>
          {sensitiveCheckResult.issues.length > 0 && (
            <div className="space-y-2">
              {sensitiveCheckResult.issues.map((issue, idx) => (
                <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                  <div className="flex items-start gap-2">
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">{issue.type}</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{issue.description}</p>
                      {issue.keywords.length > 0 && (
                        <p className="text-xs text-slate-500 mt-1">关键词: {issue.keywords.join(', ')}</p>
                      )}
                      {issue.suggestion && (
                        <p className="text-xs text-cyan-600 mt-1">建议: {issue.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 排版结果预览 */}
      {formattedHtml && (
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-cyan-50 to-blue-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-cyan-700">公众号排版预览</span>
              <span className="text-xs text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded-full">可直接复制</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyFormattedHtml}
                className="px-3 py-1.5 text-sm bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center gap-1.5 transition-all"
              >
                <Copy size={14} />
                复制排版
              </button>
              <button
                onClick={() => setFormattedHtml(null)}
                className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-all"
              >
                <X size={14} />
                关闭
              </button>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto border border-cyan-100">
            <style>{`
              .formatted-preview h1 { font-size: 20px; font-weight: bold; text-align: center; color: #1a1a1a; margin-bottom: 16px; }
              .formatted-preview h2 { font-size: 17px; font-weight: bold; color: #2c3e50; margin: 24px 0 12px; border-left: 4px solid #4a90a4; padding-left: 12px; }
              .formatted-preview h3 { font-size: 15px; font-weight: bold; color: #34495e; margin: 16px 0 8px; }
              .formatted-preview p { font-size: 15px; color: #3f3f3f; line-height: 1.8; margin: 8px 0; }
              .formatted-preview strong { color: #e74c3c; }
              .formatted-preview em { color: #595959; font-style: italic; }
              .formatted-preview blockquote { background: #f8f9fa; border-left: 4px solid #4a90a4; padding: 12px 16px; margin: 12px 0; border-radius: 4px; }
              .formatted-preview ul, .formatted-preview ol { padding-left: 24px; margin: 8px 0; }
              .formatted-preview li { font-size: 15px; color: #3f3f3f; line-height: 1.8; margin: 4px 0; }
              .formatted-preview hr { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }
              .formatted-preview img { max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px; }
              .formatted-preview .highlight { background: #fff3cd; padding: 2px 4px; border-radius: 2px; }
            `}</style>
            <div className="formatted-preview" dangerouslySetInnerHTML={{ __html: formattedHtml }} />
          </div>
        </div>
      )}

      <div className="px-5 py-4 prose prose-slate max-w-none min-h-[100px] text-sm">
        {articleGenerating && !currentArticle ? (
          <div className="text-slate-400 animate-pulse">正在生成文章...</div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: marked(currentArticle) || '' }} />
        )}
      </div>

      {/* 配图区域 */}
      {articleImages.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">已生成 {articleImages.length} 张配图</span>
            <div className="flex gap-2">
              <button
                onClick={insertImagesToArticle}
                className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-1.5 transition-all"
              >
                <Check size={14} />
                插入配图
              </button>
              <button
                onClick={() => useWritingStore.getState().clearArticleImages()}
                className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1.5 transition-all"
              >
                <X size={14} />
                取消
              </button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {articleImages.map((img, idx) => (
              <div key={idx} className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-white">
                {img.url || img.b64_json ? (
                  <img
                    src={img.url || `data:image/png;base64,${img.b64_json}`}
                    alt={`配图${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Image size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!articleGenerating && currentArticle && (
        <div className="px-5 py-3 border-t border-slate-100 flex justify-between">
          <button
            onClick={generateArticleImages}
            disabled={addingArticleImages}
            className="px-5 py-2 bg-cyan-500 text-white font-medium rounded-xl hover:bg-cyan-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
          >
            {addingArticleImages ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>生成中...</span>
              </>
            ) : (
              <>
                <Image size={14} />
                <span>一键配图</span>
              </>
            )}
          </button>
          <button
            onClick={generateTitles}
            disabled={titlesGenerating}
            className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
          >
            {titlesGenerating ? <Loader2 size={14} className="animate-spin" /> : <List size={14} />}
            <span>{titlesGenerating ? '生成中...' : '生成标题摘要'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
