<template>
  <div class="sidebar" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="sidebar-header">
      <div class="logo-area">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="6" fill="#5B4FDC" />
          <path d="M7 12L10 15L17 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span class="logo-text" v-if="!isCollapsed">Quizlo Admin</span>
      </div>
      <button class="collapse-btn" @click="toggleCollapse" aria-label="Toggle Sidebar">
        <i :class="['pi', isCollapsed ? 'pi-chevron-right' : 'pi-chevron-left']"></i>
      </button>
    </div>

    <nav class="sidebar-nav">
      <router-link 
        v-for="item in navItems" 
        :key="item.path" 
        :to="item.path" 
        class="nav-link" 
        :title="item.label"
      >
        <component :is="item.icon" class="nav-icon" />
        <span class="nav-label" v-if="!isCollapsed">{{ item.label }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer" v-if="!isCollapsed">
      <div class="user-profile">
        <div class="avatar">AD</div>
        <div class="user-info">
          <div class="user-name">Techlead Admin</div>
          <div class="user-role">System Admin</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  LayoutDashboard, 
  Layers, 
  BookOpen, 
  HelpCircle, 
  Users, 
  Calendar, 
  Settings 
} from 'lucide-vue-next'

const isCollapsed = ref(false)

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Exam Types', path: '/exam-types', icon: Layers },
  { label: 'Lessons', path: '/lessons', icon: BookOpen },
  { label: 'Questions', path: '/questions', icon: HelpCircle },
  { label: 'Users', path: '/users', icon: Users },
  { label: 'Model Tests', path: '/exams', icon: Calendar },
]

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background-color: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  transition: var(--transition-smooth);
  position: relative;
  z-index: 50;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

.sidebar-collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar-header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.logo-text {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #FFF 0%, rgba(255, 255, 255, 0.7) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  white-space: nowrap;
}

.collapse-btn {
  background: transparent;
  border: none;
  color: var(--sidebar-text-muted);
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-smooth);
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.sidebar-nav {
  flex: 1;
  padding: 1.25rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-md);
  color: var(--sidebar-text-muted);
  font-weight: 500;
  font-size: 0.925rem;
  transition: var(--transition-smooth);
  white-space: nowrap;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.03);
  color: white;
}

.nav-link.router-link-active {
  background: var(--color-primary);
  color: white;
  box-shadow: 0 4px 12px rgba(91, 79, 220, 0.25);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
}

.user-role {
  font-size: 0.75rem;
  color: var(--sidebar-text-muted);
}
</style>
