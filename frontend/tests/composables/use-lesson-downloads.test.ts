import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLessonDownloads } from '../../app/composables/useLessonDownloads'

const useFetchMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useFetch', () => useFetchMock)

describe('useLessonDownloads', () => {
  beforeEach(() => {
    useFetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('loads jobs with a stable fetch key', () => {
    useLessonDownloads().listDownloads(42)

    expect(useFetchMock.mock.calls[0][0]).toBe('/api/courses/42/lesson-downloads')
    expect(useFetchMock.mock.calls[0][1]).toEqual({
      key: 'course-42-lesson-downloads',
      baseURL: undefined,
      default: expect.any(Function)
    })
  })

  it('creates a normalized download job', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({})
    vi.stubGlobal('$fetch', fetchMock)

    await useLessonDownloads().createDownload(42, {
      sectionId: 10,
      title: ' Lesson 01 ',
      description: ' Introduction ',
      url: ' https://example.com/video '
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/courses/42/lesson-downloads', expect.objectContaining({
      method: 'POST',
      body: {
        sectionId: 10,
        title: 'Lesson 01',
        description: 'Introduction',
        url: 'https://example.com/video'
      }
    }))
  })
})
