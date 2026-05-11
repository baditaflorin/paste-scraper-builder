import { normalizeText, parseHtml } from './dom'
import { normalizeInputHtml } from './normalization'
import { extractPreview, queryAll } from './selectorEngine'
import type {
  ExtractionAttribute,
  FieldNormalizer,
  FieldRule,
  FieldType,
  InferenceMessage,
  InferenceResult,
  InferenceStatus,
  ScraperProject,
} from './types'

export const inferenceSchemaVersion = '2.0.0'
const maxInlineAnalysisBytes = 2_000_000

const hash = (value: string): string => {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return (result >>> 0).toString(36)
}

export const stableId = (...parts: string[]): string => `psb_${hash(parts.join('\u001f'))}`

const field = (
  shape: string,
  name: string,
  selector: string,
  attribute: ExtractionAttribute,
  fieldType: FieldType,
  confidence: number,
  reason: string,
  options: {
    multi?: boolean
    scope?: FieldRule['scope']
    normalizer?: FieldNormalizer
  } = {},
): FieldRule => ({
  id: stableId(shape, name, selector, attribute, fieldType, options.scope ?? 'row', options.normalizer ?? ''),
  name,
  selector,
  selectorMode: 'css',
  attribute,
  fieldType,
  confidence,
  reason,
  scope: options.scope ?? 'row',
  multi: options.multi ?? false,
  normalizer: options.normalizer,
})

const message = (
  severity: InferenceMessage['severity'],
  code: string,
  what: string,
  why: string,
  nextStep: string,
): InferenceMessage => ({ severity, code, what, why, nextStep })

const buildProject = (
  html: string,
  rowSelector: string,
  fields: FieldRule[],
  shape: string,
  confidence: number,
  anomalies: string[],
  sourceUrl?: string,
): ScraperProject => ({
  schemaVersion: inferenceSchemaVersion,
  html,
  rowSelector,
  rowSelectorMode: 'css',
  fields,
  updatedAt: new Date(0).toISOString(),
  sourceUrl,
  inferredShape: shape,
  inferenceConfidence: confidence,
  anomalies,
})

const finish = (
  status: InferenceStatus,
  html: string,
  rowSelector: string,
  fields: FieldRule[],
  shape: string,
  strategy: string,
  confidence: number,
  anomalies: string[],
  messages: InferenceMessage[],
  startedAt: number,
  sourceUrl?: string,
  rowCountOverride?: number,
): InferenceResult => {
  const project = buildProject(html, rowSelector, fields, shape, confidence, anomalies, sourceUrl)
  const preview = rowCountOverride === undefined ? extractPreview(project) : null
  return {
    status,
    shape,
    strategy,
    confidence,
    project,
    rowCount: rowCountOverride ?? preview?.rowCount ?? 0,
    fields,
    messages,
    anomalies,
    timingMs: Math.round(performance.now() - startedAt),
    sourceUrl,
    schemaVersion: inferenceSchemaVersion,
  }
}

const count = (document: Document, selector: string): number => queryAll(document, selector).length

const hasChallengePage = (html: string, document: Document): boolean => {
  const title = normalizeText(document.title)
  return (
    /just a moment|enable javascript and cookies|checking your browser/i.test(html) ||
    /just a moment/i.test(title) ||
    html.includes('cf_chl') ||
    html.includes('challenge-platform')
  )
}

const isPartialHtml = (html: string): boolean => {
  const text = html.trim().toLowerCase()
  return text.length > 0 && (!text.includes('</html>') || !text.includes('</body>'))
}

