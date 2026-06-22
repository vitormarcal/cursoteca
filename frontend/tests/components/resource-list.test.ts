import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ResourceList from '../../app/components/ResourceList.vue'

const base = {
  courseId: 1,
  sectionId: null,
  lessonId: null,
  scope: 'COURSE' as const,
  description: '',
  position: 1,
  createdAt: '2026-06-14T13:36:55Z',
  updatedAt: '2026-06-14T13:36:55Z'
}

describe('ResourceList', () => {
  it('renders PDF link and audio player', async () => {
    const wrapper = await mountSuspended(ResourceList, {
      props: {
        resources: [
          {
            ...base,
            id: 1,
            type: 'FILE',
            title: 'Workbook',
            url: null,
            fileUrl: '/assets/workbook.pdf',
            mimeType: 'application/pdf'
          },
          {
            ...base,
            id: 2,
            type: 'FILE',
            title: 'Pronunciation',
            url: null,
            fileUrl: '/assets/audio.mp3',
            mimeType: 'audio/mpeg'
          }
        ]
      }
    })

    expect(wrapper.find('a[href="/assets/workbook.pdf"]').exists()).toBe(true)
    expect(wrapper.find('audio').attributes('src')).toBe('/assets/audio.mp3')
  })
})
