<template>
  <div class="lessons-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Manage Study Lessons</h3>
      <Button label="New Lesson" icon="pi pi-plus" @click="openNewDialog" />
    </div>

    <!-- Filter Bar -->
    <div class="dashboard-card filter-card mb-3">
      <div class="filter-row">
        <div class="filter-item">
          <label>Exam Type</label>
          <Dropdown v-model="filters.exam_type_id" :options="examTypes" optionValue="id" optionLabel="name" placeholder="All Exam Types" showClear class="dropdown-w" />
        </div>
        <div class="filter-item">
          <label>Subject</label>
          <Dropdown v-model="filters.subject_id" :options="subjects" optionValue="id" optionLabel="name" placeholder="All Subjects" showClear class="dropdown-w" />
        </div>
        <div class="filter-item">
          <label>Difficulty</label>
          <Dropdown v-model="filters.difficulty" :options="['easy', 'medium', 'hard']" placeholder="All Levels" showClear class="dropdown-w" />
        </div>
      </div>
    </div>

    <!-- Lessons DataTable -->
    <DataTable :value="filteredLessons" dataKey="id" class="p-datatable-sm" responsiveLayout="scroll">
      <Column field="id" header="ID" style="width: 70px" :sortable="true"></Column>
      <Column field="title" header="English Title" :sortable="true"></Column>
      <Column field="title_bn" header="Bangla Title"></Column>
      <Column field="exam_type_name" header="Exam Type" :sortable="true"></Column>
      <Column field="subject_name" header="Subject" :sortable="true"></Column>
      <Column field="difficulty" header="Difficulty" :sortable="true">
        <template #body="slotProps">
          <span :class="['difficulty-badge', slotProps.data.difficulty]">
            {{ slotProps.data.difficulty }}
          </span>
        </template>
      </Column>
      <Column header="Rewards">
        <template #body="slotProps">
          <span class="reward-pill xp" title="XP reward">
            <i class="pi pi-bolt"></i> {{ slotProps.data.xp_reward }}
          </span>
          <span class="reward-pill coin" title="Coin reward">
            <i class="pi pi-dollar"></i> {{ slotProps.data.coin_reward }}
          </span>
        </template>
      </Column>
      <Column header="Questions">
        <template #body="slotProps">
          <strong>{{ slotProps.data.question_count }}</strong> MCQs
        </template>
      </Column>
      <Column header="Status" style="width: 90px">
        <template #body="slotProps">
          <span :class="['badge-status', slotProps.data.is_active ? 'active' : 'inactive']">
            {{ slotProps.data.is_active ? 'Active' : 'Inactive' }}
          </span>
        </template>
      </Column>
      <Column header="Actions" style="width: 140px">
        <template #body="slotProps">
          <div class="actions-group">
            <Button icon="pi pi-pencil" class="p-button-text p-button-rounded" @click="editLesson(slotProps.data)" />
            <Button icon="pi pi-trash" class="p-button-text p-button-rounded p-button-danger" @click="deleteLesson(slotProps.data.id)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Create/Edit Lesson Dialog -->
    <Dialog v-model:visible="lessonDialog" :header="dialogHeader" :modal="true" style="width: 550px" class="p-fluid">
      <div class="field mb-3">
        <label for="title">Lesson English Title *</label>
        <InputText id="title" v-model.trim="lessonForm.title" required="true" autofocus :class="{'p-invalid': submitted && !lessonForm.title}" />
        <small class="p-error" v-if="submitted && !lessonForm.title">Title is required.</small>
      </div>

      <div class="field mb-3">
        <label for="title_bn">Lesson Bangla Title *</label>
        <InputText id="title_bn" v-model.trim="lessonForm.title_bn" required="true" :class="{'p-invalid': submitted && !lessonForm.title_bn}" />
        <small class="p-error" v-if="submitted && !lessonForm.title_bn">Bangla Title is required.</small>
      </div>

      <div class="form-row mb-3">
        <div class="field col-6">
          <label>Exam Type *</label>
          <Dropdown v-model="lessonForm.exam_type_id" :options="examTypes" optionValue="id" optionLabel="name" placeholder="Select Exam Type" required="true" :class="{'p-invalid': submitted && !lessonForm.exam_type_id}" />
          <small class="p-error" v-if="submitted && !lessonForm.exam_type_id">Exam Type is required.</small>
        </div>
        <div class="field col-6">
          <label>Subject *</label>
          <Dropdown v-model="lessonForm.subject_id" :options="subjects" optionValue="id" optionLabel="name" placeholder="Select Subject" required="true" :class="{'p-invalid': submitted && !lessonForm.subject_id}" />
          <small class="p-error" v-if="submitted && !lessonForm.subject_id">Subject is required.</small>
        </div>
      </div>

      <div class="form-row mb-3">
        <div class="field col-6">
          <label>Difficulty *</label>
          <Dropdown v-model="lessonForm.difficulty" :options="['easy', 'medium', 'hard']" placeholder="Select Level" />
        </div>
        <div class="field col-6">
          <label>Questions Count</label>
          <InputNumber v-model="lessonForm.question_count" :min="1" :max="100" />
        </div>
      </div>

      <div class="form-row mb-3">
        <div class="field col-6">
          <label>XP Reward</label>
          <InputNumber v-model="lessonForm.xp_reward" :min="0" />
        </div>
        <div class="field col-6">
          <label>Coin Reward</label>
          <InputNumber v-model="lessonForm.coin_reward" :min="0" />
        </div>
      </div>

      <div class="field mb-3">
        <label for="description">Lesson Description</label>
        <Textarea id="description" v-model="lessonForm.description" rows="3" />
      </div>

      <div class="field mb-3">
        <div class="flex align-items-center gap-2">
          <InputSwitch id="is_active" v-model="lessonForm.is_active" />
          <span>{{ lessonForm.is_active ? 'Active (visible in app modules)' : 'Inactive (disabled)' }}</span>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" @click="saveLesson" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import apiClient from '../../../shared/services/apiClient'