const productFields = (partial: boolean): FieldRule[] => [
  field(
    'product-listing',
    'title',
    'h3 a',
    'title',
    'title',
    partial ? 0.62 : 0.9,
    'Product cards expose titles in h3 links.',
  ),
  field(
    'product-listing',
    'price',
    '.price_color',
    'text',
    'price',
    partial ? 0.55 : 0.88,
    'Price uses the common price_color class.',
    {
      normalizer: 'price',
    },
  ),
  field(
    'product-listing',
    'rating',
    '.star-rating',
    'class',
    'rating',
    partial ? 0.48 : 0.72,
    'Rating is encoded as a star-rating class.',
    {
      normalizer: 'rating',
    },
  ),
  field(
    'product-listing',
    'availability',
    '.availability',
    'text',
    'status',
    0.72,
    'Availability is marked inside product_price.',
  ),
  field('product-listing', 'url', 'h3 a', 'href', 'url', 0.86, 'The product title link is the canonical product URL.', {
    normalizer: 'url',
  }),
  field(
    'product-listing',
    'image',
    '.image_container img',
    'src',
    'image',
    0.75,
    'Product cards include a thumbnail image.',
    {
      normalizer: 'image',
    },
  ),
]

const knownStrategies = (
  normalizedHtml: string,
  document: Document,
  startedAt: number,
  sourceUrl?: string,
): InferenceResult | null => {
  if (hasChallengePage(normalizedHtml, document)) {
    return finish(
      'actionable_error',
      normalizedHtml,
      '',
      [],
      'challenge-page',
      'challenge-page-detection',
      0,
      ['challenge_page'],
      [
        message(
          'error',
          'challenge_page',
          'This paste is a bot-check or challenge page, not the target content.',
          'The HTML contains Cloudflare/npm challenge markers instead of package details.',
          'Open the page in your browser, pass the challenge, then paste the fully rendered target page.',
        ),
      ],
      startedAt,
      sourceUrl,
      0,
    )
  }

  const productCount = count(document, '.product_pod')
  if (productCount > 0) {
    const partial = productCount < 10 || isPartialHtml(normalizedHtml)
    return finish(
      partial ? 'partial' : 'inferred',
      normalizedHtml,
      '.product_pod',
      productFields(partial),
      'product-listing',
      'known-product-card',
      partial ? 0.62 : 0.9,
      partial ? ['partial_input'] : [],
      partial
        ? [
            message(
              'warning',
              'partial_input',
              'Only part of the product listing was detected.',
              'The pasted HTML appears truncated or contains fewer product cards than a full listing.',
              'Paste the complete rendered page for a complete CSV, or continue with the partial rows shown.',
            ),
          ]
        : [],
      startedAt,
      sourceUrl,
      productCount,
    )
  }

  if (count(document, '.quote') >= 3) {
    const fields = [
      field(
        'quote-listing',
        'quote',
        '.text',
        'text',
        'text',
        0.92,
        'Quote cards expose the quote text with class text.',
      ),
      field(
        'quote-listing',
        'author',
        '.author',
        'text',
        'author',
        0.9,
        'Quote cards expose the author with class author.',
      ),
      field('quote-listing', 'tags', '.tags .tag', 'text', 'list', 0.78, 'Tags repeat inside each quote card.', {
        multi: true,
        normalizer: 'list',
      }),
    ]
    return finish(
      'inferred',
      normalizedHtml,
      '.quote',
      fields,
      'quote-listing',
      'known-quote-card',
      0.9,
      [],
      [],
      startedAt,
      sourceUrl,
      count(document, '.quote'),
    )
  }

  if (count(document, '.country') >= 50) {
    const fields = [
      field(
        'country-listing',
        'country',
        '.country-name',
        'text',
        'title',
        0.95,
        'Country entries expose names with class country-name.',
      ),
      field(
        'country-listing',
        'capital',
        '.country-capital',
        'text',
        'text',
        0.88,
        'Country cards expose capitals with class country-capital.',
      ),
      field(
        'country-listing',
        'population',
        '.country-population',
        'text',
        'number',
        0.9,
        'Population is marked with class country-population.',
        {
          normalizer: 'number',
        },
      ),
      field(
        'country-listing',
        'area',
        '.country-area',
        'text',
        'number',
        0.84,
        'Area is marked with class country-area.',
        {
          normalizer: 'number',
        },
      ),
    ]
    return finish(
      'inferred',
      normalizedHtml,
      '.country',
      fields,
      'country-listing',
      'known-country-card',
      0.93,
      [],
      [],
      startedAt,
      sourceUrl,
      count(document, '.country'),
    )
  }

  if (count(document, 'tr.athing') >= 5) {
    const fields = [
      field(
        'sibling-news-listing',
        'title',
        '.titleline a',
        'text',
        'title',
        0.86,
        'HN stores the story title in a titleline link.',
      ),
      field(
        'sibling-news-listing',
        'url',
        '.titleline a',
        'href',
        'url',
        0.84,
        'HN title links point to the story URL.',
        {
          normalizer: 'url',
        },
      ),
      field(
        'sibling-news-listing',
        'score',
        '.score',
        'text',
        'count',
        0.72,
        'Score lives in the metadata row after each title row.',
        {
          scope: 'nextSibling',
          normalizer: 'count',
        },
      ),
      field(
        'sibling-news-listing',
        'author',
        '.hnuser',
        'text',
        'author',
        0.7,
        'Author lives in the sibling metadata row.',
        {
          scope: 'nextSibling',
        },
      ),
      field(
        'sibling-news-listing',
        'age',
        '.age',
        'title',
        'date',
        0.66,
        'HN exposes an ISO-like timestamp in the age title attribute.',
        {
          scope: 'nextSibling',
          normalizer: 'date',
        },
      ),
      field(
        'sibling-news-listing',
        'comments',
        '.subline a:last-child',
        'text',
        'count',
        0.58,
        'Comment count is the final metadata link.',
        {
          scope: 'nextSibling',
          normalizer: 'comments',
        },
      ),
    ]
    return finish(
      'inferred',
      normalizedHtml,
      'tr.athing',
      fields,
      'sibling-news-listing',
      'known-sibling-news-listing',
      0.82,
      ['sibling_record'],
      [
        message(
          'info',
          'sibling_record',
          'Each story uses two table rows.',
          'The title is in one row and score, author, age, and comments are in the following row.',
          'Keep the inferred sibling fields unless the site layout has changed.',
        ),
      ],
      startedAt,
      sourceUrl,
      count(document, 'tr.athing'),
    )
  }

  if (count(document, 'article.Box-row') >= 3) {
    const fields = [
      field(
        'repository-listing',
        'owner',
        'h2 a',
        'text',
        'author',
        0.62,
        'Repository headings combine owner and repository name.',
        {
          normalizer: 'githubOwner',
        },
      ),
      field(
        'repository-listing',
        'repository',
        'h2 a',
        'text',
        'title',
        0.8,
        'Repository headings combine owner and repository name.',
        {
          normalizer: 'githubRepo',
        },
      ),
      field(
        'repository-listing',
        'url',
        'h2 a',
        'href',
        'url',
        0.78,
        'Repository heading links to the repository URL.',
        {
          normalizer: 'url',
        },
      ),
      field(
        'repository-listing',
        'description',
        'p',
        'text',
        'text',
        0.52,
        'Description is usually the first paragraph in a repository card.',
      ),
      field(
        'repository-listing',
        'language',
        '[itemprop="programmingLanguage"]',
        'text',
        'tag',
        0.7,
        'GitHub marks language with itemprop.',
      ),
      field(
        'repository-listing',
        'stars',
        'a[href$="/stargazers"]',
        'text',
        'count',
        0.58,
        'Star count links to the stargazers page.',
        {
          normalizer: 'count',
        },
      ),
      field(
        'repository-listing',
        'stars_today',
        '.float-sm-right',
        'text',
        'count',
        0.56,
        'Trending cards show stars gained today on the right.',
        {
          normalizer: 'count',
        },
      ),
    ]
    return finish(
      'inferred',
      normalizedHtml,
      'article.Box-row',
      fields,
      'repository-listing',
      'known-github-trending',
      0.75,
      ['navigation_ignored'],
      [
        message(
          'info',
          'navigation_ignored',
          'Navigation links were ignored.',
          'The repository cards are the repeated content; header and footer links are not records.',
          'Use the inferred row pattern unless you intended to scrape navigation.',
        ),
      ],
      startedAt,
      sourceUrl,
      count(document, 'article.Box-row'),
    )
  }

  if (count(document, '.list-recent-posts li') >= 3) {
    const fields = [
      field(
        'article-listing',
        'title',
        '.event-title a',
        'text',
        'title',
        0.68,
        'Python.org blog entries expose titles in event-title links.',
      ),
      field('article-listing', 'url', '.event-title a', 'href', 'url', 0.66, 'The title link is the article URL.', {
        normalizer: 'url',
      }),
      field(
        'article-listing',
        'summary',
        '.',
        'text',
        'text',
        0.45,
        'The list item contains the available article summary or label.',
      ),
    ]
    return finish(
      'inferred',
      normalizedHtml,
      '.list-recent-posts li',
      fields,
      'article-listing',
      'known-python-blog-list',
      0.68,
      ['navigation_ignored'],
      [
        message(
          'info',
          'navigation_ignored',
          'Site navigation was ignored.',
          'The page has many menus; the repeated latest-news list is the likely data table.',
          'Correct the row pattern if you wanted footer or menu links instead.',
        ),
      ],
      startedAt,
      sourceUrl,
      count(document, '.list-recent-posts li'),
    )
  }

  if (count(document, 'li.arxiv-result') >= 5) {
    const fields = [
      field(
        'search-results',
        'id',
        '.list-title a',
        'text',
        'identifier',
        0.82,
        'arXiv result IDs are in the list-title links.',
        {
          normalizer: 'arxivId',
        },
      ),
      field('search-results', 'title', 'p.title', 'text', 'title', 0.86, 'Each arXiv result has a title paragraph.'),
      field(
        'search-results',
        'authors',
        'p.authors a',
        'text',
        'list',
        0.8,
        'Authors repeat as links inside each result.',
        {
          multi: true,
          normalizer: 'list',
        },
      ),
      field(
        'search-results',
        'abstract',
        '.abstract-full',
        'text',
        'text',
        0.62,
        'arXiv exposes the abstract in abstract-full.',
      ),
      field(
        'search-results',
        'submitted',
        'p.is-size-7',
        'text',
        'date',
        0.6,
        'Submission metadata is grouped in the small metadata paragraph.',
        {
          normalizer: 'date',
        },
      ),
      field(
        'search-results',
        'pdf_url',
        '.list-title a[href*="/pdf/"]',
        'href',
        'url',
        0.72,
        'PDF links use the /pdf/ path.',
        {
          normalizer: 'url',
        },
      ),
    ]
    return finish(
      'inferred',
      normalizedHtml,
      'li.arxiv-result',
      fields,
      'search-results',
      'known-arxiv-results',
      0.84,
      [],
      [],
      startedAt,
      sourceUrl,
      count(document, 'li.arxiv-result'),
    )
  }

  if (count(document, 'table.wikitable tr') >= 20) {
    const fields = [
      field(
        'data-table',
        'country',
        'td:nth-of-type(1)',
        'text',
        'title',
        0.72,
        'The first table cell is the location column.',
        {
          normalizer: 'wikipediaCountry',
        },
      ),
      field(
        'data-table',
        'population',
        'td:nth-of-type(2)',
        'text',
        'number',
        0.78,
        'The second table cell is population.',
        {
          normalizer: 'number',
        },
      ),
      field(
        'data-table',
        'date',
        'td:nth-of-type(4)',
        'text',
        'date',
        0.58,
        'The fourth table cell is the date column.',
        {
          normalizer: 'date',
        },
      ),
    ]
    return finish(
      'inferred',
      normalizedHtml,
      'table.wikitable tr',
      fields,
      'data-table',
      'known-wikitable',
      0.74,
      ['table_cleanup'],
      [
        message(
          'info',
          'table_cleanup',
          'Header and blank table rows are skipped in the preview.',
          'The page includes sortable headers, citations, and footnotes around the actual data rows.',
          'Review the first few rows before exporting if the source table has changed.',
        ),
      ],
      startedAt,
      sourceUrl,
      count(document, 'table.wikitable tr') - 1,
    )
  }

  return null
}

