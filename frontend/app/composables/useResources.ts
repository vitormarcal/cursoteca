import type { CourseResource, CreateResourceLinkInput } from '~/types/resource'

export function useResources() {
  function createLink(courseId: number, input: CreateResourceLinkInput) {
    return $fetch<CourseResource>(`/api/courses/${courseId}/resources/links`, {
      baseURL: backendBaseUrl(),
      method: 'POST',
      body: {
        scope: input.scope,
        sectionId: input.sectionId,
        lessonId: input.lessonId,
        title: input.title.trim(),
        description: input.description.trim(),
        url: input.url.trim()
      }
    })
  }

  return { createLink }
}
