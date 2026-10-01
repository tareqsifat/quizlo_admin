<template>
  <div class="questions-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Question Bank Management</h3>
      <div class="btn-group">
        <Button label="Bulk Importer" icon="pi pi-upload" class="p-button-outlined mr-2" @click="openImportDialog" />
        <Button label="New Question" icon="pi pi-plus" @click="openNewDialog" />
      </div>
    </div>

    <!-- Filter toolbar: search + filter drawer toggle + active filter tags -->
    <div class="dashboard-card filter-toolbar mb-3">
      <div class="toolbar-row">
        <span class="p-input-icon-left search-wrap">
          <InputText v-model="filters.search" placeholder="Search questions..." class="search-input" />
        </span>
        <Button icon="pi pi-filter" :label="activeFilterCount ? `Filters (${activeFilterCount})` : 'Filters'"
                class="p-button-outlined" @click="filterDrawer = true" />
        <span class="result-count">{{ pagination.total.toLocaleString() }} questions</span>
      </div>
      <div v-if="activeFilterTags.length" class="filter-tags">
        <Chip v-for="tag in activeFilterTags" :key="tag.key" :label="tag.label" removable @remove="clearFilter(tag.key)" />
        <Button label="Clear all" class="p-button-text p-button-sm" @click="clearAllFilters" />
      </div>
    </div>

    <Drawer v-model:visible="filterDrawer" header="Filter Questions" position="right" class="filter-drawer">
      <div class="drawer-filters">
        <div class="filter-item">
          <label>Exam Type</label>
          <Dropdown v-model="filters.exam_type_id" :options="examTypes" optionValue="id" optionLabel="name" placeholder="All Exam Types" showClear class="dropdown-w" @change="onExamTypeFilterChange" />
        </div>
        <div class="filter-item">
          <label>Exam Subject</label>
          <Dropdown v-model="filters.exam_type_subject_id" :options="subjectsForFilter" optionValue="id" optionLabel="title" placeholder="All Exam Subjects" showClear class="dropdown-w" @change="filters.topic_id = null" />
        </div>
        <div class="filter-item">
          <label>Topic</label>
          <Dropdown v-model="filters.topic_id" :options="topicsForFilter" optionValue="id" optionLabel="name" placeholder="All Topics" showClear class="dropdown-w" />
        </div>
        <div class="filter-item">
          <label>Question Type</label>
          <Dropdown v-model="filters.question_type" :options="typeOptions" optionValue="value" optionLabel="label" placeholder="All Types" showClear class="dropdown-w" />
        </div>
        <div class="filter-item">
          <label>Difficulty</label>
          <Dropdown v-model="filters.difficulty" :options="['easy', 'medium', 'hard']" placeholder="All Levels" showClear class="dropdown-w" />
        </div>
        <div class="filter-item">
          <label>Exam Year</label>
          <Dropdown v-model="filters.year" :options="yearOptions" optionValue="value" optionLabel="label" placeholder="All Years" showClear filter class="dropdown-w" />
        </div>
        <div class="filter-item">
          <label>AI Verified</label>
          <Dropdown v-model="filters.verified_by_ai" :options="verifiedOptions" optionValue="value" optionLabel="label" placeholder="All" showClear class="dropdown-w" />
        </div>
        <div class="drawer-actions">
          <Button label="Clear all" class="p-button-text" @click="clearAllFilters" />
          <Button label="Done" @click="filterDrawer = false" />
        </div>
      </div>
    </Drawer>

    <!-- Questions DataTable -->
    <DataTable :value="questions" dataKey="id" class="p-datatable-sm" responsiveLayout="scroll"
               lazy paginator :first="pagination.first" :rows="pagination.rows" :totalRecords="pagination.total"
               :rowsPerPageOptions="[25, 50, 100]" :loading="questionsLoading" @page="onPage">
      <Column field="id" header="ID" style="width: 70px"></Column>
      <Column field="question_text" header="Question Text">
        <template #body="slotProps">
          <div class="question-texts">
            <span class="en-text">{{ slotProps.data.question_text }}</span>
            <span class="bn-text" v-if="slotProps.data.question_bn">{{ slotProps.data.question_bn }}</span>
          </div>
        </template>
      </Column>
      <Column field="subject_name" header="Subject" style="width: 140px"></Column>
      <Column header="Topic" style="width: 140px">
        <template #body="slotProps">
          {{ topicName(slotProps.data.topic_id) || '—' }}
        </template>
      </Column>
      <Column header="Years" style="width: 120px">
        <template #body="slotProps">
          <span v-if="questionYears(slotProps.data).length" class="years-text">{{ questionYears(slotProps.data).join(', ') }}</span>
          <span v-else class="no-year">—</span>
          <i v-if="slotProps.data.verified_by_ai" class="pi pi-verified verified-icon" title="Verified by AI"></i>
        </template>
      </Column>
      <Column header="Review" style="width: 130px">
        <template #body="slotProps">
          <div class="review-col">
            <span v-if="slotProps.data.checked_by_human" class="review-badge checked"><i class="pi pi-check"></i> Checked by human</span>
            <span v-if="slotProps.data.rejection_reason" class="review-badge rejected" :title="slotProps.data.rejection_reason"><i class="pi pi-times"></i> Rejected</span>
            <span v-if="!slotProps.data.checked_by_human && !slotProps.data.rejection_reason" class="no-year">—</span>
          </div>
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
          <Button
            label="Search Similar Questions"
            icon="pi pi-search"
            class="p-button-outlined p-button-sm search-similar-btn"
            :disabled="(questionForm.question_text || '').trim().length < 3"
            @click="openSearchSimilarDialog"
          />
        </div>

        <!-- Exam Appearance (which exam + year this question belongs to) -->
        <div class="form-row mb-3">
          <div class="field col-4">
            <label>Exam Type (appearance)</label>
            <Dropdown v-model="appearanceForm.exam_type_id" :options="examTypes" optionValue="id" optionLabel="name" placeholder="Optional" showClear />
          </div>
          <div class="field col-4">
            <label>Source Batch</label>
            <InputText v-model="appearanceForm.source_batch" placeholder="e.g. BCS-60" />
          </div>
          <div class="field col-4">
            <label>Year</label>
            <InputNumber v-model="appearanceForm.year" placeholder="2024" :useGrouping="false" />
          </div>
        </div>

        <!-- Existing appearances (edit mode only) -->
        <div class="field mb-3" v-if="questionForm.id && existingAppearances.length">
          <label>Recorded Appearances</label>
          <div class="appearance-chips">
            <span class="appearance-chip" v-for="a in existingAppearances" :key="a.id">
              {{ a.source_batch || (a.exam_type_code + ' ' + (a.year ?? '')) }}
              <i class="pi pi-times" @click="removeAppearance(a.id)"></i>
            </span>
          </div>
        </div>

        <div class="field mb-3">
          <label>Question Text (Bangla)</label>
          <Textarea v-model="questionForm.question_bn" rows="2" />
        </div>

        <div class="form-row mb-3">
          <div class="field col-6">
            <label>Exam Subject *</label>
            <Dropdown v-model="questionForm.exam_type_subject_id" :options="examTypeSubjects" optionValue="id" optionLabel="title" placeholder="Select Exam Subject" required="true" :class="{'p-invalid': submitted && !questionForm.exam_type_subject_id}" @change="onFormExamSubjectChange" />
          </div>
          <div class="field col-6">
            <label>Associated Lesson</label>
            <Dropdown v-model="questionForm.lesson_id" :options="lessons" optionValue="id" optionLabel="title" placeholder="Optional Lesson" showClear />
          </div>
        </div>

        <div class="form-row mb-3">
          <div class="field col-6">
            <label>Topic</label>
            <Dropdown v-model="questionForm.topic_id" :options="topicsForForm" optionValue="id" optionLabel="name" placeholder="Optional Topic" showClear :disabled="!questionForm.exam_type_subject_id" />
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

        <!-- Human review (edit mode only) -->
        <div class="review-section mb-3" v-if="questionForm.id">
          <div class="review-header">
            <div class="review-check">
              <Checkbox v-model="questionForm.checked_by_human" inputId="checked_by_human" :binary="true" />
              <label for="checked_by_human">Checked</label>
            </div>
            <span v-if="questionForm.checked_by_human" class="review-badge checked"><i class="pi pi-check"></i> Checked by human</span>
            <span v-if="questionForm.rejection_reason?.trim()" class="review-badge rejected"><i class="pi pi-times"></i> Rejected</span>
          </div>
          <div class="field">
            <label>Rejection Reason</label>
            <Textarea v-model="questionForm.rejection_reason" rows="2" placeholder="Leave empty if the question is not rejected" />
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="hideDialog" />
        <Button label="Save Question" icon="pi pi-check" @click="saveQuestion" />
      </template>
    </Dialog>

    <!-- Search Similar Questions Dialog -->
    <Dialog v-model:visible="similarDialog" header="Search Similar Questions" :modal="true" style="width: 700px">
      <p class="similar-help">
        Review these existing questions before creating a new one. If any of these is the same question,
        click "This is the same question" to tag it with the exam/year above instead of creating a duplicate.
      </p>
      <div v-if="similarLoading" class="similar-loading"><i class="pi pi-spin pi-spinner"></i> Searching…</div>
      <div v-else-if="similarResults.length === 0" class="similar-empty">
        No similar questions found. It's likely safe to create this as a new question.
      </div>
      <div v-else class="similar-results">
        <div class="similar-result-item" v-for="r in similarResults" :key="r.id">
          <div class="similar-result-text">
            <div class="en-text">{{ r.question_text }}</div>
            <div class="bn-text" v-if="r.question_bn">{{ r.question_bn }}</div>
            <div class="similar-result-meta">{{ r.exam_subject_title }}</div>
            <ul class="similar-result-options">
              <li v-for="(o, i) in r.options" :key="i" :class="{ correct: o.is_correct }">{{ o.option_text }}</li>
            </ul>
            <div class="appearance-chips" v-if="r.appearances?.length">
              <span class="appearance-chip" v-for="(a, i) in r.appearances" :key="i">
                {{ a.source_batch || (a.exam_type_code + ' ' + (a.year ?? '')) }}
              </span>
            </div>
          </div>
          <Button label="This is the same question" icon="pi pi-link" class="p-button-sm" @click="recordAppearanceOnExisting(r.id)" />
        </div>
      </div>
      <template #footer>
        <Button label="Close" icon="pi pi-times" class="p-button-text p-button-secondary" @click="similarDialog = false" />
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
          <span class="legend-col col-g">G<br><small>Subject Title</small></span>
          <span class="legend-col col-h">H<br><small>Explanation (optional)</small></span>
          <span class="legend-col col-i">I<br><small>Topic (optional)</small></span>
        </div>
      </div>

      <div class="form-row mb-3">
        <div class="field col-6">
          <label>Exam Type <span class="required-star">*</span></label>
          <Dropdown
            v-model="importForm.exam_type_id"
            :options="examTypes"
            optionValue="id"
            optionLabel="name"
            placeholder="Select Exam Type"
            :class="{ 'p-invalid': importExamTypeError }"
          />
          <small class="p-error" v-if="importExamTypeError">Exam Type is required before importing.</small>
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
        <small class="helper-text">Rows with missing question or options will be skipped. Col G subject title must match an Exam Subject under the selected Exam Type (case-insensitive). Col I topic name is optional — if it doesn't match an existing Topic under that Exam Subject, a new Topic is created automatically.</small>
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
          <div class="stat-chip orange" v-if="importResults.failed?.length"><i class="pi pi-exclamation-triangle"></i> {{ importResults.failed.length }} Failed (Unmatched Subject)</div>
        </div>
        <!-- Failed rows: unmatched Exam Subject -->
        <div v-if="importResults.failed?.length" class="failed-log">
          <div class="failed-title"><i class="pi pi-exclamation-triangle"></i> Unmatched Exam Subject Rows:</div>
          <div v-for="(f, fIdx) in importResults.failed" :key="fIdx" class="failed-item">
            <span class="failed-row-num">Row {{ f.row }}</span>
            <span class="failed-raw">"{{ f.subject_raw }}"</span>
            <span class="failed-reason">{{ f.reason }}</span>
          </div>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as XLSX from 'xlsx'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Drawer from 'primevue/drawer'