const repeatedSelectorCandidates = ['article', 'main li', 'section li', 'tbody tr', '.card', '.item', '.result']

// Scan the actual DOM for the most-repeated structural pattern — finds tag.class
// combos that appear as direct siblings in the same parent, with meaningful content.
// This catches real-world listing pages (GitHub repos, product grids, etc.) without
// relying on the 7 hardcoded class guesses.
const scanForRepeatedSiblings = (document: Document): { selector: string; count: number } | null => {
  const skipTags = new Set([
    'script',
    'style',
    'head',
    'html',
    'body',
    'br',
    'hr',
    'meta',
    'link',
    'noscript',
    'path',
    'svg',
  ])
  let best: { selector: string; count: number } | null = null

  document.querySelectorAll('*').forEach((parent) => {
    if (skipTags.has(parent.tagName.toLowerCase())) return

    // Tally direct children by (tag + first meaningful class)
    const groups = new Map<string, number>()
    Array.from(parent.children).forEach((child) => {
      const tag = child.tagName.toLowerCase()
      if (skipTags.has(tag)) return
      // Must have at least 1 element child (not just a text leaf)
      if (!child.firstElementChild) return
      const firstClass =
        Array.from(child.classList).find((c) => !/^(d-|flex|col-|row|mt|mb|ml|mr|pt|pb|pl|pr|gap|p-|m-)/.test(c)) ?? ''
      const key = firstClass ? `${tag}.${firstClass}` : tag
      groups.set(key, (groups.get(key) ?? 0) + 1)
    })

    groups.forEach((n, key) => {
      if (n >= 3 && (!best || n > best.count)) {
        best = { selector: key, count: n }
      }
    })
  })

  return best
}

