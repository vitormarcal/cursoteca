import type { CreateLessonInput, Lesson, LessonDetail, UpdateLessonInput } from '~/types/lesson'
import { hasInjectionContext, inject } from 'vue'

export type LessonsApi = {
  createLesson: (courseId: number, input: CreateLessonInput) => Promise<Lesson>
  getLesson: (courseId: number, lessonId: number) => ReturnType<typeof useFetch<LessonDetail>>
  listLessons: (courseId: number) => ReturnType<typeof useFetch<Lesson[]>>
  recordLessonAccess: (courseId: number, lessonId: number) => Promise<Lesson>
  setLessonCompleted: (courseId: number, lessonId: number, completed: boolean) => Promise<Lesson>
  reorderLessons: (courseId: number, sectionId: number | null, lessonIds: number[]) => Promise<Lesson[]>
  updateLesson: (courseId: number, lessonId: number, input: UpdateLessonInput) => Promise<Lesson>
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

  function setLessonCompleted(courseId: number, lessonId: number, completed: boolean) {
    return $fetch<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}/completion`, {
      baseURL: backendBaseUrl(),
      method: 'PATCH',
      body: { completed }
    })
  }

  function recordLessonAccess(courseId: number, lessonId: number) {
    return $fetch<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}/access`, {
      baseURL: backendBaseUrl(),
      method: 'POST'
    })
  }

  function updateLesson(courseId: number, lessonId: number, input: UpdateLessonInput) {
    return $fetch<Lesson>(`/api/courses/${courseId}/lessons/${lessonId}`, {
      baseURL: backendBaseUrl(),
      method: 'PATCH',
      body: {
        sectionId: input.sectionId,
        title: input.title.trim(),
        description: input.description.trim()
      }
    })
  }

  function reorderLessons(courseId: number, sectionId: number | null, lessonIds: number[]) {
    return $fetch<Lesson[]>(`/api/courses/${courseId}/lessons/order`, {
      baseURL: backendBaseUrl(),
      method: 'PUT',
      body: { sectionId, lessonIds }
    })
  }

  return {
    createLesson,
    getLesson,
    listLessons,
    recordLessonAccess,
    reorderLessons,
    setLessonCompleted,
    updateLesson
  }
}
