import {
  ArrowDownToLine,
  Braces,
  Clipboard,
  Code2,
  Database,
  Eraser,
  ExternalLink,
  FileCode2,
  GitBranch,
  HeartHandshake,
  MousePointer2,
  Play,
  Plus,
  Save,
  Table,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useBuildStatus } from '../status/useBuildStatus'
import { generateGoScraper, generatePythonScraper } from './codegen'
import { rowsToCsv } from './csv'
import { PickerFrame } from './PickerFrame'
import { sampleHtml } from './sampleHtml'
import { extractPreview } from './selectorEngine'
import { clearDraft, loadDraft, saveDraft } from './storage'
import {
  blankProject,
  extractionAttributeSchema,
  selectorModeSchema,
  type ExtractionAttribute,
  type FieldRule,
  type PickedFieldSelector,
  type PickedSelector,
  type ScraperProject,
  type SelectorMode,
} from './types'

type PickMode = 'row' | 'field'
type ExportTab = 'csv' | 'python' | 'go'

const attributeOptions = extractionAttributeSchema.options
const selectorModes = selectorModeSchema.options

const uniqueFieldName = (fields: FieldRule[], preferredName: string): string => {
  const normalized = preferredName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
  const base = normalized || `field_${fields.length + 1}`
  const names = new Set(fields.map((field) => field.name))
  if (!names.has(base)) {
    return base
  }

  let suffix = 2
  while (names.has(`${base}_${suffix}`)) {
    suffix += 1
  }
  return `${base}_${suffix}`
}

const updateTimestamp = (project: ScraperProject): ScraperProject => ({
  ...project,
  updatedAt: new Date().toISOString(),
})

