<template>
  <div class="questions-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Question Bank Management</h3>
      <div class="btn-group">
        <Button label="Bulk Importer" icon="pi pi-upload" class="p-button-outlined mr-2" @click="openImportDialog" />
        <Button label="New Question" icon="pi pi-plus" @click="openNewDialog" />
      </div>
    </div>

    <!-- Filters -->
    <div class="dashboard-card filter-card mb-3">
      <div class="filter-row">
        <div class="filter-item">
          <label>Subject</label>
          <Dropdown v-model="filters.subject_id" :options="subjects" optionValue="id" optionLabel="name" placeholder="All Subjects" showClear class="dropdown-w" />
        </div>
        <div class="filter-item">
          <label>Question Type</label>
          <Dropdown v-model="filters.question_type" :options="typeOptions" optionValue="value" optionLabel="label" placeholder="All Types" showClear class="dropdown-w" />
        </div>
        <div class="filter-item">
          <label>Difficulty</label>
          <Dropdown v-model="filters.difficulty" :options="['easy', 'medium', 'hard']" placeholder="All Levels" showClear class="dropdown-w" />
        </div>
        <div class="filter-item search-item">
          <label>Search Text</label>
          <InputText v-model="filters.search" placeholder="Search questions..." class="search-input" />
        </div>
      </div>
    </div>

    <!-- Questions DataTable -->
    <DataTable :value="filteredQuestions" dataKey="id" class="p-datatable-sm" paginator :rows="10" responsiveLayout="scroll">
      <Column field="id" header="ID" style="width: 70px" :sortable="true"></Column>
      <Column field="question_text" header="Question Text" :sortable="true">
        <template #body="slotProps">
          <div class="question-texts">
            <span class="en-text">{{ slotProps.data.question_text }}</span>
            <span class="bn-text" v-if="slotProps.data.question_bn">{{ slotProps.data.question_bn }}</span>
          </div>
        </template>
      </Column>
      <Column field="subject_name" header="Subject" :sortable="true" style="width: 140px"></Column>
      <Column field="question_type" header="Type" style="width: 130px" :sortable="true">
        <template #body="slotProps">
          <span :class="['type-pill', slotProps.data.question_type]">
            {{ getTypeName(slotProps.data.question_type) }}
          </span>
        </template>
      </Column>
      <Column header="Details" style="width: 150px">
        <template #body="slotProps">
          <div class="details-col">
            <span v-if="slotProps.data.question_type === 'listen_answer'" class="audio-indicator">
              <i class="pi pi-volume-up"></i> Has Audio
              <Button icon="pi pi-play" class="p-button-rounded p-button-text p-button-xs" @click="playAudio(slotProps.data.audio_url)" />
            </span>
            <span v-else-if="slotProps.data.question_type === 'match_answer'">
              <i class="pi pi-clone"></i> {{ slotProps.data.options?.length }} Pairs
            </span>
            <span v-else>
              <i class="pi pi-list"></i> {{ slotProps.data.options?.length }} Options
            </span>
          </div>
        </template>
      </Column>
      <Column header="Difficulty" style="width: 100px" :sortable="true">
        <template #body="slotProps">
          <span :class="['diff-badge', slotProps.data.difficulty]">
            {{ slotProps.data.difficulty }}
          </span>
        </template>
      </Column>
      <Column header="Actions" style="width: 130px">
        <template #body="slotProps">
          <div class="actions-group">
            <Button icon="pi pi-pencil" class="p-button-text p-button-rounded" @click="editQuestion(slotProps.data)" />
            <Button icon="pi pi-trash" class="p-button-text p-button-rounded p-button-danger" @click="deleteQuestion(slotProps.data.id)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Create/Edit Question Dialog -->
    <Dialog v-model:visible="questionDialog" :header="dialogHeader" :modal="true" style="width: 750px" class="p-fluid">
      <div class="form-grid">
        <div class="field mb-3">
          <label>Question Text (English) *</label>
          <Textarea v-model="questionForm.question_text" rows="2" required="true" :class="{'p-invalid': submitted && !questionForm.question_text}" />
          <small class="p-error" v-if="submitted && !questionForm.question_text">English question text is required.</small>
        </div>

        <div class="field mb-3">
          <label>Question Text (Bangla)</label>
          <Textarea v-model="questionForm.question_bn" rows="2" />
        </div>

        <div class="form-row mb-3">
          <div class="field col-6">
            <label>Subject *</label>
            <Dropdown v-model="questionForm.subject_id" :options="subjects" optionValue="id" optionLabel="name" placeholder="Select Subject" required="true" :class="{'p-invalid': submitted && !questionForm.subject_id}" />
          </div>
          <div class="field col-6">
            <label>Associated Lesson</label>
            <Dropdown v-model="questionForm.lesson_id" :options="lessons" optionValue="id" optionLabel="title" placeholder="Optional Lesson" showClear />
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="field col-4">
            <label>Question Format / Type *</label>
            <Dropdown v-model="questionForm.question_type" :options="typeOptions" optionValue="value" optionLabel="label" placeholder="Select Type" />
          </div>
          <div class="field col-4">
            <label>Difficulty *</label>
            <Dropdown v-model="questionForm.difficulty" :options="['easy', 'medium', 'hard']" />
          </div>
          <div class="field col-4">
            <label>XP Reward Value</label>
            <InputNumber v-model="questionForm.xp_value" :min="1" :max="100" />
          </div>
        </div>

        <!-- Audio Attachment field (Only for listen to answer) -->
        <div class="field mb-3 audio-section animate-fade" v-if="questionForm.question_type === 'listen_answer'">
          <label>Audio Clip Attachment URL *</label>
          <div class="audio-input-row">
            <InputText v-model="questionForm.audio_url" placeholder="https://domain.com/path/to/clip.mp3" :class="{'p-invalid': submitted && !questionForm.audio_url}" />
            <Button icon="pi pi-play" label="Test Audio" class="p-button-secondary" :disabled="!questionForm.audio_url" @click="playAudio(questionForm.audio_url)" />
          </div>
          <small class="p-error" v-if="submitted && !questionForm.audio_url">Audio URL is required for listening type.</small>
        </div>

        <!-- Options Builder Section -->
        <div class="options-builder mb-3">
          <div class="options-header">
            <h5>{{ questionForm.question_type === 'match_answer' ? 'Define Matching Pairs' : 'Answer Options Config' }}</h5>
            <Button label="Add Item" icon="pi pi-plus" class="p-button-text p-button-sm" @click="addOptionField" />
          </div>

          <div class="options-list">
            <!-- MCQ & Fill in Gap & Listening options list -->
            <div v-if="questionForm.question_type !== 'match_answer'" v-for="(opt, idx) in questionForm.options" :key="'opt-' + idx" class="option-item-row mb-2">
              <span class="option-num">{{ idx + 1 }}</span>
              <InputText v-model="opt.option_text" placeholder="Option text (English) *" class="flex-2" required="true" />
              <InputText v-model="opt.option_text_bn" placeholder="Option text (Bangla)" class="flex-2" />
              <div class="flex align-items-center gap-1">
                <ToggleSwitch v-model="opt.is_correct" @change="ensureSingleCorrect(idx)" />
                <span class="text-xs">Correct</span>
              </div>
              <Button icon="pi pi-trash" class="p-button-danger p-button-text p-button-rounded" @click="removeOptionField(idx)" />
            </div>

            <!-- Match Answer options list (Matching items) -->
            <div v-else v-for="(opt, idx) in questionForm.options" :key="'match-' + idx" class="option-item-row match-row mb-2">
              <span class="option-num">{{ idx + 1 }}</span>
              <InputText v-model="opt.option_text" placeholder="Left Side Item (e.g. Six Point Demand) *" class="flex-3" required="true" />
              <i class="pi pi-arrow-right match-arrow"></i>
              <InputText v-model="opt.match_text" placeholder="Right Side Pair Match (e.g. 1966) *" class="flex-3" required="true" />
              <Button icon="pi pi-trash" class="p-button-danger p-button-text p-button-rounded" @click="removeOptionField(idx)" />
            </div>
          </div>
        </div>

        <div class="field mb-3">
          <label>Shame-Free Explanation (Shown after answer submission)</label>
          <Textarea v-model="questionForm.explanation" rows="2" />
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="hideDialog" />
        <Button label="Save Question" icon="pi pi-check" @click="saveQuestion" />
      </template>
    </Dialog>

    <!-- Bulk JSON Question Importer Dialog -->
    <Dialog v-model:visible="importDialog" header="Bulk Questions Importer (Zod Validated)" :modal="true" style="width: 650px" class="p-fluid">
      <div class="field mb-3">
        <label>Select Target Exam Registry *</label>
        <Dropdown v-model="importForm.exam_type_id" :options="examTypes" optionValue="id" optionLabel="name" placeholder="Select Exam Type" />
      </div>

      <div class="form-row mb-3">
        <div class="field col-6">
          <label>Source Batch Code *</label>
          <InputText v-model="importForm.source_batch" placeholder="e.g. BCS-45" />
        </div>
        <div class="field col-6">
          <label>Source Year *</label>
          <InputNumber v-model="importForm.source_year" placeholder="e.g. 2023" />
        </div>
      </div>

      <div class="field mb-3">
        <label>Paste structured JSON payload *</label>
        <Textarea v-model="importForm.json_payload" rows="10" placeholder='[
  {
    "subject_id": 3,
    "question_text": "Capital of Bangladesh?",
    "question_type": "mcq",
    "options": [
      { "option_text": "Dhaka", "is_correct": true },
      { "option_text": "Sylhet", "is_correct": false }
    ]
  }
]' />
      </div>

      <!-- Preview status logs -->
      <div v-if="importResults" class="import-results-box animate-fade">
        <h6 class="text-sm font-bold mb-1">Import summary:</h6>
        <p class="text-xs text-green-600 mb-1">Successfully Imported: <strong>{{ importResults.imported }}</strong></p>
        <p class="text-xs text-red-600 mb-1">Skipped: <strong>{{ importResults.skipped }}</strong></p>
        <div v-if="importResults.errors?.length" class="err-log">
          <div v-for="(err, eIdx) in importResults.errors" :key="eIdx" class="err-item">
            Row {{ err.index + 1 }}: {{ err.reason }}
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="hideImportDialog" />
        <Button label="Run Validation & Import" icon="pi pi-upload" @click="runImport" />
      </template>
    </Dialog>

    <!-- Hidden audio element for listening questions -->
    <audio ref="audioElement" style="display: none"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { z } from 'zod'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import apiClient from '../../../shared/services/apiClient'

