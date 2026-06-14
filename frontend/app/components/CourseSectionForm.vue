<script setup lang="ts">
import type { CourseSection, CreateCourseSectionInput } from '~/types/course-section'

const props = defineProps<{
  sections: CourseSection[]
  submitting?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  submit: [input: CreateCourseSectionInput]
}>()

const parentId = ref('')
const title = ref('')
const description = ref('')

const parentOptions = computed(() => flattenSections(props.sections))

function flattenSections(sections: CourseSection[], depth = 0): Array<{ id: number, label: string }> {
  return sections.flatMap((section) => [
    {
      id: section.id,
      label: `${'  '.repeat(depth)}${section.title}`
    },
    ...flattenSections(section.children, depth + 1)
  ])
}

function submitSection() {
  if (!title.value.trim()) {
    return
  }

  emit('submit', {
    parentId: parentId.value ? Number(parentId.value) : null,
    title: title.value,
    description: description.value
  })

  title.value = ''
  description.value = ''
}
</script>

<template>
  <form class="course-form" @submit.prevent="submitSection">
    <label>
      <span>Seção pai</span>
      <select v-model="parentId" name="parentId">
        <option value="">Curso</option>
        <option v-for="option in parentOptions" :key="option.id" :value="String(option.id)">
          {{ option.label }}
        </option>
      </select>
    </label>

    <label>
      <span>Nome</span>
      <input v-model="title" name="title" type="text" required maxlength="180" autocomplete="off">
    </label>

    <label>
      <span>Descrição</span>
      <textarea v-model="description" name="description" rows="4" />
    </label>

    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>

    <div class="form-actions">
      <button class="button button-primary" type="submit" :disabled="submitting">
        {{ submitting ? 'Salvando...' : 'Criar seção' }}
      </button>
    </div>
  </form>
</template>
