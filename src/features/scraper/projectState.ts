import { scraperProjectSchema, type ScraperProject } from './types'

export interface AppSettings {
  autoInfer: boolean
  includeProvenance: boolean
}

export const hashPrefix = '#state='
const settingsKey = 'paste-scraper-builder-settings-v1'

export const defaultSettings: AppSettings = {
  autoInfer: true,
  includeProvenance: true,
}

export const loadSettings = (): AppSettings => {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(settingsKey) ?? '{}') as Partial<AppSettings>
    return { ...defaultSettings, ...parsed }
  } catch {
    return defaultSettings
  }
}

export const saveSettings = (settings: AppSettings): void => {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings))
}

export const encodeProjectState = (project: ScraperProject): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(project))
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

export const decodeProjectState = (state: string): ScraperProject | null => {
  try {
    const padded = state
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(state.length / 4) * 4, '=')
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    const result = scraperProjectSchema.safeParse(parsed)
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export const decodeProjectJson = (text: string): ScraperProject | null => {
  try {
    const result = scraperProjectSchema.safeParse(JSON.parse(text))
    return result.success ? result.data : null
  } catch {
    return null
  }
}

export const projectStateJson = (project: ScraperProject): string => `${JSON.stringify(project, null, 2)}\n`

export const projectFromLocationHash = (): ScraperProject | null => {
  if (typeof window === 'undefined' || !window.location.hash.startsWith(hashPrefix)) {
    return null
  }
  return decodeProjectState(window.location.hash.slice(hashPrefix.length))
}

export const confidenceLabel = (confidence = 0): string => {
  if (confidence >= 0.75) {
    return 'high'
  }
  if (confidence >= 0.5) {
    return 'medium'
  }
  if (confidence > 0) {
    return 'low'
  }
  return 'none'
}
