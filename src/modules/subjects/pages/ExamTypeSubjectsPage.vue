<template>
  <div class="exam-subjects-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Manage Exam Subjects</h3>
      <Button label="New Exam Subject" icon="pi pi-plus" @click="openNewDialog" />
    </div>

    <!-- Filters -->
    <div class="dashboard-card filter-card mb-3">
      <div class="filter-row">
        <div class="filter-item">
          <label>Exam Type</label>
          <Dropdown
            v-model="filterExamTypeId"
            :options="examTypes"
            optionValue="id"
            optionLabel="name"
            placeholder="All Exam Types"
            showClear
            class="dropdown-w"
            @change="onExamTypeFilterChange"
          />
        </div>
        <div class="filter-item search-item">
          <label>Search Title</label>
          <InputText v-model="searchQuery" placeholder="Search by title..." class="search-input" />
        </div>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      :value="filteredList"
      dataKey="id"
      class="p-datatable-sm"
      paginator
      :rows="15"
      responsiveLayout="scroll"
    >
      <Column field="exam_type_name" header="Exam Type" :sortable="true" style="width: 180px" />
      <Column header="Subject" :sortable="true">
        <template #body="slotProps">
          <div class="subject-cell">
            <span class="sub-name">{{ slotProps.data.subject_name }}</span>
            <span class="sub-name-bn">{{ slotProps.data.subject_name_bn }}</span>
          </div>
        </template>
      </Column>
      <Column field="title" header="Display Title" :sortable="true" />
      <Column field="title_bn" header="Title (BN)">
        <template #body="slotProps">
          {{ slotProps.data.title_bn || '—' }}
        </template>
      </Column>
      <Column header="Status" style="width: 100px">
        <template #body="slotProps">
          <span :class="['badge-status', slotProps.data.is_active ? 'active' : 'inactive']">
            {{ slotProps.data.is_active ? 'Active' : 'Inactive' }}
          </span>
        </template>
      </Column>
      <Column header="Actions" style="width: 110px">
        <template #body="slotProps">
          <div class="actions-group">
            <Button icon="pi pi-pencil" class="p-button-text p-button-rounded" @click="editRow(slotProps.data)" />
            <Button icon="pi pi-trash" class="p-button-text p-button-rounded p-button-danger" @click="deleteRow(slotProps.data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Create / Edit Dialog -->
    <Dialog v-model:visible="rowDialog" :header="dialogHeader" :modal="true" style="width: 520px" class="p-fluid">
      <!-- Exam Type -->
      <div class="field mb-3">
        <label>Exam Type *</label>
        <Dropdown
          v-model="form.exam_type_id"
          :options="examTypes"
          optionValue="id"
          optionLabel="name"
          placeholder="Select Exam Type"
          :class="{ 'p-invalid': submitted && !form.exam_type_id }"
        />
        <small class="p-error" v-if="submitted && !form.exam_type_id">Exam Type is required.</small>
      </div>

      <!-- Subject -->
      <div class="field mb-3">
        <label>Subject *</label>
        <Dropdown
          v-model="form.subject_id"
          :options="allSubjects"
          optionValue="id"
          optionLabel="displayLabel"
          placeholder="Select Subject"
          filter
          :class="{ 'p-invalid': submitted && !form.subject_id || fieldErrors.subject_id }"
        />
        <small class="p-error" v-if="submitted && !form.subject_id">Subject is required.</small>
        <small class="p-error" v-else-if="fieldErrors.subject_id">{{ fieldErrors.subject_id }}</small>
      </div>

      <!-- Display Title -->
      <div class="field mb-3">
        <label>Display Title *</label>
        <InputText
          v-model.trim="form.title"
          placeholder="Title as shown to learners under this exam type"
          :class="{ 'p-invalid': submitted && !form.title || fieldErrors.title }"
        />
        <small class="p-error" v-if="submitted && !form.title">Title is required.</small>
        <small class="p-error" v-else-if="fieldErrors.title">{{ fieldErrors.title }}</small>
      </div>

      <!-- Title BN -->
      <div class="field mb-3">
        <label>Title (Bangla)</label>
        <InputText v-model.trim="form.title_bn" placeholder="Optional Bangla display title" />
      </div>

      <!-- Active Toggle -->
      <div class="field mb-3">
        <label class="mb-2">Active Status</label>
        <div class="flex align-items-center gap-2">
          <InputSwitch v-model="form.is_active" />
          <span>{{ form.is_active ? 'Active' : 'Inactive' }}</span>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" :loading="saving" @click="saveRow" />
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
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import apiClient from '../../../shared/services/apiClient'

// ─── State ──────────────────────────────────────────────────────
const examTypeSubjects = ref<any[]>([])
const examTypes = ref<any[]>([])
const allSubjects = ref<any[]>([])

const rowDialog = ref(false)
const dialogHeader = ref('')
const submitted = ref(false)
const saving = ref(false)
const filterExamTypeId = ref<number | null>(null)
const searchQuery = ref('')

