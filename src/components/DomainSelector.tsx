import { useWritingStore } from '../store/writingStore'
import { domains } from '../data/domains'
import {
  Cpu, TrendingUp, GraduationCap, Heart, HeartHandshake,
  Briefcase, UtensilsCrossed, MapPin, Clapperboard, Baby,
  Scale, Stethoscope, Building2, Car, Trophy, Palette,
  Users, Sparkles, Bot, PawPrint, PiggyBank, Flame,
  Film, Smartphone, Shield, Wheat, Star, Gamepad2,
  BookOpen, Landmark, Code, Target, Zap, Home, Coffee,
  HeartPulse, PenTool, MoreHorizontal,
} from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  Cpu, TrendingUp, GraduationCap, Heart, HeartHandshake,
  Briefcase, UtensilsCrossed, MapPin, Clapperboard, Baby,
  Scale, Stethoscope, Building2, Car, Trophy, Palette,
  Users, Sparkles, Bot, PawPrint, PiggyBank, Flame,
  Film, Smartphone, Shield, Wheat, Star, Gamepad2,
  BookOpen, Landmark, Code, Target, Zap, Home, Coffee,
  HeartPulse, PenTool, MoreHorizontal,
}

export default function DomainSelector() {
  const { selectedDomainId, setSelectedDomainId } = useWritingStore()

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <label className="block text-sm font-medium text-slate-700 mb-3">选择领域</label>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
        {domains.map(domain => {
          const Icon = iconMap[domain.icon]
          const isSelected = selectedDomainId === domain.id
          return (
            <button
              key={domain.id}
              onClick={() => setSelectedDomainId(isSelected ? '' : domain.id)}
              className={`group flex flex-col items-center gap-1 px-1.5 py-2.5 rounded-lg border transition-all text-center ${
                isSelected
                  ? 'border-indigo-400 bg-indigo-50 shadow-sm shadow-indigo-100 -translate-y-0.5'
                  : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                isSelected ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
              }`}>
                {Icon && <Icon size={14} />}
              </div>
              <span className={`text-[11px] font-medium leading-tight truncate w-full ${
                isSelected ? 'text-indigo-700' : 'text-slate-500'
              }`}>
                {domain.name}
              </span>
            </button>
          )
        })}
      </div>
      {selectedDomainId && (() => {
        const domain = domains.find(d => d.id === selectedDomainId)
        if (!domain) return null
        return (
          <div className="mt-2.5 flex items-center gap-2 text-xs text-slate-500 animate-fade-in">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{domain.name}</span>
            <span>{domain.desc}</span>
            <span className="text-slate-300">|</span>
            <span>推荐：{domain.recommendedStyles.join('、')}</span>
          </div>
        )
      })()}
    </div>
  )
}
