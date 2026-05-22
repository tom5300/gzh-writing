import { create } from 'zustand'

interface Settings {
  apiUrl: string
  apiKey: string
  modelName: string
  imageUrl: string
  imageApiKey: string
  imageModel: string
}

interface TitleItem {
  title: string
  summary: string
}

interface WritingState {
  // 设置
  settings: Settings
  settingsOpen: boolean
  // 领域
  selectedDomainId: string
  // 风格
  styles: Array<{ id: string; name: string }>
  selectedStyleId: string
  // 文章
  topic: string
  currentArticle: string
  articleGenerating: boolean
  // 标题
  titles: TitleItem[]
  titlesGenerating: boolean
  // 封面
  keyPoints: string[]
  coverPrompts: string[]
  coverPromptsGenerating: boolean
  coverImages: Map<number, { url?: string; b64_json?: string; revised_prompt?: string }>
  coverImageGeneratingIndices: Set<number>
  // Toast
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' }>

  // Actions
  loadSettings: () => void
  saveSettings: (settings: Settings) => void
  openSettings: () => void
  closeSettings: () => void
  setStyles: (styles: Array<{ id: string; name: string }>) => void
  setSelectedStyleId: (id: string) => void
  setSelectedDomainId: (id: string) => void
  setTopic: (topic: string) => void
  setCurrentArticle: (article: string) => void
  appendArticle: (content: string) => void
  setArticleGenerating: (v: boolean) => void
  setTitles: (titles: TitleItem[]) => void
  setTitlesGenerating: (v: boolean) => void
  setKeyPoints: (points: string[]) => void
  setCoverPrompts: (prompts: string[]) => void
  setCoverPromptsGenerating: (v: boolean) => void
  setCoverImage: (index: number, data: { url?: string; b64_json?: string; revised_prompt?: string }) => void
  setCoverImageGenerating: (index: number, v: boolean) => void
  addToast: (message: string, type?: 'success' | 'error') => void
  removeToast: (id: string) => void
  resetWorkflow: () => void
}

const SETTINGS_KEY = 'wt_settings'

const defaultSettings: Settings = {
  apiUrl: '',
  apiKey: '',
  modelName: '',
  imageUrl: '',
  imageApiKey: '',
  imageModel: '',
}

function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return defaultSettings
}

export const useWritingStore = create<WritingState>((set) => ({
  settings: readSettings(),
  settingsOpen: false,
  selectedDomainId: '',
  styles: [],
  selectedStyleId: '0',
  topic: '',
  currentArticle: '',
  articleGenerating: false,
  titles: [],
  titlesGenerating: false,
  keyPoints: [],
  coverPrompts: [],
  coverPromptsGenerating: false,
  coverImages: new Map(),
  coverImageGeneratingIndices: new Set(),
  toasts: [],

  loadSettings: () => set({ settings: readSettings() }),
  saveSettings: (settings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    set({ settings, settingsOpen: false })
  },
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  setStyles: (styles) => set({ styles }),
  setSelectedStyleId: (id) => set({ selectedStyleId: id }),
  setSelectedDomainId: (id) => set({ selectedDomainId: id }),
  setTopic: (topic) => set({ topic }),
  setCurrentArticle: (article) => set({ currentArticle: article }),
  appendArticle: (content) => set((state) => ({ currentArticle: state.currentArticle + content })),
  setArticleGenerating: (v) => set({ articleGenerating: v }),
  setTitles: (titles) => set({ titles }),
  setTitlesGenerating: (v) => set({ titlesGenerating: v }),
  setKeyPoints: (points) => set({ keyPoints: points }),
  setCoverPrompts: (prompts) => set({ coverPrompts: prompts }),
  setCoverPromptsGenerating: (v) => set({ coverPromptsGenerating: v }),
  setCoverImage: (index, data) => set((state) => {
    const newImages = new Map(state.coverImages)
    newImages.set(index, data)
    return { coverImages: newImages }
  }),
  setCoverImageGenerating: (index, v) => set((state) => {
    const newIndices = new Set(state.coverImageGeneratingIndices)
    if (v) {
      newIndices.add(index)
    } else {
      newIndices.delete(index)
    }
    return { coverImageGeneratingIndices: newIndices }
  }),
  addToast: (message, type = 'success') => {
    const id = Date.now().toString()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  resetWorkflow: () => set({
    currentArticle: '',
    titles: [],
    keyPoints: [],
    coverPrompts: [],
    coverImages: new Map(),
    coverImageGeneratingIndices: new Set(),
  }),
}))
