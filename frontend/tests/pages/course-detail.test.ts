import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import CourseDetailPage from '../../app/pages/courses/[slug]/index.vue'

const useFetchMock = vi.hoisted(() => vi.fn())
const useRouteMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)
mockNuxtImport('useRoute', () => useRouteMock)

describe('course detail page', () => {
  it('keeps management actions outside the study flow', async () => {
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

    const wrapper = await mountSuspended(CourseDetailPage, {
      global: {
        provide: {
          courseSectionsApi: {
            createSection: vi.fn(),
            listSections: vi.fn().mockResolvedValue({
              data: ref([]),
              pending: ref(false),
              error: ref(null),
              refresh: vi.fn()
            })
          },
          lessonsApi: {
            createLesson: vi.fn(),
            getLesson: vi.fn(),
            listLessons: vi.fn().mockResolvedValue({
              data: ref([]),
              pending: ref(false),
              error: ref(null),
              refresh: vi.fn()
            })
          }
        }
      }
    })

    expect(wrapper.findComponent({ name: 'CourseSectionForm' }).exists()).toBe(false)
    expect(wrapper.find('a[href="/courses/sample-language-course/manage"]').exists()).toBe(true)
  })

  it('renders lessons returned by the backend', async () => {
    useRouteMock.mockReturnValue({ params: { slug: 'sample-course' } })
    useFetchMock.mockResolvedValueOnce({
      data: ref({
        id: 42,
        name: 'Sample Course',
        slug: 'sample-course',
        description: 'Course description',
        imageUrl: '/assets/courses/sample-course/image.jpg',
        continueLessonId: 1,
        lastAccessedAt: '2026-06-21T14:00:00Z',
        createdAt: '2026-06-14T13:36:55Z',
        updatedAt: '2026-06-14T13:36:55Z'
      }),
      pending: ref(false),
      error: ref(null)
    })

    const wrapper = await mountSuspended(CourseDetailPage, {
      global: {
        provide: {
          courseSectionsApi: {
            createSection: vi.fn(),
            listSections: vi.fn().mockResolvedValue({
              data: ref([]),
              pending: ref(false),
              error: ref(null),
              refresh: vi.fn()
            })
          },
          lessonsApi: {
            createLesson: vi.fn(),
            getLesson: vi.fn(),
            listLessons: vi.fn().mockResolvedValue({
              data: ref([{
                id: 1,
                courseId: 42,
                sectionId: null,
                title: 'Introduction',
                description: 'First lesson',
                videoUrl: '/assets/courses/sample-course/lessons/video.mp4',
                position: 1,
                createdAt: '2026-06-14T13:36:55Z',
                updatedAt: '2026-06-14T13:36:55Z'
              }]),
              pending: ref(false),
              error: ref(null),
              refresh: vi.fn()
            })
          }
        }
      }
    })

    expect(wrapper.text()).toContain('Introduction')
    expect(wrapper.text()).toContain('Continuar curso')
    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.find('a[href="/courses/sample-course/lessons/1"]').exists()).toBe(true)
  })
})
