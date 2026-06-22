import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LessonDownloadForm from '../../app/components/LessonDownloadForm.vue'
import type { CourseSection } from '../../app/types/course-section'

const sections: CourseSection[] = [{
  id: 10,
  courseId: 1,
  parentId: null,
  title: 'Module 01',
  slug: 'module-01',
  description: '',
  position: 1,
  createdAt: '2026-06-14T13:36:55Z',
  updatedAt: '2026-06-14T13:36:55Z',
  children: []
}]

describe('LessonDownloadForm', () => {
  it('emits URL download data with selected section', async () => {
    const wrapper = await mountSuspended(LessonDownloadForm, { props: { sections } })

    await wrapper.find('select[name="downloadSectionId"]').setValue('10')
    await wrapper.find('input[name="downloadTitle"]').setValue('Lesson 01')
    await wrapper.find('textarea[name="downloadDescription"]').setValue('Introduction')
    await wrapper.find('input[name="downloadUrl"]').setValue('https://example.com/video')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[
      {
        sectionId: 10,
        title: 'Lesson 01',
        description: 'Introduction',
        url: 'https://example.com/video'
      }
    ]])
  })
})
