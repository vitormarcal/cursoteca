import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LessonDownloadList from '../../app/components/LessonDownloadList.vue'

describe('LessonDownloadList', () => {
  it('renders progress and failure details', async () => {
    const wrapper = await mountSuspended(LessonDownloadList, {
      props: {
        jobs: [
          {
            id: 1, courseId: 42, sectionId: null, lessonId: null, title: 'Running lesson', description: '',
            sourceUrl: 'https://example.com/1', status: 'RUNNING', progress: 37, log: '', error: null,
            createdAt: '', startedAt: '', finishedAt: null, updatedAt: ''
          },
          {
            id: 2, courseId: 42, sectionId: null, lessonId: null, title: 'Failed lesson', description: '',
            sourceUrl: 'https://example.com/2', status: 'FAILED', progress: 0, log: '', error: 'Download failed',
            createdAt: '', startedAt: '', finishedAt: '', updatedAt: ''
          }
        ]
      }
    })

    expect(wrapper.text()).toContain('Baixando · 37%')
    expect(wrapper.find('progress').attributes('value')).toBe('37')
    expect(wrapper.text()).toContain('Download failed')
  })
})
