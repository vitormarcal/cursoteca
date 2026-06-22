import type { CourseResource, CreateResourceFileInput, CreateResourceLinkInput } from '~/types/resource'

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

  function createFile(courseId: number, input: CreateResourceFileInput) {
    const formData = new FormData()
    formData.append('scope', input.scope)
    if (input.sectionId !== null) formData.append('sectionId', String(input.sectionId))
    if (input.lessonId !== null) formData.append('lessonId', String(input.lessonId))
    formData.append('title', input.title.trim())
    formData.append('description', input.description.trim())
    formData.append('file', input.file)

    return $fetch<CourseResource>(`/api/courses/${courseId}/resources/files`, {
      baseURL: backendBaseUrl(),
      method: 'POST',
      body: formData
    })
  }

  return { createFile, createLink }
}
