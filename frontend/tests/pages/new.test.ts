import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
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
})
