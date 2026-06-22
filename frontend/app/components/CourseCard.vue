<script setup lang="ts">
import type { Course } from '~/types/course'

defineProps<{
  course: Course
}>()
</script>

<template>
  <article class="course-card">
    <NuxtLink class="course-card-main" :to="`/courses/${course.slug}`">
      <img :src="course.imageUrl" :alt="`Capa do curso ${course.name}`">
      <div class="course-card-copy">
        <h2>{{ course.name }}</h2>
        <p>{{ course.description }}</p>
      </div>
    </NuxtLink>
    <div v-if="course.continueLessonId" class="course-card-footer">
      <span>Última atividade registrada</span>
      <NuxtLink class="button button-primary" :to="`/courses/${course.slug}/lessons/${course.continueLessonId}`">
        Continuar
      </NuxtLink>
    </div>
  </article>
</template>
