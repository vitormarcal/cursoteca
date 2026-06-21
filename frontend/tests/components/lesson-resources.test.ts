import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LessonResources from '../../app/components/LessonResources.vue'

const resource = (id: number, title: string) => ({
  id,
  courseId: 1,
  sectionId: null,
  lessonId: null,
  type: 'LINK' as const,
  scope: 'COURSE' as const,
  title,
  description: '',
  url: `https://example.com/${id}`,
  position: 1,
  createdAt: '2026-06-14T13:36:55Z',
  updatedAt: '2026-06-14T13:36:55Z'
})

describe('LessonResources', () => {
  it('renders lesson, section, ancestor and course groups', async () => {
    const wrapper = await mountSuspended(LessonResources, {
      props: {
        groups: {
          lesson: [resource(1, 'Lesson link')],
          section: [resource(2, 'Section link')],
          ancestors: [{ section: { id: 3, title: 'Stage', slug: 'stage' }, resources: [resource(3, 'Stage link')] }],
          course: [resource(4, 'Course link')]
        }
      }
    })

    expect(wrapper.text()).toContain('Material desta aula')
    expect(wrapper.text()).toContain('Material desta seção')
    expect(wrapper.text()).toContain('Material de Stage')
    expect(wrapper.text()).toContain('Material do curso')
    expect(wrapper.findAll('a')).toHaveLength(4)
  })
})
