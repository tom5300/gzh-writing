import { useWritingStore } from '../store/writingStore'
import { CheckCircle, XCircle } from 'lucide-react'

export default function Toast() {
  const toasts = useWritingStore(s => s.toasts)
  const removeToast = useWritingStore(s => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-20 right-5 z-[200] space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast-item flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium ${
            t.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
          onClick={() => removeToast(t.id)}
        >
          {t.type === 'error' ? <XCircle size={16} className="text-rose-500" /> : <CheckCircle size={16} className="text-emerald-500" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
