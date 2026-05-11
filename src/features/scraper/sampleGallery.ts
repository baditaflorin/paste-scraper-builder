// A curated gallery of real-page samples that exercise the inference engine
// across the 10 page shapes the README claims to handle. Each entry is shipped
// as a static asset under public/data/samples/ (so it isn't pulled into the
// initial JS bundle) and described here with the row selector the picker
// should pre-populate so the user doesn't start from a blank canvas.
//
// The .html files in public/data/samples/ are byte-for-byte the same as the
// fixtures in test/fixtures/realdata/ — keeping them in lockstep means a
// regression in the engine that fails a fixture also breaks the matching
// gallery sample, and vice versa.

export interface SampleEntry {
  id: string
  title: string
  shape: string
  rowsApprox: number
  sourceUrl: string
  description: string
  /** Path relative to the Vite base URL (assigned at fetch time). */
  path: string
}

export const SAMPLE_GALLERY: readonly SampleEntry[] = [
  {
    id: 'books-products',
    title: 'Books to Scrape — product cards',
    shape: 'product-listing',
    rowsApprox: 20,
    sourceUrl: 'https://books.toscrape.com/catalogue/page-1.html',
    description:
      'Classic e-commerce grid: cover image, title link, price, rating, in-stock badge. Good first sample to see field auto-detection on prices and ratings.',
    path: 'data/samples/books-products.html',
  },
  {
    id: 'quotes',
    title: 'Quotes to Scrape — quote blocks with tags',
    shape: 'quote-listing',
    rowsApprox: 10,
    sourceUrl: 'https://quotes.toscrape.com/',
    description:
      'Repeating <div class="quote"> with text, author, and a tag list. Demonstrates list-typed fields and per-row author attribution.',
    path: 'data/samples/quotes.html',
  },
  {
    id: 'countries',
    title: 'Scrape This Site — country listing',
    shape: 'country-listing',
    rowsApprox: 250,
    sourceUrl: 'https://www.scrapethissite.com/pages/simple/',
    description:
      'A long flat list of country cards with capital, population, and area. Good stress test for the row-detector at higher cardinalities.',
    path: 'data/samples/countries.html',
  },
  {
    id: 'hacker-news',
    title: 'Hacker News — sibling-row front page',
    shape: 'sibling-news-listing',
    rowsApprox: 30,
    sourceUrl: 'https://news.ycombinator.com/',
    description:
      'Each story is split across two adjacent <tr> elements. Exercises the sibling-row strategy that pairs title rows with their score/age rows.',
    path: 'data/samples/hacker-news.html',
  },
  {
    id: 'github-trending-js',
    title: 'GitHub Trending — repository cards',
    shape: 'repository-listing',
    rowsApprox: 25,
    sourceUrl: 'https://github.com/trending/javascript',
    description:
      'Trending JS repos: owner / name, language, total stars, stars today. Real GitHub markup with dense nested DOM and many distractor links.',
    path: 'data/samples/github-trending-js.html',
  },
  {
    id: 'python-blogs',
    title: 'Python.org — community blog list',
    shape: 'article-listing',
    rowsApprox: 15,
    sourceUrl: 'https://www.python.org/blogs/',
    description:
      'Article cards with title, dateline, and short excerpt — the standard "blog index" shape that powers most newsroom and PR pages.',
    path: 'data/samples/python-blogs.html',
  },
  {
    id: 'arxiv-web-scraping',
    title: 'arXiv search — academic search results',
    shape: 'search-results',
    rowsApprox: 25,
    sourceUrl: 'https://arxiv.org/search/?query=web+scraping&searchtype=all',
    description:
      'Search-engine results page with id, title, authors, abstract, submission date, and PDF link. Good for multi-line text fields and ID extraction.',
    path: 'data/samples/arxiv-web-scraping.html',
  },
  {
    id: 'wikipedia-population',
    title: 'Wikipedia — population data table',
    shape: 'data-table',
    rowsApprox: 240,
    sourceUrl: 'https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_population',
    description:
      'A wikitable with header rows, footnote-laden cells, and numeric formatting. Demonstrates the table strategy and number-cleaning heuristics.',
    path: 'data/samples/wikipedia-population.html',
  },
  {
    id: 'books-truncated',
    title: 'Truncated books HTML — partial input',
    shape: 'product-listing',
    rowsApprox: 1,
    sourceUrl: 'https://books.toscrape.com/catalogue/page-1.html',
    description:
      'Same shape as Books to Scrape but cut off mid-page. Shows how the inferencer flags partial input rather than silently dropping rows.',
    path: 'data/samples/books-truncated.html',
  },
  {
    id: 'npm-react-challenge',
    title: 'npm interstitial — challenge page',
    shape: 'challenge-page',
    rowsApprox: 0,
    sourceUrl: 'https://www.npmjs.com/package/react',
    description:
      'A bot-check / interstitial page with no real content. Exercises the "nothing to scrape here" detection so the UI does not invent fields.',
    path: 'data/samples/npm-react-challenge.html',
  },
] as const

export type SampleId = (typeof SAMPLE_GALLERY)[number]['id']

export function findSample(id: string): SampleEntry | undefined {
  return SAMPLE_GALLERY.find((sample) => sample.id === id)
}

/**
 * Fetch a sample's HTML body. Resolves the relative path against the Vite
 * base URL so the same call works under `vite serve` (base `/`) and under the
 * built Pages site (base `/paste-scraper-builder/`).
 */
export async function loadSampleHtml(sample: SampleEntry, baseUrl = import.meta.env.BASE_URL): Promise<string> {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const url = `${base}${sample.path}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Could not load sample ${sample.id} (${response.status} ${response.statusText})`)
  }
  return response.text()
}
