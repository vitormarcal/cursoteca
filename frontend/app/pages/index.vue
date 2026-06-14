<script setup lang="ts">
const { listCourses } = useCourses()
const { data: courses, pending, error, refresh } = await listCourses()
</script>

<template>
  <main class="page">
    <PageHeader eyebrow="Biblioteca" title="Cursos">
      <NuxtLink class="button button-primary" to="/courses/new">Cadastrar curso</NuxtLink>
    </PageHeader>

    <p v-if="pending" class="muted">Carregando cursos...</p>

    <section v-else-if="error" class="empty-state">
      <h2>Não foi possível carregar os cursos</h2>
      <p>Verifique se o backend está rodando e tente novamente.</p>
      <button class="button" type="button" @click="refresh()">Tentar novamente</button>
    </section>

    <section v-else-if="courses.length === 0" class="empty-state">
      <h2>Nenhum curso cadastrado</h2>
      <p>Cadastre o primeiro curso para iniciar a nova biblioteca.</p>
      <NuxtLink class="button button-primary" to="/courses/new">Cadastrar curso</NuxtLink>
    </section>

    <section v-else class="course-grid" aria-label="Cursos cadastrados">
      <CourseCard v-for="course in courses" :key="course.id" :course="course" />
    </section>
  </main>
</template>
