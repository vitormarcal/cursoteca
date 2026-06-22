import type { CreateLessonDownloadInput, LessonDownloadJob } from '~/types/lesson-download'
import { hasInjectionContext, inject } from 'vue'

export type LessonDownloadsApi = {
  createDownload: (courseId: number, input: CreateLessonDownloadInput) => Promise<LessonDownloadJob>
  listDownloads: (courseId: number) => ReturnType<typeof useFetch<LessonDownloadJob[]>>
}

export function useLessonDownloads(): LessonDownloadsApi {
  const injectedApi = hasInjectionContext() ? inject<LessonDownloadsApi | null>('lessonDownloadsApi', null) : null
  if (injectedApi) return injectedApi

  function listDownloads(courseId: number) {
    return useFetch<LessonDownloadJob[]>(`/api/courses/${courseId}/lesson-downloads`, {
      key: `course-${courseId}-lesson-downloads`,
      baseURL: backendBaseUrl(),
      default: () => []
    })
  }

  function createDownload(courseId: number, input: CreateLessonDownloadInput) {
    return $fetch<LessonDownloadJob>(`/api/courses/${courseId}/lesson-downloads`, {
      baseURL: backendBaseUrl(),
      method: 'POST',
      body: {
        ...input,
        title: input.title.trim(),
        description: input.description.trim(),
        url: input.url.trim()
      }
    })
  }

  return { createDownload, listDownloads }
}
