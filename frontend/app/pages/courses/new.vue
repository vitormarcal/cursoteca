<script setup lang="ts">
import type { CreateCourseInput } from '~/composables/useCourses'

const { createCourse } = useCourses()
const submitting = ref(false)
const errorMessage = ref('')

async function submitCourse(input: CreateCourseInput) {
  errorMessage.value = ''
  submitting.value = true

  try {
    await createCourse(input)
    await navigateTo('/')
  } catch (error) {
    errorMessage.value = apiErrorMessage(error, 'Não foi possível cadastrar o curso.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="page narrow-page">
    <PageHeader eyebrow="Novo curso" title="Cadastro de curso" />
    <CourseForm :submitting="submitting" :error-message="errorMessage" @submit="submitCourse" />
  </main>
</template>
