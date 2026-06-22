<script setup lang="ts">
import type { CreateResourceFileInput, ResourceTarget } from '~/types/resource'

const props = defineProps<{
  targets: ResourceTarget[]
  submitting?: boolean
  errorMessage?: string
  successMessage?: string
}>()

const emit = defineEmits<{
  submit: [input: CreateResourceFileInput]
}>()

const targetIndex = ref('0')
const title = ref('')
const description = ref('')
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

function selectFile(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

function submitFile() {
  const target = props.targets[Number(targetIndex.value)]
  if (!target || !title.value.trim() || !file.value) return

  emit('submit', {
    scope: target.scope,
    sectionId: target.sectionId ?? null,
    lessonId: target.lessonId ?? null,
    title: title.value,
    description: description.value,
    file: file.value
  })
  title.value = ''
  description.value = ''
  file.value = null
  if (fileInput.value) fileInput.value.value = ''
}
</script>

<template>
  <form class="course-form" @submit.prevent="submitFile">
    <label>
      <span>Vincular ao</span>
      <select v-model="targetIndex" name="fileTarget">
        <option v-for="(target, index) in targets" :key="`${target.scope}-${target.sectionId || target.lessonId || 0}`" :value="String(index)">
          {{ target.label }}
        </option>
      </select>
    </label>
    <label>
      <span>Título</span>
      <input v-model="title" name="fileTitle" required maxlength="180" autocomplete="off">
    </label>
    <label>
      <span>PDF ou áudio</span>
      <input
        ref="fileInput"
        name="resourceFile"
        type="file"
        required
        accept="application/pdf,.pdf,audio/mpeg,.mp3,audio/mp4,.m4a,audio/wav,.wav,audio/ogg,.ogg,audio/flac,.flac"
        @change="selectFile"
      >
    </label>
    <label>
      <span>Descrição</span>
      <textarea v-model="description" name="fileDescription" rows="3" />
    </label>
    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="form-success">{{ successMessage }}</p>
    <div class="form-actions">
      <button class="button button-primary" type="submit" :disabled="submitting">
        {{ submitting ? 'Enviando...' : 'Enviar arquivo' }}
      </button>
    </div>
  </form>
</template>
