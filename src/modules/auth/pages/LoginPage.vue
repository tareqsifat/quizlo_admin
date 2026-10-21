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
              :type="showPassword ? 'text' : 'password'" 
              id="password" 
              v-model="password" 
              placeholder="••••••••" 
              required
              :disabled="loading"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-password-btn"
              @click="showPassword = !showPassword"
              :title="showPassword ? 'Hide password' : 'Show password'"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              :disabled="loading"
            >
              <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
            </button>
          </div>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore'
import apiClient from '../../../shared/services/apiClient'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const showPassword = ref(false)

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

.input-wrapper input#password {
  padding-right: 2.75rem;
}

.input-wrapper input:focus {
  outline: none;
  border-color: var(--color-primary);
  background-color: #FFFFFF;
  box-shadow: 0 0 0 3px var(--color-primary-surface);
}

.toggle-password-btn {
  position: absolute;
  right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-hint);
  cursor: pointer;
  transition: var(--transition-smooth);
}

.toggle-password-btn:hover:not(:disabled) {
  color: var(--color-primary);
  background-color: var(--color-primary-surface);
}

.toggle-password-btn:disabled {
  cursor: not-allowed;
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
