import type { CreateLessonInput, Lesson, LessonDetail } from '~/types/lesson'
import { hasInjectionContext, inject } from 'vue'

export type LessonsApi = {
  createLesson: (courseId: number, input: CreateLessonInput) => Promise<Lesson>
  getLesson: (courseId: number, lessonId: number) => ReturnType<typeof useFetch<LessonDetail>>
  listLessons: (courseId: number) => ReturnType<typeof useFetch<Lesson[]>>
}

export function useLessons(): LessonsApi {
  const injectedApi = hasInjectionContext() ? inject<LessonsApi | null>('lessonsApi', null) : null
  if (injectedApi) {
    return injectedApi
  }

  function listLessons(courseId: number) {
    return useFetch<Lesson[]>(`/api/courses/${courseId}/lessons`, {
      key: `course-${courseId}-lessons`,
      baseURL: backendBaseUrl(),
      default: () => []
    })
  }

  function getLesson(courseId: number, lessonId: number) {
    return useFetch<LessonDetail>(`/api/courses/${courseId}/lessons/${lessonId}`, {
      key: `course-${courseId}-lesson-${lessonId}`,
      baseURL: backendBaseUrl()
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
    getLesson,
    listLessons
  }
}
