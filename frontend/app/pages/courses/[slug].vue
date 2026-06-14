<script setup lang="ts">
import type { Course } from '~/types/course'
import type { CreateCourseSectionInput } from '~/types/course-section'

const route = useRoute()
const slug = String(route.params.slug)
const { getCourseBySlug } = useCourses()
const { listSections, createSection } = useCourseSections()

const {
  data: course,
  pending: coursePending,
  error: courseError
} = await getCourseBySlug(slug)

const sectionState = course.value
  ? await listSections(course.value.id)
  : null

const sections = sectionState?.data ?? ref([])
const sectionsPending = sectionState?.pending ?? ref(false)
const sectionsError = sectionState?.error ?? ref(null)
const refreshSections = sectionState?.refresh ?? (() => Promise.resolve())
const submitting = ref(false)
const errorMessage = ref('')

async function submitSection(input: CreateCourseSectionInput) {
  if (!course.value) {
    return
  }

  errorMessage.value = ''
  submitting.value = true

  try {
    await createSection(course.value.id, input)
    await refreshSections()
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, 'Não foi possível criar a seção.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="page">
    <PageHeader eyebrow="Curso" :title="course?.name || 'Curso'">
      <NuxtLink class="button" to="/">Voltar</NuxtLink>
    </PageHeader>

    <p v-if="coursePending" class="muted">Carregando curso...</p>

    <section v-else-if="courseError" class="empty-state">
      <h2>Curso não encontrado</h2>
      <p>Verifique se o curso existe e tente novamente.</p>
      <NuxtLink class="button" to="/">Voltar para cursos</NuxtLink>
    </section>

    <template v-else-if="course">
      <section class="course-detail">
        <img :src="course.imageUrl" :alt="`Capa do curso ${course.name}`">
        <p>{{ course.description }}</p>
      </section>

      <section class="section-layout">
        <div>
          <h2>Seções</h2>
          <p v-if="sectionsPending" class="muted">Carregando seções...</p>

          <section v-else-if="sectionsError" class="empty-state">
            <h2>Não foi possível carregar as seções</h2>
            <button class="button" type="button" @click="refreshSections()">Tentar novamente</button>
          </section>

          <section v-else-if="sections.length === 0" class="empty-state">
            <h2>Nenhuma seção cadastrada</h2>
            <p>Crie a primeira seção para organizar o conteúdo deste curso.</p>
          </section>

          <CourseSectionList v-else :sections="sections" />
        </div>

        <aside>
          <h2>Nova seção</h2>
          <CourseSectionForm
            :sections="sections"
            :submitting="submitting"
            :error-message="errorMessage"
            @submit="submitSection"
          />
        </aside>
      </section>
    </template>
  </main>
</template>
