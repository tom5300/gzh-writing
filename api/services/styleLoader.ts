import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STYLES_DIR = path.join(__dirname, '../../styles')

interface Style {
  id: string
  name: string
  content: string
  filename: string
}

let stylesCache: Style[] | null = null

function loadStyles(): Style[] {
  if (stylesCache) return stylesCache
  const files = fs.readdirSync(STYLES_DIR).filter(f => f.endsWith('.txt'))
  stylesCache = files.map((file, index) => {
    const name = path.basename(file, '.txt')
    const content = fs.readFileSync(path.join(STYLES_DIR, file), 'utf-8')
    return { id: index.toString(), name, content, filename: file }
  })
  return stylesCache
}

export function getStyle(id: string): Style | undefined {
  return loadStyles().find(s => s.id === id)
}

export function getStyleList(): Array<{ id: string; name: string }> {
  return loadStyles().map(s => ({ id: s.id, name: s.name }))
}

export function invalidateCache(): void {
  stylesCache = null
}