import Chip from 'primevue/chip'
import apiClient from '../../../shared/services/apiClient'

// State
const questions = ref<any[]>([])
const questionsLoading = ref(false)
const pagination = ref({ first: 0, rows: 25, total: 0 })
let questionsRequestId = 0
const examTypes = ref<any[]>([])
const examTypeSubjects = ref<any[]>([])
const lessons = ref<any[]>([])
const topics = ref<any[]>([])

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

const filterDrawer = ref(false)
const filters = ref({
  exam_type_id: null as number | null,
  exam_type_subject_id: null as number | null,
  topic_id: null as number | null,
  question_type: null as string | null,
  difficulty: null as string | null,
  year: null as number | 'none' | null,          // 'none' = questions with no known exam year
  verified_by_ai: null as 1 | 0 | null,
  search: ''
})

const availableYears = ref<{ year: number; questions: number }[]>([])
const yearOptions = computed(() => [
  { label: 'No year', value: 'none' },
  ...availableYears.value.map(y => ({ label: `${y.year} (${y.questions})`, value: y.year }))
])
const verifiedOptions = [
  { label: 'Verified', value: 1 },
  { label: 'Not verified', value: 0 }
]

// Exam subjects offered in the filter follow the selected exam type
const subjectsForFilter = computed(() => filters.value.exam_type_id
  ? examTypeSubjects.value.filter(s => s.exam_type_id === filters.value.exam_type_id)
  : examTypeSubjects.value)

