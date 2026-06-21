<script setup lang="ts">
import type { CourseResource } from '~/types/resource'

defineProps<{ resources: CourseResource[] }>()
</script>

<template>
  <ul class="resource-list">
    <li v-for="resource in resources" :key="resource.id">
      <a v-if="resource.url" :href="resource.url" target="_blank" rel="noopener noreferrer">{{ resource.title }}</a>
      <p v-if="resource.description">{{ resource.description }}</p>
    </li>
  </ul>
</template>
