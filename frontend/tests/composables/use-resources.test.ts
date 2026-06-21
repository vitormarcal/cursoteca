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
})
