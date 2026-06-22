export type LessonDownloadStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'

export type LessonDownloadJob = {
  id: number
  courseId: number
  sectionId: number | null
  lessonId: number | null
  title: string
  description: string
  sourceUrl: string
  status: LessonDownloadStatus
  progress: number
  log: string
  error: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  updatedAt: string
}

export type CreateLessonDownloadInput = {
  sectionId: number | null
  title: string
  description: string
  url: string
}