// State
const lessons = ref<any[]>([])
const examTypes = ref<any[]>([])
const subjects = ref<any[]>([])

const lessonDialog = ref(false)
const dialogHeader = ref('')
const submitted = ref(false)

const filters = ref({
  exam_type_id: null as number | null,
  subject_id: null as number | null,
  difficulty: null as string | null
})

const lessonForm = ref({
  id: null as number | null,
  title: '',
  title_bn: '',
  exam_type_id: null as number | null,
  subject_id: null as number | null,
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  question_count: 10,
  xp_reward: 20,
  coin_reward: 10,
  description: '',
  is_active: true
})

async function loadData() {
  try {
    const lRes = await apiClient.get('/admin/lessons')
    if (lRes.success) {
      lessons.value = lRes.data
    }

    const etRes = await apiClient.get('/admin/exam-types')
    if (etRes.success) {
      examTypes.value = etRes.data
    }

    const subRes = await apiClient.get('/admin/subjects')
    if (subRes.success) {
      subjects.value = subRes.data
    }
  } catch (error) {
    console.error('Error loading lessons data:', error)
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('quizlo-api-mode-changed', loadData)
})

onUnmounted(() => {
  window.removeEventListener('quizlo-api-mode-changed', loadData)
})

const filteredLessons = computed(() => {
  return lessons.value.filter(l => {
    if (filters.value.exam_type_id && l.exam_type_id !== filters.value.exam_type_id) return false
    if (filters.value.subject_id && l.subject_id !== filters.value.subject_id) return false
    if (filters.value.difficulty && l.difficulty !== filters.value.difficulty) return false
    return true
  })
})

function openNewDialog() {
  lessonForm.value = {
    id: null,
    title: '',
    title_bn: '',
    exam_type_id: null,
    subject_id: null,
    difficulty: 'medium',
    question_count: 10,
    xp_reward: 20,
    coin_reward: 10,
    description: '',
    is_active: true
  }
  dialogHeader.value = 'Add Study Lesson'
  submitted.value = false
  lessonDialog.value = true
}

function editLesson(l: any) {
  lessonForm.value = { ...l }
  dialogHeader.value = 'Edit Study Lesson'
  submitted.value = false
  lessonDialog.value = true
}

function hideDialog() {
  lessonDialog.value = false
}

async function saveLesson() {
  submitted.value = true

  if (!lessonForm.value.title || !lessonForm.value.title_bn || !lessonForm.value.exam_type_id || !lessonForm.value.subject_id) {
    return
  }

  try {
    if (lessonForm.value.id) {
      // Update
      const res = await apiClient.put(`/admin/lessons/${lessonForm.value.id}`, lessonForm.value)
      if (res.success) {
        const idx = lessons.value.findIndex(l => l.id === lessonForm.value.id)
        lessons.value[idx] = res.data
      }
    } else {
      // Create
      const res = await apiClient.post('/admin/lessons', lessonForm.value)
      if (res.success) {
        lessons.value.push(res.data)
      }
    }
    lessonDialog.value = false
  } catch (error) {
    console.error('Error saving lesson:', error)
  }
}

async function deleteLesson(id: number) {
  if (!confirm('Are you sure you want to delete this study lesson?')) return
  try {
    const res = await apiClient.delete(`/admin/lessons/${id}`)
    if (res.success) {
      lessons.value = lessons.value.filter(l => l.id !== id)
    }
  } catch (error) {
    console.error('Error deleting lesson:', error)
  }
}
</script>

<style scoped>
.lessons-page {
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
  gap: 1.5rem;
  align-items: center;
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
  width: 200px;
}

.actions-group {
  display: flex;
  gap: 0.35rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.col-6 {
  flex: 1;
}

/* Difficulty Badges */
.difficulty-badge {
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
}

.difficulty-badge.easy { background-color: #E8F8F0; color: #27AE60; }
.difficulty-badge.medium { background-color: #FEF9EC; color: var(--color-accent); }
.difficulty-badge.hard { background-color: #FDECEC; color: #E74C3C; }

/* Reward pills */
.reward-pill {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  margin-right: 0.35rem;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}

.reward-pill.xp { background-color: var(--color-primary-surface); color: var(--color-primary); }
.reward-pill.coin { background-color: #FEF9EC; color: var(--color-accent-dark); }
</style>
