<script setup lang="ts">
import type { CourseSection } from '~/types/course-section'
import type { Lesson } from '~/types/lesson'

const props = defineProps<{
  sections: CourseSection[]
  lessons: Lesson[]
  courseSlug: string
  activeLessonId?: number
}>()

const unsectionedLessons = computed(() => lessonsInSection(props.lessons, null))
</script>

<template>
  <nav class="curriculum" aria-label="Conteúdo do curso">
    <ol v-if="unsectionedLessons.length" class="curriculum-lessons curriculum-unsectioned">
      <li v-for="lesson in unsectionedLessons" :key="lesson.id">
        <NuxtLink
          class="curriculum-lesson"
          :class="{ 'is-active': lesson.id === activeLessonId }"
          :to="`/courses/${courseSlug}/lessons/${lesson.id}`"
          :aria-current="lesson.id === activeLessonId ? 'page' : undefined"
        >
          <span class="curriculum-play" :class="{ 'is-completed': lesson.completed }" aria-hidden="true">{{ lesson.completed ? '✓' : '▶' }}</span>
          <span>
            <strong>{{ lesson.title }}</strong>
            <small v-if="lesson.description">{{ lesson.description }}</small>
          </span>
        </NuxtLink>
      </li>
    </ol>

    <ol v-if="sections.length" class="curriculum-sections curriculum-root">
      <CourseCurriculumSection
        v-for="section in sections"
        :key="section.id"
        :section="section"
        :lessons="lessons"
        :course-slug="courseSlug"
        :active-lesson-id="activeLessonId"
        :depth="0"
      />
    </ol>
  </nav>
</template>
