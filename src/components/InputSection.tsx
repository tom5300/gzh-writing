import { useWritingStore } from '../store/writingStore'
import { useEffect, useState, useMemo } from 'react'
import { fetchStyles, generateArticle } from '../services/api'
import { PenLine, Loader2, Sparkles } from 'lucide-react'
import { domains, getDomainById } from '../data/domains'

export default function InputSection() {
  const { topic, setTopic, styles, selectedStyleId, setSelectedStyleId, articleGenerating, selectedDomainId, personalStyles } = useWritingStore()
  const [showPresets, setShowPresets] = useState(false)

  useEffect(() => {
    fetchStyles()
  }, [])

  // 领域联动：选择领域后自动切换推荐风格
  useEffect(() => {
    if (!selectedDomainId) return
    const domain = getDomainById(selectedDomainId)
    if (!domain) return
    // 找到第一个推荐风格对应的 style id
    const styleList = useWritingStore.getState().styles
    for (const recStyle of domain.recommendedStyles) {
      const found = styleList.find(s => s.name === recStyle)
      if (found) {
        setSelectedStyleId(found.id)
        break
      }
    }
  }, [selectedDomainId])

  const currentDomain = useMemo(() => getDomainById(selectedDomainId), [selectedDomainId])
  const currentTopics = currentDomain?.topics || []
  const currentPlaceholder = currentDomain?.placeholder || '输入你的文章主题和写作要求，例如：\n· 写一篇关于AI对内容创作影响的评论文章，1500字\n· 分析某个行业趋势的利与弊\n· 从个人经历出发，谈谈某个话题的思考'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">主题 & 写作要求</label>
            {currentTopics.length > 0 && (
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                <Sparkles size={12} />
                <span>{showPresets ? '收起' : '推荐主题'}</span>
              </button>
            )}
          </div>
          {showPresets && currentTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5 animate-fade-in">
              {currentTopics.map(preset => (
                <button
                  key={preset}
                  onClick={() => { setTopic(preset); setShowPresets(false) }}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs rounded-lg border border-slate-200 hover:border-indigo-200 transition-all text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          )}
          <textarea
            rows={4}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all text-sm"
            placeholder={currentPlaceholder}
          />
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">写作风格</label>
            <select
              value={selectedStyleId}
              onChange={(e) => setSelectedStyleId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
            >
              {styles.length === 0 && personalStyles.length === 0 ? (
                <option value="">加载中...</option>
              ) : (
                <>
                  {/* 个人风格优先显示 */}
                  {personalStyles.length > 0 && (
                    <optgroup label="个人风格">
                      {personalStyles.map(s => (
                        <option key={s.id} value={s.id}>
                          👤 {s.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {/* 固定风格 */}
                  <optgroup label="预设风格">
                    {styles.map(s => {
                      const isRecommended = currentDomain?.recommendedStyles.includes(s.name)
                      return (
                        <option key={s.id} value={s.id}>
                          {isRecommended ? '⭐ ' : ''}{s.name}
                        </option>
                      )
                    })}
                  </optgroup>
                </>
              )}
            </select>
          </div>
          <button
            onClick={generateArticle}
            disabled={!topic.trim() || articleGenerating}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 whitespace-nowrap text-sm"
          >
            {articleGenerating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <PenLine size={16} />
            )}
            <span>{articleGenerating ? '生成中...' : '开始写作'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
