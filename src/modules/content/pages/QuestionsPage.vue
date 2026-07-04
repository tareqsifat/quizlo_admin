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
            <template v-if="questionForm.question_type !== 'match_answer'">
              <div v-for="(opt, idx) in questionForm.options" :key="'opt-' + idx" class="option-item-row mb-2">
                <span class="option-num">{{ idx + 1 }}</span>
                <InputText v-model="opt.option_text" placeholder="Option text (English) *" class="flex-2" required="true" />
                <InputText v-model="opt.option_text_bn" placeholder="Option text (Bangla)" class="flex-2" />
                <div class="correct-toggle-wrapper">
                  <ToggleSwitch v-model="opt.is_correct" @change="ensureSingleCorrect(idx)" />
                  <span class="correct-toggle-label">Correct</span>
                </div>
                <Button icon="pi pi-trash" class="p-button-danger p-button-text p-button-rounded" @click="removeOptionField(idx)" />
              </div>
            </template>

            <!-- Match Answer options list (Matching items) -->
            <template v-else>
              <div v-for="(opt, idx) in questionForm.options" :key="'match-' + idx" class="option-item-row match-row mb-2">
                <span class="option-num">{{ idx + 1 }}</span>
                <InputText v-model="opt.option_text" placeholder="Left Side Item (e.g. Six Point Demand) *" class="flex-3" required="true" />
                <i class="pi pi-arrow-right match-arrow"></i>
                <InputText v-model="opt.match_text" placeholder="Right Side Pair Match (e.g. 1966) *" class="flex-3" required="true" />
                <Button icon="pi pi-trash" class="p-button-danger p-button-text p-button-rounded" @click="removeOptionField(idx)" />
              </div>
            </template>
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

    <!-- Bulk Spreadsheet Question Importer Dialog -->
    <Dialog v-model:visible="importDialog" header="📊 Bulk Importer — Excel / Sheets" :modal="true" style="width: 760px" class="p-fluid">
      <!-- Column legend -->
      <div class="sheet-legend mb-3">
        <div class="legend-title"><i class="pi pi-info-circle"></i> Expected Column Order (A → H)</div>
        <div class="legend-cols">
          <span class="legend-col col-a">A<br><small>Question</small></span>
          <span class="legend-col col-b">B<br><small>Option A</small></span>
          <span class="legend-col col-c">C<br><small>Option B</small></span>
          <span class="legend-col col-d">D<br><small>Option C</small></span>
          <span class="legend-col col-e">E<br><small>Option D</small></span>
          <span class="legend-col col-f">F<br><small>Answer (A/B/C/D)</small></span>
          <span class="legend-col col-g">G<br><small>Subject (optional)</small></span>
          <span class="legend-col col-h">H<br><small>Explanation (optional)</small></span>
        </div>
      </div>

      <div class="form-row mb-3">
        <div class="field col-6">
          <label>Target Exam Registry</label>
          <Dropdown v-model="importForm.exam_type_id" :options="examTypes" optionValue="id" optionLabel="name" placeholder="Select Exam Type (optional)" showClear />
        </div>
        <div class="field col-3">
          <label>Source Batch</label>
          <InputText v-model="importForm.source_batch" placeholder="e.g. BCS-45" />
        </div>
        <div class="field col-3">
          <label>Year</label>
          <InputNumber v-model="importForm.source_year" placeholder="2024" />
        </div>
      </div>

      <!-- Mode tabs -->
      <div class="import-tabs mb-3">
        <button :class="['import-tab', importMode === 'file' ? 'active' : '']" @click="importMode = 'file'">
          <i class="pi pi-file-excel"></i> Upload Excel / CSV
        </button>
        <button :class="['import-tab', importMode === 'paste' ? 'active' : '']" @click="importMode = 'paste'">
          <i class="pi pi-align-left"></i> Paste from Sheets
        </button>
      </div>

      <!-- FILE UPLOAD MODE -->
      <div v-if="importMode === 'file'" class="field mb-3">
        <div
          class="file-drop-zone"
          :class="{ 'dragging': isDragging, 'file-loaded': uploadedFileName }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onFileDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".xlsx,.xls,.csv"
            style="display: none"
            @change="onFileChange"
          />
          <template v-if="!uploadedFileName">
            <i class="pi pi-cloud-upload drop-icon"></i>
            <div class="drop-text">Drag &amp; drop your <strong>Excel</strong> or <strong>CSV</strong> file here</div>
            <div class="drop-sub">or click to browse &mdash; .xlsx, .xls, .csv accepted</div>
          </template>
          <template v-else>
            <i class="pi pi-file-excel drop-icon loaded"></i>
            <div class="drop-text loaded">{{ uploadedFileName }}</div>
            <div class="drop-sub">Click to replace file</div>
          </template>
        </div>
        <small class="helper-text">First row is treated as a header and skipped automatically.</small>
      </div>

      <!-- PASTE MODE -->
      <div v-if="importMode === 'paste'" class="field mb-3">
        <label>Paste rows from Google Sheets</label>
        <Textarea v-model="importForm.tsv_payload" rows="10"
          placeholder="Select and copy rows from your Google Sheet (Ctrl+C), then paste here (Ctrl+V).&#10;The first row is treated as a header if column A equals 'question' or 'Question'." />
        <small class="helper-text">Rows with missing question or options will be skipped. Subject &amp; explanation columns are optional.</small>
      </div>

      <!-- Client-side parse preview -->
      <div v-if="parsedPreviewCount !== null" class="parse-preview-bar animate-fade">
        <i class="pi pi-eye"></i>
        Detected <strong>{{ parsedPreviewCount }}</strong> data rows ready to import.
        <span v-if="clientSkipCount > 0" class="skip-note">{{ clientSkipCount }} row(s) pre-filtered (missing question/options).</span>
      </div>

      <!-- Import results -->
      <div v-if="importResults" class="import-results-box animate-fade">
        <h6 class="result-heading">Import Summary</h6>
        <div class="result-stats">
          <div class="stat-chip green"><i class="pi pi-check-circle"></i> {{ importResults.imported }} Imported</div>
          <div class="stat-chip red"><i class="pi pi-times-circle"></i> {{ importResults.skipped }} Skipped</div>
        </div>
        <div v-if="importResults.notices?.length" class="notices-log">
          <div class="notices-title">Notices &amp; Warnings:</div>
          <div v-for="(n, nIdx) in importResults.notices" :key="nIdx" class="notice-item">
            <span class="notice-row">Row {{ n.row }}</span> {{ n.reason }}
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="hideImportDialog" />
        <Button label="Parse & Import" icon="pi pi-upload" :loading="importLoading" @click="runImport" />
      </template>
    </Dialog>

    <!-- Hidden audio element for listening questions -->
    <audio ref="audioElement" style="display: none"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import * as XLSX from 'xlsx'
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
  tsv_payload: ''
})
const importResults = ref<any>(null)
const importLoading = ref(false)
const parsedPreviewCount = ref<number | null>(null)
const clientSkipCount = ref(0)

