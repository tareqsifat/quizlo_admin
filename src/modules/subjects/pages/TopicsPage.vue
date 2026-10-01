<template>
  <div class="topics-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Manage Topics</h3>
      <Button label="New Topic" icon="pi pi-plus" @click="openNewDialog" />
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
        <div class="filter-item">
          <label>Exam Subject</label>
          <Dropdown
            v-model="filterExamTypeSubjectId"
            :options="filteredExamTypeSubjectsForFilter"
            optionValue="id"
            optionLabel="title"
            placeholder="All Exam Subjects"
            showClear
            class="dropdown-w"
          />
        </div>
        <div class="filter-item search-item">
          <label>Search Name</label>
          <InputText v-model="searchQuery" placeholder="Search by name..." class="search-input" />
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
      <Column field="exam_type_name" header="Exam Type" :sortable="true" style="width: 150px" />
      <Column field="exam_subject_title" header="Exam Subject" :sortable="true" style="width: 180px" />
      <Column header="Name" :sortable="true">
        <template #body="slotProps">
          <div class="subject-cell">
            <span class="sub-name">{{ slotProps.data.name }}</span>
            <span class="sub-name-bn">{{ slotProps.data.name_bn }}</span>
          </div>
        </template>
      </Column>
      <Column field="sort_order" header="Order" :sortable="true" style="width: 90px" />
      <Column field="question_count" header="Questions" :sortable="true" style="width: 100px" />
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
      <!-- Exam Subject -->
      <div class="field mb-3">
        <label>Exam Subject *</label>
        <Dropdown
          v-model="form.exam_type_subject_id"
          :options="allExamTypeSubjects"
          optionValue="id"
          optionLabel="displayLabel"
          placeholder="Select Exam Subject"
          filter
          :class="{ 'p-invalid': (submitted && !form.exam_type_subject_id) || fieldErrors.exam_type_subject_id }"
        />
        <small class="p-error" v-if="submitted && !form.exam_type_subject_id">Exam Subject is required.</small>
        <small class="p-error" v-else-if="fieldErrors.exam_type_subject_id">{{ fieldErrors.exam_type_subject_id }}</small>
      </div>

      <!-- Name -->
      <div class="field mb-3">
        <label>Name *</label>
        <InputText
          v-model.trim="form.name"
          placeholder="e.g. Parts of Speech"
          :class="{ 'p-invalid': (submitted && !form.name) || fieldErrors.name }"
        />
        <small class="p-error" v-if="submitted && !form.name">Name is required.</small>
        <small class="p-error" v-else-if="fieldErrors.name">{{ fieldErrors.name }}</small>
      </div>

      <!-- Name BN -->
      <div class="field mb-3">
        <label>Name (Bangla)</label>
        <InputText v-model.trim="form.name_bn" placeholder="Optional Bangla name" />
      </div>

      <!-- Sort Order -->
      <div class="field mb-3">
        <label>Sort Order</label>
        <InputNumber v-model="form.sort_order" :min="0" showButtons />
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
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Dropdown from 'primevue/dropdown'
import apiClient from '../../../shared/services/apiClient'

// ─── State ──────────────────────────────────────────────────────
const topics = ref<any[]>([])
const examTypes = ref<any[]>([])
const allExamTypeSubjectsRaw = ref<any[]>([])

const rowDialog = ref(false)
const dialogHeader = ref('')
const submitted = ref(false)
const saving = ref(false)
const filterExamTypeId = ref<number | null>(null)
const filterExamTypeSubjectId = ref<number | null>(null)
const searchQuery = ref('')

const fieldErrors = ref<Record<string, string>>({})

const form = ref({
  id: null as number | null,
  exam_type_subject_id: null as number | null,
  name: '',
  name_bn: '',
  sort_order: 0,
  is_active: true,
})

// ─── Computed ───────────────────────────────────────────────────
const allExamTypeSubjects = computed(() =>
  allExamTypeSubjectsRaw.value.map(ets => ({
    ...ets,
    displayLabel: `${ets.exam_type_name} — ${ets.title}`,
  }))
)

