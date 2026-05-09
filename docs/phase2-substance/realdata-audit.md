# Phase 2 Substance Real-Data Audit

Audit date: 2026-05-08

App audited: Paste Scraper Builder v0.1.0, commit `b259b5025f18`

Mode remains Mode A: Pure GitHub Pages.

## Inputs

The audit uses 10 real-world pasted/rendered HTML inputs. The set spans clean, mildly messy, genuinely messy, broken, adversarial, and edge-case inputs.

| #   | Input                                                                          | Class                                                 |
| --- | ------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 1   | https://books.toscrape.com/catalogue/page-1.html                               | Clean product listing                                 |
| 2   | https://quotes.toscrape.com/                                                   | Clean quote cards                                     |
| 3   | https://www.scrapethissite.com/pages/simple/                                   | Mildly messy country cards                            |
| 4   | https://news.ycombinator.com/                                                  | Adversarial multi-row records                         |
| 5   | https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_population | Large messy table                                     |
| 6   | https://github.com/trending/javascript                                         | Messy repo listing with large navigation DOM          |
| 7   | https://www.npmjs.com/package/react                                            | Adversarial blocked/challenge page                    |
| 8   | https://www.python.org/blogs/                                                  | Mixed article list plus heavy navigation/footer lists |
| 9   | https://arxiv.org/search/?query=web+scraping&searchtype=all                    | Large academic search results                         |
| 10  | Truncated paste from https://books.toscrape.com/catalogue/page-1.html          | Broken/partial real page                              |

## Per-Input Walkthrough

### 1. Books to Scrape product listing

What v1 did: After the user manually clicked a product card, then manually clicked title and price fields, v1 produced a reasonable table. It did not infer anything on paste.

What it should have done: Detect product cards immediately, suggest title, price, availability, rating, image, and product URL, then show a preview without requiring clicks.

Why it failed: The engine only reacts to point-and-click picks. It has no repeated-record discovery or product-field classifier.

Failure visibility: Obvious manual-work failure, not data corruption.

Manual work the app should have done: Pick row pattern, name fields, classify price/rating/URL, normalize relative links.

### 2. Quotes to Scrape quote cards

What v1 did: Manual selection worked for quote text and author. Tags were awkward: a field selector matching tag links only returned the first matched tag per row.

What it should have done: Detect quote records and infer quote, author, author URL, and tags as a list.

Why it failed: Field extraction is single-value only and does not understand repeated child values inside one record.

Failure visibility: Wrong-but-confident for tags because the preview can look plausible while silently dropping values.

Manual work the app should have done: Infer quote-card structure, classify author and tags, preserve multi-value fields.

### 3. Scrape This Site country cards

What v1 did: Manual row and field selection worked for country, capital, population, and area if the user picked carefully.

What it should have done: Infer country records and identify country name, capital, population, and area automatically. Population and area should be numbers.

Why it failed: No domain-aware type inference or numeric normalization exists.

Failure visibility: Mostly obvious manual-work failure; raw string values are silently less useful downstream.

Manual work the app should have done: Detect repeated country records, assign field names, and normalize numeric fields.

### 4. Hacker News front page

What v1 did: Selecting the story row produced title and URL, but points, author, age, and comments live in a sibling metadata row. Field selectors inside the selected row returned blanks for those values.

What it should have done: Treat each story row plus its following metadata row as one logical record.

Why it failed: The row model assumes one DOM element contains the whole record. It cannot compose adjacent sibling nodes into a record.

Failure visibility: Visible blanks, but the export still looks authoritative unless the user catches them.

Manual work the app should have done: Detect sibling-row record shape and map title, domain, score, author, age, and comments together.

### 5. Wikipedia population table

What v1 did: Manual table-row selection worked, but extracted cells carried footnote/citation noise and population values remained formatted text. Header rows and non-data rows were easy to include accidentally.

What it should have done: Detect the main data table, use headers as field names, skip non-data rows, strip citation markers, and normalize population counts.

Why it failed: The engine treats all DOM text equally. It has no table strategy, header inference, footnote cleanup, or anomaly detection.

Failure visibility: Wrong-but-confident because dirty table text appears as legitimate extracted data.

Manual work the app should have done: Pick the correct table body, infer headers, clean citation noise, and validate numeric columns.

### 6. GitHub Trending JavaScript

What v1 did: Manual row picking can target repository articles, but large navigation and menu structures create many repeated candidates. Owner/name, language, total stars, forks, and stars-today need careful manual field picking and cleanup.

What it should have done: Recognize a repository-list shape, prefer main content over navigation, and infer owner, repository, description, language, stars, forks, and stars-today.

Why it failed: No page-region ranking, no repo-list classifier, no number/count normalization, and no owner/name splitting.

Failure visibility: Mixed. Missing fields are visible, but choosing a repeated nav/menu structure would be wrong-but-confident.

Manual work the app should have done: Ignore navigation clutter, choose repository cards, split and name fields.

### 7. npm React package page blocked/challenge HTML

What v1 did: When the pasted HTML is a Cloudflare challenge page, v1 treats it as normal HTML. A user can extract "Just a moment..." or challenge markup as if it were package data.

What it should have done: Detect that the pasted page is a bot/challenge/interstitial page and stop with a domain message explaining that the visible page is not the target content.

