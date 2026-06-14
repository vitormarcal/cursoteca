<script setup lang="ts">
import type { Course } from '~/types/course'

defineProps<{
  course: Course
}>()
</script>

<template>
  <article class="course-card">
    <img :src="course.imageUrl" :alt="`Capa do curso ${course.name}`">
    <div>
      <h2>{{ course.name }}</h2>
      <p>{{ course.description }}</p>
    </div>
  </article>
</template>
