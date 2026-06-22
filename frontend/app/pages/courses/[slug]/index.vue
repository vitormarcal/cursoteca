<script setup lang="ts">
import type { CreateCourseSectionInput } from '~/types/course-section'
import type { CreateLessonInput } from '~/types/lesson'
import type { CreateLessonDownloadInput } from '~/types/lesson-download'
import type { CreateResourceFileInput, CreateResourceLinkInput, ResourceTarget } from '~/types/resource'

const route = useRoute()
const slug = String(route.params.slug)
const { getCourseBySlug } = useCourses()
const { listSections, createSection } = useCourseSections()
const { listLessons, createLesson } = useLessons()
const { listDownloads, createDownload } = useLessonDownloads()
const { createFile, createLink } = useResources()

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
const downloadState = course.value
  ? await listDownloads(course.value.id)
  : null
const downloads = downloadState?.data ?? ref([])
const refreshDownloads = downloadState?.refresh ?? (() => Promise.resolve())
const submitting = ref(false)
const errorMessage = ref('')
const lessonSubmitting = ref(false)
const lessonErrorMessage = ref('')
const downloadSubmitting = ref(false)
const downloadErrorMessage = ref('')
const resourceSubmitting = ref(false)
const resourceErrorMessage = ref('')
const resourceSuccessMessage = ref('')
const fileSubmitting = ref(false)
const fileErrorMessage = ref('')
const fileSuccessMessage = ref('')

const courseLessons = computed(() => lessons.value.filter(lesson => lesson.sectionId === null))
const hasActiveDownloads = computed(() => downloads.value.some(job => job.status === 'QUEUED' || job.status === 'RUNNING'))

let downloadPolling: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  downloadPolling = setInterval(async () => {
    if (!hasActiveDownloads.value) return
    await refreshDownloads()
    await refreshLessons()
  }, 2000)
})
onBeforeUnmount(() => downloadPolling && clearInterval(downloadPolling))
const resourceTargets = computed<ResourceTarget[]>(() => {
  if (!course.value) return []
  const targets: ResourceTarget[] = [{ scope: 'COURSE', label: 'Curso' }]
  function addSections(items: typeof sections.value, depth = 0) {
    for (const section of items) {
      targets.push({ scope: 'SECTION', sectionId: section.id, label: `${'— '.repeat(depth + 1)}${section.title}` })
      addSections(section.children, depth + 1)
    }
  }
  addSections(sections.value)
  return targets
})

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

async function submitDownload(input: CreateLessonDownloadInput) {
  if (!course.value) return
  downloadErrorMessage.value = ''
  downloadSubmitting.value = true
  try {
    await createDownload(course.value.id, input)
    await refreshDownloads()
  } catch (error) {
    downloadErrorMessage.value = apiErrorMessage(error, 'Não foi possível iniciar o download.')
  } finally {
    downloadSubmitting.value = false
  }
}

async function submitResourceLink(input: CreateResourceLinkInput) {
  if (!course.value) return
  resourceErrorMessage.value = ''
  resourceSuccessMessage.value = ''
  resourceSubmitting.value = true
  try {
    await createLink(course.value.id, input)
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
    fileSuccessMessage.value = 'Arquivo adicionado.'
  } catch (error) {
    fileErrorMessage.value = apiErrorMessage(error, 'Não foi possível enviar o arquivo.')
  } finally {
    fileSubmitting.value = false
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

          <section v-if="downloads.length" class="download-section">
            <h2>Downloads</h2>
            <LessonDownloadList :jobs="downloads" />
          </section>
        </div>

        <aside class="content-actions">
          <section>
            <h2>Baixar aula por URL</h2>
            <LessonDownloadForm
              :sections="sections"
              :submitting="downloadSubmitting"
              :error-message="downloadErrorMessage"
              @submit="submitDownload"
            />
          </section>

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

          <section>
            <h2>Novo link</h2>
            <ResourceLinkForm
              :targets="resourceTargets"
              :submitting="resourceSubmitting"
              :error-message="resourceErrorMessage"
              :success-message="resourceSuccessMessage"
              @submit="submitResourceLink"
            />
          </section>

          <section>
            <h2>Novo PDF ou áudio</h2>
            <ResourceFileForm
              :targets="resourceTargets"
              :submitting="fileSubmitting"
              :error-message="fileErrorMessage"
              :success-message="fileSuccessMessage"
              @submit="submitResourceFile"
            />
          </section>
        </aside>
      </section>
    </template>
  </main>
</template>
