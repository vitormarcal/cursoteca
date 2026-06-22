<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug)
const lessonId = Number(route.params.lessonId)
const { getCourseBySlug } = useCourses()
const { getLesson, listLessons, recordLessonAccess, setLessonCompleted } = useLessons()
const { listSections } = useCourseSections()

const { data: course, pending: coursePending, error: courseError } = await getCourseBySlug(slug)
const lessonState = course.value && Number.isInteger(lessonId) && lessonId > 0
  ? await getLesson(course.value.id, lessonId)
  : null
const sectionState = course.value ? await listSections(course.value.id) : null
const lessonListState = course.value ? await listLessons(course.value.id) : null

const lesson = lessonState?.data ?? ref(null)
const lessonPending = lessonState?.pending ?? ref(false)
const lessonError = lessonState?.error ?? ref(true)
const sections = sectionState?.data ?? ref([])
const lessons = lessonListState?.data ?? ref([])
const curriculumPending = computed(() => Boolean(sectionState?.pending.value || lessonListState?.pending.value))
const curriculumError = computed(() => Boolean(sectionState?.error.value || lessonListState?.error.value))
const orderedLessons = computed(() => orderedCourseLessons(sections.value, lessons.value))
const currentIndex = computed(() => orderedLessons.value.findIndex(item => item.id === lessonId))
const previousLesson = computed(() => currentIndex.value > 0 ? orderedLessons.value[currentIndex.value - 1] : undefined)
const nextLesson = computed(() => currentIndex.value >= 0 ? orderedLessons.value[currentIndex.value + 1] : undefined)
const completionSubmitting = ref(false)
const completionError = ref('')

onMounted(async () => {
  if (!course.value || !lesson.value) return
  try {
    const accessed = await recordLessonAccess(course.value.id, lesson.value.id)
    lesson.value.lastAccessedAt = accessed.lastAccessedAt
    const listedLesson = lessons.value.find(item => item.id === accessed.id)
    if (listedLesson) listedLesson.lastAccessedAt = accessed.lastAccessedAt
  } catch {
    // Retomada é auxiliar e não deve impedir a reprodução da aula.
  }
})

async function toggleCompletion() {
  if (!course.value || !lesson.value) return
  completionError.value = ''
  completionSubmitting.value = true
  try {
    const updated = await setLessonCompleted(course.value.id, lesson.value.id, !lesson.value.completed)
    lesson.value.completed = updated.completed
    lesson.value.completedAt = updated.completedAt
    lesson.value.lastAccessedAt = updated.lastAccessedAt
    const listedLesson = lessons.value.find(item => item.id === updated.id)
    if (listedLesson) Object.assign(listedLesson, updated)
  } catch (error) {
    completionError.value = apiErrorMessage(error, 'Não foi possível atualizar a aula.')
  } finally {
    completionSubmitting.value = false
  }
}
</script>

<template>
  <main class="lesson-workspace">
    <p v-if="coursePending || lessonPending" class="lesson-status muted">Carregando aula...</p>

    <section v-else-if="courseError || lessonError || !course || !lesson" class="empty-state lesson-status">
      <h2>Aula não encontrada</h2>
      <p>Verifique se esta aula pertence ao curso informado.</p>
      <NuxtLink class="button" :to="`/courses/${slug}`">Voltar ao curso</NuxtLink>
    </section>

    <template v-else>
      <aside class="lesson-sidebar">
        <div class="lesson-sidebar-header">
          <NuxtLink class="lesson-course-link" :to="`/courses/${course.slug}`">
            <span aria-hidden="true">←</span>
            <span>{{ course.name }}</span>
          </NuxtLink>
          <span class="lesson-count">{{ lessons.length }} aulas</span>
        </div>
        <p v-if="curriculumPending" class="muted curriculum-state">Carregando conteúdo...</p>
        <p v-else-if="curriculumError" class="form-error curriculum-state">Não foi possível carregar o conteúdo.</p>
        <CourseCurriculum
          v-else
          :sections="sections"
          :lessons="lessons"
          :course-slug="course.slug"
          :active-lesson-id="lesson.id"
        />
      </aside>

      <article class="lesson-content">
        <div class="lesson-content-inner">
          <nav class="lesson-context" aria-label="Localização da aula">
            <NuxtLink :to="`/courses/${course.slug}`">{{ course.name }}</NuxtLink>
            <template v-for="section in lesson.sectionPath" :key="section.id">
              <span aria-hidden="true">/</span>
              <span>{{ section.title }}</span>
            </template>
          </nav>

          <div class="lesson-title-row">
            <div>
              <p class="eyebrow">Aula</p>
              <h1>{{ lesson.title }}</h1>
            </div>
            <div class="lesson-title-actions">
              <button
                class="button lesson-completion-button"
                :class="{ 'is-completed': lesson.completed }"
                type="button"
                :disabled="completionSubmitting"
                @click="toggleCompletion"
              >
                {{ lesson.completed ? '✓ Aula concluída' : 'Marcar como concluída' }}
              </button>
              <NuxtLink class="button lesson-manage-link" :to="`/courses/${course.slug}/manage`">Gerenciar</NuxtLink>
            </div>
          </div>
          <p v-if="completionError" class="form-error lesson-completion-error">{{ completionError }}</p>

          <details class="mobile-curriculum">
            <summary>
              <span>Conteúdo do curso</span>
              <span>{{ lessons.length }} aulas</span>
            </summary>
            <CourseCurriculum
              :sections="sections"
              :lessons="lessons"
              :course-slug="course.slug"
              :active-lesson-id="lesson.id"
            />
          </details>

          <video class="lesson-player" controls preload="metadata" :src="lesson.videoUrl">
            Seu navegador não suporta reprodução de vídeo.
          </video>

          <nav class="lesson-pagination" aria-label="Navegação entre aulas">
            <NuxtLink
              v-if="previousLesson"
              class="lesson-pagination-link previous"
              :to="`/courses/${course.slug}/lessons/${previousLesson.id}`"
            >
              <small>← Aula anterior</small>
              <strong>{{ previousLesson.title }}</strong>
            </NuxtLink>
            <span v-else />
            <NuxtLink
              v-if="nextLesson"
              class="lesson-pagination-link next"
              :to="`/courses/${course.slug}/lessons/${nextLesson.id}`"
            >
              <small>Próxima aula →</small>
              <strong>{{ nextLesson.title }}</strong>
            </NuxtLink>
          </nav>

          <section v-if="lesson.description" class="lesson-description">
            <h2>Sobre esta aula</h2>
            <p>{{ lesson.description }}</p>
          </section>

          <LessonResources :groups="lesson.resourceGroups" />
        </div>
      </article>
    </template>
  </main>
</template>
