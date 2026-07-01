<template>
  <div class="login-scaffold animate-fade">
    <div class="login-card glass-effect">
      <div class="card-header">
        <div class="logo-container">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="24" height="24" rx="6" fill="#5B4FDC" />
            <path d="M7 12L10 15L17 8" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="logo-text">Quizlo Admin Portal</span>
        </div>
        <p class="subtitle">Access secure statistics, exam configurations, and student management.</p>
      </div>

      <!-- Mode Selector Badge -->
      <div class="mode-selector-container">
        <div class="mode-badge" :class="isMockMode ? 'badge-mock' : 'badge-live'" @click="toggleMode" title="Click to toggle connection mode">
          <span class="pulse-dot"></span>
          <span>{{ isMockMode ? 'MOCK MODE (OFFLINE)' : 'LIVE API SERVER' }}</span>
          <i class="pi pi-sync icon-refresh"></i>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">Admin Email Address</label>
          <div class="input-wrapper">
            <i class="pi pi-envelope input-icon"></i>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              placeholder="e.g., admin@quizlo.com" 
              required
              :disabled="loading"
              autocomplete="email"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <i class="pi pi-lock input-icon"></i>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              placeholder="••••••••" 
              required
              :disabled="loading"
              autocomplete="current-password"
            />
          </div>
        </div>

        <!-- Dev Hint Box -->
        <div class="hint-box">
          <i class="pi pi-info-circle hint-icon"></i>
          <div>
            <span class="hint-title">Sandbox Credentials:</span>
            <p v-if="isMockMode" class="hint-text">
              Email: <code class="code-select">admin@quizlo.app</code><br />
              Password: <code class="code-select">password</code>
            </p>
            <p v-else class="hint-text">
              Email: <code class="code-select">admin@quizlo.com</code><br />
              Password: <code class="code-select">password</code>
            </p>
          </div>
          <button type="button" class="autofill-btn" @click="autofill" :disabled="loading">Autofill</button>
        </div>

        <!-- Error Banner -->
        <transition name="slide-up">
          <div v-if="errorMessage" class="error-banner">
            <i class="pi pi-exclamation-circle error-icon"></i>
            <span>{{ errorMessage }}</span>
          </div>
        </transition>

        <button type="submit" class="submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner-container">
            <i class="pi pi-spin pi-spinner"></i> Authenticating...
          </span>
          <span v-else>Log In to Dashboard</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore'
import apiClient from '../../../shared/services/apiClient'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const isMockMode = ref(true)

onMounted(() => {
  // Sync state with local storage
  const saved = localStorage.getItem('quizlo_api_mock')
  if (saved !== null) {
    isMockMode.value = saved === 'true'
  } else {
    localStorage.setItem('quizlo_api_mock', 'true')
  }
})

function toggleMode() {
  isMockMode.value = !isMockMode.value
  localStorage.setItem('quizlo_api_mock', isMockMode.value ? 'true' : 'false')
  // Clear inputs on toggle
  email.value = ''
  password.value = ''
  errorMessage.value = null
  // Broadcast mode change to app layouts
  window.dispatchEvent(new CustomEvent('quizlo-api-mode-changed', { detail: isMockMode.value }))
}

function autofill() {
  if (isMockMode.value) {
    email.value = 'admin@quizlo.app'
    password.value = 'password'
  } else {
    email.value = 'admin@quizlo.com'
    password.value = 'password'
  }
}

