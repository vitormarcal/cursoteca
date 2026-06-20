import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CourseSectionList from '../../app/components/CourseSectionList.vue'

describe('CourseSectionList', () => {
  it('renders nested sections', async () => {
    const wrapper = await mountSuspended(CourseSectionList, {
      props: {
        courseSlug: 'sample-course',
        sections: [
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
      }
    })

    expect(wrapper.text()).toContain('Module 01')
    expect(wrapper.text()).toContain('Foundation topics')
    expect(wrapper.text()).toContain('Practice Set')
  })
})
