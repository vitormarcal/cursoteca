import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LessonList from '../../app/components/LessonList.vue'

describe('LessonList', () => {
  it('renders lesson metadata and link without embedding a video player', async () => {
    const wrapper = await mountSuspended(LessonList, {
      props: {
        courseSlug: 'sample',
        lessons: [{
          id: 1,
          courseId: 2,
          sectionId: null,
          title: 'Lesson 01',
          description: 'Introduction',
          videoUrl: '/assets/courses/sample/lessons/video.mp4',
          position: 1,
          createdAt: '2026-06-14T13:36:55Z',
          updatedAt: '2026-06-14T13:36:55Z'
        }]
      }
    })

    expect(wrapper.text()).toContain('Lesson 01')
    expect(wrapper.text()).toContain('Introduction')
    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.find('a').attributes('href')).toBe('/courses/sample/lessons/1')
  })
})
