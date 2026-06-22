<script setup lang="ts">
import type { LessonDownloadJob, LessonDownloadStatus } from '~/types/lesson-download'

defineProps<{ jobs: LessonDownloadJob[] }>()

const labels: Record<LessonDownloadStatus, string> = {
  QUEUED: 'Na fila',
  RUNNING: 'Baixando',
  COMPLETED: 'Concluído',
  FAILED: 'Falhou'
}
</script>

<template>
  <ul class="download-list">
    <li v-for="job in jobs" :key="job.id" class="download-item">
      <div>
        <strong>{{ job.title }}</strong>
        <p>{{ labels[job.status] }}<template v-if="job.status === 'RUNNING'"> · {{ job.progress }}%</template></p>
        <p v-if="job.error" class="form-error">{{ job.error }}</p>
      </div>
      <progress v-if="job.status === 'RUNNING'" :value="job.progress" max="100">{{ job.progress }}%</progress>
    </li>
  </ul>
</template>