function onExamTypeFilterChange() {
  const subject = examTypeSubjects.value.find(s => s.id === filters.value.exam_type_subject_id)
  if (subject && filters.value.exam_type_id && subject.exam_type_id !== filters.value.exam_type_id) {
    filters.value.exam_type_subject_id = null
    filters.value.topic_id = null
  }
}

type FilterKey = 'exam_type_id' | 'exam_type_subject_id' | 'topic_id' | 'question_type' | 'difficulty' | 'year' | 'verified_by_ai'

// One removable tag per active drawer filter (search stays in the toolbar and has no tag)
const activeFilterTags = computed(() => {
  const f = filters.value
  const tags: { key: FilterKey; label: string }[] = []
  if (f.exam_type_id !== null) tags.push({ key: 'exam_type_id', label: `Exam: ${examTypes.value.find(e => e.id === f.exam_type_id)?.code ?? f.exam_type_id}` })
  if (f.exam_type_subject_id !== null) tags.push({ key: 'exam_type_subject_id', label: `Subject: ${examTypeSubjects.value.find(s => s.id === f.exam_type_subject_id)?.title ?? f.exam_type_subject_id}` })
  if (f.topic_id !== null) tags.push({ key: 'topic_id', label: `Topic: ${topicName(f.topic_id) ?? f.topic_id}` })
  if (f.question_type !== null) tags.push({ key: 'question_type', label: `Type: ${getTypeName(f.question_type)}` })
  if (f.difficulty !== null) tags.push({ key: 'difficulty', label: `Difficulty: ${f.difficulty}` })
  if (f.year !== null) tags.push({ key: 'year', label: f.year === 'none' ? 'Year: none' : `Year: ${f.year}` })
  if (f.verified_by_ai !== null) tags.push({ key: 'verified_by_ai', label: f.verified_by_ai ? 'AI verified' : 'Not AI verified' })
  return tags
})
const activeFilterCount = computed(() => activeFilterTags.value.length)

