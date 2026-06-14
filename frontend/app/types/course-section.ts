export type CourseSection = {
  id: number
  courseId: number
  parentId: number | null
  title: string
  slug: string
  description: string
  position: number
  children: CourseSection[]
  createdAt: string
  updatedAt: string
}

export type CreateCourseSectionInput = {
  parentId: number | null
  title: string
  description: string
}
