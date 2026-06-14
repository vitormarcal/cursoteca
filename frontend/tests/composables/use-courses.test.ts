import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import { useCourses } from '../../app/composables/useCourses'

const useFetchMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)

describe('useCourses', () => {
  it('loads courses from the courses API', () => {
    const { listCourses } = useCourses()
    listCourses()

    expect(useFetchMock.mock.calls[0][0]).toBe('/api/courses')
    expect(useFetchMock.mock.calls[0][1]).toEqual({
      default: expect.any(Function)
    })
  })

  it('posts multipart course data to the courses API', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({})
    vi.stubGlobal('$fetch', fetchMock)

    const file = new File(['image'], 'cover.jpg', { type: 'image/jpeg' })
    const { createCourse } = useCourses()

    await createCourse({
      name: ' Sample Language Course ',
      description: ' Fictional course used in automated tests ',
      image: file
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/courses', {
      method: 'POST',
      body: expect.any(FormData)
    })

    const formData = fetchMock.mock.calls[0][1].body as FormData
    expect(formData.get('name')).toBe('Sample Language Course')
    expect(formData.get('description')).toBe('Fictional course used in automated tests')
    const image = formData.get('image') as File
    expect(image.name).toBe('cover.jpg')
    expect(image.type).toBe('image/jpeg')
  })
})