// File upload state
const importMode = ref<'file' | 'paste'>('file')
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFileName = ref('')
const isDragging = ref(false)
const parsedFileRows = ref<any[]>([])

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

function getTypeName(type: string | undefined | null) {
  if (!type) return 'Unknown'
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
    tsv_payload: ''
  }
  importResults.value = null
  parsedPreviewCount.value = null
  clientSkipCount.value = 0
  importLoading.value = false
  importMode.value = 'file'
  uploadedFileName.value = ''
  parsedFileRows.value = []
  isDragging.value = false
  importDialog.value = true
}

function hideImportDialog() {
  importDialog.value = false
}

const ALLOWED_EXTENSIONS = ['xlsx', 'xls', 'csv']


const ALLOWED_MIME_TYPES = new Set([
  // XLSX
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // XLS
  'application/vnd.ms-excel',
  'application/msexcel',
  'application/x-msexcel',
  'application/x-ms-excel',
  // CSV
  'text/csv',
  'text/plain',
  'application/csv',
  'text/comma-separated-values',
  // Fallback browsers sometimes emit
  'application/octet-stream',
])

/** Max allowed file size: 10 MB */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

/**
 * Magic bytes / file signature map.
 * We read the first 8 bytes of the raw buffer and compare against known signatures.
 *   XLSX → PK ZIP header: 50 4B 03 04
 *   XLS  → OLE2 Compound File header: D0 CF 11 E0 A1 B1 1A E1
 *   CSV  → No binary signature; must be printable ASCII/UTF-8 (first byte < 0x80 or BOM)
 */
function detectFileSignature(bytes: Uint8Array): 'xlsx' | 'xls' | 'csv' | 'unknown' {
  // XLSX: PK ZIP (50 4B 03 04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return 'xlsx'
  }
  // XLS: OLE2 (D0 CF 11 E0 A1 B1 1A E1)
  if (
    bytes[0] === 0xD0 && bytes[1] === 0xCF && bytes[2] === 0x11 && bytes[3] === 0xE0 &&
    bytes[4] === 0xA1 && bytes[5] === 0xB1 && bytes[6] === 0x1A && bytes[7] === 0xE1
  ) {
    return 'xls'
  }
  // UTF-8 BOM (EF BB BF) → likely CSV/text
  if (bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return 'csv'
  }
  // Printable ASCII start → treat as CSV candidate (will fail later if it is not)
  if (bytes[0] >= 0x20 && bytes[0] < 0x80) {
    return 'csv'
  }
  return 'unknown'
}

