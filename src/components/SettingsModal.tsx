import { useWritingStore } from '../store/writingStore'
import { X } from 'lucide-react'

export default function SettingsModal() {
  const { settingsOpen, closeSettings, settings, saveSettings } = useWritingStore()

  if (!settingsOpen) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    saveSettings({
      apiUrl: form.get('apiUrl') as string,
      apiKey: form.get('apiKey') as string,
      modelName: form.get('modelName') as string,
      imageUrl: form.get('imageUrl') as string,
      imageApiKey: form.get('imageApiKey') as string,
      imageModel: form.get('imageModel') as string,
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeSettings} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-modal-in">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">API 设置</h2>
          <button onClick={closeSettings} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 文本模型 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">T</span>
              文本模型
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">API URL</label>
                <input
                  name="apiUrl"
                  defaultValue={settings.apiUrl}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://api.openai.com/v1/chat/completions"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">API Key</label>
                <input
                  name="apiKey"
                  type="password"
                  defaultValue={settings.apiKey}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">模型名称</label>
                <input
                  name="modelName"
                  defaultValue={settings.modelName}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="gpt-4o / qwen-plus / deepseek-chat"
                />
              </div>
            </div>
          </div>

          {/* 图片模型 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">I</span>
              图片模型
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">API URL</label>
                <input
                  name="imageUrl"
                  defaultValue={settings.imageUrl}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="https://api.openai.com/v1/images/generations"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">API Key</label>
                <input
                  name="imageApiKey"
                  type="password"
                  defaultValue={settings.imageApiKey}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">模型名称</label>
                <input
                  name="imageModel"
                  defaultValue={settings.imageModel}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="dall-e-3 / doubao-seedream"
                />
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400">设置保存在浏览器本地，不会传给服务器。</p>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={closeSettings}
              className="px-5 py-2 border border-slate-300 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-all"
            >
              保存设置
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
