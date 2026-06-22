import type { CourseSection } from '~/types/course-section'
import type { Lesson } from '~/types/lesson'

export function lessonsInSection(lessons: Lesson[], sectionId: number | null): Lesson[] {
  return lessons
    .filter(lesson => lesson.sectionId === sectionId)
    .toSorted((left, right) => left.position - right.position || left.id - right.id)
}

export function orderedCourseLessons(sections: CourseSection[], lessons: Lesson[]): Lesson[] {
  const ordered = [...lessonsInSection(lessons, null)]

  function visit(items: CourseSection[]) {
    for (const section of items) {
      ordered.push(...lessonsInSection(lessons, section.id))
      visit(section.children)
    }
  }

  visit(sections)
  return ordered
}

export function sectionLessonCount(section: CourseSection, lessons: Lesson[]): number {
  return lessonsInSection(lessons, section.id).length
    + section.children.reduce((total, child) => total + sectionLessonCount(child, lessons), 0)
}

export function sectionContainsLesson(section: CourseSection, lessons: Lesson[], lessonId?: number): boolean {
  if (lessonId === undefined) return false
  return lessons.some(lesson => lesson.sectionId === section.id && lesson.id === lessonId)
    || section.children.some(child => sectionContainsLesson(child, lessons, lessonId))
}
