import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import CourseManagePage from '../../app/pages/courses/[slug]/manage.vue'

const useFetchMock = vi.hoisted(() => vi.fn())
const useRouteMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)
mockNuxtImport('useRoute', () => useRouteMock)

describe('course management page', () => {
  it('keeps content creation tools in a dedicated route', async () => {
    useRouteMock.mockReturnValue({ params: { slug: 'sample-course' } })
    useFetchMock.mockResolvedValueOnce({
      data: ref({
        id: 42,
        name: 'Sample Course',
        slug: 'sample-course',
        description: 'Course description',
        imageUrl: '/assets/courses/sample-course/image.jpg',
        createdAt: '2026-06-14T13:36:55Z',
        updatedAt: '2026-06-14T13:36:55Z'
      }),
      pending: ref(false),
      error: ref(null)
    })

    const emptyState = () => ({ data: ref([]), pending: ref(false), error: ref(null), refresh: vi.fn() })
    const wrapper = await mountSuspended(CourseManagePage, {
      global: {
        provide: {
          courseSectionsApi: { createSection: vi.fn(), listSections: vi.fn().mockResolvedValue(emptyState()) },
          lessonsApi: { createLesson: vi.fn(), getLesson: vi.fn(), listLessons: vi.fn().mockResolvedValue(emptyState()) },
          lessonDownloadsApi: { createDownload: vi.fn(), listDownloads: vi.fn().mockResolvedValue(emptyState()) }
        }
      }
    })

    expect(wrapper.findComponent({ name: 'LessonDownloadForm' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'LessonForm' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'CourseSectionForm' }).exists()).toBe(true)
    expect(wrapper.find('a[href="/courses/sample-course"]').exists()).toBe(true)
  })
})
