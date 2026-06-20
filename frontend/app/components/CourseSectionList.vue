<script setup lang="ts">
import type { CourseSection } from '~/types/course-section'
import type { Lesson } from '~/types/lesson'

defineOptions({
  name: 'CourseSectionList'
})

withDefaults(defineProps<{
  sections: CourseSection[]
  lessons?: Lesson[]
  courseSlug: string
}>(), {
  lessons: () => []
})
</script>

<template>
  <ol class="section-list">
    <li v-for="section in sections" :key="section.id" class="section-item">
      <div>
        <h2>{{ section.title }}</h2>
        <p v-if="section.description">{{ section.description }}</p>
      </div>

      <LessonList
        :lessons="lessons.filter(lesson => lesson.sectionId === section.id)"
        :course-slug="courseSlug"
      />

      <CourseSectionList
        v-if="section.children.length"
        :sections="section.children"
        :lessons="lessons"
        :course-slug="courseSlug"
      />
    </li>
  </ol>
</template>