// State
const questions = ref<any[]>([])
const examTypes = ref<any[]>([])
const subjects = ref<any[]>([])
const lessons = ref<any[]>([])

const questionDialog = ref(false)
const importDialog = ref(false)
const dialogHeader = ref('')
const submitted = ref(false)

const audioElement = ref<HTMLAudioElement | null>(null)

const typeOptions = [
  { label: 'Multiple Choice (MCQ)', value: 'mcq' },
  { label: 'Fill in the Gap', value: 'fill_gap' },
  { label: 'Listen to Answer', value: 'listen_answer' },
  { label: 'Match Answer Pairs', value: 'match_answer' }
]

const filters = ref({
  subject_id: null as number | null,
  question_type: null as string | null,
  difficulty: null as string | null,
  search: ''
})

const questionForm = ref({
  id: null as number | null,
  subject_id: null as number | null,
  lesson_id: null as number | null,
  question_type: 'mcq' as 'mcq' | 'fill_gap' | 'listen_answer' | 'match_answer',
  question_text: '',
  question_bn: '',
  explanation: '',
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  xp_value: 10,
  audio_url: '',
  options: [] as any[],
  is_active: true
})

const importForm = ref({
  exam_type_id: null as number | null,
  source_batch: '',
  source_year: null as number | null,
  json_payload: ''
})
const importResults = ref<any>(null)

