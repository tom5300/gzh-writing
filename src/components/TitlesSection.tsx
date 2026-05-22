import { useWritingStore } from '../store/writingStore'
import { Copy, Image, Loader2 } from 'lucide-react'
import { copyToClipboard, generateCoverPrompts } from '../services/api'

export default function TitlesSection() {
  const { titles, titlesGenerating, coverPromptsGenerating } = useWritingStore()

  if (titles.length === 0 && !titlesGenerating) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
      <div className="px-5 py-3 border-b border-slate-100">
        <span className="text-sm font-medium text-slate-700">标题 & 摘要</span>
      </div>
      <div className="divide-y divide-slate-100">
        {titles.map((item, i) => (
          <div key={i} className="px-5 py-3.5 animate-fade-in hover:bg-slate-50/50 transition-colors" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-500 text-xs font-medium rounded-full mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-slate-800 font-medium leading-relaxed text-sm">{item.title}</p>
                  <button
                    onClick={() => copyToClipboard(item.title)}
                    className="flex-shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="复制标题"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <div className="flex items-start justify-between gap-2 mt-1">
                  <p className="text-slate-500 text-xs leading-relaxed">{item.summary}</p>
                  <button
                    onClick={() => copyToClipboard(item.summary)}
                    className="flex-shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                    title="复制摘要"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-slate-100 flex justify-end">
        <button
          onClick={generateCoverPrompts}
          disabled={coverPromptsGenerating}
          className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-sm"
        >
          {coverPromptsGenerating ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
          <span>{coverPromptsGenerating ? '生成中...' : '生成封面'}</span>
        </button>
      </div>
    </div>
  )
}
