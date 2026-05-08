import { z } from 'zod'

export const selectorModeSchema = z.enum(['css', 'xpath'])
export type SelectorMode = z.infer<typeof selectorModeSchema>

export const extractionAttributeSchema = z.enum(['text', 'html', 'href', 'src', 'content', 'title', 'alt'])
export type ExtractionAttribute = z.infer<typeof extractionAttributeSchema>

export const fieldRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  selector: z.string().min(1),
  selectorMode: selectorModeSchema,
  attribute: extractionAttributeSchema,
})

export type FieldRule = z.infer<typeof fieldRuleSchema>

export const scraperProjectSchema = z.object({
  html: z.string(),
  rowSelector: z.string(),
  rowSelectorMode: selectorModeSchema,
  fields: z.array(fieldRuleSchema),
  updatedAt: z.string(),
})

export type ScraperProject = z.infer<typeof scraperProjectSchema>

export type PreviewRow = Record<string, string>

export interface PreviewResult {
  rows: PreviewRow[]
  rowCount: number
  warnings: string[]
}

export interface PickedSelector {
  css: string
  xpath: string
}

export interface PickedFieldSelector extends PickedSelector {
  rowIndex: number
}

export const blankProject = (): ScraperProject => ({
  html: '',
  rowSelector: '',
  rowSelectorMode: 'css',
  fields: [],
  updatedAt: new Date().toISOString(),
})
