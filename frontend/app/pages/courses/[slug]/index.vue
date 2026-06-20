<script setup lang="ts">
import type { CreateCourseSectionInput } from '~/types/course-section'
import type { CreateLessonInput } from '~/types/lesson'

const route = useRoute()
const slug = String(route.params.slug)
const { getCourseBySlug } = useCourses()
const { listSections, createSection } = useCourseSections()
const { listLessons, createLesson } = useLessons()

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
const lessonState = course.value
  ? await listLessons(course.value.id)
  : null
const lessons = lessonState?.data ?? ref([])
const lessonsPending = lessonState?.pending ?? ref(false)
const lessonsError = lessonState?.error ?? ref(null)
const refreshLessons = lessonState?.refresh ?? (() => Promise.resolve())
const submitting = ref(false)
const errorMessage = ref('')
const lessonSubmitting = ref(false)
const lessonErrorMessage = ref('')

const courseLessons = computed(() => lessons.value.filter(lesson => lesson.sectionId === null))

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

async function submitLesson(input: CreateLessonInput) {
  if (!course.value) {
    return
  }

  lessonErrorMessage.value = ''
  lessonSubmitting.value = true

  try {
    await createLesson(course.value.id, input)
    await refreshLessons()
  } catch (error) {
    lessonErrorMessage.value = apiErrorMessage(error, 'Não foi possível cadastrar a aula.')
  } finally {
    lessonSubmitting.value = false
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
          <h2>Conteúdo</h2>
          <p v-if="sectionsPending || lessonsPending" class="muted">Carregando conteúdo...</p>

          <section v-else-if="sectionsError || lessonsError" class="empty-state">
            <h2>Não foi possível carregar o conteúdo</h2>
            <button class="button" type="button" @click="refreshSections(); refreshLessons()">Tentar novamente</button>
          </section>

          <section v-else-if="sections.length === 0 && lessons.length === 0" class="empty-state">
            <h2>Nenhum conteúdo cadastrado</h2>
            <p>Crie uma seção ou cadastre a primeira aula deste curso.</p>
          </section>

          <template v-else>
            <section v-if="courseLessons.length" class="unsectioned-lessons">
              <h2>Aulas do curso</h2>
              <LessonList :lessons="courseLessons" :course-slug="course.slug" />
            </section>
            <CourseSectionList
              v-if="sections.length"
              :sections="sections"
              :lessons="lessons"
              :course-slug="course.slug"
            />
          </template>
        </div>

        <aside class="content-actions">
          <section>
            <h2>Nova aula</h2>
            <LessonForm
              :sections="sections"
              :submitting="lessonSubmitting"
              :error-message="lessonErrorMessage"
              @submit="submitLesson"
            />
          </section>

          <section>
            <h2>Nova seção</h2>
            <CourseSectionForm
              :sections="sections"
              :submitting="submitting"
              :error-message="errorMessage"
              @submit="submitSection"
            />
          </section>
        </aside>
      </section>
    </template>
  </main>
</template>
