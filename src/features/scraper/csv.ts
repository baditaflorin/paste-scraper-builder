import Papa from 'papaparse'
import type { FieldRule, PreviewRow } from './types'

export const rowsToCsv = (rows: PreviewRow[], fields: FieldRule[]): string =>
  Papa.unparse({
    fields: fields.map((field) => field.name),
    data: rows.map((row) => fields.map((field) => row[field.name] ?? '')),
  })
