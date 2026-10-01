import { ref } from 'vue'

export interface QuestionOption {
  id: number
  option_text: string
  option_text_bn?: string
  is_correct: boolean
  sort_order?: number
  match_text?: string // Used for match_answer type
}

export interface Question {
  id: number
  subject_id: number
  subject_name?: string
  topic_id?: number
  topic_name?: string
  lesson_id?: number
  question_text: string
  question_bn?: string
  explanation?: string
  difficulty: 'easy' | 'medium' | 'hard'
  xp_value: number
  is_active: boolean
  question_type: 'mcq' | 'fill_gap' | 'listen_answer' | 'match_answer'
  audio_url?: string // Audio attachment for listen_answer
  options: QuestionOption[]
  exam_types?: any[]
  appearances?: QuestionAppearance[]
  created_at: string
}

export interface QuestionAppearance {
  id: number
  question_id: number
  exam_type_id: number
  exam_type_name?: string
  exam_type_code?: string
  year?: number | null
  source_batch?: string | null
}

export interface Subject {
  id: number
  name: string
  name_bn: string
  slug: string
  icon?: string
  color_hex?: string
  is_active: boolean
}

export interface ExamTypeSubject {
  exam_type_id: number
  subject_id: number
  subject_name: string
  is_active: boolean
  sort_order: number
  total_marks?: number
  syllabus_note?: string
}

