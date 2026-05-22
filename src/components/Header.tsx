import { useWritingStore } from '../store/writingStore'
import { Settings, Trash2 } from 'lucide-react'

export default function Header() {
  const openSettings = useWritingStore(s => s.openSettings)
  const clearAllData = useWritingStore(s => s.clearAllData)
  const currentArticle = useWritingStore(s => s.currentArticle)

  const handleClearData = () => {
    if (!currentArticle) return
    if (confirm('确定要清除所有生成的数据吗？此操作不可撤销。')) {
      clearAllData()
    }
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="logo" className="w-8 h-8" />
          <span className="font-bold text-slate-800 text-base tracking-tight">公众号写作神器</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearData}
            disabled={!currentArticle}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="清除所有数据"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={openSettings}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            title="API 设置"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
