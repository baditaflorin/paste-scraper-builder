import type {
  ExtractionAttribute,
  FieldRule,
  FieldType,
  FieldNormalizer,
  PickedFieldSelector,
  PickedSelector,
  PreviewResult,
  ScraperProject,
  SelectorMode,
} from './types'
import { normalizeText, parseHtml, sanitizeHtml } from './dom'
import { normalizeValue } from './normalization'

const psbHash = (value: string): string => {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return (result >>> 0).toString(36)
}
const psbStableId = (...parts: string[]): string => `psb_${psbHash(parts.join(''))}`

const ignoredClasses = new Set(['psb-hover', 'psb-row', 'psb-field'])
const preferredAttributes = ['data-testid', 'data-test', 'data-qa', 'data-sku', 'itemprop', 'name', 'aria-label']

const quoteCss = (value: string): string => value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')

const cssEscape = (value: string): string => {
  if (globalThis.CSS?.escape) {
    return globalThis.CSS.escape(value)
  }

  return value.replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`)
}

const elementTag = (element: Element): string => element.tagName.toLowerCase()

const isElement = (node: Node | null): node is Element => node?.nodeType === Node.ELEMENT_NODE

const hasElement = (elements: Element[], target: Element): boolean => elements.some((element) => element === target)

export const queryAll = (root: ParentNode, selector: string): Element[] => {
  try {
    return Array.from(root.querySelectorAll(selector))
  } catch {
    return []
  }
}

const directElementChildren = (element: Element): Element[] =>
  Array.from(element.children).filter((child): child is Element => isElement(child))

const nthOfType = (element: Element): number => {
  const tag = elementTag(element)
  let index = 1
  let sibling = element.previousElementSibling
  while (sibling) {
    if (elementTag(sibling) === tag) {
      index += 1
    }
    sibling = sibling.previousElementSibling
  }
  return index
}

const attributeCandidates = (element: Element): string[] =>
  preferredAttributes
    .filter((attribute) => element.hasAttribute(attribute))
    .map((attribute) => `${elementTag(element)}[${attribute}="${quoteCss(element.getAttribute(attribute) ?? '')}"]`)

const classCandidates = (element: Element): string[] => {
  const classes = Array.from(element.classList).filter((className) => !ignoredClasses.has(className))
  const tag = elementTag(element)
  const candidates: string[] = []

  classes.slice(0, 4).forEach((className) => {
    candidates.push(`${tag}.${cssEscape(className)}`)
    candidates.push(`.${cssEscape(className)}`)
  })

  if (classes.length > 1) {
    const combined = classes
      .slice(0, 3)
      .map((className) => `.${cssEscape(className)}`)
      .join('')
    candidates.push(`${tag}${combined}`)
    candidates.push(combined)
  }

  return candidates
}

const basicCandidates = (element: Element): string[] => {
  const tag = elementTag(element)
  const candidates = [
    ...attributeCandidates(element),
    ...classCandidates(element),
    element.id ? `${tag}#${cssEscape(element.id)}` : '',
    element.id ? `#${cssEscape(element.id)}` : '',
    tag,
  ].filter(Boolean)

  return Array.from(new Set(candidates))
}

const uniqueSelectorWithin = (root: ParentNode, element: Element): string | null => {
  for (const candidate of basicCandidates(element)) {
    const matches = queryAll(root, candidate)
    if (matches.length === 1 && matches[0] === element) {
      return candidate
    }
  }

  return null
}

export const inferRowCssSelector = (element: Element, document: Document): string => {
  const parent = element.parentElement
  const ownCandidates = basicCandidates(element)

  for (const candidate of ownCandidates) {
    const matches = queryAll(document, candidate)
    if (matches.length > 1 && hasElement(matches, element)) {
      return candidate
    }
  }

  if (parent) {
    for (const candidate of ownCandidates) {
      const selector = `${elementTag(parent)} > ${candidate}`
      const matches = queryAll(document, selector)
      if (matches.length > 1 && hasElement(matches, element)) {
        return selector
      }
    }

    const siblingTags = directElementChildren(parent).filter((child) => elementTag(child) === elementTag(element))
    if (siblingTags.length > 1) {
      return `${selectorPath(document.body, parent)} > ${elementTag(element)}`
    }
  }

  return selectorPath(document.body, element)
}

