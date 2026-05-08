import { openDB } from 'idb'
import { scraperProjectSchema, type ScraperProject } from './types'

const databaseName = 'paste-scraper-builder'
const storeName = 'drafts'
const draftKey = 'current'

const getDatabase = () =>
  openDB(databaseName, 1, {
    upgrade(database) {
      database.createObjectStore(storeName)
    },
  })

export const saveDraft = async (project: ScraperProject): Promise<void> => {
  const database = await getDatabase()
  await database.put(storeName, project, draftKey)
}

export const loadDraft = async (): Promise<ScraperProject | null> => {
  const database = await getDatabase()
  const draft = await database.get(storeName, draftKey)
  const parsed = scraperProjectSchema.safeParse(draft)
  return parsed.success ? parsed.data : null
}

export const clearDraft = async (): Promise<void> => {
  const database = await getDatabase()
  await database.delete(storeName, draftKey)
}
