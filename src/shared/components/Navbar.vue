<template>
  <header class="navbar glass-effect">
    <div class="nav-left">
      <h2 class="page-title">{{ currentPageTitle }}</h2>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const currentPageTitle = computed(() => {
  const name = route.name as string
  if (!name) return 'Dashboard'
  if (name === 'home') return 'Overview Dashboard'
  return name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ')
})
</script>

<style scoped>
.navbar {
  height: 70px;
  border-bottom: 1px solid var(--color-border);
  padding: 0 1.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 40;
}

.page-title {
  font-size: 1.25rem;
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.01em;
}
</style>
