<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <header class="topbar">
      <NuxtLink class="brand" to="/">Cursoteca</NuxtLink>
      <nav>
        <NuxtLink to="/">Cursos</NuxtLink>
        <NuxtLink class="button button-primary" to="/courses/new">Novo curso</NuxtLink>
      </nav>
    </header>
    <NuxtPage />
  </div>
</template>
