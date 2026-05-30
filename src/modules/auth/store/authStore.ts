import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('quizlo_admin_token'))
  const isAuthenticated = ref<boolean>(!!token.value)

  function login(accessToken: string) {
    token.value = accessToken
    isAuthenticated.value = true
    localStorage.setItem('quizlo_admin_token', accessToken)
  }

  function logout() {
    token.value = null
    isAuthenticated.value = false
    localStorage.removeItem('quizlo_admin_token')
  }

  return {
    token,
    isAuthenticated,
    login,
    logout
  }
})
