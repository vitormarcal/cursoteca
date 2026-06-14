<script setup lang="ts">
import type { CourseSection } from '~/types/course-section'

defineOptions({
  name: 'CourseSectionList'
})

defineProps<{
  sections: CourseSection[]
}>()
</script>

<template>
  <ol class="section-list">
    <li v-for="section in sections" :key="section.id" class="section-item">
      <div>
        <h2>{{ section.title }}</h2>
        <p v-if="section.description">{{ section.description }}</p>
      </div>

      <CourseSectionList v-if="section.children.length" :sections="section.children" />
    </li>
  </ol>
</template>