export const selectorPath = (root: Element, element: Element): string => {
  if (root === element) {
    return elementTag(element)
  }

  const unique = uniqueSelectorWithin(root, element)
  if (unique) {
    return unique
  }

  const parts: string[] = []
  let current: Element | null = element

  while (current && current !== root && current !== current.ownerDocument.documentElement) {
    const uniqueForCurrent = current.parentElement ? uniqueSelectorWithin(current.parentElement, current) : null
    parts.unshift(uniqueForCurrent ?? `${elementTag(current)}:nth-of-type(${nthOfType(current)})`)
    const selector = parts.join(' > ')
    const matches = queryAll(root, selector)
    if (matches.length === 1 && matches[0] === element) {
      return selector
    }
    current = current.parentElement
  }

  return parts.join(' > ') || elementTag(element)
}

const xpathLiteral = (value: string): string => {
  if (!value.includes("'")) {
    return `'${value}'`
  }

  if (!value.includes('"')) {
    return `"${value}"`
  }

  return `concat(${value
    .split("'")
    .map((part) => `'${part}'`)
    .join(', "\'", ')})`
}

const classXPath = (element: Element): string | null => {
  const className = Array.from(element.classList).find((candidate) => !ignoredClasses.has(candidate))
  return className
    ? `//${elementTag(element)}[contains(concat(" ", normalize-space(@class), " "), " ${className} ")]`
    : null
}

const indexedXPathSegment = (element: Element): string => `${elementTag(element)}[${nthOfType(element)}]`

export const absoluteXPath = (element: Element): string => {
  if (element.id) {
    return `//*[@id=${xpathLiteral(element.id)}]`
  }

  const parts: string[] = []
  let current: Element | null = element

  while (current) {
    parts.unshift(indexedXPathSegment(current))
    current = current.parentElement
  }

  return `/${parts.join('/')}`
}

export const relativeXPath = (root: Element, element: Element): string => {
  if (root === element) {
    return '.'
  }

  const parts: string[] = []
  let current: Element | null = element

  while (current && current !== root) {
    parts.unshift(indexedXPathSegment(current))
    current = current.parentElement
  }

  return current === root ? `./${parts.join('/')}` : absoluteXPath(element)
}

export const inferRowXPath = (element: Element, document: Document): string => {
  for (const attribute of preferredAttributes) {
    const value = element.getAttribute(attribute)
    if (!value) {
      continue
    }

    const candidate = `//${elementTag(element)}[@${attribute}=${xpathLiteral(value)}]`
    if (selectElements(document, candidate, 'xpath').length > 1) {
      return candidate
    }
  }

  const classCandidate = classXPath(element)
  if (classCandidate && selectElements(document, classCandidate, 'xpath').length > 1) {
    return classCandidate
  }

  return absoluteXPath(element)
}

