import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPickerDocument } from './dom'
import { selectorsForFieldPick, selectorsForRowPick, selectElements, selectorMatches } from './selectorEngine'
import type { FieldRule, PickedFieldSelector, PickedSelector, SelectorMode } from './types'

type PickMode = 'row' | 'field'

interface PickerFrameProps {
  html: string
  pickMode: PickMode
  rowSelector: string
  rowSelectorMode: SelectorMode
  fields: FieldRule[]
  onPickRow: (picked: PickedSelector) => void
  onPickField: (picked: PickedFieldSelector) => void
  onMessage: (message: string) => void
}

const asElement = (target: EventTarget | null): Element | null =>
  target && (target as Node).nodeType === Node.ELEMENT_NODE ? (target as Element) : null

const clearMarker = (document: Document, marker: string) => {
  document.querySelectorAll(`[${marker}]`).forEach((element) => element.removeAttribute(marker))
}

export function PickerFrame({
  html,
  pickMode,
  rowSelector,
  rowSelectorMode,
  fields,
  onPickRow,
  onPickField,
  onMessage,
}: PickerFrameProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  const [loadVersion, setLoadVersion] = useState(0)
  const srcDoc = useMemo(() => createPickerDocument(html), [html])

  const markSelections = useCallback(() => {
    const document = frameRef.current?.contentDocument
    if (!document) {
      return
    }

    clearMarker(document, 'data-psb-row')
    clearMarker(document, 'data-psb-field')

    if (rowSelector) {
      selectElements(document, rowSelector, rowSelectorMode).forEach((row) => {
        row.setAttribute('data-psb-row', 'true')
      })
    }

    fields.forEach((field) => {
      const contexts = rowSelector ? selectElements(document, rowSelector, rowSelectorMode) : [document.body]
      contexts.forEach((context) => {
        if (!context) {
          return
        }

        selectElements(context, field.selector, field.selectorMode).forEach((element) => {
          element.setAttribute('data-psb-field', 'true')
        })
      })
    })
  }, [fields, rowSelector, rowSelectorMode])

  useEffect(() => {
    const document = frameRef.current?.contentDocument
    if (!document) {
      return undefined
    }

    markSelections()

    let hoverElement: Element | null = null
    const clearHover = () => {
      if (hoverElement) {
        hoverElement.removeAttribute('data-psb-hover')
        hoverElement = null
      }
    }

    const handleMouseOver = (event: MouseEvent) => {
      clearHover()
      const element = asElement(event.target)
      if (!element || element === document.documentElement || element === document.body) {
        return
      }

      hoverElement = element
      hoverElement.setAttribute('data-psb-hover', 'true')
    }

    const handleMouseOut = () => clearHover()

    const handleClick = (event: MouseEvent) => {
      const element = asElement(event.target)
      if (!element) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (pickMode === 'row') {
        const picked = selectorsForRowPick(element, document)
        onPickRow(picked)
        const count = selectorMatches(html, picked[rowSelectorMode], rowSelectorMode)
        onMessage(`Row selector matched ${count} item${count === 1 ? '' : 's'}.`)
        return
      }

      if (!rowSelector) {
        onMessage('Pick a row before adding fields.')
        return
      }

      const picked = selectorsForFieldPick(element, rowSelector, rowSelectorMode, document)
      if (!picked) {
        onMessage('Clicked element is outside the current row selector.')
        return
      }

      onPickField(picked)
      onMessage(`Field selector added from row ${picked.rowIndex + 1}.`)
    }

    document.addEventListener('mouseover', handleMouseOver, true)
    document.addEventListener('mouseout', handleMouseOut, true)
    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('mouseover', handleMouseOver, true)
      document.removeEventListener('mouseout', handleMouseOut, true)
      document.removeEventListener('click', handleClick, true)
      clearHover()
    }
  }, [html, loadVersion, markSelections, onMessage, onPickField, onPickRow, pickMode, rowSelector, rowSelectorMode])

  useEffect(() => {
    markSelections()
  }, [markSelections])

  return (
    <iframe
      ref={frameRef}
      className="picker-frame"
      title="Rendered pasted HTML picker"
      srcDoc={srcDoc}
      onLoad={() => setLoadVersion((version) => version + 1)}
    />
  )
}
