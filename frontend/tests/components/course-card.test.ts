import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CourseCard from '../../app/components/CourseCard.vue'

describe('CourseCard', () => {
  it('links directly to the last accessed lesson', async () => {
    const wrapper = await mountSuspended(CourseCard, {
      props: {
        course: {
          id: 1,
          name: 'Sample Course',
          slug: 'sample-course',
          description: 'Description',
          imageUrl: '/cover.jpg',
          continueLessonId: 7,
          lastAccessedAt: '2026-06-21T14:00:00Z',
          createdAt: '2026-06-14T13:36:55Z',
          updatedAt: '2026-06-14T13:36:55Z'
        }
      }
    })

    expect(wrapper.text()).toContain('Continuar')
    expect(wrapper.find('a[href="/courses/sample-course/lessons/7"]').exists()).toBe(true)
  })
})
