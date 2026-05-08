import { describe, expect, it } from 'vitest'
import { sampleHtml } from './sampleHtml'
import { extractPreview, selectorMatches } from './selectorEngine'
import type { ScraperProject } from './types'

const project = (html: string, rowSelector: string, fields: ScraperProject['fields']): ScraperProject => ({
  html,
  rowSelector,
  rowSelectorMode: rowSelector.startsWith('/') || rowSelector.startsWith('//') ? 'xpath' : 'css',
  fields,
  updatedAt: '2026-05-08T00:00:00.000Z',
})

describe('extractPreview', () => {
  it('extracts marketplace card fields with CSS selectors', () => {
    const result = extractPreview(
      project(sampleHtml, '.product-card', [
        { id: '1', name: 'title', selector: '.title', selectorMode: 'css', attribute: 'text' },
        { id: '2', name: 'price', selector: '.price', selectorMode: 'css', attribute: 'text' },
        { id: '3', name: 'href', selector: '.title', selectorMode: 'css', attribute: 'href' },
      ]),
    )

    expect(result.rowCount).toBe(3)
    expect(result.rows[0]).toEqual({
      title: 'Oak Desk Stand',
      price: '$42',
      href: '/products/desk-stand',
    })
  })

  it('extracts table rows', () => {
    const html = `
      <table>
        <tbody>
          <tr><td class="city">Bucharest</td><td class="temp">21 C</td></tr>
          <tr><td class="city">Cluj</td><td class="temp">18 C</td></tr>
        </tbody>
      </table>
    `

    const result = extractPreview(
      project(html, 'tbody > tr', [
        { id: '1', name: 'city', selector: '.city', selectorMode: 'css', attribute: 'text' },
        { id: '2', name: 'temp', selector: '.temp', selectorMode: 'css', attribute: 'text' },
      ]),
    )

    expect(result.rows).toEqual([
      { city: 'Bucharest', temp: '21 C' },
      { city: 'Cluj', temp: '18 C' },
    ])
  })

  it('extracts list entries with data attributes', () => {
    const html = `
      <ul>
        <li data-row="book"><a href="/a">Alpha</a><span data-score="98">98</span></li>
        <li data-row="book"><a href="/b">Beta</a><span data-score="91">91</span></li>
      </ul>
    `

    const result = extractPreview(
      project(html, '[data-row="book"]', [
        { id: '1', name: 'name', selector: 'a', selectorMode: 'css', attribute: 'text' },
        { id: '2', name: 'url', selector: 'a', selectorMode: 'css', attribute: 'href' },
        { id: '3', name: 'score', selector: '[data-score]', selectorMode: 'css', attribute: 'text' },
      ]),
    )

    expect(result.rows[1]).toEqual({ name: 'Beta', url: '/b', score: '91' })
  })

  it('extracts nested article cards', () => {
    const html = `
      <section>
        <article class="story"><header><h2>One</h2></header><time title="2026-05-07">Yesterday</time></article>
        <article class="story"><header><h2>Two</h2></header><time title="2026-05-08">Today</time></article>
      </section>
    `

    const result = extractPreview(
      project(html, 'article.story', [
        { id: '1', name: 'headline', selector: 'h2', selectorMode: 'css', attribute: 'text' },
        { id: '2', name: 'date', selector: 'time', selectorMode: 'css', attribute: 'title' },
      ]),
    )

    expect(result.rows).toEqual([
      { headline: 'One', date: '2026-05-07' },
      { headline: 'Two', date: '2026-05-08' },
    ])
  })

  it('extracts XPath rows and fields', () => {
    const html = `
      <div class="people">
        <div class="person"><b>Ana</b><span>Designer</span></div>
        <div class="person"><b>Mihai</b><span>Engineer</span></div>
      </div>
    `

    const result = extractPreview({
      ...project(html, '//div[contains(concat(" ", normalize-space(@class), " "), " person ")]', [
        { id: '1', name: 'name', selector: './b[1]', selectorMode: 'xpath', attribute: 'text' },
        { id: '2', name: 'role', selector: './span[1]', selectorMode: 'xpath', attribute: 'text' },
      ]),
      rowSelectorMode: 'xpath',
    })

    expect(result.rows).toEqual([
      { name: 'Ana', role: 'Designer' },
      { name: 'Mihai', role: 'Engineer' },
    ])
  })
})

describe('selectorMatches', () => {
  it('counts contextual field matches', () => {
    expect(selectorMatches(sampleHtml, '.title', 'css', '.product-card', 'css')).toBe(3)
  })
})
