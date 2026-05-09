import {
  ArrowDownToLine,
  Braces,
  Clipboard,
  Code2,
  Database,
  Eraser,
  ExternalLink,
  FileJson,
  FileUp,
  FileCode2,
  GitBranch,
  HeartHandshake,
  Link2,
  MousePointer2,
  Play,
  Plus,
  Save,
  Share2,
  Table,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useBuildStatus } from '../status/useBuildStatus'
import { generateGoScraper, generatePythonScraper } from './codegen'
import { rowsToCsv, rowsToPlainCsv } from './csv'
import { analyzeHtml, stableId } from './inference'
import { PickerFrame } from './PickerFrame'
import {
  confidenceLabel,
  decodeProjectJson,
  encodeProjectState,
  hashPrefix,
  loadSettings,
  projectFromLocationHash,
  projectStateJson,
  saveSettings,
  type AppSettings,
} from './projectState'
import { sampleHtml } from './sampleHtml'
import { extractPreview, inferFieldsFromRowSelector } from './selectorEngine'
import { clearDraft, loadDraft, saveDraft } from './storage'
import { parseHtml } from './dom'
import {
  blankProject,
  extractionAttributeSchema,
  selectorModeSchema,
  type ExtractionAttribute,
  type FieldRule,
  type InferenceResult,
  type PickedFieldSelector,
  type PickedSelector,
  type ScraperProject,
  type SelectorMode,
} from './types'

type PickMode = 'row' | 'field'
type ExportTab = 'csv' | 'json' | 'python' | 'go'

const attributeOptions = extractionAttributeSchema.options
const selectorModes = selectorModeSchema.options

