import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import IndexPage from '../../app/pages/index.vue'

const useFetchMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)

describe('courses index page', () => {
  it('renders courses loaded from the API', async () => {
    useFetchMock.mockResolvedValueOnce({
      data: ref([
        {
          id: 1,
          name: 'Sample Language Course',
          slug: 'sample-language-course',
          description: 'Fictional course used in automated tests',
          imageUrl: '/assets/courses/sample-language-course/image.jpg',
          continueLessonId: 7,
          lastAccessedAt: '2026-06-21T14:00:00Z',
          createdAt: '2026-06-14T13:36:55.721602Z',
          updatedAt: '2026-06-14T13:36:55.721602Z'
        }
      ]),
      pending: ref(false),
      error: ref(null),
      refresh: vi.fn()
    })

    const wrapper = await mountSuspended(IndexPage)

    expect(useFetchMock.mock.calls[0][0]).toBe('/api/courses')
    expect(useFetchMock.mock.calls[0][1]).toEqual({
      key: 'courses-list',
      baseURL: undefined,
      default: expect.any(Function)
    })
    expect(wrapper.text()).toContain('Sample Language Course')
    expect(wrapper.text()).toContain('Cadastrar curso')
    expect(wrapper.findComponent({ name: 'CourseCard' }).exists()).toBe(true)
    expect(wrapper.find('img').attributes('src')).toBe('/assets/courses/sample-language-course/image.jpg')
    expect(wrapper.find('a[href="/courses/sample-language-course/lessons/7"]').exists()).toBe(true)
  })
})
