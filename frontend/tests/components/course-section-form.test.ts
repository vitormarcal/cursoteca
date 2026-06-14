import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CourseSectionForm from '../../app/components/CourseSectionForm.vue'
import type { CourseSection } from '../../app/types/course-section'

const sections: CourseSection[] = [
  {
    id: 10,
    courseId: 1,
    parentId: null,
    title: 'Module 01',
    slug: 'module-01',
    description: 'Foundation topics',
    position: 1,
    createdAt: '2026-06-14T13:36:55.721602Z',
    updatedAt: '2026-06-14T13:36:55.721602Z',
    children: [
      {
        id: 11,
        courseId: 1,
        parentId: 10,
        title: 'Practice Set',
        slug: 'practice-set',
        description: '',
        position: 1,
        createdAt: '2026-06-14T13:36:55.721602Z',
        updatedAt: '2026-06-14T13:36:55.721602Z',
        children: []
      }
    ]
  }
]

describe('CourseSectionForm', () => {
  it('emits root section data', async () => {
    const wrapper = await mountSuspended(CourseSectionForm, {
      props: {
        sections
      }
    })

    await wrapper.find('input[name="title"]').setValue('Module 02')
    await wrapper.find('textarea[name="description"]').setValue('Next topics')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          parentId: null,
          title: 'Module 02',
          description: 'Next topics'
        }
      ]
    ])
  })

  it('emits child section data with selected parent', async () => {
    const wrapper = await mountSuspended(CourseSectionForm, {
      props: {
        sections
      }
    })

    await wrapper.find('select[name="parentId"]').setValue('10')
    await wrapper.find('input[name="title"]').setValue('Lesson Group')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([
      [
        {
          parentId: 10,
          title: 'Lesson Group',
          description: ''
        }
      ]
    ])
  })
})
