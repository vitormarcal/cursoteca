import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useResources } from '../../app/composables/useResources'

describe('useResources', () => {
  beforeEach(() => vi.unstubAllGlobals())

  it('creates a trimmed resource link', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('$fetch', fetchMock)

    await useResources().createLink(42, {
      scope: 'SECTION',
      sectionId: 10,
      lessonId: null,
      title: ' Reference ',
      description: ' Notes ',
      url: ' https://example.com '
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/courses/42/resources/links', {
      baseURL: undefined,
      method: 'POST',
      body: {
        scope: 'SECTION',
        sectionId: 10,
        lessonId: null,
        title: 'Reference',
        description: 'Notes',
        url: 'https://example.com'
      }
    })
  })

  it('uploads a resource file as multipart data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({})
    vi.stubGlobal('$fetch', fetchMock)
    const file = new File(['pdf'], 'material.pdf', { type: 'application/pdf' })

    await useResources().createFile(42, {
      scope: 'LESSON',
      sectionId: null,
      lessonId: 7,
      title: ' Material ',
      description: ' Notes ',
      file
    })

    const options = fetchMock.mock.calls[0][1]
    expect(fetchMock.mock.calls[0][0]).toBe('/api/courses/42/resources/files')
    expect(options.method).toBe('POST')
    expect(options.body.get('scope')).toBe('LESSON')
    expect(options.body.get('lessonId')).toBe('7')
    expect(options.body.get('title')).toBe('Material')
    expect(options.body.get('file')).toBe(file)
  })
})
