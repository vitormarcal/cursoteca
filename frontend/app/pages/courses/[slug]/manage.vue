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

const { data: course, pending: coursePending, error: courseError } = await getCourseBySlug(slug)
const sectionState = course.value ? await listSections(course.value.id) : null
const lessonState = course.value ? await listLessons(course.value.id) : null
const downloadState = course.value ? await listDownloads(course.value.id) : null
const sections = sectionState?.data ?? ref([])
const lessons = lessonState?.data ?? ref([])
const downloads = downloadState?.data ?? ref([])
const refreshSections = sectionState?.refresh ?? (() => Promise.resolve())
const refreshLessons = lessonState?.refresh ?? (() => Promise.resolve())
const refreshDownloads = downloadState?.refresh ?? (() => Promise.resolve())

const sectionSubmitting = ref(false)
const sectionError = ref('')
const lessonSubmitting = ref(false)
const lessonError = ref('')
const downloadSubmitting = ref(false)
const downloadError = ref('')
const linkSubmitting = ref(false)
const linkError = ref('')
const linkSuccess = ref('')
const fileSubmitting = ref(false)
const fileError = ref('')
const fileSuccess = ref('')

const hasActiveDownloads = computed(() => downloads.value.some(job => job.status === 'QUEUED' || job.status === 'RUNNING'))
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
  for (const lesson of orderedCourseLessons(sections.value, lessons.value)) {
    targets.push({ scope: 'LESSON', lessonId: lesson.id, label: `Aula — ${lesson.title}` })
  }
  return targets
})

let downloadPolling: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  downloadPolling = setInterval(async () => {
    if (!hasActiveDownloads.value) return
    await refreshDownloads()
    await refreshLessons()
  }, 2000)
})
onBeforeUnmount(() => downloadPolling && clearInterval(downloadPolling))

async function submitSection(input: CreateCourseSectionInput) {
  if (!course.value) return
  sectionError.value = ''
  sectionSubmitting.value = true
  try {
    await createSection(course.value.id, input)
    await refreshSections()
  } catch (error) {
    sectionError.value = apiErrorMessage(error, 'Não foi possível criar a seção.')
  } finally {
    sectionSubmitting.value = false
  }
}

async function submitLesson(input: CreateLessonInput) {
  if (!course.value) return
  lessonError.value = ''
  lessonSubmitting.value = true
  try {
    await createLesson(course.value.id, input)
    await refreshLessons()
  } catch (error) {
    lessonError.value = apiErrorMessage(error, 'Não foi possível cadastrar a aula.')
  } finally {
    lessonSubmitting.value = false
  }
}

async function submitDownload(input: CreateLessonDownloadInput) {
  if (!course.value) return
  downloadError.value = ''
  downloadSubmitting.value = true
  try {
    await createDownload(course.value.id, input)
    await refreshDownloads()
  } catch (error) {
    downloadError.value = apiErrorMessage(error, 'Não foi possível iniciar o download.')
  } finally {
    downloadSubmitting.value = false
  }
}

async function submitLink(input: CreateResourceLinkInput) {
  if (!course.value) return
  linkError.value = ''
  linkSuccess.value = ''
  linkSubmitting.value = true
  try {
    await createLink(course.value.id, input)
    linkSuccess.value = 'Link adicionado.'
  } catch (error) {
    linkError.value = apiErrorMessage(error, 'Não foi possível adicionar o link.')
  } finally {
    linkSubmitting.value = false
  }
}

async function submitFile(input: CreateResourceFileInput) {
  if (!course.value) return
  fileError.value = ''
  fileSuccess.value = ''
  fileSubmitting.value = true
  try {
    await createFile(course.value.id, input)
    fileSuccess.value = 'Arquivo adicionado.'
  } catch (error) {
    fileError.value = apiErrorMessage(error, 'Não foi possível enviar o arquivo.')
  } finally {
    fileSubmitting.value = false
  }
}
</script>

<template>
  <main class="page manage-page">
    <PageHeader eyebrow="Gerenciamento" :title="course?.name || 'Curso'">
      <NuxtLink class="button" :to="`/courses/${slug}`">Voltar ao curso</NuxtLink>
    </PageHeader>

    <p v-if="coursePending" class="muted">Carregando curso...</p>
    <section v-else-if="courseError || !course" class="empty-state">
      <h2>Curso não encontrado</h2>
      <NuxtLink class="button" to="/">Voltar para cursos</NuxtLink>
    </section>

    <template v-else>
      <section v-if="downloads.length" class="management-status">
        <div class="section-heading">
          <h2>Downloads</h2>
          <span class="muted">{{ downloads.length }} jobs</span>
        </div>
        <LessonDownloadList :jobs="downloads" />
      </section>

      <div class="management-grid">
        <section class="management-card">
          <p class="eyebrow">Vídeo por URL</p>
          <h2>Baixar aula</h2>
          <LessonDownloadForm :sections="sections" :submitting="downloadSubmitting" :error-message="downloadError" @submit="submitDownload" />
        </section>
        <section class="management-card">
          <p class="eyebrow">Upload</p>
          <h2>Nova aula</h2>
          <LessonForm :sections="sections" :submitting="lessonSubmitting" :error-message="lessonError" @submit="submitLesson" />
        </section>
        <section class="management-card">
          <p class="eyebrow">Organização</p>
          <h2>Nova seção</h2>
          <CourseSectionForm :sections="sections" :submitting="sectionSubmitting" :error-message="sectionError" @submit="submitSection" />
        </section>
        <section class="management-card">
          <p class="eyebrow">Material</p>
          <h2>Novo link</h2>
          <ResourceLinkForm :targets="resourceTargets" :submitting="linkSubmitting" :error-message="linkError" :success-message="linkSuccess" @submit="submitLink" />
        </section>
        <section class="management-card">
          <p class="eyebrow">Material</p>
          <h2>Novo PDF ou áudio</h2>
          <ResourceFileForm :targets="resourceTargets" :submitting="fileSubmitting" :error-message="fileError" :success-message="fileSuccess" @submit="submitFile" />
        </section>
      </div>
    </template>
  </main>
</template>