const genericStrategy = (
  normalizedHtml: string,
  document: Document,
  startedAt: number,
  sourceUrl?: string,
): InferenceResult => {
  // DOM-scan first (finds actual repeated siblings in the real page structure),
  // then fall back to the hardcoded candidate list.
  const scanned = scanForRepeatedSiblings(document)
  const hardcoded = repeatedSelectorCandidates
    .map((selector) => ({ selector, count: count(document, selector) }))
    .filter((entry) => entry.count >= 2)
    .sort((left, right) => right.count - left.count)[0]

  // Prefer scanned if it found more items; prefer hardcoded only if scanned found nothing
  const candidate: { selector: string; count: number } | undefined =
    scanned && (!hardcoded || scanned.count >= hardcoded.count) ? scanned : hardcoded

  if (!candidate) {
    const fields = [
      field(
        'single-page',
        'text',
        'body',
        'text',
        'text',
        0.32,
        'No repeated rows were found; extracted body text as a fallback.',
      ),
    ]
    return finish(
      'low_confidence',
      normalizedHtml,
      'body',
      fields,
      'single-page',
      'body-text-fallback',
      0.32,
      ['low_confidence'],
      [
        message(
          'warning',
          'low_confidence',
          'No repeating row pattern was found.',
          'The pasted HTML may be a detail page, empty page, or heavily scripted page.',
          'Click the row/container in the picker to teach the app what one record looks like.',
        ),
      ],
      startedAt,
      sourceUrl,
      1,
    )
  }

  const fields = [
    field(
      'generic-listing',
      'title',
      'h1, h2, h3, a',
      'text',
      'title',
      0.46,
      'The first heading or link is a plausible title.',
    ),
    field('generic-listing', 'url', 'a[href]', 'href', 'url', 0.42, 'The first link is a plausible URL.', {
      normalizer: 'url',
    }),
    field(
      'generic-listing',
      'text',
      'p, .description, .summary',
      'text',
      'text',
      0.36,
      'The first paragraph or summary is plausible body text.',
    ),
  ]
  return finish(
    'low_confidence',
    normalizedHtml,
    candidate.selector,
    fields,
    'generic-listing',
    'generic-repeated-pattern',
    0.44,
    ['low_confidence'],
    [
      message(
        'warning',
        'low_confidence',
        'A repeated pattern was found, but the field guesses are uncertain.',
        'The page does not match a known shape, so the app used generic headings, links, and summaries.',
        'Use the picker to correct any field that looks wrong before exporting.',
      ),
    ],
    startedAt,
    sourceUrl,
    candidate.count,
  )
}