/**
 * Run all security checks on an uploaded File before handing it to SheetJS.
 * Returns { ok: true } or { ok: false, reason: string }.
 */
async function validateFile(file: File): Promise<{ ok: boolean; reason?: string }> {
  // 1. Filename extension whitelist
  const nameParts = file.name.split('.')
  const ext = (nameParts[nameParts.length - 1] ?? '').toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { ok: false, reason: `Rejected: file extension ".${ext}" is not allowed. Only .xlsx, .xls, and .csv are accepted.` }
  }

  // 2. MIME type whitelist (browser-reported)
  const mime = (file.type || '').toLowerCase()
  // If browser provides a non-empty MIME that is NOT in our whitelist → reject.
  // Some browsers emit 'application/octet-stream' for unknown types, which we allow
  // but will catch at the magic-bytes stage.
  if (mime && !ALLOWED_MIME_TYPES.has(mime)) {
    return { ok: false, reason: `Rejected: MIME type "${file.type}" is not allowed. Expected an Excel or CSV file.` }
  }

  // 3. File size limit
  if (file.size === 0) {
    return { ok: false, reason: 'Rejected: the file is empty (0 bytes).' }
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return { ok: false, reason: `Rejected: file is too large (${sizeMB} MB). Maximum allowed size is 10 MB.` }
  }

  // 4. Magic bytes / binary file-signature check
  // Read only the first 8 bytes — fast and sufficient for signature detection.
  const headerSlice = file.slice(0, 8)
  const headerBuffer = await headerSlice.arrayBuffer()
  const headerBytes = new Uint8Array(headerBuffer)
  const sig = detectFileSignature(headerBytes)

  if (sig === 'unknown') {
    return { ok: false, reason: 'Rejected: file signature does not match any known Excel or CSV format. Do not rename other file types to .xlsx.' }
  }

  // 5. Extension ↔ signature consistency check
  if (ext === 'csv' && sig !== 'csv') {
    return { ok: false, reason: 'Rejected: file claims to be CSV but its binary signature looks like a binary Excel file. Please save as .xlsx instead.' }
  }
  if ((ext === 'xlsx' || ext === 'xls') && sig === 'csv') {
    // Text content masquerading as Excel — could be a renamed .txt file
    return { ok: false, reason: `Rejected: file extension is ".${ext}" but the content appears to be plain text, not a real Excel file.` }
  }
  if (ext === 'xlsx' && sig === 'xls') {
    // Actually an old OLE2 XLS renamed to .xlsx — still safe to parse, just warn
    console.warn('[FileUpload] File extension is .xlsx but signature is OLE2 (old .xls). SheetJS will handle it.')
  }

  return { ok: true }
}

// ---- File Upload Handlers ----

function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) processFile(file)
  // Reset input so same file can be re-selected
  ;(event.target as HTMLInputElement).value = ''
}

/**
 * Security-validated file processing pipeline.
 * Runs all checks first, then hands the file to SheetJS only if clean.
 * Row 1 is always treated as a header and skipped.
 */
async function processFile(file: File) {
  // --- Run security gauntlet ---
  const check = await validateFile(file)
  if (!check.ok) {
    alert(`⚠️ File rejected\n\n${check.reason}`)
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target!.result as ArrayBuffer)
      const workbook = XLSX.read(data, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      // Convert to 2D array (raw values, header row included)
      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

      const rows: any[] = []
      let skipped = 0

      for (let i = 1; i < rawRows.length; i++) {  // i=1 → skip header row
        const cols = rawRows[i]
        const question    = String(cols[0] ?? '').trim()
        const optionA     = String(cols[1] ?? '').trim()
        const optionB     = String(cols[2] ?? '').trim()
        const optionC     = String(cols[3] ?? '').trim()
        const optionD     = String(cols[4] ?? '').trim()
        const rightAnswer = String(cols[5] ?? '').trim().toUpperCase()
        const subject     = String(cols[6] ?? '').trim()
        const explanation = String(cols[7] ?? '').trim()

        if (!question.trim() && !optionA && !optionB) continue // blank row

        if (!question || !optionA || !optionB) {
          skipped++
          continue
        }

        rows.push({ question, optionA, optionB, optionC, optionD, rightAnswer, subject, explanation })
      }

      uploadedFileName.value = file.name
      parsedFileRows.value = rows
      parsedPreviewCount.value = rows.length
      clientSkipCount.value = skipped
      importResults.value = null
    } catch (err) {
      alert('Failed to parse file. The file may be corrupted or password-protected.')
    }
  }
  reader.readAsArrayBuffer(file)
}