export const selectElements = (context: Document | Element, selector: string, mode: SelectorMode): Element[] => {
  if (!selector.trim()) {
    return []
  }

  if (mode === 'css') {
    return queryAll(context, selector)
  }

  const isDocument = context.nodeType === Node.DOCUMENT_NODE
  const document = isDocument ? (context as Document) : (context as Element).ownerDocument
  try {
    const result = document.evaluate(selector, context, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    const elements: Element[] = []
    for (let index = 0; index < result.snapshotLength; index += 1) {
      const node = result.snapshotItem(index)
      if (isElement(node)) {
        elements.push(node)
      }
    }
    return elements
  } catch {
    return []
  }
}

export const valueFromElement = (element: Element | undefined, attribute: ExtractionAttribute): string => {
  if (!element) {
    return ''
  }

  if (attribute === 'text') {
    return normalizeText(element.textContent)
  }

  if (attribute === 'html') {
    return element.innerHTML.trim()
  }

  return normalizeText(element.getAttribute(attribute))
}

const contextForField = (document: Document, row: Element, field: FieldRule): Document | Element => {
  if (field.scope === 'document') {
    return document
  }
  if (field.scope === 'nextSibling') {
    return row.nextElementSibling ?? row
  }
  return row
}

const fieldElements = (document: Document, row: Element, field: FieldRule): Element[] => {
  const context = contextForField(document, row, field)
  return field.selector === '.' && context instanceof Element
    ? [context]
    : selectElements(context, field.selector, field.selectorMode)
}

const fieldValue = (document: Document, row: Element, field: FieldRule, sourceUrl?: string): string => {
  const elements = fieldElements(document, row, field)
  const values = (field.multi ? elements : elements.slice(0, 1))
    .map((element) => valueFromElement(element, field.attribute))
    .filter(Boolean)
  return normalizeValue(values.join('; '), field.fieldType, field.normalizer, sourceUrl)
}

export const extractPreview = (project: ScraperProject): PreviewResult => {
  const document = parseHtml(sanitizeHtml(project.html))
  const warnings: string[] = []
  const fieldMatchCounts: Record<string, number> = {}
  const rows = project.rowSelector
    ? selectElements(document, project.rowSelector, project.rowSelectorMode)
    : document.body
      ? [document.body]
      : []

  if (!project.html.trim()) {
    return { rows: [], rowCount: 0, warnings: ['Paste HTML or load the sample.'], rowIndices: [] }
  }

  if (!project.rowSelector.trim()) {
    warnings.push('Pick a row/container before extracting repeated records.')
  }

  if (rows.length === 0) {
    warnings.push('No rows matched the current row selector.')
  }

  if (project.fields.length === 0) {
    warnings.push('Add at least one field selector.')
  }

  const exclusions = new Set(project.rowExclusions ?? [])
  const indexedRows = rows.map((row, idx) => ({
    row,
    idx,
    data: Object.fromEntries(
      project.fields.map((field) => [field.name, fieldValue(document, row, field, project.sourceUrl)]),
    ),
  }))

  const previewIndexed = indexedRows.filter(
    ({ idx, data }) =>
      !exclusions.has(idx) &&
      (project.fields.length === 0 || Object.values(data).some((value) => value.trim())),
  )

  project.fields.forEach((field) => {
    const matchedCount = rows.filter((row) => fieldElements(document, row, field).length > 0).length
    fieldMatchCounts[field.name] = matchedCount
    if (rows.length > 0 && matchedCount === 0) {
      warnings.push(`Field "${field.name}" did not match inside any row.`)
    }
  })

  return {
    rows: previewIndexed.map((r) => r.data),
    rowCount: previewIndexed.length,
    warnings,
    fieldMatchCounts,
    rowIndices: previewIndexed.map((r) => r.idx),
  }
}

const bestRowElement = (element: Element, document: Document): Element => {
  const candidates: Array<{ element: Element; score: number }> = []
  let current: Element | null = element

  while (current && current !== document.body && current !== document.documentElement) {
    const css = inferRowCssSelector(current, document)
    const matches = selectElements(document, css, 'css')
    const childWeight = directElementChildren(current).length * 4
    const repeatedWeight = matches.length > 1 && hasElement(matches, current) ? 100 : 0
    const siblingWeight = current.parentElement && directElementChildren(current.parentElement).length > 1 ? 12 : 0
    candidates.push({ element: current, score: repeatedWeight + childWeight + siblingWeight })
    current = current.parentElement
  }

  return candidates.sort((left, right) => right.score - left.score)[0]?.element ?? element
}

export const selectorsForRowPick = (element: Element, document: Document): PickedSelector => {
  const row = bestRowElement(element, document)
  return {
    css: inferRowCssSelector(row, document),
    xpath: inferRowXPath(row, document),
  }
}

export const selectorsForFieldPick = (
  element: Element,
  rowSelector: string,
  rowSelectorMode: SelectorMode,
  document: Document,
): PickedFieldSelector | null => {
  const rows = selectElements(document, rowSelector, rowSelectorMode)
  const rowIndex = rows.findIndex((row) => row === element || row.contains(element))
  const row = rows[rowIndex]
  if (!row) {
    return null
  }

  return {
    css: row === element ? '.' : selectorPath(row, element),
    xpath: row === element ? '.' : relativeXPath(row, element),
    rowIndex,
  }
}

export const selectorMatches = (
  html: string,
  selector: string,
  selectorMode: SelectorMode,
  contextSelector?: string,
  contextMode?: SelectorMode,
): number => {
  const document = parseHtml(sanitizeHtml(html))
  if (!contextSelector) {
    return selectElements(document, selector, selectorMode).length
  }

  return selectElements(document, contextSelector, contextMode ?? 'css').reduce(
    (count, row) => count + selectElements(row, selector, selectorMode).length,
    0,
  )
}

type FieldMeta = {
  fieldType: FieldType
  baseName: string
  attribute: ExtractionAttribute
  normalizer?: FieldNormalizer
}

const guessFieldMeta = (tag: string, attribute: ExtractionAttribute, samples: string[]): FieldMeta => {
  const joined = samples.join(' ').toLowerCase()
  if (attribute === 'src' || tag === 'img') {
    return { fieldType: 'image', baseName: 'image', attribute: 'src', normalizer: 'image' }
  }
  if (attribute === 'href') {
    return { fieldType: 'url', baseName: 'url', attribute: 'href', normalizer: 'url' }
  }
  if (/\$|€|£|¥|\d+[.,]\d{2}|price|cost/.test(joined)) {
    return { fieldType: 'price', baseName: 'price', attribute: 'text', normalizer: 'price' }
  }
  if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b|\d{4}-\d{2}-\d{2}/.test(joined)) {
    return { fieldType: 'date', baseName: 'date', attribute: 'text', normalizer: 'date' }
  }
  if (/^\d[\d,\s]*$/.test(samples[0] ?? '')) {
    return { fieldType: 'count', baseName: 'count', attribute: 'text', normalizer: 'count' }
  }
  if (/h[1-4]/.test(tag)) {
    return { fieldType: 'title', baseName: 'title', attribute: 'text' }
  }
  return { fieldType: 'text', baseName: 'text', attribute: 'text' }
}

