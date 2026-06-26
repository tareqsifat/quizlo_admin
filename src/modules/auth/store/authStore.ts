import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('quizlo_admin_token'))
  const isAuthenticated = ref<boolean>(!!token.value)
  const user = ref<any>(JSON.parse(localStorage.getItem('quizlo_admin_user') || 'null'))

  function login(accessToken: string, userData: any) {
    token.value = accessToken
    isAuthenticated.value = true
    user.value = userData
    localStorage.setItem('quizlo_admin_token', accessToken)
    localStorage.setItem('quizlo_admin_user', JSON.stringify(userData))
  }

  function logout() {
    token.value = null
    isAuthenticated.value = false
    user.value = null
    localStorage.removeItem('quizlo_admin_token')
    localStorage.removeItem('quizlo_admin_user')
  }

  return {
    token,
    isAuthenticated,
    user,
    login,
    logout
  }
})
