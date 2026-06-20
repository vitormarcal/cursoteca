<script setup lang="ts">
import type { Lesson } from '~/types/lesson'

defineProps<{
  lessons: Lesson[]
  courseSlug: string
}>()
</script>

<template>
  <ol v-if="lessons.length" class="lesson-list">
    <li v-for="lesson in lessons" :key="lesson.id" class="lesson-item">
      <div>
        <h3>{{ lesson.title }}</h3>
        <p v-if="lesson.description">{{ lesson.description }}</p>
      </div>
      <NuxtLink class="button" :to="`/courses/${courseSlug}/lessons/${lesson.id}`">Abrir aula</NuxtLink>
    </li>
  </ol>
</template>