function clearFilter(key: FilterKey) {
  filters.value[key] = null
  if (key === 'exam_type_subject_id') filters.value.topic_id = null
}

function clearAllFilters() {
  (Object.keys(filters.value) as (keyof typeof filters.value)[]).forEach(k => {
    if (k === 'search') filters.value.search = ''
    else (filters.value as any)[k] = null
  })
}

function questionYears(q: any): number[] {
  const years = (q.appearances || []).map((a: any) => a.year).filter((y: number | null) => y)
  return [...new Set<number>(years)].sort((a, b) => a - b)
}

const questionForm = ref({
  id: null as number | null,
  exam_type_subject_id: null as number | null,
  topic_id: null as number | null,
  lesson_id: null as number | null,
  question_type: 'mcq' as 'mcq' | 'fill_gap' | 'listen_answer' | 'match_answer',
  question_text: '',
  question_bn: '',
  explanation: '',
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  xp_value: 10,
  audio_url: '',
  options: [] as any[],
  is_active: true,
  checked_by_human: false,
  rejection_reason: null as string | null
})

const importForm = ref({
  exam_type_id: null as number | null,
  source_batch: '',
  source_year: null as number | null,
  tsv_payload: ''
})

// Exam-year appearance tracking (search-similar / duplicate tagging)
const appearanceForm = ref({
  exam_type_id: null as number | null,
  source_batch: '',
  year: null as number | null
})
const existingAppearances = ref<any[]>([])
const similarDialog = ref(false)
const similarResults = ref<any[]>([])
const similarLoading = ref(false)
const importResults = ref<any>(null)
const importLoading = ref(false)
const parsedPreviewCount = ref<number | null>(null)
const clientSkipCount = ref(0)
const importExamTypeError = ref(false)

