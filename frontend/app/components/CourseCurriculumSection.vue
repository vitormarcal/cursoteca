<script setup lang="ts">
import type { CourseSection } from '~/types/course-section'
import type { Lesson } from '~/types/lesson'

defineOptions({ name: 'CourseCurriculumSection' })

const props = defineProps<{
  section: CourseSection
  lessons: Lesson[]
  courseSlug: string
  activeLessonId?: number
  depth: number
}>()

const directLessons = computed(() => lessonsInSection(props.lessons, props.section.id))
const lessonCount = computed(() => sectionLessonCount(props.section, props.lessons))
const hasActiveLesson = computed(() => directLessons.value.some(lesson => lesson.id === props.activeLessonId)
  || props.section.children.some(child => sectionContainsLesson(child, props.lessons, props.activeLessonId)))
</script>

<template>
  <li class="curriculum-section" :style="{ '--curriculum-depth': depth }">
    <details :open="depth === 0 || hasActiveLesson">
      <summary class="curriculum-section-summary">
        <span class="curriculum-chevron" aria-hidden="true">›</span>
        <span class="curriculum-section-copy">
          <strong>{{ section.title }}</strong>
          <small>{{ lessonCount }} {{ lessonCount === 1 ? 'aula' : 'aulas' }}</small>
        </span>
      </summary>

      <p v-if="section.description" class="curriculum-section-description">{{ section.description }}</p>

      <ol v-if="directLessons.length" class="curriculum-lessons">
        <li v-for="lesson in directLessons" :key="lesson.id">
          <NuxtLink
            class="curriculum-lesson"
            :class="{ 'is-active': lesson.id === activeLessonId }"
            :to="`/courses/${courseSlug}/lessons/${lesson.id}`"
            :aria-current="lesson.id === activeLessonId ? 'page' : undefined"
          >
            <span class="curriculum-play" aria-hidden="true">▶</span>
            <span>
              <strong>{{ lesson.title }}</strong>
              <small v-if="lesson.description">{{ lesson.description }}</small>
            </span>
          </NuxtLink>
        </li>
      </ol>

      <ol v-if="section.children.length" class="curriculum-sections">
        <CourseCurriculumSection
          v-for="child in section.children"
          :key="child.id"
          :section="child"
          :lessons="lessons"
          :course-slug="courseSlug"
          :active-lesson-id="activeLessonId"
          :depth="depth + 1"
        />
      </ol>
    </details>
  </li>
</template>