async function loadData() {
  try {
    const qRes = await apiClient.get('/admin/questions')
    if (qRes.success) {
      questions.value = qRes.data
    }

    const etRes = await apiClient.get('/admin/exam-types')
    if (etRes.success) {
      examTypes.value = etRes.data
    }

    const subRes = await apiClient.get('/admin/subjects')
    if (subRes.success) {
      subjects.value = subRes.data
    }

    const lesRes = await apiClient.get('/admin/lessons')
    if (lesRes.success) {
      lessons.value = lesRes.data
    }
  } catch (error) {
    console.error('Error loading data:', error)
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('quizlo-api-mode-changed', loadData)
})

onUnmounted(() => {
  window.removeEventListener('quizlo-api-mode-changed', loadData)
})

const filteredQuestions = computed(() => {
  return questions.value.filter(q => {
    if (filters.value.subject_id && q.subject_id !== filters.value.subject_id) return false
    if (filters.value.question_type && q.question_type !== filters.value.question_type) return false
    if (filters.value.difficulty && q.difficulty !== filters.value.difficulty) return false
    if (filters.value.search) {
      const qText = (q.question_text || '').toLowerCase()
      const qTextBn = (q.question_bn || '').toLowerCase()
      const searchVal = filters.value.search.toLowerCase()
      if (!qText.includes(searchVal) && !qTextBn.includes(searchVal)) return false
    }
    return true
  })
})

