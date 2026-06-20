import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLessons } from '../../app/composables/useLessons'

const useFetchMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)

describe('useLessons', () => {
  beforeEach(() => {
    useFetchMock.mockReset()
    vi.unstubAllGlobals()
  })

  it('loads lessons for a course', () => {
    useLessons().listLessons(42)

    expect(useFetchMock.mock.calls[0][0]).toBe('/api/courses/42/lessons')
    expect(useFetchMock.mock.calls[0][1]).toEqual({
      key: 'course-42-lessons',
      baseURL: undefined,
      default: expect.any(Function)
    })
  })

  it('loads a lesson detail scoped to its course', () => {
    useLessons().getLesson(42, 7)

    expect(useFetchMock.mock.calls[0][0]).toBe('/api/courses/42/lessons/7')
    expect(useFetchMock.mock.calls[0][1]).toEqual({
      key: 'course-42-lesson-7',
      baseURL: undefined
    })
  })

  it('creates a lesson as multipart data', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({})
    vi.stubGlobal('$fetch', fetchMock)
    const video = new File(['video'], 'lesson.mp4', { type: 'video/mp4' })

    await useLessons().createLesson(42, {
      sectionId: 10,
      title: ' Lesson 01 ',
      description: ' Introduction ',
      video
    })

    const options = fetchMock.mock.calls[0][1]
    expect(fetchMock.mock.calls[0][0]).toBe('/api/courses/42/lessons')
    expect(options.method).toBe('POST')
    expect(options.body.get('sectionId')).toBe('10')
    expect(options.body.get('title')).toBe('Lesson 01')
    expect(options.body.get('description')).toBe('Introduction')
    expect(options.body.get('video')).toBe(video)
  })
})
