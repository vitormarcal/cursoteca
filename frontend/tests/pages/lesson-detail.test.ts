import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import LessonDetailPage from '../../app/pages/courses/[slug]/lessons/[lessonId].vue'

const useFetchMock = vi.hoisted(() => vi.fn())
const useRouteMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useFetch', () => useFetchMock)
mockNuxtImport('useRoute', () => useRouteMock)

const course = {
  id: 42,
  name: 'Sample Course',
  slug: 'sample-course',
  description: 'Course description',
  imageUrl: '/assets/courses/sample-course/image.jpg',
  createdAt: '2026-06-14T13:36:55Z',
  updatedAt: '2026-06-14T13:36:55Z'
}

describe('lesson detail page', () => {
  it('renders player, description and section context', async () => {
    useRouteMock.mockReturnValue({ params: { slug: 'sample-course', lessonId: '7' } })
    useFetchMock.mockResolvedValueOnce({
      data: ref(course),
      pending: ref(false),
      error: ref(null)
    })

    const getLesson = vi.fn().mockResolvedValue({
      data: ref({
        id: 7,
        courseId: 42,
        sectionId: 11,
        sectionPath: [
          { id: 10, title: 'Stage 01', slug: 'stage-01' },
          { id: 11, title: 'Module 01', slug: 'module-01' }
        ],
        resourceGroups: {
          lesson: [{
            id: 20,
            courseId: 42,
            sectionId: null,
            lessonId: 7,
            type: 'LINK',
            scope: 'LESSON',
            title: 'Lesson reference',
            description: 'Reference description',
            url: 'https://example.com/reference',
            fileUrl: null,
            mimeType: null,
            position: 1,
            createdAt: '2026-06-14T13:36:55Z',
            updatedAt: '2026-06-14T13:36:55Z'
          }],
          section: [],
          ancestors: [],
          course: []
        },
        title: 'Lesson 01',
        description: 'Introduction',
        videoUrl: '/assets/courses/sample-course/lessons/video.mp4',
        position: 1,
        createdAt: '2026-06-14T13:36:55Z',
        updatedAt: '2026-06-14T13:36:55Z'
      }),
      pending: ref(false),
      error: ref(null)
    })

    const wrapper = await mountSuspended(LessonDetailPage, {
      global: {
        provide: {
          lessonsApi: {
            createLesson: vi.fn(),
            getLesson,
            listLessons: vi.fn()
          }
        }
      }
    })

    expect(getLesson).toHaveBeenCalledWith(42, 7)
    expect(wrapper.text()).toContain('Lesson 01')
    expect(wrapper.text()).toContain('Stage 01')
    expect(wrapper.text()).toContain('Module 01')
    expect(wrapper.text()).toContain('Introduction')
    expect(wrapper.text()).toContain('Lesson reference')
    expect(wrapper.find('video').attributes('src')).toBe('/assets/courses/sample-course/lessons/video.mp4')
  })

  it('renders not found state when lesson lookup fails', async () => {
    useRouteMock.mockReturnValue({ params: { slug: 'sample-course', lessonId: '99' } })
    useFetchMock.mockResolvedValueOnce({
      data: ref(course),
      pending: ref(false),
      error: ref(null)
    })

    const wrapper = await mountSuspended(LessonDetailPage, {
      global: {
        provide: {
          lessonsApi: {
            createLesson: vi.fn(),
            getLesson: vi.fn().mockResolvedValue({
              data: ref(null),
              pending: ref(false),
              error: ref(new Error('not found'))
            }),
            listLessons: vi.fn()
          }
        }
      }
    })

    expect(wrapper.text()).toContain('Aula não encontrada')
    expect(wrapper.find('video').exists()).toBe(false)
  })
})
