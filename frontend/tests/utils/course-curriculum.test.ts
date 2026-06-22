import { describe, expect, it } from 'vitest'
import { orderedCourseLessons, sectionLessonCount } from '../../app/utils/course-curriculum'
import type { CourseSection } from '../../app/types/course-section'
import type { Lesson } from '../../app/types/lesson'

const timestamp = '2026-06-14T13:36:55Z'
const sections: CourseSection[] = [{
  id: 10,
  courseId: 1,
  parentId: null,
  title: 'Module',
  slug: 'module',
  description: '',
  position: 1,
  children: [{
    id: 11,
    courseId: 1,
    parentId: 10,
    title: 'Topic',
    slug: 'topic',
    description: '',
    position: 1,
    children: [],
    createdAt: timestamp,
    updatedAt: timestamp
  }],
  createdAt: timestamp,
  updatedAt: timestamp
}]

function lesson(id: number, sectionId: number | null, position: number): Lesson {
  return {
    id,
    courseId: 1,
    sectionId,
    title: `Lesson ${id}`,
    description: '',
    videoUrl: `/${id}.mp4`,
    position,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

describe('course curriculum ordering', () => {
  it('orders unsectioned, parent and nested lessons consistently', () => {
    const lessons = [lesson(4, 11, 1), lesson(2, 10, 2), lesson(1, null, 1), lesson(3, 10, 1)]

    expect(orderedCourseLessons(sections, lessons).map(item => item.id)).toEqual([1, 3, 2, 4])
    expect(sectionLessonCount(sections[0]!, lessons)).toBe(3)
  })
})
