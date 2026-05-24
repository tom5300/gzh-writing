import { useWritingStore } from '../store/writingStore'
import { marked } from 'marked'
import { Copy, List, Loader2, Sparkles, Image, Check, X } from 'lucide-react'
import { copyToClipboard, generateTitles, generateArticleImages } from '../services/api'

export default function ArticleSection() {
  const { currentArticle, articleGenerating, titlesGenerating, styles, selectedStyleId, openHumanizerModal, articleImages, addingArticleImages, setCurrentArticle } = useWritingStore()

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
              onClick={() => copyToClipboard(currentArticle)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Copy size={14} />
              <span>复制正文</span>
            </button>
            <button
              onClick={openHumanizerModal}
              className="px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Sparkles size={14} />
              <span>去除AI味道</span>
            </button>
          </div>
        )}
      </div>
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