function getTypeName(type: string) {
  const match = typeOptions.find(t => t.value === type)
  return match ? match.label : type.toUpperCase()
}

function playAudio(url?: string) {
  if (!url || !audioElement.value) return
  audioElement.value.src = url
  audioElement.value.play()
}

// Dialog controls
function openNewDialog() {
  questionForm.value = {
    id: null,
    subject_id: null,
    lesson_id: null,
    question_type: 'mcq',
    question_text: '',
    question_bn: '',
    explanation: '',
    difficulty: 'medium',
    xp_value: 10,
    audio_url: '',
    options: [
      { option_text: '', option_text_bn: '', is_correct: true },
      { option_text: '', option_text_bn: '', is_correct: false }
    ],
    is_active: true
  }
  dialogHeader.value = 'Add Question'
  submitted.value = false
  questionDialog.value = true
}

function editQuestion(q: any) {
  questionForm.value = { ...q, options: q.options ? JSON.parse(JSON.stringify(q.options)) : [] }
  dialogHeader.value = 'Edit Question'
  submitted.value = false
  questionDialog.value = true
}

function hideDialog() {
  questionDialog.value = false
}

function addOptionField() {
  if (questionForm.value.question_type === 'match_answer') {
    questionForm.value.options.push({ option_text: '', match_text: '', is_correct: true })
  } else {
    questionForm.value.options.push({ option_text: '', option_text_bn: '', is_correct: false })
  }
}

function removeOptionField(idx: number) {
  questionForm.value.options.splice(idx, 1)
}

function ensureSingleCorrect(selectedIdx: number) {
  if (questionForm.value.question_type === 'match_answer') return // Match answers can have multiple correctly paired components
  
  // MCQ, gap fill should strictly have exactly one correct option
  questionForm.value.options.forEach((opt, idx) => {
    opt.is_correct = idx === selectedIdx
  })
}

async function saveQuestion() {
  submitted.value = true

  if (!questionForm.value.question_text || !questionForm.value.subject_id) {
    return
  }

  if (questionForm.value.question_type === 'listen_answer' && !questionForm.value.audio_url) {
    return
  }

  // Double check that at least one is correct
  const correctCount = questionForm.value.options.filter(o => o.is_correct).length
  if (questionForm.value.question_type !== 'match_answer' && correctCount !== 1) {
    alert('You must specify exactly one correct answer option.')
    return
  }

  try {
    if (questionForm.value.id) {
      const res = await apiClient.put(`/admin/questions/${questionForm.value.id}`, questionForm.value)
      if (res.success) {
        const idx = questions.value.findIndex(q => q.id === questionForm.value.id)
        questions.value[idx] = res.data
      }
    } else {
      const res = await apiClient.post('/admin/questions', questionForm.value)
      if (res.success) {
        questions.value.push(res.data)
      }
    }
    questionDialog.value = false
  } catch (error) {
    console.error('Error saving question:', error)
  }
}

async function deleteQuestion(id: number) {
  if (!confirm('Are you sure you want to deactivate/soft-delete this question?')) return
  try {
    const res = await apiClient.delete(`/admin/questions/${id}`)
    if (res.success) {
      const idx = questions.value.findIndex(q => q.id === id)
      questions.value[idx].is_active = false
    }
  } catch (error) {
    console.error('Error deactivating question:', error)
  }
}

// Bulk Importer logic
function openImportDialog() {
  importForm.value = {
    exam_type_id: null,
    source_batch: '',
    source_year: null,
    json_payload: ''
  }
  importResults.value = null
  importDialog.value = true
}

function hideImportDialog() {
  importDialog.value = false
}

