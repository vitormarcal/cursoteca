export type Course = {
  id: number
  name: string
  slug: string
  description: string
  imageUrl: string
  continueLessonId: number | null
  lastAccessedAt: string | null
  createdAt: string
  updatedAt: string
}
