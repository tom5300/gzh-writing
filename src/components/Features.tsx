import { PenLine, ListChecks, WandSparkles, Rocket, BookOpen, Grid3X3 } from 'lucide-react'

const features = [
  {
    icon: BookOpen,
    color: 'violet',
    title: '风格喂养',
    desc: '添加你喜欢的文章，AI 学习并模仿其写作风格，让生成的内容更有个性和辨识度。',
  },
  {
    icon: Grid3X3,
    color: 'cyan',
    title: '领域选择',
    desc: '精准匹配内容领域，AI据此调整用词、语气和专业程度，让每篇文章都恰到好处。',
  },
  {
    icon: PenLine,
    color: 'indigo',
    title: '风格化写作',
    desc: '内置多种写作风格模板，AI 严格遵循风格约束，每篇文章都有鲜明的个人辨识度。',
  },
  {
    icon: ListChecks,
    color: 'amber',
    title: '智能标题摘要',
    desc: '基于正文一键批量生成 5 组标题和摘要，涵盖疑问句、数字型、反差型等多种风格。',
  },
  {
    icon: WandSparkles,
    color: 'emerald',
    title: 'AI 封面生成',
    desc: '自动提炼关键内容点，生成 3 个专业封面图 Prompt，选定后一键调用文生图模型出图。',
  },
  {
    icon: Rocket,
    color: 'rose',
    title: '即拿即用',
    desc: '所有文本一键复制到剪贴板，封面图直接下载到本地，无缝对接公众号等平台。',
  },
]

const colorMap: Record<string, { bg: string; text: string; groupBg: string }> = {
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', groupBg: 'group-hover:bg-violet-100' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', groupBg: 'group-hover:bg-cyan-100' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', groupBg: 'group-hover:bg-indigo-100' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', groupBg: 'group-hover:bg-amber-100' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', groupBg: 'group-hover:bg-emerald-100' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-500', groupBg: 'group-hover:bg-rose-100' },
}

export default function Features() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">从写作到发布，一站闭环</h2>
          <p className="mt-2 text-slate-500 text-sm">六大能力模块串联完整创作流程</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {features.map((f) => {
            const c = colorMap[f.color]
            return (
              <div key={f.title} className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all duration-300">
                <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.groupBg} flex items-center justify-center mb-4 transition-colors`}>
                  <f.icon size={20} className={c.text} />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
