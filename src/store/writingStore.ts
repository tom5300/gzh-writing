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

interface WritingData {
  topic: string
  currentArticle: string
  titles: TitleItem[]
  keyPoints: string[]
  coverPrompts: string[]
  coverImages: Record<number, { url?: string; b64_json?: string; revised_prompt?: string }>
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
  clearAllData: () => void
}

const SETTINGS_KEY = 'wt_settings'
const WRITING_DATA_KEY = 'wt_writing_data'

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

function readWritingData(): WritingData {
  try {
    const raw = localStorage.getItem(WRITING_DATA_KEY)
    if (raw) {
      const data = JSON.parse(raw) as WritingData
      return {
        topic: data.topic || '',
        currentArticle: data.currentArticle || '',
        titles: data.titles || [],
        keyPoints: data.keyPoints || [],
        coverPrompts: data.coverPrompts || [],
        coverImages: data.coverImages || {},
      }
    }
  } catch { /* ignore */ }
  return {
    topic: '',
    currentArticle: '',
    titles: [],
    keyPoints: [],
    coverPrompts: [],
    coverImages: {},
  }
}

function saveWritingData(data: WritingData): void {
  try {
    localStorage.setItem(WRITING_DATA_KEY, JSON.stringify(data))
  } catch { /* ignore */ }
}

function createWritingDataFromState(state: Partial<WritingState>): WritingData {
  return {
    topic: state.topic || '',
    currentArticle: state.currentArticle || '',
    titles: state.titles || [],
    keyPoints: state.keyPoints || [],
    coverPrompts: state.coverPrompts || [],
    coverImages: state.coverImages instanceof Map 
      ? Object.fromEntries(state.coverImages) 
      : state.coverImages || {},
  }
}

export const useWritingStore = create<WritingState>((set, get) => {
  const savedData = readWritingData()
  
  return {
    settings: readSettings(),
    settingsOpen: false,
    selectedDomainId: '',
    styles: [],
    selectedStyleId: '0',
    topic: savedData.topic,
    currentArticle: savedData.currentArticle,
    articleGenerating: false,
    titles: savedData.titles,
    titlesGenerating: false,
    keyPoints: savedData.keyPoints,
    coverPrompts: savedData.coverPrompts,
    coverPromptsGenerating: false,
    coverImages: new Map(Object.entries(savedData.coverImages).map(([k, v]) => [Number(k), v])),
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
    setTopic: (topic) => {
      set({ topic })
      saveWritingData(createWritingDataFromState({ ...get(), topic }))
    },
    setCurrentArticle: (article) => {
      set({ currentArticle: article })
      saveWritingData(createWritingDataFromState({ ...get(), currentArticle: article }))
    },
    appendArticle: (content) => set((state) => {
      const newArticle = state.currentArticle + content
      saveWritingData(createWritingDataFromState({ ...state, currentArticle: newArticle }))
      return { currentArticle: newArticle }
    }),
    setArticleGenerating: (v) => set({ articleGenerating: v }),
    setTitles: (titles) => {
      set({ titles })
      saveWritingData(createWritingDataFromState({ ...get(), titles }))
    },
    setTitlesGenerating: (v) => set({ titlesGenerating: v }),
    setKeyPoints: (points) => {
      set({ keyPoints: points })
      saveWritingData(createWritingDataFromState({ ...get(), keyPoints: points }))
    },
    setCoverPrompts: (prompts) => {
      set({ coverPrompts: prompts })
      saveWritingData(createWritingDataFromState({ ...get(), coverPrompts: prompts }))
    },
    setCoverPromptsGenerating: (v) => set({ coverPromptsGenerating: v }),
    setCoverImage: (index, data) => set((state) => {
      const newImages = new Map(state.coverImages)
      newImages.set(index, data)
      saveWritingData(createWritingDataFromState({ ...state, coverImages: newImages }))
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
    resetWorkflow: () => {
      const emptyState: Partial<WritingState> = {
        currentArticle: '',
        titles: [],
        keyPoints: [],
        coverPrompts: [],
        coverImages: new Map<number, { url?: string; b64_json?: string; revised_prompt?: string }>(),
        coverImageGeneratingIndices: new Set<number>(),
      }
      set(emptyState)
      saveWritingData(createWritingDataFromState(emptyState))
      get().addToast('数据已重置')
    },
    clearAllData: () => {
      localStorage.removeItem(WRITING_DATA_KEY)
      set({
        topic: '',
        currentArticle: '',
        titles: [],
        keyPoints: [],
        coverPrompts: [],
        coverImages: new Map(),
        coverImageGeneratingIndices: new Set(),
      })
      get().addToast('所有数据已清除')
    },
  }
})
