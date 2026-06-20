export type Lesson = {
  id: number
  courseId: number
  sectionId: number | null
  title: string
  description: string
  videoUrl: string
  position: number
  createdAt: string
  updatedAt: string
}

export type CreateLessonInput = {
  sectionId: number | null
  title: string
  description: string
  video: File
}
