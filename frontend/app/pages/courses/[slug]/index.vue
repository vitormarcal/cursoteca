<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug)
const { getCourseBySlug } = useCourses()
const { listSections } = useCourseSections()
const { listLessons } = useLessons()

const { data: course, pending: coursePending, error: courseError } = await getCourseBySlug(slug)
const sectionState = course.value ? await listSections(course.value.id) : null
const lessonState = course.value ? await listLessons(course.value.id) : null
const sections = sectionState?.data ?? ref([])
const sectionsPending = sectionState?.pending ?? ref(false)
const sectionsError = sectionState?.error ?? ref(null)
const lessons = lessonState?.data ?? ref([])
const lessonsPending = lessonState?.pending ?? ref(false)
const lessonsError = lessonState?.error ?? ref(null)
const orderedLessons = computed(() => orderedCourseLessons(sections.value, lessons.value))
const firstLesson = computed(() => orderedLessons.value[0])
</script>

<template>
  <main class="page course-overview-page">
    <PageHeader eyebrow="Curso" :title="course?.name || 'Curso'">
      <div class="header-actions">
        <NuxtLink class="button" to="/">Biblioteca</NuxtLink>
        <NuxtLink v-if="course" class="button" :to="`/courses/${course.slug}/manage`">Gerenciar curso</NuxtLink>
      </div>
    </PageHeader>

    <p v-if="coursePending" class="muted">Carregando curso...</p>

    <section v-else-if="courseError || !course" class="empty-state">
      <h2>Curso não encontrado</h2>
      <p>Verifique se o curso existe e tente novamente.</p>
      <NuxtLink class="button" to="/">Voltar para cursos</NuxtLink>
    </section>

    <template v-else>
      <section class="course-hero">
        <img :src="course.imageUrl" :alt="`Capa do curso ${course.name}`">
        <div class="course-hero-copy">
          <p>{{ course.description }}</p>
          <div class="course-meta">
            <span>{{ lessons.length }} {{ lessons.length === 1 ? 'aula' : 'aulas' }}</span>
            <span>{{ sections.length }} {{ sections.length === 1 ? 'seção' : 'seções principais' }}</span>
          </div>
          <NuxtLink
            v-if="firstLesson"
            class="button button-primary course-primary-action"
            :to="`/courses/${course.slug}/lessons/${firstLesson.id}`"
          >
            Começar curso
          </NuxtLink>
        </div>
      </section>

      <section class="course-content-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Currículo</p>
            <h2>Conteúdo do curso</h2>
          </div>
          <span v-if="lessons.length" class="muted">{{ lessons.length }} aulas</span>
        </div>

        <p v-if="sectionsPending || lessonsPending" class="muted">Carregando conteúdo...</p>

        <section v-else-if="sectionsError || lessonsError" class="empty-state compact-empty-state">
          <h2>Não foi possível carregar o conteúdo</h2>
          <p>Atualize a página para tentar novamente.</p>
        </section>

        <section v-else-if="sections.length === 0 && lessons.length === 0" class="empty-state compact-empty-state">
          <h2>Nenhum conteúdo cadastrado</h2>
          <p>Use a área de gerenciamento para adicionar a primeira aula.</p>
          <NuxtLink class="button button-primary" :to="`/courses/${course.slug}/manage`">Gerenciar curso</NuxtLink>
        </section>

        <CourseCurriculum
          v-else
          :sections="sections"
          :lessons="lessons"
          :course-slug="course.slug"
        />
      </section>
    </template>
  </main>
</template>