const downloadText = (filename: string, contents: string, mimeType: string) => {
  const blob = new Blob([contents], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function LinkButton({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a className="icon-link" href={href} target="_blank" rel="noreferrer" title={label} aria-label={label}>
      {icon}
      <span>{label}</span>
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  )
}

export function ScraperBuilder() {
  const [project, setProject] = useState<ScraperProject>(() => blankProject())
  const [pickMode, setPickMode] = useState<PickMode>('row')
  const [selectorMode, setSelectorMode] = useState<SelectorMode>('css')
  const [fieldName, setFieldName] = useState('title')
  const [attribute, setAttribute] = useState<ExtractionAttribute>('text')
  const [exportTab, setExportTab] = useState<ExportTab>('csv')
  const [toast, setToast] = useState('Ready.')
  const { meta, liveCommit } = useBuildStatus()

  useEffect(() => {
    let mounted = true
    loadDraft()
      .then((draft) => {
        if (draft && mounted) {
          setProject(draft)
          setSelectorMode(draft.rowSelectorMode)
          setToast('Local draft restored.')
        }
      })
      .catch(() => setToast('Local draft could not be restored.'))

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!project.html && project.fields.length === 0 && !project.rowSelector) {
      return
    }

    const handle = window.setTimeout(() => {
      void saveDraft(project).catch(() => setToast('Local draft could not be saved.'))
    }, 350)

    return () => window.clearTimeout(handle)
  }, [project])

  const preview = useMemo(() => extractPreview(project), [project])
  const csv = useMemo(() => rowsToCsv(preview.rows, project.fields), [preview.rows, project.fields])
  const python = useMemo(() => generatePythonScraper(project), [project])
  const go = useMemo(() => generateGoScraper(project), [project])

  const setProjectWithTimestamp = (updater: (current: ScraperProject) => ScraperProject) => {
    setProject((current) => updateTimestamp(updater(current)))
  }

  const handlePickRow = (picked: PickedSelector) => {
    setProjectWithTimestamp((current) => ({
      ...current,
      rowSelector: picked[selectorMode],
      rowSelectorMode: selectorMode,
    }))
    setPickMode('field')
  }

  const handlePickField = (picked: PickedFieldSelector) => {
    const name = uniqueFieldName(project.fields, fieldName)
    setProjectWithTimestamp((current) => ({
      ...current,
      fields: [
        ...current.fields,
        {
          id: crypto.randomUUID(),
          name,
          selector: picked[selectorMode],
          selectorMode,
          attribute,
        },
      ],
    }))
    setFieldName(`field_${project.fields.length + 2}`)
  }

  const updateField = (id: string, patch: Partial<FieldRule>) => {
    setProjectWithTimestamp((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    }))
  }

  const removeField = (id: string) => {
    setProjectWithTimestamp((current) => ({
      ...current,
      fields: current.fields.filter((field) => field.id !== id),
    }))
  }

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setToast(`${label} copied.`)
    } catch {
      setToast(`${label} could not be copied.`)
    }
  }

  const resetProject = async () => {
    setProject(blankProject())
    setPickMode('row')
    setFieldName('title')
    await clearDraft()
    setToast('Draft cleared.')
  }

  const loadSample = () => {
    setProject(updateTimestamp({ ...blankProject(), html: sampleHtml }))
    setPickMode('row')
    setFieldName('title')
    setToast('Sample loaded.')
  }

  const activeExport = exportTab === 'csv' ? csv : exportTab === 'python' ? python : go
  const activeExportName = exportTab === 'csv' ? 'extraction.csv' : exportTab === 'python' ? 'scraper.py' : 'scraper.go'
  const activeExportMime = exportTab === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8'

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <Braces size={24} />
          </div>
          <div>
            <h1>Paste Scraper Builder</h1>
            <p>
              v{meta.version} · commit <code>{liveCommit}</code>
            </p>
          </div>
        </div>
        <nav className="top-links" aria-label="Project links">
          <LinkButton href={meta.repository} icon={<GitBranch size={16} aria-hidden="true" />} label="GitHub" />
          <LinkButton href={meta.paypal} icon={<HeartHandshake size={16} aria-hidden="true" />} label="PayPal" />
        </nav>
      </header>

      <main className="builder-grid">
        <section className="workspace-panel input-panel" aria-labelledby="input-heading">
          <div className="panel-heading">
            <h2 id="input-heading">Source</h2>
            <div className="button-row">
              <button type="button" className="tool-button" onClick={loadSample}>
                <Play size={16} aria-hidden="true" />
                <span>Sample</span>
              </button>
              <button type="button" className="icon-button" title="Clear draft" aria-label="Clear draft" onClick={() => void resetProject()}>
                <Eraser size={17} aria-hidden="true" />
              </button>
            </div>
          </div>

          <label className="field-label" htmlFor="html-input">
            Rendered HTML
          </label>
          <textarea
            id="html-input"
            className="html-input"
            spellCheck={false}
            value={project.html}
            onChange={(event) =>
              setProjectWithTimestamp((current) => ({
                ...current,
                html: event.target.value,
              }))
            }
          />

          <div className="control-grid">
            <div>
              <span className="field-label">Picker</span>
              <div className="segmented-control" role="group" aria-label="Picker mode">
                <button type="button" className={pickMode === 'row' ? 'active' : ''} onClick={() => setPickMode('row')}>
                  <MousePointer2 size={15} aria-hidden="true" />
                  <span>Row</span>
                </button>
                <button type="button" className={pickMode === 'field' ? 'active' : ''} onClick={() => setPickMode('field')}>
                  <Plus size={15} aria-hidden="true" />
                  <span>Field</span>
                </button>
              </div>
            </div>

            <div>
              <span className="field-label">Selector</span>
              <div className="segmented-control" role="group" aria-label="Selector type">
                {selectorModes.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    className={selectorMode === mode ? 'active' : ''}
                    onClick={() => setSelectorMode(mode)}
                  >
                    <Code2 size={15} aria-hidden="true" />
                    <span>{mode.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="field-preset">
            <div>
              <label className="field-label" htmlFor="field-name">
                Field
              </label>
              <input id="field-name" value={fieldName} onChange={(event) => setFieldName(event.target.value)} autoComplete="off" />
            </div>
            <div>
              <label className="field-label" htmlFor="attribute">
                Value
              </label>
              <select id="attribute" value={attribute} onChange={(event) => setAttribute(event.target.value as ExtractionAttribute)}>
                {attributeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="selector-stack">
            <label className="field-label" htmlFor="row-selector">
              Row selector
            </label>
            <input
              id="row-selector"
              value={project.rowSelector}
              onChange={(event) =>
                setProjectWithTimestamp((current) => ({
                  ...current,
                  rowSelector: event.target.value,
                  rowSelectorMode: selectorMode,
                }))
              }
            />
          </div>
        </section>

        <section className="workspace-panel picker-panel" aria-labelledby="picker-heading">
          <div className="panel-heading">
            <h2 id="picker-heading">Picker</h2>
            <span className="status-pill">{preview.rowCount} rows</span>
          </div>
          <PickerFrame
            html={project.html}
            pickMode={pickMode}
            rowSelector={project.rowSelector}
            rowSelectorMode={project.rowSelectorMode}
            fields={project.fields}
            onPickRow={handlePickRow}
            onPickField={handlePickField}
            onMessage={setToast}
          />
        </section>

        <section className="workspace-panel output-panel" aria-labelledby="output-heading">
          <div className="panel-heading">
            <h2 id="output-heading">Preview</h2>
            <div className="button-row">
              <button
                type="button"
                className="icon-button"
                title="Save local draft"
                aria-label="Save local draft"
                onClick={() => void saveDraft(project).then(() => setToast('Local draft saved.'))}
              >
                <Save size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-button"
                title="Download active export"
                aria-label="Download active export"
                onClick={() => downloadText(activeExportName, activeExport, activeExportMime)}
              >
                <ArrowDownToLine size={17} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="field-list" aria-label="Selected fields">
            {project.fields.length === 0 ? (
              <div className="empty-state">No fields selected.</div>
            ) : (
              project.fields.map((field) => (
                <div className="field-rule" key={field.id}>
                  <input value={field.name} onChange={(event) => updateField(field.id, { name: event.target.value })} />
                  <select
                    value={field.attribute}
                    onChange={(event) => updateField(field.id, { attribute: event.target.value as ExtractionAttribute })}
                    aria-label={`${field.name} attribute`}
                  >
                    {attributeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input value={field.selector} onChange={(event) => updateField(field.id, { selector: event.target.value })} aria-label={`${field.name} selector`} />
                  <button type="button" className="icon-button" title="Remove field" aria-label="Remove field" onClick={() => removeField(field.id)}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              ))
            )}
          </div>

          {preview.warnings.length > 0 && (
            <div className="warnings" role="status">
              {preview.warnings.slice(0, 3).map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {project.fields.map((field) => (
                    <th key={field.id}>{field.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 25).map((row, rowIndex) => (
                  <tr key={`${rowIndex}-${JSON.stringify(row)}`}>
                    {project.fields.map((field) => (
                      <td key={field.id}>{row[field.name]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="export-tabs" role="tablist" aria-label="Export format">
            <button type="button" className={exportTab === 'csv' ? 'active' : ''} onClick={() => setExportTab('csv')}>
              <Table size={15} aria-hidden="true" />
              <span>CSV</span>
            </button>
            <button type="button" className={exportTab === 'python' ? 'active' : ''} onClick={() => setExportTab('python')}>
              <FileCode2 size={15} aria-hidden="true" />
              <span>Python</span>
            </button>
            <button type="button" className={exportTab === 'go' ? 'active' : ''} onClick={() => setExportTab('go')}>
              <Database size={15} aria-hidden="true" />
              <span>Go</span>
            </button>
          </div>

          <div className="export-box">
            <button type="button" className="copy-button" onClick={() => void copyText(activeExport, exportTab.toUpperCase())}>
              <Clipboard size={15} aria-hidden="true" />
              <span>Copy</span>
            </button>
            <pre>{activeExport}</pre>
          </div>
        </section>
      </main>

      <footer className="toast" role="status">
        {toast}
      </footer>
    </div>
  )
}
