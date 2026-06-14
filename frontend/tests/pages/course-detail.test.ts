import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import CourseDetailPage from '../../app/pages/courses/[slug].vue'

const useFetchMock = vi.hoisted(() => vi.fn())
const useRouteMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)
mockNuxtImport('useRoute', () => useRouteMock)

describe('course detail page', () => {
  it('renders structured backend errors when section creation fails', async () => {
    useRouteMock.mockReturnValue({
      params: {
        slug: 'sample-language-course'
      }
    })
    useFetchMock.mockResolvedValueOnce({
      data: ref({
        id: 42,
        name: 'Sample Language Course',
        slug: 'sample-language-course',
        description: 'Fictional course used in automated tests',
        imageUrl: '/assets/courses/sample-language-course/image.jpg',
        createdAt: '2026-06-14T13:36:55.721602Z',
        updatedAt: '2026-06-14T13:36:55.721602Z'
      }),
      pending: ref(false),
      error: ref(null)
    })

    const createSectionMock = vi.fn().mockRejectedValueOnce({
      data: {
        status: 400,
        code: 1002,
        description: 'Course section input is invalid.',
        details: {
          title: 'title is required'
        }
      }
    })

    const wrapper = await mountSuspended(CourseDetailPage, {
      global: {
        provide: {
          courseSectionsApi: {
            createSection: createSectionMock,
            listSections: vi.fn().mockResolvedValue({
              data: ref([]),
              pending: ref(false),
              error: ref(null),
              refresh: vi.fn()
            })
          }
        }
      }
    })

    await wrapper.findComponent({ name: 'CourseSectionForm' }).vm.$emit('submit', {
      parentId: null,
      title: '',
      description: ''
    })
    await nextTick()
    await nextTick()

    expect(wrapper.text()).toContain('Course section input is invalid. title is required')
  })
})
