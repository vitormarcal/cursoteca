<script setup lang="ts">
import type { CourseSection } from '~/types/course-section'
import type { CreateLessonDownloadInput } from '~/types/lesson-download'

const props = defineProps<{
  sections: CourseSection[]
  submitting?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{ submit: [input: CreateLessonDownloadInput] }>()
const sectionId = ref('')
const title = ref('')
const description = ref('')
const url = ref('')

const sectionOptions = computed(() => flattenSections(props.sections))

function flattenSections(sections: CourseSection[], depth = 0): Array<{ id: number, label: string }> {
  return sections.flatMap(section => [
    { id: section.id, label: `${'  '.repeat(depth)}${section.title}` },
    ...flattenSections(section.children, depth + 1)
  ])
}

function submitDownload() {
  if (!title.value.trim() || !url.value.trim()) return
  emit('submit', {
    sectionId: sectionId.value ? Number(sectionId.value) : null,
    title: title.value,
    description: description.value,
    url: url.value
  })
  title.value = ''
  description.value = ''
  url.value = ''
}
</script>

<template>
  <form class="course-form" @submit.prevent="submitDownload">
    <label>
      <span>Seção</span>
      <select v-model="sectionId" name="downloadSectionId">
        <option value="">Curso (sem seção)</option>
        <option v-for="option in sectionOptions" :key="option.id" :value="String(option.id)">
          {{ option.label }}
        </option>
      </select>
    </label>
    <label>
      <span>Título</span>
      <input v-model="title" name="downloadTitle" type="text" required maxlength="180" autocomplete="off">
    </label>
    <label>
      <span>Descrição</span>
      <textarea v-model="description" name="downloadDescription" rows="3" />
    </label>
    <label>
      <span>URL do vídeo</span>
      <input v-model="url" name="downloadUrl" type="url" required placeholder="https://..." autocomplete="off">
    </label>
    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    <div class="form-actions">
      <button class="button button-primary" type="submit" :disabled="submitting">
        {{ submitting ? 'Adicionando...' : 'Baixar vídeo' }}
      </button>
    </div>
  </form>
</template>
