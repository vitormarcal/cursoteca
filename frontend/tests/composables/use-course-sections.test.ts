import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCourseSections } from '../../app/composables/useCourseSections'

const useFetchMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)

describe('useCourseSections', () => {
  beforeEach(() => {
    useFetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('loads sections for a course', () => {
    const { listSections } = useCourseSections()
    listSections(42)

    expect(useFetchMock.mock.calls[0][0]).toBe('/api/courses/42/sections')
    expect(useFetchMock.mock.calls[0][1]).toEqual({
      key: 'course-42-sections',
      baseURL: undefined,
      default: expect.any(Function)
    })
  })

  it('creates a section with trimmed fields', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({})
    vi.stubGlobal('$fetch', fetchMock)

    const { createSection } = useCourseSections()
    await createSection(42, {
      parentId: 10,
      title: ' Module 01 ',
      description: ' Foundation topics '
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/courses/42/sections', {
      baseURL: undefined,
      method: 'POST',
      body: {
        parentId: 10,
        title: 'Module 01',
        description: 'Foundation topics'
      }
    })
  })
})
