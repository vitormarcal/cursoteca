<script setup lang="ts">
import type { LessonDetail } from '~/types/lesson'

defineProps<{
  groups: LessonDetail['resourceGroups']
}>()
</script>

<template>
  <section class="lesson-resources">
    <h2>Materiais</h2>

    <div v-if="groups.lesson.length" class="resource-group">
      <h3>Material desta aula</h3>
      <ResourceList :resources="groups.lesson" />
    </div>
    <div v-if="groups.section.length" class="resource-group">
      <h3>Material desta seção</h3>
      <ResourceList :resources="groups.section" />
    </div>
    <div v-for="group in groups.ancestors" :key="group.section.id" class="resource-group">
      <h3>Material de {{ group.section.title }}</h3>
      <ResourceList :resources="group.resources" />
    </div>
    <div v-if="groups.course.length" class="resource-group">
      <h3>Material do curso</h3>
      <ResourceList :resources="groups.course" />
    </div>

    <p v-if="!groups.lesson.length && !groups.section.length && !groups.ancestors.length && !groups.course.length" class="muted">
      Nenhum material cadastrado.
    </p>
  </section>
</template>
