import type { Course } from '~/types/course'
import { hasInjectionContext, inject } from 'vue'

export type CreateCourseInput = {
  name: string
  description: string
  image: File
}

export type CoursesApi = {
  createCourse: (input: CreateCourseInput) => Promise<unknown>
  listCourses: () => ReturnType<typeof useFetch<Course[]>>
}

export function useCourses(): CoursesApi {
  const injectedApi = hasInjectionContext() ? inject<CoursesApi | null>('coursesApi', null) : null
  if (injectedApi) {
    return injectedApi
  }

  function listCourses() {
    return useFetch<Course[]>('/api/courses', {
      default: () => []
    })
  }

  function createCourse(input: CreateCourseInput) {
    const formData = new FormData()
    formData.append('name', input.name.trim())
    formData.append('description', input.description.trim())
    formData.append('image', input.image)

    return $fetch('/api/courses', {
      method: 'POST',
      body: formData
    })
  }

  return {
    createCourse,
    listCourses
  }
}
