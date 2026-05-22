import Header from '@/components/Header'
import Hero from '@/components/Hero'
import Features from '@/components/Features'
import InputSection from '@/components/InputSection'
import StyleFeedingSection from '@/components/StyleFeedingSection'
import DomainSelector from '@/components/DomainSelector'
import ArticleSection from '@/components/ArticleSection'
import TitlesSection from '@/components/TitlesSection'
import CoverSection from '@/components/CoverSection'
import SettingsModal from '@/components/SettingsModal'
import HumanizerModal from '@/components/HumanizerModal'
import Toast from '@/components/Toast'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />

      {/* 工作区 */}
      <section id="workspace" className="py-12 sm:py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">开始创作</h2>
            <p className="mt-2 text-slate-500 text-sm">输入你的主题，让 AI 帮你完成剩下的工作。</p>
          </div>
          <InputSection />
          <StyleFeedingSection />
          <DomainSelector />
          <ArticleSection />
          <TitlesSection />
          <CoverSection />
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-8 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-5 text-center text-xs text-slate-400">
          公众号写作神器 - AI Agent 驱动的一站式内容创作工具
        </div>
      </footer>

      <SettingsModal />
      <HumanizerModal />
      <Toast />
    </div>
  )
}
