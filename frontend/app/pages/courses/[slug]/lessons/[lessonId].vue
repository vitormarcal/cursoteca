<script setup lang="ts">
import type { CreateResourceFileInput, CreateResourceLinkInput } from '~/types/resource'

const route = useRoute()
const slug = String(route.params.slug)
const lessonId = Number(route.params.lessonId)
const { getCourseBySlug } = useCourses()
const { getLesson } = useLessons()
const { createFile, createLink } = useResources()

const {
  data: course,
  pending: coursePending,
  error: courseError
} = await getCourseBySlug(slug)

const lessonState = course.value && Number.isInteger(lessonId) && lessonId > 0
  ? await getLesson(course.value.id, lessonId)
  : null
const lesson = lessonState?.data ?? ref(null)
const lessonPending = lessonState?.pending ?? ref(false)
const lessonError = lessonState?.error ?? ref(true)
const refreshLesson = lessonState?.refresh ?? (() => Promise.resolve())
const resourceSubmitting = ref(false)
const resourceErrorMessage = ref('')
const resourceSuccessMessage = ref('')
const fileSubmitting = ref(false)
const fileErrorMessage = ref('')
const fileSuccessMessage = ref('')

const resourceTargets = computed(() => {
  if (!lesson.value) return []
  return [
    { scope: 'LESSON' as const, lessonId: lesson.value.id, label: 'Esta aula' },
    ...lesson.value.sectionPath.slice().reverse().map(section => ({
      scope: 'SECTION' as const,
      sectionId: section.id,
      label: section.title
    })),
    { scope: 'COURSE' as const, label: 'Curso' }
  ]
})

async function submitResourceLink(input: CreateResourceLinkInput) {
  if (!course.value) return
  resourceErrorMessage.value = ''
  resourceSuccessMessage.value = ''
  resourceSubmitting.value = true
  try {
    await createLink(course.value.id, input)
    await refreshLesson()
    resourceSuccessMessage.value = 'Link adicionado.'
  } catch (error) {
    resourceErrorMessage.value = apiErrorMessage(error, 'Não foi possível adicionar o link.')
  } finally {
    resourceSubmitting.value = false
  }
}

async function submitResourceFile(input: CreateResourceFileInput) {
  if (!course.value) return
  fileErrorMessage.value = ''
  fileSuccessMessage.value = ''
  fileSubmitting.value = true
  try {
    await createFile(course.value.id, input)
    await refreshLesson()
    fileSuccessMessage.value = 'Arquivo adicionado.'
  } catch (error) {
    fileErrorMessage.value = apiErrorMessage(error, 'Não foi possível enviar o arquivo.')
  } finally {
    fileSubmitting.value = false
  }
}
</script>

<template>
  <main class="page lesson-page">
    <PageHeader eyebrow="Aula" :title="lesson?.title || 'Aula'">
      <NuxtLink class="button" :to="`/courses/${slug}`">Voltar ao curso</NuxtLink>
    </PageHeader>

    <p v-if="coursePending || lessonPending" class="muted">Carregando aula...</p>

    <section v-else-if="courseError || lessonError || !course || !lesson" class="empty-state">
      <h2>Aula não encontrada</h2>
      <p>Verifique se esta aula pertence ao curso informado.</p>
      <NuxtLink class="button" :to="`/courses/${slug}`">Voltar ao curso</NuxtLink>
    </section>

    <template v-else>
      <nav v-if="lesson.sectionPath.length" class="lesson-context" aria-label="Localização da aula">
        <span>{{ course.name }}</span>
        <template v-for="section in lesson.sectionPath" :key="section.id">
          <span aria-hidden="true">/</span>
          <span>{{ section.title }}</span>
        </template>
      </nav>

      <video class="lesson-player" controls preload="metadata" :src="lesson.videoUrl">
        Seu navegador não suporta reprodução de vídeo.
      </video>

      <section v-if="lesson.description" class="lesson-description">
        <h2>Sobre esta aula</h2>
        <p>{{ lesson.description }}</p>
      </section>

      <LessonResources :groups="lesson.resourceGroups" />

      <section class="lesson-resource-form">
        <h2>Adicionar link</h2>
        <ResourceLinkForm
          :targets="resourceTargets"
          :submitting="resourceSubmitting"
          :error-message="resourceErrorMessage"
          :success-message="resourceSuccessMessage"
          @submit="submitResourceLink"
        />
      </section>

      <section class="lesson-resource-form">
        <h2>Adicionar PDF ou áudio</h2>
        <ResourceFileForm
          :targets="resourceTargets"
          :submitting="fileSubmitting"
          :error-message="fileErrorMessage"
          :success-message="fileSuccessMessage"
          @submit="submitResourceFile"
        />
      </section>
    </template>
  </main>
</template>
