import type { CourseResource } from './resource'

export type Lesson = {
  id: number
  courseId: number
  sectionId: number | null
  title: string
  description: string
  videoUrl: string
  position: number
  completed: boolean
  completedAt: string | null
  lastAccessedAt: string | null
  createdAt: string
  updatedAt: string
}

export type LessonSection = {
  id: number
  title: string
  slug: string
}

export type LessonDetail = Lesson & {
  sectionPath: LessonSection[]
  resourceGroups: {
    lesson: CourseResource[]
    section: CourseResource[]
    ancestors: Array<{
      section: LessonSection
      resources: CourseResource[]
    }>
    course: CourseResource[]
  }
}

export type CreateLessonInput = {
  sectionId: number | null
  title: string
  description: string
  video: File
}

export type UpdateLessonInput = {
  sectionId: number | null
  title: string
  description: string
}
