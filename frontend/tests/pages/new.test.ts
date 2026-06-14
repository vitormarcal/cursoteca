import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import NewCoursePage from '../../app/pages/courses/new.vue'

const navigateToMock = vi.hoisted(() => vi.fn())

mockNuxtImport('navigateTo', () => navigateToMock)

describe('new course page', () => {
  it('creates a course from submitted form data and navigates back to the index', async () => {
    navigateToMock.mockResolvedValueOnce(undefined)
    const createCourseMock = vi.fn().mockResolvedValueOnce({})

    const wrapper = await mountSuspended(NewCoursePage, {
      global: {
        provide: {
          coursesApi: {
            createCourse: createCourseMock
          }
        }
      }
    })

    const file = new File(['image'], 'cover.jpg', { type: 'image/jpeg' })
    await wrapper.findComponent({ name: 'CourseForm' }).vm.$emit('submit', {
      name: 'Sample Language Course',
      description: 'Fictional course used in automated tests',
      image: file
    })

    expect(createCourseMock).toHaveBeenCalledWith({
      name: 'Sample Language Course',
      description: 'Fictional course used in automated tests',
      image: file
    })
    expect(navigateToMock).toHaveBeenCalledWith('/')
  })

  it('renders structured backend errors when course creation fails', async () => {
    navigateToMock.mockResolvedValueOnce(undefined)
    const createCourseMock = vi.fn().mockRejectedValueOnce({
      data: {
        status: 400,
        code: 1001,
        description: 'Course input is invalid.',
        details: {
          name: 'name is required'
        }
      }
    })

    const wrapper = await mountSuspended(NewCoursePage, {
      global: {
        provide: {
          coursesApi: {
            createCourse: createCourseMock
          }
        }
      }
    })

    await wrapper.findComponent({ name: 'CourseForm' }).vm.$emit('submit', {
      name: '',
      description: 'Fictional course used in automated tests',
      image: new File(['image'], 'cover.jpg', { type: 'image/jpeg' })
    })
    await nextTick()
    await nextTick()

    expect(wrapper.text()).toContain('Course input is invalid. name is required')
  })
})
