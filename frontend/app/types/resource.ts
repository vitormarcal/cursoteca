export type ResourceScope = 'COURSE' | 'SECTION' | 'LESSON'

export type CourseResource = {
  id: number
  courseId: number
  sectionId: number | null
  lessonId: number | null
  type: 'LINK' | 'FILE'
  scope: ResourceScope
  title: string
  description: string
  url: string | null
  fileUrl: string | null
  mimeType: string | null
  position: number
  createdAt: string
  updatedAt: string
}

export type ResourceTarget = {
  scope: ResourceScope
  sectionId?: number
  lessonId?: number
  label: string
}

export type CreateResourceLinkInput = {
  scope: ResourceScope
  sectionId: number | null
  lessonId: number | null
  title: string
  description: string
  url: string
}

export type CreateResourceFileInput = {
  scope: ResourceScope
  sectionId: number | null
  lessonId: number | null
  title: string
  description: string
  file: File
}
