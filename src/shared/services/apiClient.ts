import axios from 'axios'

// Base URL configuration for live backend integration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

const client = axios.create({
  baseURL: BASE_URL,
  // The unpaginated /admin/questions listing can take several seconds once
  // the bank has thousands of rows (pre-existing scalability limit, not
  // introduced here) — a generous timeout avoids spurious failures on that
  // one heavy endpoint rather than making every other call wait needlessly.
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Inject JWT token into headers for live API calls
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('quizlo_admin_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

// Unwrap response bodies; on 401 (expired/invalid token) clear the session and
// send the user back to the login page.
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const isLoginRequest = /auth\/admin-login/.test(error.config?.url || '')
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('quizlo_admin_token')
      localStorage.removeItem('quizlo_admin_user')
      const loginPath = `${import.meta.env.BASE_URL}login`
      if (window.location.pathname !== loginPath) {
        window.location.href = loginPath
      }
    }
    return Promise.reject(error)
  }
)

export default client as any