export const inferFieldsFromRowSelector = (
  rowSelector: string,
  rowMode: SelectorMode,
  document: Document,
): FieldRule[] => {
  const rows = selectElements(document, rowSelector, rowMode)
  if (rows.length === 0) return []

  const sampleRows = rows.slice(0, Math.min(6, rows.length))
  const firstRow = sampleRows[0]

  type Candidate = {
    selector: string
    meta: FieldMeta
    coverage: number
    samples: string[]
  }

  const candidates: Candidate[] = []
  const seenKeys = new Set<string>()

  // Walk descendants of first row and test each relative selector across sample rows
  const descendants = Array.from(firstRow.querySelectorAll('*')).slice(0, 150)

  for (const el of descendants) {
    const tag = el.tagName.toLowerCase()
    if (['script', 'style', 'nav', 'header', 'footer', 'noscript'].includes(tag)) continue

    const isImg = tag === 'img'
    const isLink = tag === 'a'
    const attribute: ExtractionAttribute = isImg ? 'src' : isLink ? 'href' : 'text'

    const relSel = selectorPath(firstRow, el)
    const key = `${relSel}|${attribute}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)

    let matchCount = 0
    const samples: string[] = []

    for (const row of sampleRows) {
      const matched = queryAll(row, relSel)
      if (matched.length !== 1) continue
      const val =
        attribute === 'text'
          ? normalizeText(matched[0].textContent)
          : (matched[0].getAttribute(attribute) ?? '')
      if (!val.trim()) continue
      matchCount++
      if (samples.length < 3) samples.push(val)
    }

    const coverage = matchCount / sampleRows.length
    if (coverage < 0.5 || samples.length === 0) continue

    const meta = guessFieldMeta(tag, attribute, samples)
    candidates.push({ selector: relSel, meta, coverage, samples })
  }

  // Deduplicate by baseName — keep highest coverage per name
  const byName = new Map<string, Candidate>()
  for (const c of candidates) {
    const existing = byName.get(c.meta.baseName)
    if (!existing || c.coverage > existing.coverage) {
      byName.set(c.meta.baseName, c)
    }
  }

  const priorityOrder = ['title', 'image', 'url', 'price', 'date', 'count', 'author', 'text']
  const sorted = Array.from(byName.values()).sort((a, b) => {
    const pa = priorityOrder.indexOf(a.meta.baseName)
    const pb = priorityOrder.indexOf(b.meta.baseName)
    return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
  })

  const usedNames = new Set<string>()
  return sorted.slice(0, 8).map((c) => {
    let name = c.meta.baseName
    let suffix = 2
    while (usedNames.has(name)) name = `${c.meta.baseName}_${suffix++}`
    usedNames.add(name)

    return {
      id: psbStableId('auto', name, c.selector, c.meta.attribute, 'row'),
      name,
      selector: c.selector,
      selectorMode: 'css' as SelectorMode,
      attribute: c.meta.attribute,
      fieldType: c.meta.fieldType,
      confidence: Math.round(c.coverage * 80) / 100,
      reason: `Auto-detected in ${Math.round(c.coverage * 100)}% of rows.`,
      scope: 'row' as const,
      normalizer: c.meta.normalizer,
    }
  })
}
