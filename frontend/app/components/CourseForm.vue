<script setup lang="ts">
import type { CreateCourseInput } from '~/composables/useCourses'

const emit = defineEmits<{
  submit: [input: CreateCourseInput]
}>()

defineProps<{
  submitting?: boolean
  errorMessage?: string
}>()

const name = ref('')
const description = ref('')
const image = ref<File | null>(null)

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  image.value = input.files?.[0] ?? null
}

function submitCourse() {
  if (!name.value.trim() || !description.value.trim() || !image.value) {
    return
  }

  emit('submit', {
    name: name.value,
    description: description.value,
    image: image.value
  })
}
</script>

<template>
  <form class="course-form" @submit.prevent="submitCourse">
    <label>
      <span>Nome</span>
      <input v-model="name" name="name" type="text" required maxlength="180" autocomplete="off">
    </label>

    <label>
      <span>Descrição</span>
      <textarea v-model="description" name="description" required rows="6" />
    </label>

    <label>
      <span>Imagem</span>
      <input name="image" type="file" accept="image/*" required @change="onImageChange">
    </label>

    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

    <div class="form-actions">
      <NuxtLink class="button" to="/">Cancelar</NuxtLink>
      <button class="button button-primary" type="submit" :disabled="submitting">
        {{ submitting ? 'Salvando...' : 'Salvar curso' }}
      </button>
    </div>
  </form>
</template>
