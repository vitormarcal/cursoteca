import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import CourseContentManager from '../../app/components/CourseContentManager.vue'

const timestamp = '2026-06-21T14:00:00Z'
const sections = [
  {
    id: 10,
    courseId: 1,
    parentId: null,
    title: 'First section',
    slug: 'first-section',
    description: '',
    position: 1,
    children: [],
    createdAt: timestamp,
    updatedAt: timestamp
  },
  {
    id: 11,
    courseId: 1,
    parentId: null,
    title: 'Second section',
    slug: 'second-section',
    description: '',
    position: 2,
    children: [],
    createdAt: timestamp,
    updatedAt: timestamp
  }
]
const lessons = [{
  id: 20,
  courseId: 1,
  sectionId: 10,
  title: 'Lesson',
  description: '',
  videoUrl: '/lesson.mp4',
  position: 1,
  completed: false,
  completedAt: null,
  lastAccessedAt: null,
  createdAt: timestamp,
  updatedAt: timestamp
}]

describe('CourseContentManager', () => {
  it('emits sibling ordering and lesson edits', async () => {
    const wrapper = await mountSuspended(CourseContentManager, { props: { sections, lessons } })

    await wrapper.find('button[aria-label="Descer seção First section"]').trigger('click')
    expect(wrapper.emitted('reorderSections')).toEqual([[null, [11, 10]]])

    const lessonItem = wrapper.find('.content-manager-item.is-lesson')
    await lessonItem.find('summary').trigger('click')
    await lessonItem.find('input').setValue('Updated lesson')
    await lessonItem.find('select').setValue('11')
    await lessonItem.find('form').trigger('submit')

    expect(wrapper.emitted('updateLesson')).toEqual([[20, {
      sectionId: 11,
      title: 'Updated lesson',
      description: ''
    }]])
  })
})
