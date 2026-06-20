<script setup lang="ts">
import type { CourseSection } from '~/types/course-section'
import type { CreateLessonInput } from '~/types/lesson'

const props = defineProps<{
  sections: CourseSection[]
  submitting?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  submit: [input: CreateLessonInput]
}>()

const sectionId = ref('')
const title = ref('')
const description = ref('')
const video = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const sectionOptions = computed(() => flattenSections(props.sections))

function flattenSections(sections: CourseSection[], depth = 0): Array<{ id: number, label: string }> {
  return sections.flatMap(section => [
    {
      id: section.id,
      label: `${'  '.repeat(depth)}${section.title}`
    },
    ...flattenSections(section.children, depth + 1)
  ])
}

function selectVideo(event: Event) {
  video.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

function submitLesson() {
  if (!title.value.trim() || !video.value) {
    return
  }

  emit('submit', {
    sectionId: sectionId.value ? Number(sectionId.value) : null,
    title: title.value,
    description: description.value,
    video: video.value
  })

  title.value = ''
  description.value = ''
  video.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
</script>

<template>
  <form class="course-form" @submit.prevent="submitLesson">
    <label>
      <span>Seção</span>
      <select v-model="sectionId" name="sectionId">
        <option value="">Curso (sem seção)</option>
        <option v-for="option in sectionOptions" :key="option.id" :value="String(option.id)">
          {{ option.label }}
        </option>
      </select>
    </label>

    <label>
      <span>Título</span>
      <input v-model="title" name="title" type="text" required maxlength="180" autocomplete="off">
    </label>

    <label>
      <span>Descrição</span>
      <textarea v-model="description" name="description" rows="4" />
    </label>

    <label>
      <span>Vídeo MP4</span>
      <input
        ref="fileInput"
        name="video"
        type="file"
        required
        accept="video/mp4,.mp4"
        @change="selectVideo"
      >
    </label>

    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

    <div class="form-actions">
      <button class="button button-primary" type="submit" :disabled="submitting">
        {{ submitting ? 'Enviando...' : 'Cadastrar aula' }}
      </button>
    </div>
  </form>
</template>
