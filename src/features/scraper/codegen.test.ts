import { describe, expect, it } from 'vitest'
import { generateGoScraper, generatePythonScraper } from './codegen'
import type { ScraperProject } from './types'

const project: ScraperProject = {
  html: '<article class="product"><a class="title" href="/x">Name</a></article>',
  rowSelector: '.product',
  rowSelectorMode: 'css',
  fields: [{ id: '1', name: 'title', selector: '.title', selectorMode: 'css', attribute: 'text' }],
  updatedAt: '2026-05-08T00:00:00.000Z',
}

describe('code generators', () => {
  it('generates Python scraper code with configured selectors', () => {
    const code = generatePythonScraper(project)

    expect(code).toContain('parsel')
    expect(code).toContain('ROW_SELECTOR = ".product"')
    expect(code).toContain('"selector": ".title"')
  })

  it('generates Go scraper code with configured selectors', () => {
    const code = generateGoScraper(project)

    expect(code).toContain('cascadia')
    expect(code).toContain('selectNodes(doc, ".product", "css")')
    expect(code).toContain('Selector: ".title"')
  })
})
