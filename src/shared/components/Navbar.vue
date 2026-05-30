<template>
  <header class="navbar glass-effect">
    <div class="nav-left">
      <h2 class="page-title">{{ currentPageTitle }}</h2>
    </div>

    <div class="nav-right">
      <!-- API Mode Switcher Widget -->
      <div class="mock-switcher" :class="{ 'mock-active': isMockMode }">
        <span class="switcher-label">
          <i class="pi pi-server icon-server"></i>
          {{ isMockMode ? 'MOCK DATA MODE (OFFLINE SAFE)' : 'LIVE API SERVER' }}
        </span>
        <button 
          class="switch-btn" 
          @click="toggleMode" 
          :title="isMockMode ? 'Switch to real server API connection' : 'Switch to offline mock engine'"
        >
          <span class="switch-handle"></span>
        </button>
      </div>

      <div class="divider"></div>

      <!-- Quick Platform Health Widget -->
      <div class="health-badge" :class="isMockMode ? 'health-mock' : 'health-online'">
        <span class="dot"></span>
        {{ isMockMode ? 'Offline Sandbox' : 'Server Online' }}
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isMockMode = ref(true) // Default to true so it works out of the box!

onMounted(() => {
  const saved = localStorage.getItem('quizlo_api_mock')
  if (saved !== null) {
    isMockMode.value = saved === 'true'
  } else {
    localStorage.setItem('quizlo_api_mock', 'true')
  }
})

const currentPageTitle = computed(() => {
  const name = route.name as string
  if (!name) return 'Dashboard'
  if (name === 'home') return 'Overview Dashboard'
  return name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' ')
})

function toggleMode() {
  isMockMode.value = !isMockMode.value
  localStorage.setItem('quizlo_api_mock', isMockMode.value ? 'true' : 'false')
  // Broadcast event to reload pages/states
  window.dispatchEvent(new CustomEvent('quizlo-api-mode-changed', { detail: isMockMode.value }))
}
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

.nav-right {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.divider {
  width: 1px;
  height: 24px;
  background-color: var(--color-border);
}

/* Mock switcher widget styling */
.mock-switcher {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--color-primary-surface);
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid rgba(91, 79, 220, 0.15);
  transition: var(--transition-smooth);
}

.mock-switcher.mock-active {
  background-color: #FEF9EC;
  border-color: rgba(243, 156, 18, 0.25);
}

.switcher-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-primary-dark);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.mock-switcher.mock-active .switcher-label {
  color: var(--color-accent-dark);
}

.icon-server {
  font-size: 0.85rem;
}

.switch-btn {
  width: 38px;
  height: 20px;
  border-radius: 20px;
  background-color: var(--color-primary);
  border: none;
  cursor: pointer;
  position: relative;
  transition: var(--transition-smooth);
}

.mock-switcher.mock-active .switch-btn {
  background-color: var(--color-accent);
}

.switch-handle {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: white;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: var(--transition-smooth);
}

/* Switch active position */
.mock-switcher.mock-active .switch-handle {
  left: 21px;
}

/* Health Badge */
.health-badge {
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.65rem;
  border-radius: 50px;
}

.health-badge.health-mock {
  background-color: #F1F5F9;
  color: var(--color-text-secondary);
}

.health-badge.health-online {
  background-color: #E8F8F0;
  color: var(--color-primary-dark);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #94A3B8;
  display: inline-block;
}

.health-online .dot {
  background-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(91, 79, 220, 0.2);
  animation: pulse 1.8s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(91, 79, 220, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(91, 79, 220, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(91, 79, 220, 0);
  }
}
</style>