// File upload state
const importMode = ref<'file' | 'paste'>('file')
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadedFileName = ref('')
const isDragging = ref(false)
const parsedFileRows = ref<any[]>([])

// Server-side pagination for the questions table (the full bank is too large to load at once)
async function fetchQuestions() {
  const requestId = ++questionsRequestId
  questionsLoading.value = true
  try {
    const params: Record<string, string | number> = {
      page: Math.floor(pagination.value.first / pagination.value.rows) + 1,
      per_page: pagination.value.rows
    }
    for (const [key, value] of Object.entries(filters.value)) {
      if (value === null || value === '') continue
      if (key === 'year' && value === 'none') params.has_year = 0
      else params[key] = typeof value === 'string' ? value.trim() : value
    }
    const qRes = await apiClient.get('/admin/questions', { params })
    if (requestId !== questionsRequestId) return   // a newer page/filter request superseded this one
    if (qRes.success) {
      questions.value = qRes.data
      pagination.value.total = qRes.meta?.total ?? qRes.data.length
    }
  } catch (error) {
    console.error('Error loading questions:', error)
  } finally {
    if (requestId === questionsRequestId) questionsLoading.value = false
  }
}

function onPage(event: { first: number; rows: number }) {
  pagination.value.first = event.first
  pagination.value.rows = event.rows
  fetchQuestions()
}

async function loadData() {
  try {
    await fetchQuestions()

    const etRes = await apiClient.get('/admin/exam-types')
    if (etRes.success) {
      examTypes.value = etRes.data
    }

    const etsRes = await apiClient.get('/admin/exam-type-subjects')
    if (etsRes.success) {
      examTypeSubjects.value = etsRes.data
    }

    const lesRes = await apiClient.get('/admin/lessons')
    if (lesRes.success) {
      lessons.value = lesRes.data
    }

    const topicsRes = await apiClient.get('/admin/topics')
    if (topicsRes.success) {
      topics.value = topicsRes.data
    }

    try {
      const yearsRes = await apiClient.get('/admin/questions/years')
      if (yearsRes.success) availableYears.value = yearsRes.data
    } catch {
      availableYears.value = []   // year list is optional (e.g. mock mode has no endpoint)
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

const topicsForFilter = computed(() => {
  if (!filters.value.exam_type_subject_id) return topics.value
  return topics.value.filter(t => t.exam_type_subject_id === filters.value.exam_type_subject_id)
})

const topicsForForm = computed(() => {
  if (!questionForm.value.exam_type_subject_id) return []
  return topics.value.filter(t => t.exam_type_subject_id === questionForm.value.exam_type_subject_id)
})

function topicName(topicId: number | null | undefined) {
  if (!topicId) return null
  return topics.value.find(t => t.id === topicId)?.name ?? null
}

function onFormExamSubjectChange() {
  // Topic must belong to the newly selected Exam Subject.
  if (!topicsForForm.value.find(t => t.id === questionForm.value.topic_id)) {
    questionForm.value.topic_id = null
  }
}

// Filters are applied server-side; any change goes back to page 1 (search is debounced while typing)
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(() => [filters.value.exam_type_id, filters.value.exam_type_subject_id, filters.value.topic_id, filters.value.question_type, filters.value.difficulty,
             filters.value.year, filters.value.verified_by_ai], () => {
  pagination.value.first = 0
  fetchQuestions()
})
watch(() => filters.value.search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    pagination.value.first = 0
    fetchQuestions()
  }, 350)
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
    exam_type_subject_id: null,
    topic_id: null,
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
    is_active: true,
    checked_by_human: false,
    rejection_reason: null
  }
  dialogHeader.value = 'Add Question'
  submitted.value = false
  appearanceForm.value = { exam_type_id: null, source_batch: '', year: null }
  existingAppearances.value = []
  questionDialog.value = true
}