/**
 * Parse a TSV (tab-separated) payload pasted from Google Sheets.
 * Columns: A=question, B=optA, C=optB, D=optC, E=optD, F=rightAnswer, G=subject, H=explanation
 */
function parseTsvPayload(tsv: string) {
  const lines = tsv.split('\n').map(l => l.trimEnd())
  const rows: any[] = []
  let skipped = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    const cols = line.split('\t')
    const question   = (cols[0] ?? '').trim()
    const optionA    = (cols[1] ?? '').trim()
    const optionB    = (cols[2] ?? '').trim()
    const optionC    = (cols[3] ?? '').trim()
    const optionD    = (cols[4] ?? '').trim()
    const rightAnswer = (cols[5] ?? '').trim().toUpperCase()
    const subject    = (cols[6] ?? '').trim()
    const explanation = (cols[7] ?? '').trim()

    // Auto-detect and skip header row (first row where col A is a label)
    if (i === 0 && /^(question|প্রশ্ন|#)/i.test(question)) {
      continue
    }

    // Client-side pre-filter: skip if question or minimum options missing
    if (!question || !optionA || !optionB) {
      skipped++
      continue
    }

    rows.push({ question, optionA, optionB, optionC, optionD, rightAnswer, subject, explanation })
  }

  return { rows, skipped }
}

