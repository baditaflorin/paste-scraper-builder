const unsafeElementSelector = 'script, iframe, object, embed, link[rel="preload"], link[rel="modulepreload"]'

export const parseHtml = (html: string): Document => {
  const parser = new DOMParser()
  return parser.parseFromString(html || '<!doctype html><html><body></body></html>', 'text/html')
}

export const sanitizeHtml = (html: string): string => {
  const document = parseHtml(html)
  document.querySelectorAll(unsafeElementSelector).forEach((node) => node.remove())
  document.querySelectorAll('*').forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const name = attribute.name.toLowerCase()
      if (name.startsWith('on') || name === 'srcdoc') {
        element.removeAttribute(attribute.name)
      }
    })

    if (element instanceof HTMLAnchorElement) {
      element.target = '_blank'
      element.rel = 'noreferrer'
    }
  })

  return `<!doctype html>${document.documentElement.outerHTML}`
}

export const createPickerDocument = (html: string): string => {
  const safeHtml = sanitizeHtml(html)
  const document = parseHtml(safeHtml)
  const style = document.createElement('style')
  style.textContent = `
    [data-psb-hover="true"] {
      outline: 3px solid #f59e0b !important;
      outline-offset: 2px !important;
      cursor: crosshair !important;
    }

    [data-psb-row="true"] {
      outline: 3px solid #14b8a6 !important;
      outline-offset: 3px !important;
    }

    [data-psb-field="true"] {
      outline: 3px solid #e11d48 !important;
      outline-offset: 2px !important;
    }
  `
  document.head.append(style)
  return `<!doctype html>${document.documentElement.outerHTML}`
}

export const normalizeText = (value: string | null | undefined): string => (value ?? '').replace(/\s+/g, ' ').trim()
