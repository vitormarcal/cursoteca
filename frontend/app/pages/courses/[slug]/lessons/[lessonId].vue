<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug)
const lessonId = Number(route.params.lessonId)
const { getCourseBySlug } = useCourses()
const { getLesson } = useLessons()

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
    </template>
  </main>
</template>