export interface ExamTypeSubjectEntry {
  id: number
  exam_type_id: number
  exam_type_name: string
  subject_id: number
  subject_name: string
  subject_name_bn: string
  title: string
  title_bn?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Topic {
  id: number
  exam_type_subject_id: number
  exam_subject_title?: string
  exam_type_id?: number
  exam_type_name?: string
  name: string
  name_bn?: string
  sort_order: number
  question_count?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ExamType {
  id: number
  name: string
  name_bn: string
  code: string
  slug: string
  description?: string
  icon?: string
  is_active: boolean
  sort_order: number
  subjects_count?: number
  enrolled_users_count?: number
  created_at: string
}

export interface Lesson {
  id: number
  exam_type_id: number
  exam_type_name?: string
  subject_id: number
  subject_name?: string
  topic_id?: number
  topic_name?: string
  title: string
  title_bn: string
  description?: string
  xp_reward: number
  coin_reward: number
  difficulty: 'easy' | 'medium' | 'hard'
  question_count: number
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface User {
  id: number
  name: string
  phone: string
  email?: string
  daily_goal: number
  is_active: boolean
  is_admin: boolean
  streak: number
  coins: number
  hearts: number
  level: number
  xp: number
  created_at: string
}

// ── In-Memory Datasets ──────────────────────────────────────────

const examTypes = ref<ExamType[]>([
  {
    id: 1,
    name: 'BCS Preliminary',
    name_bn: 'বিসিএস প্রিলিমিনারি',
    code: 'BCS',
    slug: 'bcs-preliminary',
    description: 'Bangladesh Civil Service Preliminary Exam',
    icon: 'pi-briefcase',
    is_active: true,
    sort_order: 1,
    subjects_count: 3,
    enrolled_users_count: 14900,
    created_at: '2026-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'HSC Examination',
    name_bn: 'এইচএসসি পরীক্ষা',
    code: 'HSC',
    slug: 'hsc-exam',
    description: 'Higher Secondary Certificate Examination',
    icon: 'pi-book',
    is_active: true,
    sort_order: 2,
    subjects_count: 2,
    enrolled_users_count: 8400,
    created_at: '2026-05-15T09:00:00Z'
  }
])

const subjects = ref<Subject[]>([
  { id: 1, name: 'Bangla', name_bn: 'বাংলা', slug: 'bangla', icon: 'pi-language', color_hex: '#27AE60', is_active: true },
  { id: 2, name: 'English Grammar', name_bn: 'ইংরেজি ব্যাকরণ', slug: 'english-grammar', icon: 'pi-pencil', color_hex: '#3498DB', is_active: true },
  { id: 3, name: 'Bangladesh Affairs', name_bn: 'বাংলাদেশ বিষয়াবলী', slug: 'bangladesh-affairs', icon: 'pi-map', color_hex: '#E67E22', is_active: true }
])

const examTypeSubjects = ref<ExamTypeSubject[]>([
  { exam_type_id: 1, subject_id: 1, subject_name: 'Bangla', is_active: true, sort_order: 1, total_marks: 35, syllabus_note: 'Bangla language and literature' },
  { exam_type_id: 1, subject_id: 2, subject_name: 'English Grammar', is_active: true, sort_order: 2, total_marks: 35, syllabus_note: 'English grammar and language usage' },
  { exam_type_id: 1, subject_id: 3, subject_name: 'Bangladesh Affairs', is_active: true, sort_order: 3, total_marks: 30, syllabus_note: 'History and general knowledge' },
  { exam_type_id: 2, subject_id: 1, subject_name: 'Bangla', is_active: true, sort_order: 1, total_marks: 100 },
  { exam_type_id: 2, subject_id: 2, subject_name: 'English Grammar', is_active: true, sort_order: 2, total_marks: 100 }
])

// Feature 2: Exam Type Subjects (exam-type-specific subject titles)
const examTypeSubjectEntries = ref<ExamTypeSubjectEntry[]>([
  {
    id: 1, exam_type_id: 1, exam_type_name: 'BCS Preliminary',
    subject_id: 1, subject_name: 'Bangla', subject_name_bn: 'বাংলা',
    title: 'বাংলা ভাষা ও সাহিত্য', title_bn: 'বাংলা ভাষা ও সাহিত্য',
    is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 2, exam_type_id: 1, exam_type_name: 'BCS Preliminary',
    subject_id: 2, subject_name: 'English Grammar', subject_name_bn: 'ইংরেজি ব্যাকরণ',
    title: 'English', title_bn: 'ইংরেজি',
    is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 3, exam_type_id: 1, exam_type_name: 'BCS Preliminary',
    subject_id: 3, subject_name: 'Bangladesh Affairs', subject_name_bn: 'বাংলাদেশ বিষয়াবলী',
    title: 'বাংলাদেশ বিষয়াবলী', title_bn: 'বাংলাদেশ বিষয়াবলী',
    is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
])

const topics = ref<Topic[]>([
  {
    id: 1, exam_type_subject_id: 2, exam_subject_title: 'English', exam_type_id: 1, exam_type_name: 'BCS Preliminary',
    name: 'Parts of Speech', name_bn: 'পদ প্রকরণ', sort_order: 1, question_count: 1,
    is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
  {
    id: 2, exam_type_subject_id: 1, exam_subject_title: 'বাংলা ভাষা ও সাহিত্য', exam_type_id: 1, exam_type_name: 'BCS Preliminary',
    name: 'Modern Period', name_bn: 'আধুনিক যুগ', sort_order: 1, question_count: 1,
    is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  },
])

const lessons = ref<Lesson[]>([
  {
    id: 1,
    exam_type_id: 1,
    exam_type_name: 'BCS Preliminary',
    subject_id: 3,
    subject_name: 'Bangladesh Affairs',
    title: 'Liberation War 1971',
    title_bn: '১৯৭১ সালের মুক্তিযুদ্ধ',
    description: 'Detailed overview of historical milestones of Bangladesh Liberation War.',
    xp_reward: 20,
    coin_reward: 10,
    difficulty: 'medium',
    question_count: 5,
    sort_order: 1,
    is_active: true,
    created_at: '2026-01-15T00:00:00Z'
  },
  {
    id: 2,
    exam_type_id: 1,
    exam_type_name: 'BCS Preliminary',
    subject_id: 1,
    subject_name: 'Bangla',
    title: 'Charjyapada Literature',
    title_bn: 'চর্যাপদ ও আদি যুগ',
    description: 'Study of early literature works of Bangla history.',
    xp_reward: 30,
    coin_reward: 15,
    difficulty: 'hard',
    question_count: 4,
    sort_order: 2,
    is_active: true,
    created_at: '2026-02-10T00:00:00Z'
  }
])

const questions = ref<Question[]>([
  {
    id: 101,
    subject_id: 3,
    subject_name: 'Bangladesh Affairs',
    topic_id: 1,
    topic_name: 'History',
    lesson_id: 1,
    question_type: 'mcq',
    question_text: 'Who was the first President of Bangladesh?',
    question_bn: 'বাংলাদেশের প্রথম রাষ্ট্রপতি কে ছিলেন?',
    explanation: 'Sheikh Mujibur Rahman was declared president on 10 April 1971.',
    difficulty: 'medium',
    xp_value: 10,
    is_active: true,
    options: [
      { id: 401, option_text: 'Sheikh Mujibur Rahman', option_text_bn: 'শেখ মুজিবুর রহমান', is_correct: true, sort_order: 1 },
      { id: 402, option_text: 'Ziaur Rahman', option_text_bn: 'জিয়াউর রহমান', is_correct: false, sort_order: 2 },
      { id: 403, option_text: 'Tajuddin Ahmad', option_text_bn: 'তাজউদ্দীন আহমদ', is_correct: false, sort_order: 3 },
      { id: 404, option_text: 'Abu Sayeed Chowdhury', option_text_bn: 'আবু সাইদ চৌধুরী', is_correct: false, sort_order: 4 }
    ],
    exam_types: [{ id: 1, code: 'BCS' }],
    created_at: '2026-01-15T00:00:00Z'
  },
  {
    id: 102,
    subject_id: 2,
    subject_name: 'English Grammar',
    question_type: 'fill_gap',
    question_text: 'Identify the missing preposition: She is proficient ___ English.',
    question_bn: 'শূন্যস্থানটি পূরণ করুন: She is proficient ___ English.',
    explanation: 'The preposition "in" is typically used with proficient to describe skills.',
    difficulty: 'easy',
    xp_value: 10,
    is_active: true,
    options: [
      { id: 405, option_text: 'in', is_correct: true },
      { id: 406, option_text: 'at', is_correct: false },
      { id: 407, option_text: 'on', is_correct: false },
      { id: 408, option_text: 'with', is_correct: false }
    ],
    exam_types: [{ id: 1, code: 'BCS' }],
    created_at: '2026-01-20T00:00:00Z'
  },
  {
    id: 103,
    subject_id: 1,
    subject_name: 'Bangla',
    question_type: 'listen_answer',
    question_text: 'Listen to the audio and identify the correctly spoken spelling of the word "প্রজ্জ্বলিত".',
    question_bn: 'নিচের অডিওটি শুনুন এবং "প্রজ্জ্বলিত" শব্দের সঠিক উচ্চারণ সিলেক্ট করুন।',
    explanation: 'The correct phonetic spelling pronunciation has dual sound layers.',
    difficulty: 'hard',
    xp_value: 15,
    is_active: true,
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // high quality sample sound
    options: [
      { id: 409, option_text: 'Projjolit', option_text_bn: 'প্রজ্জ্বলিত', is_correct: true },
      { id: 410, option_text: 'Projjilit', option_text_bn: 'প্রজ্জলিত', is_correct: false },
      { id: 411, option_text: 'Projolit', option_text_bn: 'প্রজ্বলিত', is_correct: false }
    ],
    exam_types: [{ id: 1, code: 'BCS' }],
    created_at: '2026-02-05T00:00:00Z'
  },
  {
    id: 104,
    subject_id: 3,
    subject_name: 'Bangladesh Affairs',
    question_type: 'match_answer',
    question_text: 'Match the historical events with their corresponding years:',
    question_bn: 'ঐতিহাসিক ঘটনাগুলোর সাথে সঠিক সালগুলো মিলান:',
    explanation: 'Language movement occurred in 1952, Six-point in 1966, Victory in 1971.',
    difficulty: 'medium',
    xp_value: 20,
    is_active: true,
    options: [
      { id: 412, option_text: 'Language Movement (ভাষা আন্দোলন)', match_text: '1952', is_correct: true },
      { id: 413, option_text: 'Six Point Demand (ছয় দফা আন্দোলন)', match_text: '1966', is_correct: true },
      { id: 414, option_text: 'Victory Day of Bangladesh (বিজয় দিবস)', match_text: '1971', is_correct: true }
    ],
    exam_types: [{ id: 1, code: 'BCS' }],
    created_at: '2026-02-15T00:00:00Z'
  }
])

const users = ref<User[]>([
  {
    id: 1,
    name: 'Sajid Islam',
    phone: '01700000001',
    email: 'sajid@quizlo.app',
    daily_goal: 20,
    is_active: true,
    is_admin: false,
    streak: 12,
    coins: 340,
    hearts: 5,
    level: 4,
    xp: 2450,
    created_at: '2026-01-10T12:00:00Z'
  },
  {
    id: 2,
    name: 'Zahurul Haq',
    phone: '01800000002',
    email: 'zahur@quizlo.app',
    daily_goal: 30,
    is_active: true,
    is_admin: false,
    streak: 0,
    coins: 40,
    hearts: 2,
    level: 2,
    xp: 850,
    created_at: '2026-03-05T09:00:00Z'
  },
  {
    id: 3,
    name: 'Admin User',
    phone: '01900000003',
    email: 'admin@quizlo.app',
    daily_goal: 10,
    is_active: true,
    is_admin: true,
    streak: 99,
    coins: 9999,
    hearts: 5,
    level: 99,
    xp: 99999,
    created_at: '2026-01-01T00:00:00Z'
  }
])

// ── Database Operations Handler ─────────────────────────────────

export const mockDb = {
  getDashboardStats() {
    return {
      users: {
        total: users.value.length + 15417,
        active_today: 3201,
        new_this_week: 412,
        active_this_month: 8903
      },
      content: {
        total_questions: questions.value.length + 8536,
        total_lessons: lessons.value.length + 318,
        total_subjects: subjects.value.length,
        total_exam_types: examTypes.value.length
      },
      engagement: {
        answers_submitted_today: 87250,
        lessons_completed_today: 1204,
        model_tests_today: 302
      },
      top_exam_types: examTypes.value.map(et => ({
        id: et.id,
        name: et.name,
        code: et.code,
        enrolled_users: et.enrolled_users_count || 0
      }))
    }
  },

  // ── Exam Types ──
  getExamTypes() {
    return [...examTypes.value]
  },
  createExamType(data: any) {
    const newId = Math.max(...examTypes.value.map(e => e.id), 0) + 1
    const newEt: ExamType = {
      id: newId,
      name: data.name,
      name_bn: data.name_bn,
      code: data.code,
      slug: data.slug,
      description: data.description,
      icon: data.icon || 'pi-box',
      is_active: data.is_active !== undefined ? data.is_active : true,
      sort_order: data.sort_order || 0,
      subjects_count: 0,
      enrolled_users_count: 0,
      created_at: new Date().toISOString()
    }
    examTypes.value.push(newEt)
    return newEt
  },
  updateExamType(id: number, data: any) {
    const index = examTypes.value.findIndex(e => e.id === id)
    if (index === -1) throw new Error('Not Found')
    examTypes.value[index] = { ...examTypes.value[index], ...data }
    return examTypes.value[index]
  },
  assignSubject(data: any) {
    const existing = examTypeSubjects.value.find(
      ets => ets.exam_type_id === data.exam_type_id && ets.subject_id === data.subject_id
    )
    const sub = subjects.value.find(s => s.id === data.subject_id)
    const subName = sub ? sub.name : 'Unknown'
    
    if (existing) {
      existing.is_active = data.is_active !== undefined ? data.is_active : true
      existing.sort_order = data.sort_order || 0
      existing.total_marks = data.total_marks
      existing.syllabus_note = data.syllabus_note
      return existing
    }

    const newEts: ExamTypeSubject = {
      exam_type_id: data.exam_type_id,
      subject_id: data.subject_id,
      subject_name: subName,
      is_active: data.is_active !== undefined ? data.is_active : true,
      sort_order: data.sort_order || 0,
      total_marks: data.total_marks,
      syllabus_note: data.syllabus_note
    }
    examTypeSubjects.value.push(newEts)

    // Update counts
    const et = examTypes.value.find(e => e.id === data.exam_type_id)
    if (et) {
      et.subjects_count = (et.subjects_count || 0) + 1
    }
    return newEts
  },
  removeSubject(examTypeId: number, subjectId: number) {
    const index = examTypeSubjects.value.findIndex(
      ets => ets.exam_type_id === examTypeId && ets.subject_id === subjectId
    )
    if (index !== -1) {
      examTypeSubjects.value.splice(index, 1)
      const et = examTypes.value.find(e => e.id === examTypeId)
      if (et && et.subjects_count) {
        et.subjects_count -= 1
      }
      return true
    }
    return false
  },
  getSubjectsForExamType(examTypeId: number) {
    return examTypeSubjects.value.filter(ets => ets.exam_type_id === examTypeId)
  },

  // ── Subjects ──
  getSubjects() {
    return [...subjects.value]
  },
  createSubject(data: any) {
    const newId = Math.max(...subjects.value.map(s => s.id), 0) + 1
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    // Check slug uniqueness
    if (subjects.value.find(s => s.slug === slug)) {
      throw { response: { status: 422, data: { errors: { slug: ['This slug is already taken.'] } } } }
    }
    const newS: Subject = {
      id: newId,
      name: data.name,
      name_bn: data.name_bn,
      slug,
      icon: data.icon || undefined,
      color_hex: data.color_hex || undefined,
      is_active: data.is_active !== undefined ? data.is_active : true,
    }
    subjects.value.push(newS)
    return newS
  },
  updateSubject(id: number, data: any) {
    const index = subjects.value.findIndex(s => s.id === id)
    if (index === -1) throw new Error('Not Found')
    subjects.value[index] = { ...subjects.value[index], ...data }
    return subjects.value[index]
  },
  deleteSubject(id: number) {
    // Block if exam type subject entries reference it
    const usageCount = examTypeSubjectEntries.value.filter(e => e.subject_id === id).length
    if (usageCount > 0) {
      throw {
        response: {
          status: 422,
          data: {
            message: `Cannot delete: subject is used by ${usageCount} Exam Subject mapping(s). Remove those first, or deactivate the subject instead.`
          }
        }
      }
    }
    const index = subjects.value.findIndex(s => s.id === id)
    if (index !== -1) subjects.value.splice(index, 1)
    return true
  },

  // ── Exam Type Subject Entries (Feature 2) ──
  getExamTypeSubjectEntries(examTypeId?: number) {
    if (examTypeId) {
      return examTypeSubjectEntries.value.filter(e => e.exam_type_id === examTypeId)
    }
    return [...examTypeSubjectEntries.value]
  },
  getExamTypeSubjectEntriesForExamType(examTypeId: number) {
    return examTypeSubjectEntries.value
      .filter(e => e.exam_type_id === examTypeId && e.is_active)
      .map(e => ({
        id: e.id,
        title: e.title,
        title_bn: e.title_bn,
        subject_id: e.subject_id,
        subject_name: e.subject_name,
        subject_name_bn: e.subject_name_bn,
      }))
  },
  createExamTypeSubjectEntry(data: any) {
    const examTypeId = data.exam_type_id
    const subjectId  = data.subject_id
    const title      = data.title?.trim()

    // Uniqueness: (exam_type_id, subject_id)
    if (examTypeSubjectEntries.value.find(e => e.exam_type_id === examTypeId && e.subject_id === subjectId)) {
      throw { response: { status: 422, data: { errors: { subject_id: ['This subject is already mapped under the selected Exam Type.'] } } } }
    }
    // Uniqueness: (exam_type_id, title)
    if (examTypeSubjectEntries.value.find(e => e.exam_type_id === examTypeId && e.title.toLowerCase() === title.toLowerCase())) {
      throw { response: { status: 422, data: { errors: { title: [`Another Exam Subject already uses the title "${title}" under this Exam Type.`] } } } }
    }

    const et  = examTypes.value.find(e => e.id === examTypeId)
    const sub = subjects.value.find(s => s.id === subjectId)
    const newId = Math.max(...examTypeSubjectEntries.value.map(e => e.id), 0) + 1
    const newEntry: ExamTypeSubjectEntry = {
      id: newId,
      exam_type_id: examTypeId, exam_type_name: et?.name ?? 'Unknown',
      subject_id: subjectId, subject_name: sub?.name ?? 'Unknown', subject_name_bn: sub?.name_bn ?? '',
      title, title_bn: data.title_bn ?? undefined,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    examTypeSubjectEntries.value.push(newEntry)
    return newEntry
  },
  updateExamTypeSubjectEntry(id: number, data: any) {
    const index = examTypeSubjectEntries.value.findIndex(e => e.id === id)
    if (index === -1) throw new Error('Not Found')
    const current = examTypeSubjectEntries.value[index]!
    const examTypeId = data.exam_type_id ?? current.exam_type_id
    const subjectId  = data.subject_id  ?? current.subject_id
    const title      = data.title       ?? current.title

    if (examTypeSubjectEntries.value.find(e => e.id !== id && e.exam_type_id === examTypeId && e.subject_id === subjectId)) {
      throw { response: { status: 422, data: { errors: { subject_id: ['This subject is already mapped under the selected Exam Type.'] } } } }
    }
    if (examTypeSubjectEntries.value.find(e => e.id !== id && e.exam_type_id === examTypeId && e.title.toLowerCase() === title.toLowerCase())) {
      throw { response: { status: 422, data: { errors: { title: [`Another Exam Subject already uses the title "${title}" under this Exam Type.`] } } } }
    }

    examTypeSubjectEntries.value[index] = { ...current, ...data, updated_at: new Date().toISOString() }
    return examTypeSubjectEntries.value[index]
  },
  deleteExamTypeSubjectEntry(id: number) {
    const entry = examTypeSubjectEntries.value.find(e => e.id === id)
    if (!entry) throw new Error('Not Found')
    // Block if questions reference it (mock: always 0 questions in mock)
    const index = examTypeSubjectEntries.value.findIndex(e => e.id === id)
    examTypeSubjectEntries.value.splice(index, 1)
    return true
  },

  // ── Topics (Feature 3) ──
  getTopics() {
    return [...topics.value]
  },
  getTopicsForExamTypeSubject(examTypeSubjectId: number) {
    return topics.value
      .filter(t => t.exam_type_subject_id === examTypeSubjectId && t.is_active)
      .map(t => ({ id: t.id, name: t.name, name_bn: t.name_bn, sort_order: t.sort_order }))
  },
  createTopic(data: any) {
    const examTypeSubjectId = data.exam_type_subject_id
    const name = data.name?.trim()

    if (topics.value.find(t => t.exam_type_subject_id === examTypeSubjectId && t.name.toLowerCase() === name.toLowerCase())) {
      throw { response: { status: 422, data: { errors: { name: [`Another Topic already uses the name "${name}" under this Exam Subject.`] } } } }
    }

    const ets = examTypeSubjectEntries.value.find(e => e.id === examTypeSubjectId)
    const newId = Math.max(...topics.value.map(t => t.id), 0) + 1
    const newTopic: Topic = {
      id: newId,
      exam_type_subject_id: examTypeSubjectId,
      exam_subject_title: ets?.title ?? 'Unknown',
      exam_type_id: ets?.exam_type_id,
      exam_type_name: ets?.exam_type_name,
      name, name_bn: data.name_bn ?? undefined,
      sort_order: data.sort_order ?? 0,
      question_count: 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }
    topics.value.push(newTopic)
    return newTopic
  },
  updateTopic(id: number, data: any) {
    const index = topics.value.findIndex(t => t.id === id)
    if (index === -1) throw new Error('Not Found')
    const current = topics.value[index]!
    const examTypeSubjectId = data.exam_type_subject_id ?? current.exam_type_subject_id
    const name = data.name ?? current.name

    if (topics.value.find(t => t.id !== id && t.exam_type_subject_id === examTypeSubjectId && t.name.toLowerCase() === name.toLowerCase())) {
      throw { response: { status: 422, data: { errors: { name: [`Another Topic already uses the name "${name}" under this Exam Subject.`] } } } }
    }

    topics.value[index] = { ...current, ...data, updated_at: new Date().toISOString() }
    return topics.value[index]
  },
  deleteTopic(id: number) {
    const topic = topics.value.find(t => t.id === id)
    if (!topic) throw new Error('Not Found')
    if ((topic.question_count ?? 0) > 0) {
      throw { response: { status: 422, data: { message: `Cannot delete: ${topic.question_count} question(s) are linked to this Topic. Remove or reassign the questions first.` } } }
    }
    const index = topics.value.findIndex(t => t.id === id)
    topics.value.splice(index, 1)
    return true
  },

  // ── Lessons ──
  getLessons() {
    return [...lessons.value]
  },
  createLesson(data: any) {
    const newId = Math.max(...lessons.value.map(l => l.id), 0) + 1
    const sub = subjects.value.find(s => s.id === data.subject_id)
    const et = examTypes.value.find(e => e.id === data.exam_type_id)
    const newL: Lesson = {
      id: newId,
      exam_type_id: data.exam_type_id,
      exam_type_name: et ? et.name : 'Unknown',
      subject_id: data.subject_id,
      subject_name: sub ? sub.name : 'Unknown',
      topic_id: data.topic_id,
      topic_name: data.topic_name || 'General',
      title: data.title,
      title_bn: data.title_bn,
      description: data.description,
      xp_reward: data.xp_reward || 20,
      coin_reward: data.coin_reward || 10,
      difficulty: data.difficulty || 'medium',
      question_count: data.question_count || 10,
      sort_order: data.sort_order || 0,
      is_active: data.is_active !== undefined ? data.is_active : true,
      created_at: new Date().toISOString()
    }
    lessons.value.push(newL)
    return newL
  },
  updateLesson(id: number, data: any) {
    const index = lessons.value.findIndex(l => l.id === id)
    if (index === -1) throw new Error('Not Found')
    lessons.value[index] = { ...lessons.value[index], ...data }
    return lessons.value[index]
  },
  deleteLesson(id: number) {
    const index = lessons.value.findIndex(l => l.id === id)
    if (index !== -1) {
      lessons.value.splice(index, 1)
      return true
    }
    return false
  },

  // ── Questions ──
  getQuestions() {
    return [...questions.value]
  },
  createQuestion(data: any) {
    const newId = Math.max(...questions.value.map(q => q.id), 0) + 1
    const sub = subjects.value.find(s => s.id === data.subject_id)
    const newQ: Question = {
      id: newId,
      subject_id: data.subject_id,
      subject_name: sub ? sub.name : 'Unknown',
      topic_id: data.topic_id,
      topic_name: data.topic_name || 'General',
      lesson_id: data.lesson_id,
      question_type: data.question_type || 'mcq',
      question_text: data.question_text,
      question_bn: data.question_bn,
      explanation: data.explanation,
      difficulty: data.difficulty || 'medium',
      xp_value: data.xp_value || 10,
      is_active: data.is_active !== undefined ? data.is_active : true,
      audio_url: data.audio_url,
      options: (data.options || []).map((o: any, idx: number) => ({
        id: Math.floor(Math.random() * 100000),
        option_text: o.option_text,
        option_text_bn: o.option_text_bn,
        is_correct: o.is_correct,
        sort_order: o.sort_order || idx + 1,
        match_text: o.match_text
      })),
      exam_types: (data.exam_types || []).map((et: any) => {
        const fullEt = examTypes.value.find(e => e.id === et.exam_type_id)
        return {
          id: et.exam_type_id,
          code: fullEt ? fullEt.code : 'GEN',
          source_batch: et.source_batch,
          source_year: et.source_year
        }
      }),
      appearances: [],
      created_at: new Date().toISOString()
    }
    questions.value.push(newQ)
    if (data.appearance && data.appearance.exam_type_id) {
      this.createQuestionAppearance(newId, data.appearance)
    }
    return newQ
  },
  updateQuestion(id: number, data: any) {
    const index = questions.value.findIndex(q => q.id === id)
    if (index === -1) throw new Error('Not Found')
    const targetQ = questions.value[index]
    if (!targetQ) throw new Error('Not Found')
    
    // Process options if provided
    let optionsList = targetQ.options
    if (data.options) {
      optionsList = data.options.map((o: any, idx: number) => ({
        id: o.id || Math.floor(Math.random() * 100000),
        option_text: o.option_text,
        option_text_bn: o.option_text_bn,
        is_correct: o.is_correct,
        sort_order: o.sort_order || idx + 1,
        match_text: o.match_text
      }))
    }

    questions.value[index] = { 
      ...targetQ, 
      ...data,
      options: optionsList
    }
    return questions.value[index]
  },
  deleteQuestion(id: number) {
    // Soft delete
    const index = questions.value.findIndex(q => q.id === id)
    if (index !== -1) {
      const q = questions.value[index]
      if (q) {
        q.is_active = false
        return true
      }
    }
    return false
  },
  // ── Question Exam-Year Appearances (search-similar / duplicate tagging) ──
  searchSimilarQuestions(q: string) {
    const needle = (q || '').toLowerCase().trim()
    if (needle.length < 3) return []
    return questions.value
      .filter(qq => qq.is_active && (
        qq.question_text.toLowerCase().includes(needle) ||
        (qq.question_bn || '').toLowerCase().includes(needle)
      ))
      .slice(0, 10)
      .map(qq => ({
        id: qq.id,
        question_text: qq.question_text,
        question_bn: qq.question_bn,
        exam_subject_title: subjects.value.find(s => s.id === qq.subject_id)?.name,
        options: qq.options.map(o => ({ option_text: o.option_text, is_correct: o.is_correct })),
        appearances: qq.appearances || []
      }))
  },
  getQuestionAppearances(questionId: number) {
    const q = questions.value.find(qq => qq.id === questionId)
    return q?.appearances || []
  },
  createQuestionAppearance(questionId: number, data: any) {
    const q = questions.value.find(qq => qq.id === questionId)
    if (!q) throw new Error('Not Found')
    if (!q.appearances) q.appearances = []

    const existing = q.appearances.find(a => a.exam_type_id === data.exam_type_id && a.year === data.year)
    if (existing) return existing

    const fullEt = examTypes.value.find(e => e.id === data.exam_type_id)
    const appearance: QuestionAppearance = {
      id: Math.floor(Math.random() * 100000),
      question_id: questionId,
      exam_type_id: data.exam_type_id,
      exam_type_name: fullEt ? fullEt.name : undefined,
      exam_type_code: fullEt ? fullEt.code : 'GEN',
      year: data.year ?? null,
      source_batch: data.source_batch ?? null
    }
    q.appearances.push(appearance)
    return appearance
  },
  deleteQuestionAppearance(questionId: number, appearanceId: number) {
    const q = questions.value.find(qq => qq.id === questionId)
    if (!q || !q.appearances) return false
    q.appearances = q.appearances.filter(a => a.id !== appearanceId)
    return true
  },

  importQuestions(examTypeId: number, sourceBatch: string, sourceYear: number, questionList: any[]) {
    let imported = 0
    let skipped = 0
    const errors: any[] = []

    questionList.forEach((q, idx) => {
      // Basic validation
      if (!q.question_text || !q.subject_id) {
        errors.push({ index: idx, reason: 'Missing question text or subject ID' })
        skipped++
        return
      }

      // Check duplicate
      const duplicate = questions.value.find(
        eq => eq.question_text.toLowerCase() === q.question_text.toLowerCase()
      )
      if (duplicate) {
        errors.push({ index: idx, reason: 'Duplicate question text detected.' })
        skipped++
        return
      }

      this.createQuestion({
        subject_id: q.subject_id,
        question_text: q.question_text,
        question_bn: q.question_bn,
        question_type: q.question_type || 'mcq',
        audio_url: q.audio_url,
        explanation: q.explanation,
        difficulty: q.difficulty || 'medium',
        xp_value: q.xp_value || 10,
        options: q.options || [],
        exam_types: [{ exam_type_id: examTypeId, source_batch: sourceBatch, source_year: sourceYear }]
      })
      imported++
    })

    return { imported, skipped, errors }
  },

  // ── Users ──
  getUsers() {
    return [...users.value]
  },
  toggleUserActive(userId: number) {
    const index = users.value.findIndex(u => u.id === userId)
    if (index !== -1) {
      const u = users.value[index]
      if (u) {
        u.is_active = !u.is_active
        return u
      }
    }
    throw new Error('Not Found')
  }
}