function editQuestion(q: any) {
  questionForm.value = {
    ...q,
    options: q.options ? JSON.parse(JSON.stringify(q.options)) : [],
    checked_by_human: !!q.checked_by_human,
    rejection_reason: q.rejection_reason ?? null
  }
  dialogHeader.value = 'Edit Question'
  submitted.value = false
  appearanceForm.value = { exam_type_id: null, source_batch: '', year: null }
  existingAppearances.value = q.appearances ? JSON.parse(JSON.stringify(q.appearances)) : []
  questionDialog.value = true
}

// ─── Search Similar Questions (duplicate-avoidance) ──────────────────

async function openSearchSimilarDialog() {
  const q = (questionForm.value.question_text || '').trim()
  if (q.length < 3) return

  similarDialog.value = true
  similarLoading.value = true
  similarResults.value = []
  try {
    const res = await apiClient.get('/admin/questions/search-similar', { params: { q } })
    if (res.success) {
      similarResults.value = res.data
    }
  } catch (error) {
    console.error('Error searching similar questions:', error)
  } finally {
    similarLoading.value = false
  }
}

/**
 * Admin recognized an existing question as the same one — tag it with the
 * exam+year appearance instead of creating a new question row.
 */
async function recordAppearanceOnExisting(questionId: number) {
  if (!appearanceForm.value.exam_type_id) {
    alert('Select an Exam Type above before tagging this as an existing question.')
    return
  }
  try {
    const res = await apiClient.post(`/admin/questions/${questionId}/appearances`, {
      exam_type_id: appearanceForm.value.exam_type_id,
      year: appearanceForm.value.year,
      source_batch: appearanceForm.value.source_batch || null
    })
    if (res.success) {
      similarDialog.value = false
      questionDialog.value = false
      await loadData()
      alert(`Tagged existing question #${questionId} with the selected exam appearance. No duplicate was created.`)
    }
  } catch (error) {
    console.error('Error recording appearance:', error)
    alert('Failed to record the exam appearance. Please try again.')
  }
}

