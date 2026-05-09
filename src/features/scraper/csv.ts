import Papa from 'papaparse'
import type { FieldRule, PreviewRow, ScraperProject } from './types'

const appVersion = typeof __APP_VERSION__ === 'undefined' ? 'test' : __APP_VERSION__

export const rowsToCsv = (rows: PreviewRow[], fields: FieldRule[], project?: ScraperProject): string => {
  const provenanceFields = [
    '_psb_app_version',
    '_psb_schema_version',
    '_psb_shape',
    '_psb_row_selector',
    '_psb_source_url',
    '_psb_inference_confidence',
  ]
  const fieldNames = fields.map((field) => field.name)
  const fieldMetaNames = fields.flatMap((field) => [`${field.name}__type`, `${field.name}__confidence`])

  return Papa.unparse({
    fields: [...fieldNames, ...fieldMetaNames, ...provenanceFields],
    data: rows.map((row) => [
      ...fields.map((field) => row[field.name] ?? ''),
      ...fields.flatMap((field) => [field.fieldType ?? 'text', String(field.confidence ?? '')]),
      appVersion,
      project?.schemaVersion ?? '2.0.0',
      project?.inferredShape ?? 'manual',
      project?.rowSelector ?? '',
      project?.sourceUrl ?? '',
      String(project?.inferenceConfidence ?? ''),
    ]),
  })
}

export const rowsToPlainCsv = (rows: PreviewRow[], fields: FieldRule[]): string =>
  Papa.unparse({
    fields: fields.map((field) => field.name),
    data: rows.map((row) => fields.map((field) => row[field.name] ?? '')),
  })
