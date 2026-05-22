import { useWritingStore } from '../store/writingStore'
import { useEffect } from 'react'
import { Shield, Plug, Zap } from 'lucide-react'

export default function Hero() {
  const settings = useWritingStore(s => s.settings)
  const openSettings = useWritingStore(s => s.openSettings)

  useEffect(() => {
    if (!settings.apiUrl) {
      const timer = setTimeout(() => openSettings(), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 pt-28 pb-20 sm:pt-36 sm:pb-24">
      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto px-5 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs text-indigo-200 mb-8 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>AI Agent 驱动的写作神器</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
          别折腾自己了{' '}
          <span className="bg-gradient-to-r from-indigo-300 to-emerald-300 bg-clip-text text-transparent">
            让AI写吧
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
          从灵感到成品，三步搞定正文、标题摘要、封面配图
        </p>

        <div className="mt-14 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Shield size={14} className="text-emerald-500/60" />数据本地存储</span>
          <span className="flex items-center gap-1.5"><Plug size={14} className="text-indigo-400/60" />自由接入模型</span>
          <span className="flex items-center gap-1.5"><Zap size={14} className="text-amber-400/60" />流式实时生成</span>
        </div>
      </div>
    </section>
  )
}