async function removeAppearance(appearanceId: number) {
  if (!questionForm.value.id) return
  if (!confirm('Remove this exam appearance tag?')) return
  try {
    const res = await apiClient.delete(`/admin/questions/${questionForm.value.id}/appearances/${appearanceId}`)
    if (res.success) {
      existingAppearances.value = existingAppearances.value.filter(a => a.id !== appearanceId)
    }
  } catch (error) {
    console.error('Error removing appearance:', error)
  }
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

  if (!questionForm.value.question_text || !questionForm.value.exam_type_subject_id) {
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

  const payload: any = { ...questionForm.value }
  if (appearanceForm.value.exam_type_id) {
    payload.appearance = {
      exam_type_id: appearanceForm.value.exam_type_id,
      year: appearanceForm.value.year,
      source_batch: appearanceForm.value.source_batch || null
    }
  }

  try {
    if (questionForm.value.id) {
      const res = await apiClient.put(`/admin/questions/${questionForm.value.id}`, payload)
      if (res.success) {
        // Refetch: the update response lacks list-only fields (subject_name, mapped appearances)
        await fetchQuestions()
      }
    } else {
      const res = await apiClient.post('/admin/questions', payload)
      if (res.success) {
        await fetchQuestions()
      }
    }
    questionDialog.value = false
  } catch (error) {
    console.error('Error saving question:', error)
  }
}

async function deleteQuestion(id: number) {
  if (!confirm('Delete this question? This cannot be undone.')) return
  try {
    const res = await apiClient.delete(`/admin/questions/${id}`)
    if (res.success) {
      // step back a page if this deleted the last row on the current page
      if (questions.value.length === 1 && pagination.value.first > 0) {
        pagination.value.first -= pagination.value.rows
      }
      await fetchQuestions()
    }
  } catch (error) {
    console.error('Error deleting question:', error)
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
  importExamTypeError.value = false
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
  const b0 = bytes[0] ?? 0
  const b1 = bytes[1] ?? 0
  const b2 = bytes[2] ?? 0
  const b3 = bytes[3] ?? 0
  const b4 = bytes[4] ?? 0
  const b5 = bytes[5] ?? 0
  const b6 = bytes[6] ?? 0
  const b7 = bytes[7] ?? 0

  // XLSX: PK ZIP (50 4B 03 04)
  if (b0 === 0x50 && b1 === 0x4B && b2 === 0x03 && b3 === 0x04) {
    return 'xlsx'
  }
  // XLS: OLE2 (D0 CF 11 E0 A1 B1 1A E1)
  if (
    b0 === 0xD0 && b1 === 0xCF && b2 === 0x11 && b3 === 0xE0 &&
    b4 === 0xA1 && b5 === 0xB1 && b6 === 0x1A && b7 === 0xE1
  ) {
    return 'xls'
  }
  // UTF-8 BOM (EF BB BF) → likely CSV/text
  if (b0 === 0xEF && b1 === 0xBB && b2 === 0xBF) {
    return 'csv'
  }
  // Printable ASCII start → treat as CSV candidate (will fail later if it is not)
  if (b0 >= 0x20 && b0 < 0x80) {
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
      const sheet = workbook.Sheets[workbook.SheetNames[0]!]!
      // Convert to 2D array (raw values, header row included)
      const rawRows: (any[] | undefined)[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

      const rows: any[] = []
      let skipped = 0

      for (let i = 1; i < rawRows.length; i++) {  // i=1 → skip header row
        const cols: any[] = rawRows[i] ?? []
        const question    = String(cols[0] ?? '').trim()
        const optionA     = String(cols[1] ?? '').trim()
        const optionB     = String(cols[2] ?? '').trim()
        const optionC     = String(cols[3] ?? '').trim()
        const optionD     = String(cols[4] ?? '').trim()
        const rightAnswer = String(cols[5] ?? '').trim().toUpperCase()
        const subject     = String(cols[6] ?? '').trim()
        const explanation = String(cols[7] ?? '').trim()
        const topic       = String(cols[8] ?? '').trim()

        if (!question.trim() && !optionA && !optionB) continue // blank row

        if (!question || !optionA || !optionB) {
          skipped++
          continue
        }

        rows.push({ question, optionA, optionB, optionC, optionD, rightAnswer, subject, explanation, topic })
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
    const line: string = lines[i] ?? ''
    if (!line.trim()) continue

    const cols: string[] = line.split('\t')
    const question   = (cols[0] ?? '').trim()
    const optionA    = (cols[1] ?? '').trim()
    const optionB    = (cols[2] ?? '').trim()
    const optionC    = (cols[3] ?? '').trim()
    const optionD    = (cols[4] ?? '').trim()
    const rightAnswer = (cols[5] ?? '').trim().toUpperCase()
    const subject    = (cols[6] ?? '').trim()
    const explanation = (cols[7] ?? '').trim()
    const topic      = (cols[8] ?? '').trim()

    // Auto-detect and skip header row (first row where col A is a label)
    if (i === 0 && /^(question|প্রশ্ন|#)/i.test(question)) {
      continue
    }

    // Client-side pre-filter: skip if question or minimum options missing
    if (!question || !optionA || !optionB) {
      skipped++
      continue
    }

    rows.push({ question, optionA, optionB, optionC, optionD, rightAnswer, subject, explanation, topic })
  }

  return { rows, skipped }
}

async function runImport() {
  // ── Guard: exam type is required ──────────────────────────────
  importExamTypeError.value = !importForm.value.exam_type_id
  if (!importForm.value.exam_type_id) {
    return
  }

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
      // Reload question + topic lists (import may have auto-created new topics)
      await fetchQuestions()
      const topicsRes = await apiClient.get('/admin/topics')
      if (topicsRes.success) {
        topics.value = topicsRes.data
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

.toolbar-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.search-wrap {
  flex: 1;
  min-width: 200px;
}

.result-count {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.75rem;
}

.drawer-filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.drawer-filters .dropdown-w {
  width: 100%;
}

.drawer-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
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

.years-text { font-size: 0.8rem; }
.no-year { color: #aaa; }
.verified-icon { color: #27AE60; margin-left: 0.35rem; font-size: 0.85rem; }

/* Human review */
.review-col {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-start;
}

.review-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  white-space: nowrap;
}

.review-badge .pi { font-size: 0.65rem; }
.review-badge.checked { background-color: #E8F8F0; color: #27AE60; }
.review-badge.rejected { background-color: #FDECEC; color: #E74C3C; }

.review-section {
  border-top: 1px solid var(--color-divider);
  padding-top: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.review-check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.review-check label {
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
}

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
.legend-col.col-i { background: #F5F3FF; color: #7C3AED; border-color: #DDD6FE; }

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

/* Failed rows panel */
.failed-log {
  margin-top: 0.75rem;
  border: 1px solid rgba(231, 76, 60, 0.35);
  border-radius: 8px;
  padding: 0.75rem;
  background: rgba(231, 76, 60, 0.06);
}

.failed-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #E74C3C;
  margin-bottom: 0.5rem;
}

.failed-item {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: baseline;
  padding: 0.3rem 0;
  border-bottom: 1px solid rgba(231, 76, 60, 0.12);
  font-size: 0.8rem;
}
.failed-item:last-child { border-bottom: none; }

.failed-row-num {
  background: rgba(231,76,60,0.15);
  color: #E74C3C;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-weight: 700;
  flex-shrink: 0;
}

.failed-raw {
  color: var(--color-text-primary);
  font-style: italic;
  flex-shrink: 0;
}

.failed-reason {
  color: var(--color-text-secondary);
  flex: 1;
}

.stat-chip.orange {
  background: rgba(243, 156, 18, 0.12);
  color: #F39C12;
  border: 1px solid rgba(243, 156, 18, 0.25);
}

.required-star {
  color: #E74C3C;
  margin-left: 2px;
}

/* ---- Search Similar / Exam Appearances ---- */
.search-similar-btn {
  align-self: flex-start;
  margin-top: 0.5rem;
}

.appearance-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.appearance-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--color-primary-surface);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 50px;
}

.appearance-chip .pi-times {
  cursor: pointer;
  font-size: 0.65rem;
  opacity: 0.7;
}

.appearance-chip .pi-times:hover {
  opacity: 1;
}

.similar-help {
  font-size: 0.82rem;
  color: var(--color-text-secondary);
  margin-bottom: 1rem;
}

.similar-loading,
.similar-empty {
  text-align: center;
  padding: 2rem 1rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.similar-results {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 420px;
  overflow-y: auto;
}

.similar-result-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  background: var(--color-bg-scaffold);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
}

.similar-result-text {
  flex: 1;
}

.similar-result-meta {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  margin-top: 0.25rem;
}

.similar-result-options {
  margin: 0.4rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.similar-result-options li.correct {
  color: #27AE60;
  font-weight: 700;
}
</style>

