import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import LessonForm from '../../app/components/LessonForm.vue'
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

describe('LessonForm', () => {
  it('emits lesson data with selected section and video', async () => {
    const wrapper = await mountSuspended(LessonForm, { props: { sections } })
    const video = new File(['video'], 'lesson.mp4', { type: 'video/mp4' })
    const videoInput = wrapper.find<HTMLInputElement>('input[name="video"]')
    Object.defineProperty(videoInput.element, 'files', { value: [video] })

    await wrapper.find('select[name="sectionId"]').setValue('10')
    await wrapper.find('input[name="title"]').setValue('Lesson 01')
    await wrapper.find('textarea[name="description"]').setValue('Introduction')
    await videoInput.trigger('change')
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toEqual([[
      {
        sectionId: 10,
        title: 'Lesson 01',
        description: 'Introduction',
        video
      }
    ]])
  })
})