const uniqueFieldName = (fields: FieldRule[], preferredName: string): string => {
  const normalized = preferredName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
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

const projectMatchesInference = (project: ScraperProject, inference: InferenceResult): boolean =>
  project.rowSelector === inference.project.rowSelector &&
  project.inferredShape === inference.project.inferredShape &&
  project.inferenceConfidence === inference.project.inferenceConfidence &&
  JSON.stringify(project.fields) === JSON.stringify(inference.project.fields) &&
  JSON.stringify(project.anomalies ?? []) === JSON.stringify(inference.project.anomalies ?? [])

const initialSharedProject = projectFromLocationHash()

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
  const [project, setProject] = useState<ScraperProject>(() =>
    initialSharedProject ? updateTimestamp(initialSharedProject) : blankProject(),
  )
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings())
  const [pickMode, setPickMode] = useState<PickMode>('row')
  const [selectorMode, setSelectorMode] = useState<SelectorMode>(() => initialSharedProject?.rowSelectorMode ?? 'css')
  const [fieldName, setFieldName] = useState('title')
  const [attribute, setAttribute] = useState<ExtractionAttribute>('text')
  const [exportTab, setExportTab] = useState<ExportTab>('csv')
  const [toast, setToast] = useState(initialSharedProject ? 'Project restored from share link.' : 'Ready.')
  const [manualOverride, setManualOverride] = useState(Boolean(initialSharedProject))
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { meta, liveCommit } = useBuildStatus()

  useEffect(() => {
    let mounted = true
    if (initialSharedProject) {
      return () => {
        mounted = false
      }
    }

    loadDraft()
      .then((draft) => {
        if (draft && mounted) {
          setProject(draft)
          setSelectorMode(draft.rowSelectorMode)
          setManualOverride(Boolean(draft.rowSelector || draft.fields.length > 0))
          setToast('Local draft restored.')
        }
      })
      .catch(() => setToast('Local draft could not be restored.'))

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    if (!project.html && project.fields.length === 0 && !project.rowSelector) {
      return
    }

    const handle = window.setTimeout(() => {
      void saveDraft(project).catch(() => setToast('Local draft could not be saved.'))
    }, 350)

    return () => window.clearTimeout(handle)
  }, [project])

  const inference = useMemo(
    () => analyzeHtml(project.html, { sourceUrl: project.sourceUrl }),
    [project.html, project.sourceUrl],
  )

  useEffect(() => {
    if (!settings.autoInfer || manualOverride || !project.html.trim()) {
      return
    }
    if (inference.status === 'too_large') {
      const handle = window.setTimeout(() => setToast('HTML is above the automatic analysis budget.'), 0)
      return () => window.clearTimeout(handle)
    }
    if (projectMatchesInference(project, inference)) {
      return
    }
    const handle = window.setTimeout(() => {
      setProject(updateTimestamp({ ...inference.project, html: project.html, sourceUrl: project.sourceUrl }))
      setSelectorMode(inference.project.rowSelectorMode)
      setPickMode(inference.fields.length > 0 ? 'field' : 'row')
      setToast(
        inference.status === 'actionable_error'
          ? (inference.messages[0]?.what ?? 'Input needs attention.')
          : `Detected ${inference.shape} with ${confidenceLabel(inference.confidence)} confidence.`,
      )
    }, 0)
    return () => window.clearTimeout(handle)
  }, [inference, manualOverride, project, settings.autoInfer])

  const preview = useMemo(() => extractPreview(project), [project])
  const csv = useMemo(
    () =>
      settings.includeProvenance
        ? rowsToCsv(preview.rows, project.fields, project)
        : rowsToPlainCsv(preview.rows, project.fields),
    [preview.rows, project, settings.includeProvenance],
  )
  const json = useMemo(() => projectStateJson(project), [project])
  const python = useMemo(() => generatePythonScraper(project), [project])
  const go = useMemo(() => generateGoScraper(project), [project])

  const setProjectWithTimestamp = (updater: (current: ScraperProject) => ScraperProject) => {
    setProject((current) => updateTimestamp(updater(current)))
  }

  const handlePickRow = (picked: PickedSelector) => {
    const rowSel = picked[selectorMode]
    setManualOverride(true)
    setProjectWithTimestamp((current) => {
      const doc = parseHtml(current.html)
      const autoFields = inferFieldsFromRowSelector(rowSel, selectorMode, doc)
      return {
        ...current,
        rowSelector: rowSel,
        rowSelectorMode: selectorMode,
        fields: autoFields.length > 0 ? autoFields : current.fields,
      }
    })
    if (project.fields.length === 0) {
      setToast('Row picked — fields auto-detected. Remove false positives with ×.')
    }
    setPickMode('field')
  }

  const handlePickField = (picked: PickedFieldSelector) => {
    const name = uniqueFieldName(project.fields, fieldName)
    setManualOverride(true)
    setProjectWithTimestamp((current) => ({
      ...current,
      fields: [
        ...current.fields,
        {
          id: stableId('manual', name, picked[selectorMode], attribute, String(project.fields.length)),
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
    setManualOverride(true)
    setProjectWithTimestamp((current) => ({
      ...current,
      fields: current.fields.map((field) => (field.id === id ? { ...field, ...patch } : field)),
    }))
  }

  const removeField = (id: string) => {
    setManualOverride(true)
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
    setManualOverride(false)
    setPickMode('row')
    setFieldName('title')
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    await clearDraft()
    setToast('Draft cleared.')
  }

  const loadSample = () => {
    setProject(updateTimestamp({ ...blankProject(), html: sampleHtml }))
    setManualOverride(false)
    setPickMode('row')
    setFieldName('title')
    setToast('Sample loaded.')
  }

  const applyHtmlInput = (html: string, sourceUrl?: string) => {
    setManualOverride(false)
    setProjectWithTimestamp((current) => ({
      ...blankProject(),
      html,
      sourceUrl: sourceUrl ?? current.sourceUrl,
    }))
    setPickMode('row')
  }

  const importText = (text: string, label: string) => {
    const parsed = decodeProjectJson(text)
    if (parsed) {
      setProject(updateTimestamp(parsed))
      setSelectorMode(parsed.rowSelectorMode)
      setManualOverride(true)
      setToast(`${label} project restored.`)
      return
    }
    throw new Error('Not a project state file')
  }

  const handleFiles = async (files: FileList | File[]) => {
    const [file] = Array.from(files)
    if (!file) {
      return
    }
    const text = await file.text()
    if (file.name.endsWith('.json') || file.type.includes('json')) {
      try {
        importText(text, file.name)
        return
      } catch {
        setToast('JSON file was not a Paste Scraper Builder project.')
        return
      }
    }
    applyHtmlInput(text)
    setToast(`${file.name} loaded.`)
  }

  const readClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      applyHtmlInput(text)
      setToast('Clipboard HTML loaded.')
    } catch {
      setToast('Clipboard permission was denied. Use the paste box or upload an HTML file.')
    }
  }

  const shareProject = async () => {
    const encoded = encodeProjectState(project)
    if (encoded.length > 60_000) {
      setToast('Project is too large for a share URL. Download the JSON state file instead.')
      return
    }
    const url = `${window.location.origin}${window.location.pathname}${hashPrefix}${encoded}`
    window.history.replaceState(null, '', `${window.location.pathname}${hashPrefix}${encoded}`)
    await copyText(url, 'Share link')
  }

  const activeExport = exportTab === 'csv' ? csv : exportTab === 'json' ? json : exportTab === 'python' ? python : go
  const activeExportName =
    exportTab === 'csv'
      ? 'extraction.csv'
      : exportTab === 'json'
        ? 'paste-scraper-project.json'
        : exportTab === 'python'
          ? 'scraper.py'
          : 'scraper.go'
  const activeExportMime =
    exportTab === 'csv'
      ? 'text/csv;charset=utf-8'
      : exportTab === 'json'
        ? 'application/json;charset=utf-8'
        : 'text/plain;charset=utf-8'
  const visibleMessages = [...inference.messages.map((entry) => `${entry.what} ${entry.nextStep}`), ...preview.warnings]
  const debugEnabled = new URLSearchParams(window.location.search).get('debug') === '1'

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
        <section
          className="workspace-panel input-panel"
          aria-labelledby="input-heading"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            void handleFiles(event.dataTransfer.files)
          }}
        >
          <div className="panel-heading">
            <h2 id="input-heading">Source</h2>
            <div className="button-row">
              <input
                ref={fileInputRef}
                type="file"
                accept=".html,.htm,.json,text/html,application/json"
                hidden
                onChange={(event) => {
                  if (event.target.files) {
                    void handleFiles(event.target.files)
                  }
                  event.target.value = ''
                }}
              />
              <button
                type="button"
                className="icon-button"
                title="Upload HTML or project JSON"
                aria-label="Upload HTML or project JSON"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-button"
                title="Read clipboard"
                aria-label="Read clipboard"
                onClick={() => void readClipboard()}
              >
                <Clipboard size={17} aria-hidden="true" />
              </button>
              <button type="button" className="tool-button" onClick={loadSample}>
                <Play size={16} aria-hidden="true" />
                <span>Sample</span>
              </button>
              <button
                type="button"
                className="icon-button"
                title="Clear draft"
                aria-label="Clear draft"
                onClick={() => void resetProject()}
              >
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
            onChange={(event) => {
              setManualOverride(false)
              setProjectWithTimestamp((current) => ({
                ...current,
                html: event.target.value,
              }))
            }}
          />

          <div className="selector-stack">
            <label className="field-label" htmlFor="source-url">
              Source URL
            </label>
            <div className="input-with-icon">
              <Link2 size={15} aria-hidden="true" />
              <input
                id="source-url"
                value={project.sourceUrl ?? ''}
                placeholder="https://example.com/page"
                onChange={(event) => {
                  setManualOverride(false)
                  setProjectWithTimestamp((current) => ({ ...current, sourceUrl: event.target.value || undefined }))
                }}
              />
            </div>
          </div>

          <div className={`inference-card ${inference.status}`}>
            <strong>{inference.shape === 'empty' ? 'Waiting for HTML' : `Detected ${inference.shape}`}</strong>
            <span>
              {confidenceLabel(inference.confidence)} confidence · {preview.rowCount} rows · {inference.strategy}
            </span>
            {inference.nextPageUrl && (
              <span className="next-page-hint">
                Next page:{' '}
                <code title={inference.nextPageUrl}>
                  {inference.nextPageUrl.length > 60
                    ? `${inference.nextPageUrl.slice(0, 60)}…`
                    : inference.nextPageUrl}
                </code>
                <button
                  type="button"
                  className="icon-button"
                  title="Copy next-page URL"
                  aria-label="Copy next-page URL"
                  onClick={() => void copyText(inference.nextPageUrl!, 'Next-page URL')}
                >
                  <Clipboard size={13} aria-hidden="true" />
                </button>
              </span>
            )}
          </div>

          <details className="settings-panel">
            <summary>Settings</summary>
            <label>
              <input
                type="checkbox"
                checked={settings.autoInfer}
                onChange={(event) => setSettings((current) => ({ ...current, autoInfer: event.target.checked }))}
              />
              <span>Infer row pattern and fields after paste/upload</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.includeProvenance}
                onChange={(event) =>
                  setSettings((current) => ({ ...current, includeProvenance: event.target.checked }))
                }
              />
              <span>Include provenance and confidence columns in CSV</span>
            </label>
          </details>

          <div className="control-grid">
            <div>
              <span className="field-label">Picker</span>
              <div className="segmented-control" role="group" aria-label="Picker mode">
                <button type="button" className={pickMode === 'row' ? 'active' : ''} onClick={() => setPickMode('row')}>
                  <MousePointer2 size={15} aria-hidden="true" />
                  <span>Row</span>
                </button>
                <button
                  type="button"
                  className={pickMode === 'field' ? 'active' : ''}
                  onClick={() => setPickMode('field')}
                >
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
              <input
                id="field-name"
                value={fieldName}
                onChange={(event) => setFieldName(event.target.value)}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="attribute">
                Value
              </label>
              <select
                id="attribute"
                value={attribute}
                onChange={(event) => setAttribute(event.target.value as ExtractionAttribute)}
              >
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
              onChange={(event) => {
                setManualOverride(true)
                setProjectWithTimestamp((current) => ({
                  ...current,
                  rowSelector: event.target.value,
                  rowSelectorMode: selectorMode,
                }))
              }}
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
                title="Copy share link"
                aria-label="Copy share link"
                onClick={() => void shareProject()}
              >
                <Share2 size={17} aria-hidden="true" />
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
                <div className="field-rule-card" key={field.id}>
                  <div className="field-rule">
                    <input
                      value={field.name}
                      onChange={(event) => updateField(field.id, { name: event.target.value })}
                    />
                    <select
                      value={field.attribute}
                      onChange={(event) =>
                        updateField(field.id, { attribute: event.target.value as ExtractionAttribute })
                      }
                      aria-label={`${field.name} attribute`}
                    >
                      {attributeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <input
                      value={field.selector}
                      onChange={(event) => updateField(field.id, { selector: event.target.value })}
                      aria-label={`${field.name} selector`}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      title="Remove field"
                      aria-label="Remove field"
                      onClick={() => removeField(field.id)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <p className="field-meta">
                    {(field.fieldType ?? 'text').toUpperCase()} · {confidenceLabel(field.confidence)} confidence
                    {field.reason ? ` · ${field.reason}` : ''}
                  </p>
                </div>
              ))
            )}
          </div>

          {(inference.status === 'low_confidence' || inference.status === 'partial') && !manualOverride && (
            <div className="action-tip" role="status">
              <span>
                {inference.status === 'low_confidence'
                  ? 'Uncertain pattern — click any item in the Picker to auto-detect rows and fields.'
                  : 'Partial match — click one item in the Picker to refine.'}
              </span>
              <button
                type="button"
                className="tip-button"
                onClick={() => {
                  setPickMode('row')
                  setToast('Click any repeating item in the Picker panel.')
                }}
              >
                → Open Picker
              </button>
            </div>
          )}

          {visibleMessages.length > 0 && (
            <div className="warnings" role="status">
              {visibleMessages.slice(0, 4).map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th aria-label="Exclude row" />
                  {project.fields.map((field) => (
                    <th key={field.id}>{field.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.slice(0, 25).map((row, displayIndex) => {
                  const domIndex = preview.rowIndices[displayIndex]
                  return (
                    <tr key={`${domIndex}-${JSON.stringify(row)}`}>
                      <td>
                        <button
                          type="button"
                          className="exclude-row-button"
                          title="Exclude this row (false positive)"
                          aria-label="Exclude row"
                          onClick={() => {
                            setManualOverride(true)
                            setProjectWithTimestamp((current) => ({
                              ...current,
                              rowExclusions: [...(current.rowExclusions ?? []), domIndex],
                            }))
                          }}
                        >
                          ×
                        </button>
                      </td>
                      {project.fields.map((field) => (
                        <td key={field.id}>{row[field.name]}</td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="export-tabs" role="tablist" aria-label="Export format">
            <button type="button" className={exportTab === 'csv' ? 'active' : ''} onClick={() => setExportTab('csv')}>
              <Table size={15} aria-hidden="true" />
              <span>CSV</span>
            </button>
            <button type="button" className={exportTab === 'json' ? 'active' : ''} onClick={() => setExportTab('json')}>
              <FileJson size={15} aria-hidden="true" />
              <span>JSON</span>
            </button>
            <button
              type="button"
              className={exportTab === 'python' ? 'active' : ''}
              onClick={() => setExportTab('python')}
            >
              <FileCode2 size={15} aria-hidden="true" />
              <span>Python</span>
            </button>
            <button type="button" className={exportTab === 'go' ? 'active' : ''} onClick={() => setExportTab('go')}>
              <Database size={15} aria-hidden="true" />
              <span>Go</span>
            </button>
          </div>

          <div className="export-box">
            <button
              type="button"
              className="copy-button"
              onClick={() => void copyText(activeExport, exportTab.toUpperCase())}
            >
              <Clipboard size={15} aria-hidden="true" />
              <span>Copy</span>
            </button>
            <pre>{activeExport}</pre>
          </div>

          {debugEnabled && (
            <details className="debug-panel" open>
              <summary>Debug</summary>
              <pre>{JSON.stringify({ inference, preview, settings }, null, 2)}</pre>
            </details>
          )}
        </section>
      </main>

      <footer className="toast" role="status">
        {toast}
      </footer>
    </div>
  )
}
