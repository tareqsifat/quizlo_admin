import axios from 'axios'
import { mockDb } from './mockDb'

// Base URL configuration for live backend integration
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
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

// Helper check for Mock Mode status
function isMockActive(): boolean {
  return localStorage.getItem('quizlo_api_mock') === 'true'
}

// ── Transparent Mock Handler Interceptor ────────────────────────
// If mock mode is active, intercept the request and return mockDb response directly.
client.interceptors.request.use((config) => {
  if (!isMockActive()) return config

  const url = config.url || ''
  const method = (config.method || 'get').toLowerCase()
  const data = config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : null

  // Simulated Delay for high-fidelity UI loading indicators
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // Interceptor resolver bypassing network requests
  const resolveMock = async (mockResponseData: any, status = 200) => {
    await delay(300) // 300ms simulated network latency
    return Promise.reject({
      config,
      response: {
        status,
        statusText: 'OK',
        headers: {},
        config,
        data: {
          success: status >= 200 && status < 300,
          data: mockResponseData,
          message: status < 300 ? 'Success (Mock Sandbox Mode)' : 'Error (Mock Sandbox)',
          meta: {}
        }
      }
    })
  }

  // Route matching rules
  try {
    // 0. Admin Login
    if (url.match(/^\/?auth\/admin-login$/)) {
      if (data && data.email === 'admin@quizlo.app' && data.password === 'password') {
        return resolveMock({
          token: {
            token_type: 'Bearer',
            expires_in: 1296000,
            access_token: 'mock_admin_access_token_12345',
            refresh_token: 'mock_admin_refresh_token_12345'
          },
          user: {
            id: 3,
            name: 'Admin User',
            email: 'admin@quizlo.app',
            phone: '01900000003'
          }
        })
      } else {
        return delay(300).then(() => Promise.reject({
          config,
          response: {
            status: 400,
            statusText: 'Bad Request',
            headers: {},
            config,
            data: {
              success: false,
              message: 'Invalid admin credentials or account not authorized.',
              data: null
            }
          }
        }))
      }
    }

    // 1. Dashboard Stats
    if (url.match(/^\/?admin\/dashboard\/stats/)) {
      return resolveMock(mockDb.getDashboardStats())
    }

    // 2. Exam Types & Mappings
    if (url.match(/^\/?admin\/exam-types$/)) {
      if (method === 'get') {
        return resolveMock(mockDb.getExamTypes())
      }
      if (method === 'post') {
        return resolveMock(mockDb.createExamType(data))
      }
    }
        const examTypeMatch = url.match(/^\/?admin\/exam-types\/(\d+)$/)
    if (examTypeMatch && method === 'put') {
      return resolveMock(mockDb.updateExamType(parseInt(examTypeMatch[1]!), data))
    }

    if (url.match(/^\/?admin\/exam-types\/assign-subject/)) {
      return resolveMock(mockDb.assignSubject(data))
    }

    const removeSubjectMatch = url.match(/^\/?admin\/exam-types\/(\d+)\/subjects\/(\d+)$/)
    if (removeSubjectMatch && method === 'delete') {
      return resolveMock(mockDb.removeSubject(parseInt(removeSubjectMatch[1]!), parseInt(removeSubjectMatch[2]!)))
    }

    // 3. Subjects list
    if (url.match(/^\/?admin\/subjects$/)) {
      return resolveMock(mockDb.getSubjects())
    }

    // 4. Lessons
    if (url.match(/^\/?admin\/lessons$/)) {
      if (method === 'get') {
        return resolveMock(mockDb.getLessons())
      }
      if (method === 'post') {
        return resolveMock(mockDb.createLesson(data))
      }
    }
    const lessonMatch = url.match(/^\/?admin\/lessons\/(\d+)$/)
    if (lessonMatch) {
      if (method === 'put') {
        return resolveMock(mockDb.updateLesson(parseInt(lessonMatch[1]!), data))
      }
      if (method === 'delete') {
        return resolveMock(mockDb.deleteLesson(parseInt(lessonMatch[1]!)))
      }
    }

    // 5. Questions (Multi-Type and Importer)
    if (url.match(/^\/?admin\/questions$/)) {
      if (method === 'get') {
        return resolveMock(mockDb.getQuestions())
      }
      if (method === 'post') {
        return resolveMock(mockDb.createQuestion(data))
      }
    }
    
    if (url.match(/^\/?admin\/questions\/import/)) {
      const res = mockDb.importQuestions(data.exam_type_id, data.source_batch, data.source_year, data.questions)
      return resolveMock(res)
    }

    const questionMatch = url.match(/^\/?admin\/questions\/(\d+)$/)
    if (questionMatch) {
      if (method === 'put') {
        return resolveMock(mockDb.updateQuestion(parseInt(questionMatch[1]!), data))
      }
      if (method === 'delete') {
        return resolveMock(mockDb.deleteQuestion(parseInt(questionMatch[1]!)))
      }
    }

    // 6. Users
    if (url.match(/^\/?admin\/users$/)) {
      return resolveMock(mockDb.getUsers())
    }
    const userToggleMatch = url.match(/^\/?admin\/users\/(\d+)\/toggle-active/)
    if (userToggleMatch) {
      return resolveMock(mockDb.toggleUserActive(parseInt(userToggleMatch[1]!)))
    }

  } catch {
    return resolveMock(null, 500)
  }

  return config
})

// Response interceptor to catch the mock Promise.reject and turn it into resolved output
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Check if it is our intercepted mock response
    if (error.response && error.response.statusText === 'OK' && isMockActive()) {
      return Promise.resolve(error.response.data)
    }
    return Promise.reject(error)
  }
)

export default client as any
