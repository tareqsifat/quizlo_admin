import axios from 'axios'
import { mockDb } from './mockDb'

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

    // 3. Subjects — full CRUD
    if (url.match(/^\/?\.?admin\/subjects\/all$/)) {
      return resolveMock(mockDb.getSubjects())
    }
    if (url.match(/^\/?admin\/subjects$/)) {
      if (method === 'get') {
        return resolveMock(mockDb.getSubjects())
      }
      if (method === 'post') {
        return resolveMock(mockDb.createSubject(data))
      }
    }
    const subjectMatch = url.match(/^\/?admin\/subjects\/(\d+)$/)
    if (subjectMatch) {
      const subId = parseInt(subjectMatch[1]!)
      if (method === 'put')    return resolveMock(mockDb.updateSubject(subId, data))
      if (method === 'delete') return resolveMock(mockDb.deleteSubject(subId))
    }

    // 3b. Exam Type Subjects — full CRUD
    const etsForExamTypeMatch = url.match(/^\/?admin\/exam-type-subjects\/for-exam-type\/(\d+)$/)
    if (etsForExamTypeMatch && method === 'get') {
      return resolveMock(mockDb.getExamTypeSubjectEntriesForExamType(parseInt(etsForExamTypeMatch[1]!)))
    }
    if (url.match(/^\/?admin\/exam-type-subjects$/)) {
      if (method === 'get') {
        return resolveMock(mockDb.getExamTypeSubjectEntries())
      }
      if (method === 'post') {
        return resolveMock(mockDb.createExamTypeSubjectEntry(data))
      }
    }
    const etsMatch = url.match(/^\/?admin\/exam-type-subjects\/(\d+)$/)
    if (etsMatch) {
      const etsId = parseInt(etsMatch[1]!)
      if (method === 'put')    return resolveMock(mockDb.updateExamTypeSubjectEntry(etsId, data))
      if (method === 'delete') return resolveMock(mockDb.deleteExamTypeSubjectEntry(etsId))
    }

    // 3c. Topics — full CRUD
    const topicsForExamSubjectMatch = url.match(/^\/?admin\/topics\/for-exam-type-subject\/(\d+)$/)
    if (topicsForExamSubjectMatch && method === 'get') {
      return resolveMock(mockDb.getTopicsForExamTypeSubject(parseInt(topicsForExamSubjectMatch[1]!)))
    }
    if (url.match(/^\/?admin\/topics$/)) {
      if (method === 'get') {
        return resolveMock(mockDb.getTopics())
      }
      if (method === 'post') {
        return resolveMock(mockDb.createTopic(data))
      }
    }
    const topicMatch = url.match(/^\/?admin\/topics\/(\d+)$/)
    if (topicMatch) {
      const topicId = parseInt(topicMatch[1]!)
      if (method === 'put')    return resolveMock(mockDb.updateTopic(topicId, data))
      if (method === 'delete') return resolveMock(mockDb.deleteTopic(topicId))
    }

    // 5. Questions import (updated: uses exam-type-subject matching)
    if (url.match(/^\/?admin\/questions\/import/)) {
      // Build exam-subject lookup map for this exam type
      const etsMap: Record<string, number> = {}
      const etsForType = mockDb.getExamTypeSubjectEntriesForExamType(data.exam_type_id)
      etsForType.forEach((ets: any) => {
        etsMap[ets.title.toLowerCase().trim()] = ets.id
      })

      let imported = 0, skipped = 0
      const failed: any[] = []
      const notices: any[] = []
      const topicMapByEts: Record<number, Record<string, number>> = {}

      ;(data.rows || []).forEach((row: any, idx: number) => {
        const rowNum = idx + 1
        if (!row.question) { skipped++; notices.push({ row: rowNum, reason: 'Missing question text' }); return }
        if (!row.optionA || !row.optionB) { skipped++; notices.push({ row: rowNum, reason: 'Missing options B or C' }); return }
        const subjectKey = (row.subject || '').toLowerCase().trim()
        if (!subjectKey) { skipped++; notices.push({ row: rowNum, reason: 'Subject column (G) is empty.' }); return }
        const etsId = etsMap[subjectKey]
        if (!etsId) {
          failed.push({ row: rowNum, subject_raw: row.subject, reason: `No Exam Subject found for "${row.subject}" under the selected Exam Type.` })
          return
        }

        let topicId: number | null = null
        const topicRaw = (row.topic || '').trim()
        if (topicRaw) {
          if (!topicMapByEts[etsId]) {
            const map: Record<string, number> = {}
            mockDb.getTopicsForExamTypeSubject(etsId).forEach((t: any) => { map[t.name.toLowerCase().trim()] = t.id })
            topicMapByEts[etsId] = map
          }
          const topicKey = topicRaw.toLowerCase()
          topicId = topicMapByEts[etsId]![topicKey] ?? null
          if (!topicId) {
            const newTopic = mockDb.createTopic({ exam_type_subject_id: etsId, name: topicRaw, name_bn: topicRaw, sort_order: 0 })
            topicId = newTopic.id
            topicMapByEts[etsId]![topicKey] = topicId
          }
        }

        mockDb.createQuestion({ subject_id: etsId, topic_id: topicId, question_text: row.question, question_type: 'mcq', explanation: row.explanation, difficulty: 'medium', xp_value: 10,
          options: [
            { option_text: row.optionA, is_correct: row.rightAnswer === 'A' },
            { option_text: row.optionB, is_correct: row.rightAnswer === 'B' },
            ...(row.optionC ? [{ option_text: row.optionC, is_correct: row.rightAnswer === 'C' }] : []),
            ...(row.optionD ? [{ option_text: row.optionD, is_correct: row.rightAnswer === 'D' }] : []),
          ] })
        imported++
      })
      return resolveMock({ imported, skipped, failed, notices })
    }

    // 4. Lessons
    if (url.match(/^\/?admin\/lessons$/)) {
      if (method === 'get') return resolveMock(mockDb.getLessons())
      if (method === 'post') return resolveMock(mockDb.createLesson(data))
    }
    const lessonMatch = url.match(/^\/?admin\/lessons\/(\d+)$/)
    if (lessonMatch) {
      if (method === 'put')    return resolveMock(mockDb.updateLesson(parseInt(lessonMatch[1]!), data))
      if (method === 'delete') return resolveMock(mockDb.deleteLesson(parseInt(lessonMatch[1]!)))
    }

    // 5. Questions (get / post)
    if (url.match(/^\/?admin\/questions$/)) {
      if (method === 'get')  return resolveMock(mockDb.getQuestions())
      if (method === 'post') return resolveMock(mockDb.createQuestion(data))
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

    // 5b. Question search-similar + exam-year appearances
    if (url.match(/^\/?admin\/questions\/search-similar$/) && method === 'get') {
      const q = (config.params && config.params.q) || ''
      return resolveMock(mockDb.searchSimilarQuestions(q))
    }
    const appearancesListMatch = url.match(/^\/?admin\/questions\/(\d+)\/appearances$/)
    if (appearancesListMatch) {
      const qId = parseInt(appearancesListMatch[1]!)
      if (method === 'get')  return resolveMock(mockDb.getQuestionAppearances(qId))
      if (method === 'post') return resolveMock(mockDb.createQuestionAppearance(qId, data))
    }
    const appearanceDeleteMatch = url.match(/^\/?admin\/questions\/(\d+)\/appearances\/(\d+)$/)
    if (appearanceDeleteMatch && method === 'delete') {
      return resolveMock(mockDb.deleteQuestionAppearance(parseInt(appearanceDeleteMatch[1]!), parseInt(appearanceDeleteMatch[2]!)))
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
