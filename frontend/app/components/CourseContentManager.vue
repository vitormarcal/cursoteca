<script setup lang="ts">
import type { CourseSection, UpdateCourseSectionInput } from '~/types/course-section'
import type { Lesson, UpdateLessonInput } from '~/types/lesson'

type SectionEntry = { kind: 'section', section: CourseSection, depth: number }
type LessonEntry = { kind: 'lesson', lesson: Lesson, depth: number }
type ContentEntry = SectionEntry | LessonEntry

const props = defineProps<{
  sections: CourseSection[]
  lessons: Lesson[]
  submitting?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  updateSection: [sectionId: number, input: UpdateCourseSectionInput]
  updateLesson: [lessonId: number, input: UpdateLessonInput]
  reorderSections: [parentId: number | null, sectionIds: number[]]
  reorderLessons: [sectionId: number | null, lessonIds: number[]]
}>()

const sectionDrafts = reactive<Record<number, UpdateCourseSectionInput>>({})
const lessonDrafts = reactive<Record<number, UpdateLessonInput>>({})

const flatSections = computed(() => {
  const result: Array<{ section: CourseSection, depth: number }> = []
  function visit(items: CourseSection[], depth: number) {
    for (const section of items) {
      result.push({ section, depth })
      visit(section.children, depth + 1)
    }
  }
  visit(props.sections, 0)
  return result
})

const entries = computed<ContentEntry[]>(() => {
  const result: ContentEntry[] = lessonsInSection(props.lessons, null).map(lesson => ({ kind: 'lesson', lesson, depth: 0 }))
  function visit(items: CourseSection[], depth: number) {
    for (const section of items) {
      result.push({ kind: 'section', section, depth })
      result.push(...lessonsInSection(props.lessons, section.id).map(lesson => ({ kind: 'lesson' as const, lesson, depth: depth + 1 })))
      visit(section.children, depth + 1)
    }
  }
  visit(props.sections, 0)
  return result
})

watchEffect(() => {
  for (const { section } of flatSections.value) {
    sectionDrafts[section.id] = { title: section.title, description: section.description }
  }
  for (const lesson of props.lessons) {
    lessonDrafts[lesson.id] = { sectionId: lesson.sectionId, title: lesson.title, description: lesson.description }
  }
})

function sectionSiblings(section: CourseSection) {
  return flatSections.value
    .map(item => item.section)
    .filter(item => item.parentId === section.parentId)
    .toSorted((left, right) => left.position - right.position || left.id - right.id)
}

function moveSection(section: CourseSection, offset: number) {
  const siblings = sectionSiblings(section)
  const index = siblings.findIndex(item => item.id === section.id)
  const target = index + offset
  if (target < 0 || target >= siblings.length) return
  const ids = siblings.map(item => item.id)
  const currentId = ids[index]!
  ids[index] = ids[target]!
  ids[target] = currentId
  emit('reorderSections', section.parentId, ids)
}

function moveLesson(lesson: Lesson, offset: number) {
  const siblings = lessonsInSection(props.lessons, lesson.sectionId)
  const index = siblings.findIndex(item => item.id === lesson.id)
  const target = index + offset
  if (target < 0 || target >= siblings.length) return
  const ids = siblings.map(item => item.id)
  const currentId = ids[index]!
  ids[index] = ids[target]!
  ids[target] = currentId
  emit('reorderLessons', lesson.sectionId, ids)
}
</script>

<template>
  <section class="content-manager" aria-labelledby="content-manager-title">
    <div class="section-heading">
      <div>
        <p class="eyebrow">Currículo</p>
        <h2 id="content-manager-title">Organizar conteúdo</h2>
      </div>
      <span class="muted">{{ lessons.length }} aulas</span>
    </div>
    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    <p v-if="entries.length === 0" class="muted">Nenhum conteúdo para organizar.</p>

    <ol v-else class="content-manager-list">
      <li
        v-for="entry in entries"
        :key="`${entry.kind}-${entry.kind === 'section' ? entry.section.id : entry.lesson.id}`"
        class="content-manager-item"
        :class="`is-${entry.kind}`"
        :style="{ '--manager-depth': entry.depth }"
      >
        <template v-if="entry.kind === 'section'">
          <div class="content-manager-row">
            <span class="content-kind">Seção</span>
            <strong>{{ entry.section.title }}</strong>
            <div class="content-order-actions">
              <button class="icon-button" type="button" :disabled="submitting || sectionSiblings(entry.section)[0]?.id === entry.section.id" :aria-label="`Subir seção ${entry.section.title}`" @click="moveSection(entry.section, -1)">↑</button>
              <button class="icon-button" type="button" :disabled="submitting || sectionSiblings(entry.section).at(-1)?.id === entry.section.id" :aria-label="`Descer seção ${entry.section.title}`" @click="moveSection(entry.section, 1)">↓</button>
            </div>
          </div>
          <details class="content-edit-details">
            <summary>Editar seção</summary>
            <form class="content-edit-form" @submit.prevent="emit('updateSection', entry.section.id, sectionDrafts[entry.section.id]!)">
              <label>Título <input v-model="sectionDrafts[entry.section.id]!.title" required maxlength="180"></label>
              <label>Descrição <textarea v-model="sectionDrafts[entry.section.id]!.description" rows="3" maxlength="8000" /></label>
              <button class="button button-primary" type="submit" :disabled="submitting">Salvar seção</button>
            </form>
          </details>
        </template>

        <template v-else>
          <div class="content-manager-row">
            <span class="content-kind">Aula</span>
            <strong>{{ entry.lesson.title }}</strong>
            <div class="content-order-actions">
              <button class="icon-button" type="button" :disabled="submitting || lessonsInSection(lessons, entry.lesson.sectionId)[0]?.id === entry.lesson.id" :aria-label="`Subir aula ${entry.lesson.title}`" @click="moveLesson(entry.lesson, -1)">↑</button>
              <button class="icon-button" type="button" :disabled="submitting || lessonsInSection(lessons, entry.lesson.sectionId).at(-1)?.id === entry.lesson.id" :aria-label="`Descer aula ${entry.lesson.title}`" @click="moveLesson(entry.lesson, 1)">↓</button>
            </div>
          </div>
          <details class="content-edit-details">
            <summary>Editar ou mover aula</summary>
            <form class="content-edit-form" @submit.prevent="emit('updateLesson', entry.lesson.id, lessonDrafts[entry.lesson.id]!)">
              <label>Título <input v-model="lessonDrafts[entry.lesson.id]!.title" required maxlength="180"></label>
              <label>Descrição <textarea v-model="lessonDrafts[entry.lesson.id]!.description" rows="3" maxlength="8000" /></label>
              <label>Seção
                <select v-model="lessonDrafts[entry.lesson.id]!.sectionId">
                  <option :value="null">Curso (sem seção)</option>
                  <option v-for="item in flatSections" :key="item.section.id" :value="item.section.id">{{ '— '.repeat(item.depth) }}{{ item.section.title }}</option>
                </select>
              </label>
              <button class="button button-primary" type="submit" :disabled="submitting">Salvar aula</button>
            </form>
          </details>
        </template>
      </li>
    </ol>
  </section>
</template>
