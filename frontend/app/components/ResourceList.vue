<script setup lang="ts">
import type { CourseResource } from '~/types/resource'

defineProps<{ resources: CourseResource[] }>()
</script>

<template>
  <ul class="resource-list">
    <li v-for="resource in resources" :key="resource.id">
      <a v-if="resource.url" :href="resource.url" target="_blank" rel="noopener noreferrer">{{ resource.title }}</a>
      <template v-else-if="resource.fileUrl && resource.mimeType?.startsWith('audio/')">
        <a :href="resource.fileUrl" download>{{ resource.title }}</a>
        <audio controls preload="none" :src="resource.fileUrl">
          Seu navegador não suporta reprodução de áudio.
        </audio>
      </template>
      <a v-else-if="resource.fileUrl" :href="resource.fileUrl" target="_blank" rel="noopener noreferrer">
        {{ resource.title }}
      </a>
      <p v-if="resource.description">{{ resource.description }}</p>
    </li>
  </ul>
</template>
