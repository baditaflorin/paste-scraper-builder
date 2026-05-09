import { describe, expect, it } from 'vitest'
import { blankProject } from './types'
import { decodeProjectJson, decodeProjectState, encodeProjectState, projectStateJson } from './projectState'

describe('project state codec', () => {
  it('round-trips hash encoded project state', () => {
    const project = {
      ...blankProject(),
      html: '<article><h2>Alpha</h2></article>',
      rowSelector: 'article',
      fields: [
        { id: 'title', name: 'title', selector: 'h2', selectorMode: 'css' as const, attribute: 'text' as const },
      ],
      updatedAt: '2026-05-09T00:00:00.000Z',
    }

    expect(decodeProjectState(encodeProjectState(project))).toEqual(project)
  })

  it('validates project JSON imports', () => {
    const project = { ...blankProject(), updatedAt: '2026-05-09T00:00:00.000Z' }
    expect(decodeProjectJson(projectStateJson(project))).toEqual(project)
    expect(decodeProjectJson('{"bad":true}')).toBeNull()
  })
})