const fieldErrors = ref<Record<string, string>>({})

const form = ref({
  id: null as number | null,
  exam_type_id: null as number | null,
  subject_id: null as number | null,
  title: '',
  title_bn: '',
  is_active: true,
})

// ─── Computed ───────────────────────────────────────────────────
const filteredList = computed(() => {
  return examTypeSubjects.value.filter(row => {
    if (filterExamTypeId.value && row.exam_type_id !== filterExamTypeId.value) return false
    const q = searchQuery.value.toLowerCase()
    if (q && !row.title.toLowerCase().includes(q)) return false
    return true
  })
})

// ─── Data Loading ───────────────────────────────────────────────
async function loadData() {
  try {
    const [etsRes, etRes, subRes] = await Promise.all([
      apiClient.get('/admin/exam-type-subjects'),
      apiClient.get('/admin/exam-types'),
      apiClient.get('/admin/subjects/all'),
    ])
    if (etsRes.success) examTypeSubjects.value = etsRes.data
    if (etRes.success)  examTypes.value = etRes.data
    if (subRes.success) {
      allSubjects.value = (subRes.data as any[]).map(s => ({
        ...s,
        displayLabel: `${s.name} (${s.name_bn})`,
      }))
    }
  } catch (e) {
    console.error('Failed to load exam subjects', e)
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('quizlo-api-mode-changed', loadData)
})
onUnmounted(() => {
  window.removeEventListener('quizlo-api-mode-changed', loadData)
})

function onExamTypeFilterChange() {
  searchQuery.value = ''
}

// ─── Dialog controls ────────────────────────────────────────────
function openNewDialog() {
  form.value = { id: null, exam_type_id: filterExamTypeId.value, subject_id: null, title: '', title_bn: '', is_active: true }
  fieldErrors.value = {}
  submitted.value = false
  dialogHeader.value = 'Add Exam Subject'
  rowDialog.value = true
}

function editRow(row: any) {
  form.value = {
    id:           row.id,
    exam_type_id: row.exam_type_id,
    subject_id:   row.subject_id,
    title:        row.title,
    title_bn:     row.title_bn || '',
    is_active:    row.is_active,
  }
  fieldErrors.value = {}
  submitted.value = false
  dialogHeader.value = 'Edit Exam Subject'
  rowDialog.value = true
}

function hideDialog() {
  rowDialog.value = false
}

// ─── Save ───────────────────────────────────────────────────────
async function saveRow() {
  submitted.value = true
  fieldErrors.value = {}

  if (!form.value.exam_type_id || !form.value.subject_id || !form.value.title) return

  saving.value = true
  try {
    const payload = {
      exam_type_id: form.value.exam_type_id,
      subject_id:   form.value.subject_id,
      title:        form.value.title,
      title_bn:     form.value.title_bn || null,
      is_active:    form.value.is_active,
    }

    if (form.value.id) {
      const res = await apiClient.put(`/admin/exam-type-subjects/${form.value.id}`, payload)
      if (res.success) {
        const idx = examTypeSubjects.value.findIndex(r => r.id === form.value.id)
        if (idx !== -1) examTypeSubjects.value[idx] = res.data
        rowDialog.value = false
      }
    } else {
      const res = await apiClient.post('/admin/exam-type-subjects', payload)
      if (res.success) {
        examTypeSubjects.value.push(res.data)
        rowDialog.value = false
      }
    }
  } catch (err: any) {
    const errors = err?.response?.data?.errors
    if (errors) {
      fieldErrors.value = {
        subject_id: errors.subject_id?.[0] ?? '',
        title:      errors.title?.[0] ?? '',
      }
    } else {
      alert(err?.response?.data?.message || 'Save failed. Please try again.')
    }
  } finally {
    saving.value = false
  }
}

// ─── Delete ─────────────────────────────────────────────────────
async function deleteRow(row: any) {
  if (!confirm(`Delete Exam Subject "${row.title}" under "${row.exam_type_name}"?`)) return
  try {
    const res = await apiClient.delete(`/admin/exam-type-subjects/${row.id}`)
    if (res.success) {
      examTypeSubjects.value = examTypeSubjects.value.filter(r => r.id !== row.id)
    }
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Delete failed.')
  }
}
</script>

<style scoped>
.exam-subjects-page {
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
  align-items: flex-end;
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

.search-item { flex: 1; min-width: 200px; }
.search-input { width: 100% !important; }
.dropdown-w { width: 200px; }

.subject-cell {
  display: flex;
  flex-direction: column;
}

.sub-name { font-weight: 500; }
.sub-name-bn { font-size: 0.8rem; opacity: 0.65; }

.actions-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.badge-status {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-status.active   { background: rgba(39,174,96,0.15); color: #27AE60; }
.badge-status.inactive { background: rgba(231,76,60,0.12); color: #E74C3C; }

.mb-3 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.flex { display: flex; }
.align-items-center { align-items: center; }
.gap-2 { gap: 0.5rem; }
</style>
