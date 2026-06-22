import type { CourseSection, CreateCourseSectionInput, UpdateCourseSectionInput } from '~/types/course-section'
import { hasInjectionContext, inject } from 'vue'

export type CourseSectionsApi = {
  createSection: (courseId: number, input: CreateCourseSectionInput) => Promise<CourseSection>
  listSections: (courseId: number) => ReturnType<typeof useFetch<CourseSection[]>>
  reorderSections: (courseId: number, parentId: number | null, sectionIds: number[]) => Promise<CourseSection[]>
  updateSection: (courseId: number, sectionId: number, input: UpdateCourseSectionInput) => Promise<CourseSection>
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
      key: `course-${courseId}-sections`,
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

  function updateSection(courseId: number, sectionId: number, input: UpdateCourseSectionInput) {
    return $fetch<CourseSection>(`/api/courses/${courseId}/sections/${sectionId}`, {
      baseURL: backendBaseUrl(),
      method: 'PATCH',
      body: { title: input.title.trim(), description: input.description.trim() }
    })
  }

  function reorderSections(courseId: number, parentId: number | null, sectionIds: number[]) {
    return $fetch<CourseSection[]>(`/api/courses/${courseId}/sections/order`, {
      baseURL: backendBaseUrl(),
      method: 'PUT',
      body: { parentId, sectionIds }
    })
  }

  return {
    createSection,
    listSections,
    reorderSections,
    updateSection
  }
}