async function handleLogin() {
  loading.value = true
  errorMessage.value = null

  try {
    const response = await apiClient.post('/auth/admin-login', {
      email: email.value,
      password: password.value
    })

    if (response.success && response.data) {
      const { token, user } = response.data
      authStore.login(token.access_token, user)
      router.push('/')
    } else {
      errorMessage.value = response.message || 'Login failed. Please check credentials.'
    }
  } catch (error: any) {
    console.error('Login error:', error)
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage.value = error.response.data.message
    } else {
      errorMessage.value = 'Connection error. Please check if the API server is online.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-scaffold {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 10% 20%, rgba(91, 79, 220, 0.05) 0%, rgba(0, 0, 0, 0) 90.2%),
              linear-gradient(135deg, #F8F9FC 0%, #E2E8F0 100%);
  padding: 1.5rem;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  box-shadow: 0 20px 40px -15px rgba(91, 79, 220, 0.12);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.card-header {
  margin-bottom: 2rem;
  text-align: center;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.logo-icon {
  width: 36px;
  height: 36px;
}

.logo-text {
  font-family: 'Outfit', sans-serif;
  font-weight: 800;
  font-size: 1.5rem;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.mode-selector-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.mode-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 1rem;
  border-radius: 50px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-sm);
}

.mode-badge:hover {
  transform: translateY(-1px);
}

.badge-mock {
  background-color: #FEF9EC;
  color: var(--color-accent-dark);
  border: 1px solid rgba(243, 156, 18, 0.2);
}

.badge-live {
  background-color: #E8F8F0;
  color: var(--color-primary-dark);
  border: 1px solid rgba(91, 79, 220, 0.2);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
}

.badge-live .pulse-dot {
  box-shadow: 0 0 0 3px rgba(91, 79, 220, 0.2);
  animation: pulse 1.8s infinite;
}

.badge-mock .pulse-dot {
  box-shadow: 0 0 0 3px rgba(243, 156, 18, 0.2);
  animation: pulse-mock 1.8s infinite;
}

.icon-refresh {
  font-size: 0.7rem;
  margin-left: 0.25rem;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(91, 79, 220, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(91, 79, 220, 0); }
  100% { box-shadow: 0 0 0 0 rgba(91, 79, 220, 0); }
}

@keyframes pulse-mock {
  0% { box-shadow: 0 0 0 0 rgba(243, 156, 18, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(243, 156, 18, 0); }
  100% { box-shadow: 0 0 0 0 rgba(243, 156, 18, 0); }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 0.85rem;
  color: var(--color-text-hint);
  font-size: 0.95rem;
}

.input-wrapper input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.25rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  color: var(--color-text-primary);
  transition: var(--transition-smooth);
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: #FFFFFF;
  box-shadow: 0 0 0 3px var(--color-primary-surface);
}

.hint-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background-color: var(--color-primary-surface);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  border: 1px solid rgba(91, 79, 220, 0.1);
  position: relative;
}

.hint-icon {
  color: var(--color-primary);
  font-size: 1rem;
  margin-top: 0.15rem;
}

.hint-title {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-primary-dark);
  margin-bottom: 0.15rem;
}

.hint-text {
  font-size: 0.725rem;
  color: var(--color-primary-dark);
  line-height: 1.4;
}

.code-select {
  font-family: monospace;
  background-color: rgba(91, 79, 220, 0.08);
  padding: 0.05rem 0.25rem;
  border-radius: 4px;
  font-weight: 600;
}

.autofill-btn {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.35rem 0.65rem;
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: 0 2px 5px rgba(91, 79, 220, 0.15);
}

.autofill-btn:hover {
  background-color: var(--color-primary-light);
  transform: translateY(-50%) translateY(-1px);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #FDF2F2;
  border: 1px solid rgba(231, 76, 60, 0.2);
  color: var(--color-heart);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  font-size: 0.775rem;
  font-weight: 550;
  line-height: 1.4;
}

.error-icon {
  font-size: 0.95rem;
  flex-shrink: 0;
}

.submit-btn {
  width: 100%;
  padding: 0.85rem;
  border: none;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: white;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: 0 4px 12px rgba(91, 79, 220, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover {
  background-color: var(--color-primary-light);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(91, 79, 220, 0.3);
}

.submit-btn:disabled {
  background-color: var(--color-text-hint);
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}

.spinner-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Animations */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(8px);
  opacity: 0;
}
</style>
