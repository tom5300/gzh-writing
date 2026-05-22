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
  coverImageData: { url?: string; b64_json?: string; revised_prompt?: string } | null
  coverImageGenerating: boolean
  coverImageGeneratingIndex: number
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
  setCoverImageData: (data: WritingState['coverImageData']) => void
  setCoverImageGenerating: (v: boolean, index?: number) => void
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
  coverImageData: null,
  coverImageGenerating: false,
  coverImageGeneratingIndex: -1,
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
  setCoverImageData: (data) => set({ coverImageData: data }),
  setCoverImageGenerating: (v, index = -1) => set({ coverImageGenerating: v, coverImageGeneratingIndex: index }),
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
    coverImageData: null,
  }),
}))
