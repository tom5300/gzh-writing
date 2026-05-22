import { useWritingStore } from '../store/writingStore'
import { marked } from 'marked'
import { Copy, List, Loader2 } from 'lucide-react'
import { copyToClipboard, generateTitles } from '../services/api'

export default function ArticleSection() {
  const { currentArticle, articleGenerating, titlesGenerating, styles, selectedStyleId } = useWritingStore()

  if (!currentArticle && !articleGenerating) return null

  const styleName = styles.find(s => s.id === selectedStyleId)?.name || ''

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
          <button
            onClick={() => copyToClipboard(currentArticle)}
            className="text-sm text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
          >
            <Copy size={14} />
            <span>复制正文</span>
          </button>
        )}
      </div>
      <div className="px-5 py-4 prose prose-slate max-w-none min-h-[100px] text-sm">
        {articleGenerating && !currentArticle ? (
          <div className="text-slate-400 animate-pulse">正在生成文章...</div>
        ) : (
          <div dangerouslySetInnerHTML={{ __html: marked(currentArticle) || '' }} />
        )}
      </div>
      {!articleGenerating && currentArticle && (
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
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
