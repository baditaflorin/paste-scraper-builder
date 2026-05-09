import type { FieldNormalizer, FieldType } from './types'

const currencySymbols: Record<string, string> = {
  $: 'USD',
  '£': 'GBP',
  '€': 'EUR',
  '¥': 'JPY',
}

const starWords: Record<string, string> = {
  One: '1',
  Two: '2',
  Three: '3',
  Four: '4',
  Five: '5',
}

export const normalizeInputHtml = (html: string): string =>
  html
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')

export const normalizeExtractedText = (value: string | null | undefined): string =>
  (value ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\[[a-z]?\d+\]\s*/gi, ' ')
    .replace(/\s*\^+\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const stripNumber = (value: string): string => {
  const match = normalizeExtractedText(value).match(/-?\d[\d,.]*/)
  return match ? match[0].replace(/,/g, '') : ''
}

const normalizePrice = (value: string): string => {
  const text = normalizeExtractedText(value)
  const amount = stripNumber(text)
  if (!amount) {
    return text
  }
  const symbol = Object.keys(currencySymbols).find((candidate) => text.includes(candidate))
  return symbol ? `${currencySymbols[symbol]} ${amount}` : amount
}

const normalizeRating = (value: string): string => {
  const text = normalizeExtractedText(value)
  const word = Object.keys(starWords).find((candidate) => new RegExp(`\\b${candidate}\\b`).test(text))
  return word ? starWords[word] : stripNumber(text) || text
}

const normalizeDate = (value: string): string => {
  const text = normalizeExtractedText(value)
  const iso = text.match(/\d{4}-\d{2}-\d{2}/)
  if (iso) {
    return iso[0]
  }
  const monthDate = text.match(/\b\d{1,2}\s+[A-Z][a-z]+\s+\d{4}\b/)
  return monthDate ? monthDate[0] : text
}

const normalizeList = (value: string): string =>
  normalizeExtractedText(value)
    .split(/\s*;\s*|\s*,\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
    .join('; ')

const normalizeGithubName = (value: string, side: 'owner' | 'repo'): string => {
  const text = normalizeExtractedText(value).replace(/\s+/g, '')
  const [owner, repo] = text.split('/').filter(Boolean)
  return side === 'owner' ? (owner ?? text) : (repo ?? text)
}

const normalizeWikipediaCountry = (value: string): string => {
  const text = normalizeExtractedText(value)
  const words = text
    .replace(/^\d+\s*/, '')
    .split(/\s+/)
    .filter((word) => !/^\d/.test(word) && !/^\[[^\]]+\]$/.test(word))
  return words.slice(0, Math.min(words.length, 5)).join(' ') || text
}

const normalizeArxivId = (value: string): string => {
  const text = normalizeExtractedText(value)
  const match = text.match(/arXiv:\s*([^\s]+)/i)
  return match?.[1] ?? text
}

export const resolveUrl = (value: string, sourceUrl?: string): string => {
  const text = normalizeExtractedText(value)
  if (!text) {
    return ''
  }
  try {
    return new URL(text, sourceUrl || globalThis.location?.href || 'https://example.invalid/').href
  } catch {
    return text
  }
}

export const normalizeValue = (
  value: string,
  fieldType?: FieldType,
  normalizer?: FieldNormalizer,
  sourceUrl?: string,
): string => {
  if (normalizer === 'githubOwner') {
    return normalizeGithubName(value, 'owner')
  }
  if (normalizer === 'githubRepo') {
    return normalizeGithubName(value, 'repo')
  }
  if (normalizer === 'wikipediaCountry') {
    return normalizeWikipediaCountry(value)
  }
  if (normalizer === 'arxivId') {
    return normalizeArxivId(value)
  }
  if (normalizer === 'comments') {
    const text = normalizeExtractedText(value)
    return /comment/i.test(text) ? stripNumber(text) : ''
  }
  if (normalizer === 'price' || fieldType === 'price') {
    return normalizePrice(value)
  }
  if (normalizer === 'rating' || fieldType === 'rating') {
    return normalizeRating(value)
  }
  if (normalizer === 'count' || normalizer === 'number' || fieldType === 'count' || fieldType === 'number') {
    return stripNumber(value)
  }
  if (normalizer === 'date' || fieldType === 'date') {
    return normalizeDate(value)
  }
  if (normalizer === 'url' || normalizer === 'image' || fieldType === 'url' || fieldType === 'image') {
    return resolveUrl(value, sourceUrl)
  }
  if (normalizer === 'list' || fieldType === 'list') {
    return normalizeList(value)
  }
  return normalizeExtractedText(value)
}
