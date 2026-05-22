import { useWritingStore } from '../store/writingStore'
import { Copy, WandSparkles, Loader2, Download } from 'lucide-react'
import { copyToClipboard, generateCoverImage, downloadCoverImage } from '../services/api'

export default function CoverSection() {
  const {
    keyPoints, coverPrompts, coverPromptsGenerating,
    coverImageData, coverImageGenerating, coverImageGeneratingIndex,
  } = useWritingStore()

  if (coverPrompts.length === 0 && !coverPromptsGenerating) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-slide-up">
      <div className="px-5 py-3 border-b border-slate-100">
        <span className="text-sm font-medium text-slate-700">封面图</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* 关键点 */}
        {keyPoints.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keyPoints.map((p, i) => (
              <span key={i} className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                {p}
              </span>
            ))}
          </div>
        )}

        {/* Prompt 卡片 */}
        <div className="space-y-3">
          {coverPrompts.map((prompt, i) => (
            <div key={i} className="rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-400 mb-1">Prompt {i + 1}</div>
                  <p className="text-xs text-slate-700 leading-relaxed break-all">{prompt}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(prompt)}
                  className="flex-shrink-0 text-slate-400 hover:text-indigo-600 transition-colors mt-3"
                  title="复制 Prompt"
                >
                  <Copy size={13} />
                </button>
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => generateCoverImage(i)}
                  disabled={coverImageGenerating}
                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                >
                  {coverImageGenerating && coverImageGeneratingIndex === i ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <WandSparkles size={12} />
                  )}
                  <span>{coverImageGenerating && coverImageGeneratingIndex === i ? '生成中...' : '生成封面'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 封面图预览 */}
        {coverImageData && (
          <div className="animate-fade-in">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              {coverImageData.url ? (
                <img
                  src={`/api/cover/proxy?url=${encodeURIComponent(coverImageData.url)}`}
                  alt="封面图"
                  className="w-full object-contain"
                />
              ) : coverImageData.b64_json ? (
                <img
                  src={`data:image/png;base64,${coverImageData.b64_json}`}
                  alt="封面图"
                  className="w-full object-contain"
                />
              ) : null}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={downloadCoverImage}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-1.5"
              >
                <Download size={13} />
                <span>下载封面</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
