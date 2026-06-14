import type { CourseSection, CreateCourseSectionInput } from '~/types/course-section'
import { hasInjectionContext, inject } from 'vue'

export type CourseSectionsApi = {
  createSection: (courseId: number, input: CreateCourseSectionInput) => Promise<CourseSection>
  listSections: (courseId: number) => ReturnType<typeof useFetch<CourseSection[]>>
}

export function useCourseSections(): CourseSectionsApi {
  const injectedApi = hasInjectionContext()
    ? inject<CourseSectionsApi | null>('courseSectionsApi', null)
    : null

  if (injectedApi) {
    return injectedApi
  }

  function listSections(courseId: number) {
    return useFetch<CourseSection[]>(`/api/courses/${courseId}/sections`, {
      baseURL: backendBaseUrl(),
      default: () => []
    })
  }

  function createSection(courseId: number, input: CreateCourseSectionInput) {
    return $fetch<CourseSection>(`/api/courses/${courseId}/sections`, {
      baseURL: backendBaseUrl(),
      method: 'POST',
      body: {
        parentId: input.parentId,
        title: input.title.trim(),
        description: input.description.trim()
      }
    })
  }

  return {
    createSection,
    listSections
  }
}
