import { z } from 'zod'

export const selectorModeSchema = z.enum(['css', 'xpath'])
export type SelectorMode = z.infer<typeof selectorModeSchema>

export const extractionAttributeSchema = z.enum(['text', 'html', 'href', 'src', 'content', 'title', 'alt', 'class'])
export type ExtractionAttribute = z.infer<typeof extractionAttributeSchema>

export const fieldTypeSchema = z.enum([
  'title',
  'text',
  'price',
  'rating',
  'status',
  'url',
  'image',
  'author',
  'date',
  'count',
  'number',
  'list',
  'tag',
  'identifier',
])
export type FieldType = z.infer<typeof fieldTypeSchema>

export const fieldScopeSchema = z.enum(['row', 'nextSibling', 'document'])
export type FieldScope = z.infer<typeof fieldScopeSchema>

export const fieldNormalizerSchema = z.enum([
  'text',
  'price',
  'rating',
  'url',
  'image',
  'count',
  'number',
  'date',
  'list',
  'githubOwner',
  'githubRepo',
  'wikipediaCountry',
  'arxivId',
  'comments',
])
export type FieldNormalizer = z.infer<typeof fieldNormalizerSchema>

export const fieldRuleSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  selector: z.string().min(1),
  selectorMode: selectorModeSchema,
  attribute: extractionAttributeSchema,
  fieldType: fieldTypeSchema.optional(),
  confidence: z.number().min(0).max(1).optional(),
  reason: z.string().optional(),
  scope: fieldScopeSchema.optional(),
  multi: z.boolean().optional(),
  normalizer: fieldNormalizerSchema.optional(),
})

export type FieldRule = z.infer<typeof fieldRuleSchema>

export const scraperProjectSchema = z.object({
  schemaVersion: z.string().optional(),
  html: z.string(),
  rowSelector: z.string(),
  rowSelectorMode: selectorModeSchema,
  fields: z.array(fieldRuleSchema),
  updatedAt: z.string(),
  sourceUrl: z.string().optional(),
  inferredShape: z.string().optional(),
  inferenceConfidence: z.number().min(0).max(1).optional(),
  anomalies: z.array(z.string()).optional(),
  rowExclusions: z.array(z.number()).optional(),
})

export type ScraperProject = z.infer<typeof scraperProjectSchema>

export type PreviewRow = Record<string, string>

export type InferenceStatus = 'empty' | 'inferred' | 'partial' | 'low_confidence' | 'actionable_error' | 'too_large'

export interface InferenceMessage {
  severity: 'info' | 'warning' | 'error'
  code: string
  what: string
  why: string
  nextStep: string
}

export interface InferenceResult {
  status: InferenceStatus
  shape: string
  strategy: string
  confidence: number
  project: ScraperProject
  rowCount: number
  fields: FieldRule[]
  messages: InferenceMessage[]
  anomalies: string[]
  timingMs: number
  sourceUrl?: string
  schemaVersion: string
  nextPageUrl?: string
}

export interface PreviewResult {
  rows: PreviewRow[]
  rowCount: number
  warnings: string[]
  fieldMatchCounts?: Record<string, number>
  rowIndices: number[]
}

export interface PickedSelector {
  css: string
  xpath: string
}

export interface PickedFieldSelector extends PickedSelector {
  rowIndex: number
}

export const blankProject = (): ScraperProject => ({
  schemaVersion: '2.0.0',
  html: '',
  rowSelector: '',
  rowSelectorMode: 'css',
  fields: [],
  updatedAt: new Date().toISOString(),
  anomalies: [],
  rowExclusions: [],
})
