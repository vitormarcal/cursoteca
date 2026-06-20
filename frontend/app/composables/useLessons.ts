import type { CreateLessonInput, Lesson } from '~/types/lesson'
import { hasInjectionContext, inject } from 'vue'

export type LessonsApi = {
  createLesson: (courseId: number, input: CreateLessonInput) => Promise<Lesson>
  listLessons: (courseId: number) => ReturnType<typeof useFetch<Lesson[]>>
}

export function useLessons(): LessonsApi {
  const injectedApi = hasInjectionContext() ? inject<LessonsApi | null>('lessonsApi', null) : null
  if (injectedApi) {
    return injectedApi
  }

  function listLessons(courseId: number) {
    return useFetch<Lesson[]>(`/api/courses/${courseId}/lessons`, {
      baseURL: backendBaseUrl(),
      default: () => []
    })
  }

  function createLesson(courseId: number, input: CreateLessonInput) {
    const formData = new FormData()
    if (input.sectionId !== null) {
      formData.append('sectionId', String(input.sectionId))
    }
    formData.append('title', input.title.trim())
    formData.append('description', input.description.trim())
    formData.append('video', input.video)

    return $fetch<Lesson>(`/api/courses/${courseId}/lessons`, {
      baseURL: backendBaseUrl(),
      method: 'POST',
      body: formData
    })
  }

  return {
    createLesson,
    listLessons
  }
}