async function runImport() {
  let rows: any[] = []
  let skipped = 0

  if (importMode.value === 'file') {
    if (!uploadedFileName.value || parsedFileRows.value.length === 0) {
      alert('Please upload an Excel or CSV file first.')
      return
    }
    rows = parsedFileRows.value
    skipped = clientSkipCount.value
  } else {
    if (!importForm.value.tsv_payload.trim()) {
      alert('Please paste your Google Sheets rows first.')
      return
    }
    const parsed = parseTsvPayload(importForm.value.tsv_payload)
    rows = parsed.rows
    skipped = parsed.skipped
    parsedPreviewCount.value = rows.length
    clientSkipCount.value = skipped
  }

  if (rows.length === 0) {
    alert('No valid rows found after parsing. Check that your data has questions and options in columns A–E.')
    return
  }

  importLoading.value = true
  try {
    const payload = {
      exam_type_id: importForm.value.exam_type_id,
      source_batch: importForm.value.source_batch || null,
      source_year: importForm.value.source_year || null,
      rows
    }

    const res = await apiClient.post('/admin/questions/import', payload)
    if (res.success) {
      importResults.value = res.data
      // Reload question list
      const qRes = await apiClient.get('/admin/questions')
      if (qRes.success) {
        questions.value = qRes.data
      }
    }
  } catch (err: any) {
    alert('Import failed. Please check your connection and try again.')
  } finally {
    importLoading.value = false
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

/* Dialog Form & Grid Styles */
.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.field label {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.col-6 { flex: 1; }
.col-4 { flex: 1; }

/* Force PrimeVue components to stretch to 100% within fluid dialogs */
.p-fluid .p-inputtext,
.p-fluid .p-textarea,
.p-fluid .p-dropdown,
.p-fluid .p-inputnumber {
  width: 100% !important;
}

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
  font-weight: 700;
  color: var(--color-text-primary);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.option-item-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  background: var(--color-bg-scaffold);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  transition: var(--transition-smooth);
}

.option-item-row:hover {
  background: var(--color-bg-card);
  border-color: var(--color-primary-light);
  box-shadow: var(--shadow-sm);
}

.option-num {
  font-weight: 700;
  color: var(--color-primary);
  width: 24px;
  height: 24px;
  background: var(--color-primary-surface);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.flex-2 { flex: 2; }
.flex-3 { flex: 3; }

.correct-toggle-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 60px;
  flex-shrink: 0;
}

.correct-toggle-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Match Row Specific Styles */
.match-row {
  background: #FEF9EC;
  border-color: rgba(243, 156, 18, 0.2);
}

.match-row:hover {
  background: var(--color-bg-card);
  border-color: var(--color-accent-light);
}

.match-arrow {
  color: var(--color-accent-dark);
  font-size: 1.1rem;
  flex-shrink: 0;
}

.import-results-box {
  background-color: var(--color-bg-scaffold);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-top: 1rem;
}

/* --- Spreadsheet Importer Styles --- */

.sheet-legend {
  background: var(--color-bg-scaffold);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
}

.legend-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-cols {
  display: flex;
  gap: 0.4rem;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.legend-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 0.4rem 0.5rem;
  border-radius: var(--radius-sm, 6px);
  font-size: 0.8rem;
  font-weight: 700;
  text-align: center;
  line-height: 1.3;
  border: 1.5px solid transparent;
}

.legend-col small { font-size: 0.6rem; font-weight: 500; opacity: 0.85; }
.legend-col.col-a { background: #EEF2FF; color: #4F46E5; border-color: #C7D2FE; }
.legend-col.col-b { background: #F0FFF4; color: #16A34A; border-color: #A7F3D0; }
.legend-col.col-c { background: #F0FFF4; color: #16A34A; border-color: #A7F3D0; }
.legend-col.col-d { background: #F0FFF4; color: #16A34A; border-color: #A7F3D0; }
.legend-col.col-e { background: #F0FFF4; color: #16A34A; border-color: #A7F3D0; }
.legend-col.col-f { background: #FFF7ED; color: #EA580C; border-color: #FED7AA; }
.legend-col.col-g { background: var(--color-primary-surface); color: var(--color-primary); border-color: var(--color-primary-light, #C7D2FE); }
.legend-col.col-h { background: #F8F8F8; color: #6B7280; border-color: #E5E7EB; }

.helper-text {
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  margin-top: 0.3rem;
  display: block;
}

.parse-preview-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #EEF2FF;
  border: 1px solid #C7D2FE;
  border-radius: var(--radius-md);
  padding: 0.6rem 1rem;
  font-size: 0.82rem;
  color: #4F46E5;
  font-weight: 500;
  margin-top: 0.5rem;
}

.skip-note {
  color: var(--color-accent-dark, #B45309);
  font-weight: 600;
}

.result-heading {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.6rem;
  color: var(--color-text-primary);
}

.result-stats {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  border-radius: 50px;
  font-size: 0.78rem;
  font-weight: 700;
}

.stat-chip.green { background: #E8F8F0; color: #27AE60; }
.stat-chip.red   { background: #FDECEC; color: #E74C3C; }

.notices-log {
  border-top: 1px solid var(--color-border);
  padding-top: 0.6rem;
  margin-top: 0.25rem;
  max-height: 160px;
  overflow-y: auto;
}

.notices-title {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.4rem;
}

.notice-item {
  font-size: 0.72rem;
  color: var(--color-text-secondary);
  padding: 0.2rem 0;
  border-bottom: 1px dashed var(--color-divider);
  line-height: 1.5;
}

.notice-row {
  display: inline-block;
  background: #FEF9EC;
  color: var(--color-accent-dark, #B45309);
  border-radius: 4px;
  padding: 0.05rem 0.35rem;
  font-weight: 700;
  margin-right: 0.35rem;
  font-size: 0.68rem;
}

/* ---- Import Mode Tabs ---- */
.import-tabs {
  display: flex;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.import-tab {
  flex: 1;
  padding: 0.6rem 1rem;
  font-size: 0.82rem;
  font-weight: 600;
  background: var(--color-bg-scaffold);
  color: var(--color-text-secondary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: all 0.18s ease;
}

.import-tab:first-child {
  border-right: 1px solid var(--color-border);
}

.import-tab.active {
  background: var(--color-primary);
  color: #fff;
}

.import-tab:not(.active):hover {
  background: var(--color-primary-surface);
  color: var(--color-primary);
}

/* ---- File Drop Zone ---- */
.file-drop-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 2.5rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-bg-scaffold);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-height: 160px;
  justify-content: center;
}

.file-drop-zone:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-surface);
}

.file-drop-zone.dragging {
  border-color: var(--color-primary);
  background: var(--color-primary-surface);
  transform: scale(1.01);
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.file-drop-zone.file-loaded {
  border-color: #16A34A;
  background: #F0FFF4;
  border-style: solid;
}

.drop-icon {
  font-size: 2.5rem;
  color: var(--color-text-secondary);
  transition: color 0.2s ease;
}

.drop-icon.loaded {
  color: #16A34A;
}

.file-drop-zone:hover .drop-icon,
.file-drop-zone.dragging .drop-icon {
  color: var(--color-primary);
}

.drop-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.drop-text.loaded {
  color: #16A34A;
}

.drop-sub {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
</style>