Why it failed: No challenge/interstitial detection and no source-shape validation.

Failure visibility: Wrong-but-confident if the user does not recognize the challenge markup.

Manual work the app should have done: Warn that the input is not the intended package page and suggest pasting the fully rendered target content.

### 8. Python.org blogs page

What v1 did: Manual selection can extract latest-news list items. The hero/latest article is structurally separate from the list, and the page contains many navigation/footer links that can be mistaken for repeated records.

What it should have done: Prefer the main content region, infer blog/news items, include the lead item and list items coherently, and normalize dates.

Why it failed: No main-content scoring, no article/list shape recognition, and no date normalization.

Failure visibility: Silent omission when the lead item is not part of the selected row pattern.

Manual work the app should have done: Identify content records, ignore nav/footer records, and classify title/date/link.

### 9. arXiv search results

What v1 did: Manual selection can find result rows, but titles, authors, abstracts, PDF/abstract links, submission dates, and comments are nested and noisy. The page is large enough that re-parsing on every edit is noticeable.

What it should have done: Detect search-result records, classify title/authors/abstract/date/links, normalize authors as a list, and keep the UI responsive while parsing.

Why it failed: No search-result strategy, no multi-value author handling, no date normalization, and no performance budget/progress model.

Failure visibility: Mixed. Missing/noisy fields are visible; slow operations give no progress or cancellation.

Manual work the app should have done: Infer result schema, clean text, classify links, and expose confidence.

### 10. Truncated Books to Scrape paste

What v1 did: The browser parser repaired the partial HTML. Depending on where the paste was cut, preview rows were incomplete or fields became blank. v1 did not warn that the source looked truncated.

What it should have done: Detect likely truncation, still extract complete records where possible, mark incomplete rows, and warn before export.

Why it failed: No input integrity checks and no per-row completeness/anomaly scoring.

Failure visibility: Silent or wrong-but-confident because repaired DOM output looks clean enough.

Manual work the app should have done: Identify partial input, separate complete from incomplete records, and explain the risk.

## Top 5 Logic Gaps

1. V1 does not auto-detect repeated records after paste, even when product cards, quote cards, country cards, search results, or table rows are obvious.
2. The row model assumes a record is one DOM element; it fails on multi-node records such as Hacker News story rows plus sibling metadata rows.
3. Field extraction is scalar-only and raw-text-only, so tags/authors are dropped, dates/numbers/prices stay unnormalized, and relative URLs remain unresolved.
4. There is no confidence model, so low-quality guesses, empty fields, challenge pages, and partial inputs can look just as valid as good extractions.
5. The engine does not rank page regions or understand common shapes, so navigation/footer/menu repetitions compete with actual content.

## Top 3 Intuition Failures

1. Pasting real HTML does not immediately produce a useful preview; the user must configure row and field selectors from scratch.
2. Export can contain blanks, partial data, or dirty citation/navigation text without explaining what went wrong.
3. The preview suggests DOM-level thinking ("row selector", one selected element) when real pages often have logical records spread across siblings or tables.

## Top 3 "Feels Stupid" Moments

1. The user has to click obvious product cards, quote cards, country rows, repository cards, or search results before seeing any extraction.
2. The user has to name fields like title, price, date, URL, author, stars, or population even when labels and value patterns make them obvious.
3. The user has to diagnose empty fields by understanding DOM containment and selector scope instead of the app explaining that data lives outside the selected record.

## What "Smart" Means For Paste Scraper Builder

1. On paste, the app proposes a row pattern, field schema, and preview without requiring clicks.
2. It recognizes common HTML scraping shapes: product/listing cards, quote/article cards, tables, search results, repository listings, and single/interstitial pages.
3. It classifies fields with confidence: title, price, currency, URL, image, author, date, rating, count, tag/list, identifier, and free text.
4. It normalizes obvious values by default: whitespace, citation markers, relative URLs, prices, numbers, counts, dates, and multi-value lists.
5. When it is unsure, it says why in user language and carries confidence/provenance into preview and export.

## Phase 2 Substance Success Metrics

1. Auto-detection produces a useful first preview on at least 7 of the 10 real-data inputs with no manual selector picking.
2. Same input produces byte-identical preview data and exported CSV/code metadata on 10 of 10 fixtures.
3. Every low-confidence or failed fixture shows a what/why/next-step message; zero silent failures are allowed.
4. Median paste-to-preview time is under 1 second across the fixture set; p95 is under 3 seconds; worst case stays under 5 seconds or becomes cancellable.
5. Every inferred row pattern and field has a visible confidence level and an explanation.
6. Every export includes app version, schema version, source identifier, generation timestamp policy, selected row pattern, field rules, and per-field confidence.
7. No real-data fixture regresses once it is added to the substance suite.

## Explicit Out Of Scope

1. No backend, crawler, proxy, hosted scraping service, login automation, CAPTCHA bypass, or browser extension.
2. No new major user-facing surface beyond paste, picker, preview, CSV export, Python export, and Go export.
3. No polish work: themes, command palette, skeleton loaders, marketing visuals, OG images, or layout redesign.
4. No cloud sync, accounts, shared projects, or multi-project library.
5. No architecture escalation beyond Mode A.
6. No fixture-free "smart" claims; substance work must be tied to the 10 real-data inputs.
