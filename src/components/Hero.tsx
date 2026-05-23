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
          <span>新一代 AI 驱动的内容创作平台</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
          告别创作瓶颈{' '}
          <span className="bg-gradient-to-r from-indigo-300 to-emerald-300 bg-clip-text text-transparent">
            让 AI 替你思考
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl mx-auto">
          输入主题，AI 即可生成专业文案、爆款标题与精美封面，一站式完成内容生产全流程
        </p>

        <div className="mt-14 flex items-center justify-center gap-6 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Shield size={14} className="text-emerald-500/60" />隐私数据本地存储</span>
          <span className="flex items-center gap-1.5"><Plug size={14} className="text-indigo-400/60" />支持全模型接入</span>
          <span className="flex items-center gap-1.5"><Zap size={14} className="text-amber-400/60" />流式输出即时可见</span>
        </div>
      </div>
    </section>
  )
}
