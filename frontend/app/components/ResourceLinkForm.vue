<script setup lang="ts">
import type { CreateResourceLinkInput, ResourceTarget } from '~/types/resource'

const props = defineProps<{
  targets: ResourceTarget[]
  submitting?: boolean
  errorMessage?: string
  successMessage?: string
}>()

const emit = defineEmits<{
  submit: [input: CreateResourceLinkInput]
}>()

const targetIndex = ref('0')
const title = ref('')
const description = ref('')
const url = ref('')

function submitLink() {
  const target = props.targets[Number(targetIndex.value)]
  if (!target || !title.value.trim() || !url.value.trim()) return

  emit('submit', {
    scope: target.scope,
    sectionId: target.sectionId ?? null,
    lessonId: target.lessonId ?? null,
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
  <form class="course-form" @submit.prevent="submitLink">
    <label>
      <span>Vincular ao</span>
      <select v-model="targetIndex" name="resourceTarget">
        <option v-for="(target, index) in targets" :key="`${target.scope}-${target.sectionId || target.lessonId || 0}`" :value="String(index)">
          {{ target.label }}
        </option>
      </select>
    </label>
    <label>
      <span>Título</span>
      <input v-model="title" name="resourceTitle" required maxlength="180" autocomplete="off">
    </label>
    <label>
      <span>URL</span>
      <input v-model="url" name="resourceUrl" type="url" required placeholder="https://">
    </label>
    <label>
      <span>Descrição</span>
      <textarea v-model="description" name="resourceDescription" rows="3" />
    </label>
    <p v-if="errorMessage" class="form-error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="form-success">{{ successMessage }}</p>
    <div class="form-actions">
      <button class="button button-primary" type="submit" :disabled="submitting">
        {{ submitting ? 'Salvando...' : 'Adicionar link' }}
      </button>
    </div>
  </form>
</template>
