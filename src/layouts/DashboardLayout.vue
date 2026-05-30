<template>
  <div class="app-container">
    <!-- Collapsible Sidebar Navigation (Left Panel) -->
    <Sidebar />

    <!-- Workspace Panel (Main Body) -->
    <div class="main-content">
      <!-- Navbar (Top Header) -->
      <Navbar />

      <!-- Scrollable workspace view -->
      <main class="workspace">
        <router-view v-slot="{ Component }">
          <transition name="fade-page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from '../shared/components/Sidebar.vue'
import Navbar from '../shared/components/Navbar.vue'
</script>

<style scoped>
.fade-page-enter-active,
.fade-page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-page-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