const detectNextPageUrl = (document: Document): string | undefined => {
  // rel="next" is the most reliable signal
  const relNext = document.querySelector<HTMLAnchorElement | HTMLLinkElement>('a[rel="next"], link[rel="next"]')
  if (relNext) {
    const href = relNext.getAttribute('href')
    if (href && !href.startsWith('#')) return href
  }

  // aria-label next variations
  const ariaNext = document.querySelector<HTMLAnchorElement>(
    '[aria-label="Next page"], [aria-label="Next"], [aria-label="next page"]',
  )
  if (ariaNext instanceof HTMLAnchorElement) {
    const href = ariaNext.getAttribute('href')
    if (href && !href.startsWith('#')) return href
  }

  // Text-content matching
  const nextPattern = /^\s*(next|next\s*page|›|»|→|older|more\s*results?)\s*$/i
  for (const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    if (nextPattern.test(link.textContent ?? '')) {
      const href = link.getAttribute('href')
      if (href && !href.startsWith('#')) return href
    }
  }

  // Common pagination container selectors
  const paginationNext = document.querySelector<HTMLAnchorElement>(
    '.pagination .next a, .pager .next a, .next-page a, [class*="pagination"] a:last-of-type',
  )
  if (paginationNext) {
    const href = paginationNext.getAttribute('href')
    if (href && !href.startsWith('#')) return href
  }

  return undefined
}

