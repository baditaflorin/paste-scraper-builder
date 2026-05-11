import { describe, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { SAMPLE_GALLERY, findSample, loadSampleHtml } from './sampleGallery'

describe('sampleGallery', () => {
  it('covers every claimed page shape from the README', () => {
    // Each shape should appear at least once. If we add a new shape to the
    // engine, we should also add a sample that exercises it.
    const expectedShapes = [
      'product-listing',
      'quote-listing',
      'country-listing',
      'sibling-news-listing',
      'repository-listing',
      'article-listing',
      'search-results',
      'data-table',
      'challenge-page',
    ]
    const gotShapes = new Set(SAMPLE_GALLERY.map((s) => s.shape))
    for (const shape of expectedShapes) {
      expect(gotShapes, `gallery missing a sample for ${shape}`).toContain(shape)
    }
  })

  it('has at least 9 samples — the engine claims to detect 9+ shapes', () => {
    expect(SAMPLE_GALLERY.length).toBeGreaterThanOrEqual(9)
  })

  it('has unique ids', () => {
    const ids = SAMPLE_GALLERY.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every sample has a real description, source URL, and path', () => {
    for (const sample of SAMPLE_GALLERY) {
      expect(sample.title.length, `${sample.id} title`).toBeGreaterThan(0)
      expect(sample.description.length, `${sample.id} description`).toBeGreaterThan(20)
      expect(sample.sourceUrl, `${sample.id} sourceUrl`).toMatch(/^https?:\/\//)
      expect(sample.path, `${sample.id} path`).toMatch(/^data\/samples\/.+\.html$/)
    }
  })

  it('every sample path resolves to a non-empty static asset', async () => {
    for (const sample of SAMPLE_GALLERY) {
      const filePath = resolve('public', sample.path)
      const body = await readFile(filePath, 'utf8')
      expect(body.length, `${sample.id} body`).toBeGreaterThan(100)
      // Quick sanity check: the file should at least look like HTML.
      expect(body.toLowerCase()).toMatch(/<html|<!doctype|<table|<article|<div/)
    }
  })

  it('findSample returns the entry by id and undefined for unknown ids', () => {
    expect(findSample('quotes')?.shape).toBe('quote-listing')
    expect(findSample('does-not-exist')).toBeUndefined()
  })

  it('loadSampleHtml resolves the path against the supplied base URL', async () => {
    const calls: string[] = []
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls.push(typeof input === 'string' ? input : input.toString())
      return new Response('<html><body>ok</body></html>', { status: 200 })
    }) as typeof fetch
    try {
      await loadSampleHtml(SAMPLE_GALLERY[0]!, '/paste-scraper-builder/')
      expect(calls[0]).toBe(`/paste-scraper-builder/${SAMPLE_GALLERY[0]!.path}`)
      // Base without trailing slash should work too.
      await loadSampleHtml(SAMPLE_GALLERY[0]!, '/scraper')
      expect(calls[1]).toBe(`/scraper/${SAMPLE_GALLERY[0]!.path}`)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('loadSampleHtml surfaces non-2xx responses as errors', async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = (async () => new Response('nope', { status: 404, statusText: 'Not Found' })) as typeof fetch
    try {
      await expect(loadSampleHtml(SAMPLE_GALLERY[0]!, '/x/')).rejects.toThrow(/404/)
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})