// Zod Validation Schema for frontend verification
const questionImportSchema = z.array(
  z.object({
    subject_id: z.number(),
    question_text: z.string().min(5),
    question_bn: z.string().optional().nullable(),
    question_type: z.enum(['mcq', 'fill_gap', 'listen_answer', 'match_answer']).default('mcq'),
    audio_url: z.string().optional().nullable(),
    explanation: z.string().optional().nullable(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    xp_value: z.number().default(10),
    options: z.array(
      z.object({
        option_text: z.string(),
        option_text_bn: z.string().optional().nullable(),
        is_correct: z.boolean().default(false),
        match_text: z.string().optional().nullable()
      })
    ).min(2, 'Must provide at least 2 options')
  })
)

async function runImport() {
  if (!importForm.value.exam_type_id || !importForm.value.source_batch || !importForm.value.source_year || !importForm.value.json_payload) {
    alert('Please fill in all target metadata fields.')
    return
  }

  try {
    const parsedData = JSON.parse(importForm.value.json_payload)
    
    // Zod parsing validation
    const valResult = questionImportSchema.safeParse(parsedData)
    if (!valResult.success) {
      const formatErr = valResult.error.issues.map((e: any) => `Field: ${e.path.join('.')} -> ${e.message}`).join('\n')
      alert(`Zod schema verification failed:\n${formatErr}`)
      return
    }

    const payload = {
      exam_type_id: importForm.value.exam_type_id,
      source_batch: importForm.value.source_batch,
      source_year: importForm.value.source_year,
      questions: parsedData
    }

    const res = await apiClient.post('/admin/questions/import', payload)
    if (res.success) {
      importResults.value = res.data
      // Reload lists
      const qRes = await apiClient.get('/admin/questions')
      if (qRes.success) {
        questions.value = qRes.data
      }
    }
  } catch (err: any) {
    alert('JSON format parsing error. Make sure your payload is syntactically correct JSON.')
  }
}
</script>

<style scoped>
.questions-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 1.25rem;
  letter-spacing: -0.01em;
}

.filter-row {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.filter-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.dropdown-w {
  width: 170px;
}

.search-item {
  flex: 1;
  min-width: 200px;
}

.search-input {
  width: 100% !important;
}

.question-texts {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.en-text {
  font-size: 0.875rem;
  font-weight: 500;
}

.bn-text {
  font-size: 0.775rem;
  color: var(--color-text-secondary);
  font-family: 'Inter', sans-serif;
}

/* Type Badges */
.type-pill {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 50px;
  text-transform: uppercase;
}

.type-pill.mcq { background-color: var(--color-primary-surface); color: var(--color-primary); }
.type-pill.fill_gap { background-color: #EBF5FB; color: #3498DB; }
.type-pill.listen_answer { background-color: #FEF9EC; color: var(--color-accent-dark); }
.type-pill.match_answer { background-color: #E8F8F0; color: #27AE60; }

.audio-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-accent-dark);
  font-weight: 600;
}

.diff-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
}

.diff-badge.easy { background-color: #E8F8F0; color: #27AE60; }
.diff-badge.medium { background-color: #FEF9EC; color: var(--color-accent); }
.diff-badge.hard { background-color: #FDECEC; color: #E74C3C; }

.actions-group {
  display: flex;
  gap: 0.35rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.col-6 { flex: 1; }
.col-4 { flex: 1; }

.audio-section {
  background-color: var(--color-bg-scaffold);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.audio-input-row {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.4rem;
}

.audio-input-row input {
  flex: 1;
}

/* Options Builder Styles */
.options-builder {
  border-top: 1px solid var(--color-divider);
  padding-top: 1.25rem;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.options-header h5 {
  font-size: 0.95rem;
}

.option-item-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.option-num {
  font-weight: 700;
  color: var(--color-text-hint);
  width: 20px;
}

.flex-2 { flex: 2; }
.flex-3 { flex: 3; }

.match-arrow {
  color: var(--color-text-hint);
  font-size: 0.95rem;
}

.import-results-box {
  background-color: var(--color-bg-scaffold);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-top: 1rem;
}

.err-log {
  max-height: 100px;
  overflow-y: auto;
  border-top: 1px solid var(--color-border);
  padding-top: 0.5rem;
  margin-top: 0.5rem;
}

.err-item {
  font-size: 0.7rem;
  color: #E74C3C;
}
</style>