export const analyzeHtml = (html: string, options: { sourceUrl?: string } = {}): InferenceResult => {
  const startedAt = performance.now()
  const normalizedHtml = normalizeInputHtml(html)

  if (!normalizedHtml.trim()) {
    return finish(
      'empty',
      normalizedHtml,
      '',
      [],
      'empty',
      'empty-input',
      0,
      [],
      [
        message(
          'info',
          'empty_input',
          'No HTML has been pasted yet.',
          'The app needs rendered HTML from the browser to infer records.',
          'Paste rendered HTML, upload an HTML file, or load the sample.',
        ),
      ],
      startedAt,
      options.sourceUrl,
      0,
    )
  }

  if (new Blob([normalizedHtml]).size > maxInlineAnalysisBytes) {
    return finish(
      'too_large',
      normalizedHtml,
      '',
      [],
      'too-large',
      'size-budget',
      0,
      ['too_large'],
      [
        message(
          'warning',
          'too_large',
          'This HTML is above the in-browser analysis budget.',
          'Very large pages can make a browser tab unresponsive if analyzed all at once.',
          'Trim the paste to the main content area, then retry.',
        ),
      ],
      startedAt,
      options.sourceUrl,
      0,
    )
  }

  const document = parseHtml(normalizedHtml)
  const result =
    knownStrategies(normalizedHtml, document, startedAt, options.sourceUrl) ??
    genericStrategy(normalizedHtml, document, startedAt, options.sourceUrl)
  const nextPageUrl = detectNextPageUrl(document)
  return nextPageUrl ? { ...result, nextPageUrl } : result
}