const filteredExamTypeSubjectsForFilter = computed(() => {
  if (!filterExamTypeId.value) return allExamTypeSubjectsRaw.value
  return allExamTypeSubjectsRaw.value.filter(ets => ets.exam_type_id === filterExamTypeId.value)
})

const filteredList = computed(() => {
  return topics.value.filter(row => {
    if (filterExamTypeId.value && row.exam_type_id !== filterExamTypeId.value) return false
    if (filterExamTypeSubjectId.value && row.exam_type_subject_id !== filterExamTypeSubjectId.value) return false
    const q = searchQuery.value.toLowerCase()
    if (q && !row.name.toLowerCase().includes(q)) return false
    return true
  })
})

// ─── Data Loading ───────────────────────────────────────────────
async function loadData() {
  try {
    const [topicsRes, etRes, etsRes] = await Promise.all([
      apiClient.get('/admin/topics'),
      apiClient.get('/admin/exam-types'),
      apiClient.get('/admin/exam-type-subjects'),
    ])
    if (topicsRes.success) topics.value = topicsRes.data
    if (etRes.success) examTypes.value = etRes.data
    if (etsRes.success) allExamTypeSubjectsRaw.value = etsRes.data
  } catch (e) {
    console.error('Failed to load topics', e)
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
  filterExamTypeSubjectId.value = null
  searchQuery.value = ''
}

// ─── Dialog controls ────────────────────────────────────────────
function openNewDialog() {
  form.value = {
    id: null,
    exam_type_subject_id: filterExamTypeSubjectId.value,
    name: '',
    name_bn: '',
    sort_order: 0,
    is_active: true,
  }
  fieldErrors.value = {}
  submitted.value = false
  dialogHeader.value = 'Add Topic'
  rowDialog.value = true
}

function editRow(row: any) {
  form.value = {
    id:                    row.id,
    exam_type_subject_id:  row.exam_type_subject_id,
    name:                  row.name,
    name_bn:               row.name_bn || '',
    sort_order:            row.sort_order || 0,
    is_active:             row.is_active,
  }
  fieldErrors.value = {}
  submitted.value = false
  dialogHeader.value = 'Edit Topic'
  rowDialog.value = true
}

function hideDialog() {
  rowDialog.value = false
}

// ─── Save ───────────────────────────────────────────────────────
async function saveRow() {
  submitted.value = true
  fieldErrors.value = {}

  if (!form.value.exam_type_subject_id || !form.value.name) return

  saving.value = true
  try {
    const payload = {
      exam_type_subject_id: form.value.exam_type_subject_id,
      name:                  form.value.name,
      name_bn:               form.value.name_bn || null,
      sort_order:            form.value.sort_order ?? 0,
      is_active:             form.value.is_active,
    }

    if (form.value.id) {
      const res = await apiClient.put(`/admin/topics/${form.value.id}`, payload)
      if (res.success) {
        const idx = topics.value.findIndex(r => r.id === form.value.id)
        if (idx !== -1) topics.value[idx] = res.data
        rowDialog.value = false
      }
    } else {
      const res = await apiClient.post('/admin/topics', payload)
      if (res.success) {
        topics.value.push(res.data)
        rowDialog.value = false
      }
    }
  } catch (err: any) {
    const errors = err?.response?.data?.errors
    if (errors) {
      fieldErrors.value = {
        exam_type_subject_id: errors.exam_type_subject_id?.[0] ?? '',
        name:                  errors.name?.[0] ?? '',
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
  if (!confirm(`Delete Topic "${row.name}" under "${row.exam_subject_title}"?`)) return
  try {
    const res = await apiClient.delete(`/admin/topics/${row.id}`)
    if (res.success) {
      topics.value = topics.value.filter(r => r.id !== row.id)
    } else {
      alert(res.message || 'Delete failed.')
    }
  } catch (err: any) {
    alert(err?.response?.data?.message || 'Delete failed.')
  }
}
</script>

<style scoped>
.topics-page {
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
.dropdown-w { width: 220px; }

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
