import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { rowsToCsv } from './csv'
import { analyzeHtml } from './inference'
import { extractPreview } from './selectorEngine'
import type { FieldType } from './types'

interface ExpectedField {
  name: string
  type: FieldType
  confidenceAtLeast: number
}

interface ExpectedFixture {
  id: string
  sourceUrl: string
  expectedKind: string
  expectedShape: string
  minRows: number
  requiredFields: ExpectedField[]
  requiredAnomalies?: string[]
  requiredMessageIncludes?: string[]
  sampleMustContain?: string[]
}

const fixturesRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../test/fixtures/realdata')
const fixtureIds = [
  'arxiv-web-scraping',
  'books-products',
  'books-truncated',
  'countries',
  'github-trending-js',
  'hacker-news',
  'npm-react-challenge',
  'python-blogs',
  'quotes',
  'wikipedia-population',
]

const readFixture = (id: string): { html: string; expected: ExpectedFixture } => ({
  html: readFileSync(join(fixturesRoot, `${id}.html`), 'utf8'),
  expected: JSON.parse(readFileSync(join(fixturesRoot, `${id}.expected.json`), 'utf8')) as ExpectedFixture,
})

const stableResult = (html: string, sourceUrl: string) => {
  const result = analyzeHtml(html, { sourceUrl })
  return {
    status: result.status,
    shape: result.shape,
    strategy: result.strategy,
    confidence: result.confidence,
    rowSelector: result.project.rowSelector,
    fields: result.fields,
    anomalies: result.anomalies,
    messages: result.messages,
  }
}

describe('real-data inference fixtures', () => {
  it.each(fixtureIds)(
    'infers %s without manual selector picking',
    (id) => {
      const { html, expected } = readFixture(id)
      const result = analyzeHtml(html, { sourceUrl: expected.sourceUrl })
      const preview = extractPreview(result.project)
      const serializedPreview = JSON.stringify(preview.rows.slice(0, 5))

      expect(result.shape).toBe(expected.expectedShape)
      expect(result.rowCount).toBeGreaterThanOrEqual(expected.minRows)
      if (expected.expectedKind === 'actionable_error') {
        expect(result.status).toBe('actionable_error')
      } else {
        expect(result.status).not.toBe('actionable_error')
      }

      expected.requiredFields.forEach((required) => {
        const actual = result.fields.find((field) => field.name === required.name)
        expect(actual, `${id} missing ${required.name}`).toBeTruthy()
        expect(actual?.fieldType).toBe(required.type)
        expect(actual?.confidence ?? 0).toBeGreaterThanOrEqual(required.confidenceAtLeast)
      })

      expected.requiredAnomalies?.forEach((anomaly) => {
        expect(result.anomalies).toContain(anomaly)
      })

      expected.requiredMessageIncludes?.forEach((needle) => {
        expect(result.messages.map((entry) => `${entry.what} ${entry.why} ${entry.nextStep}`).join(' ')).toContain(
          needle,
        )
      })

      expected.sampleMustContain?.forEach((needle) => {
        expect(serializedPreview).toContain(needle)
      })
    },
    20_000,
  )

  it.each(fixtureIds)(
    'is deterministic for %s',
    (id) => {
      const { html, expected } = readFixture(id)
      expect(stableResult(html, expected.sourceUrl)).toEqual(stableResult(html, expected.sourceUrl))
    },
    20_000,
  )

  it('generates deterministic provenance CSV', () => {
    const { html, expected } = readFixture('books-products')
    const result = analyzeHtml(html, { sourceUrl: expected.sourceUrl })
    const preview = extractPreview(result.project)
    expect(rowsToCsv(preview.rows, result.fields, result.project)).toBe(
      rowsToCsv(preview.rows, result.fields, result.project),
    )
    expect(rowsToCsv(preview.rows.slice(0, 1), result.fields, result.project)).toContain('_psb_app_version')
  })
})

describe('input robustness edge cases', () => {
  const syntheticInputs = [
    '',
    '\uFEFF<html><body><article><h2>Alpha</h2></article></body></html>',
    '<html><body><div><article><h2>Broken',
    '<html><body>' + '<article><h2>Huge</h2><a href="/x">x</a></article>'.repeat(250) + '</body></html>',
    '<table><tr><td>One<td>2</tr><tr><td>Two<td>3</tr></table>',
  ]

  it.each(syntheticInputs)('does not crash on synthetic input %#', (html) => {
    expect(() => analyzeHtml(html)).not.toThrow()
  })
})
