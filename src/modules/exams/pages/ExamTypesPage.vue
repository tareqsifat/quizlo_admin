<template>
  <div class="exam-types-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Manage Exam Registries</h3>
      <Button label="New Exam Type" icon="pi pi-plus" @click="openNewDialog" />
    </div>

    <!-- PrimeVue DataTable for Exam Types -->
    <DataTable :value="examTypes" responsiveLayout="scroll" dataKey="id" class="p-datatable-sm">
      <Column field="id" header="ID" :sortable="true" style="width: 70px"></Column>
      <Column field="name" header="English Name" :sortable="true"></Column>
      <Column field="name_bn" header="Bangla Name"></Column>
      <Column field="code" header="Unique Code" :sortable="true"></Column>
      <Column field="slug" header="Slug"></Column>
      <Column header="Status" style="width: 100px">
        <template #body="slotProps">
          <span :class="['badge-status', slotProps.data.is_active ? 'active' : 'inactive']">
            {{ slotProps.data.is_active ? 'Active' : 'Inactive' }}
          </span>
        </template>
      </Column>
      <Column header="Actions" style="width: 180px">
        <template #body="slotProps">
          <div class="actions-group">
            <Button icon="pi pi-pencil" class="p-button-text p-button-rounded" @click="editExamType(slotProps.data)" />
            <Button icon="pi pi-book" label="Subjects" class="p-button-text p-button-rounded p-button-info" @click="viewSubjects(slotProps.data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Dialog for creating/editing Exam Types -->
    <Dialog v-model:visible="examTypeDialog" :header="dialogHeader" :modal="true" style="width: 450px" class="p-fluid">
      <div class="field mb-3">
        <label for="name">English Name *</label>
        <InputText id="name" v-model.trim="examTypeForm.name" required="true" autofocus :class="{'p-invalid': submitted && !examTypeForm.name}" />
        <small class="p-error" v-if="submitted && !examTypeForm.name">English Name is required.</small>
      </div>

      <div class="field mb-3">
        <label for="name_bn">Bangla Name *</label>
        <InputText id="name_bn" v-model.trim="examTypeForm.name_bn" required="true" :class="{'p-invalid': submitted && !examTypeForm.name_bn}" />
        <small class="p-error" v-if="submitted && !examTypeForm.name_bn">Bangla Name is required.</small>
      </div>

      <div class="form-row mb-3">
        <div class="field col-6">
          <label for="code">Unique Code *</label>
          <InputText id="code" v-model.trim="examTypeForm.code" required="true" placeholder="e.g. BCS" :class="{'p-invalid': submitted && !examTypeForm.code}" />
          <small class="p-error" v-if="submitted && !examTypeForm.code">Code is required.</small>
        </div>
        <div class="field col-6">
          <label for="slug">Kebab Slug *</label>
          <InputText id="slug" v-model.trim="examTypeForm.slug" required="true" placeholder="e.g. bcs-exam" :class="{'p-invalid': submitted && !examTypeForm.slug}" />
          <small class="p-error" v-if="submitted && !examTypeForm.slug">Slug is required.</small>
        </div>
      </div>

      <div class="field mb-3">
        <label for="description">Description</label>
        <Textarea id="description" v-model="examTypeForm.description" rows="3" />
      </div>

      <div class="field mb-3">
        <label class="mb-2">Active Status</label>
        <div class="flex align-items-center gap-2">
          <InputSwitch id="is_active" v-model="examTypeForm.is_active" />
          <span>{{ examTypeForm.is_active ? 'Visible to candidates' : 'Hidden from candidates' }}</span>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="hideDialog" />
        <Button label="Save" icon="pi pi-check" @click="saveExamType" />
      </template>
    </Dialog>

    <!-- Dialog for managing subjects of an Exam Type -->
    <Dialog v-model:visible="subjectsDialog" :header="`Manage Subjects for ${selectedExamType?.name}`" :modal="true" style="width: 800px" class="p-fluid">
      <div class="assign-area mb-4">
        <h5>Assign New Subject</h5>
        <div class="assign-form">
          <Dropdown v-model="assignForm.subject_id" :options="allSubjects" optionValue="id" optionLabel="name" placeholder="Select a Subject" class="dropdown-item" />
          <InputNumber v-model="assignForm.total_marks" placeholder="Total Marks (e.g. 35)" class="input-item" />
          <InputText v-model="assignForm.syllabus_note" placeholder="Syllabus note" class="input-item" />
          <Button label="Assign" icon="pi pi-plus" @click="assignSubject" class="btn-item" />
        </div>
      </div>

      <h5>Assigned Subjects List</h5>
      <DataTable :value="assignedSubjects" class="p-datatable-sm" responsiveLayout="scroll">
        <Column field="subject_id" header="Subject ID" style="width: 100px"></Column>
        <Column field="subject_name" header="Subject Name"></Column>
        <Column field="total_marks" header="Marks Allocated" style="width: 150px">
          <template #body="slotProps">
            {{ slotProps.data.total_marks || 'N/A' }}
          </template>
        </Column>
        <Column field="syllabus_note" header="Syllabus Note"></Column>
        <Column header="Actions" style="width: 100px">
          <template #body="slotProps">
            <Button icon="pi pi-trash" class="p-button-danger p-button-text p-button-rounded" @click="removeSubject(slotProps.data.subject_id)" />
          </template>
        </Column>
      </DataTable>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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
const examTypes = ref<any[]>([])
const allSubjects = ref<any[]>([])
const assignedSubjects = ref<any[]>([])
const selectedExamType = ref<any>(null)

// Dialog visibilities
const examTypeDialog = ref(false)
const subjectsDialog = ref(false)
const dialogHeader = ref('')

const submitted = ref(false)

// Form States
const examTypeForm = ref({
  id: null as number | null,
  name: '',
  name_bn: '',
  code: '',
  slug: '',
  description: '',
  is_active: true
})

const assignForm = ref({
  subject_id: null as number | null,
  total_marks: null as number | null,
  syllabus_note: ''
})

async function loadData() {
  try {
    const etRes = await apiClient.get('/admin/exam-types')
    if (etRes.success) {
      examTypes.value = etRes.data
    }

    const subRes = await apiClient.get('/admin/subjects')
    if (subRes.success) {
      allSubjects.value = subRes.data
    }
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('quizlo-api-mode-changed', loadData)
})

onUnmounted(() => {
  window.removeEventListener('quizlo-api-mode-changed', loadData)
})

// Dialog controls
function openNewDialog() {
  examTypeForm.value = {
    id: null,
    name: '',
    name_bn: '',
    code: '',
    slug: '',
    description: '',
    is_active: true
  }
  dialogHeader.value = 'Add Exam Type'
  submitted.value = false
  examTypeDialog.value = true
}

function editExamType(et: any) {
  examTypeForm.value = { ...et }
  dialogHeader.value = 'Edit Exam Type'
  submitted.value = false
  examTypeDialog.value = true
}

function hideDialog() {
  examTypeDialog.value = false
}

async function saveExamType() {
  submitted.value = true

  if (!examTypeForm.value.name || !examTypeForm.value.name_bn || !examTypeForm.value.code || !examTypeForm.value.slug) {
    return
  }

  try {
    if (examTypeForm.value.id) {
      // Update
      const res = await apiClient.put(`/admin/exam-types/${examTypeForm.value.id}`, examTypeForm.value)
      if (res.success) {
        const idx = examTypes.value.findIndex(e => e.id === examTypeForm.value.id)
        examTypes.value[idx] = res.data
      }
    } else {
      // Create
      const res = await apiClient.post('/admin/exam-types', examTypeForm.value)
      if (res.success) {
        examTypes.value.push(res.data)
      }
    }
    examTypeDialog.value = false
  } catch (error) {
    console.error('Error saving exam type:', error)
  }
}

// Subject mappings controls
async function viewSubjects(et: any) {
  selectedExamType.value = et
  assignForm.value = {
    subject_id: null,
    total_marks: null,
    syllabus_note: ''
  }
  try {
    const res = await apiClient.get(`/admin/exam-types/${et.id}/subjects`)
    if (res.success) {
      assignedSubjects.value = res.data
    }
    subjectsDialog.value = true
  } catch (error) {
    console.error('Error loading assigned subjects:', error)
  }
}

async function assignSubject() {
  if (!assignForm.value.subject_id) return

  try {
    const payload = {
      exam_type_id: selectedExamType.value.id,
      subject_id: assignForm.value.subject_id,
      total_marks: assignForm.value.total_marks,
      syllabus_note: assignForm.value.syllabus_note
    }
    const res = await apiClient.post('/admin/exam-types/assign-subject', payload)
    if (res.success) {
      const existingIdx = assignedSubjects.value.findIndex(s => s.subject_id === assignForm.value.subject_id)
      if (existingIdx !== -1) {
        assignedSubjects.value[existingIdx] = res.data
      } else {
        assignedSubjects.value.push(res.data)
      }
      // Reset
      assignForm.value = {
        subject_id: null,
        total_marks: null,
        syllabus_note: ''
      }
    }
  } catch (error) {
    console.error('Error assigning subject:', error)
  }
}

async function removeSubject(subjectId: number) {
  try {
    const res = await apiClient.delete(`/admin/exam-types/${selectedExamType.value.id}/subjects/${subjectId}`)
    if (res.success) {
      assignedSubjects.value = assignedSubjects.value.filter(s => s.subject_id !== subjectId)
    }
  } catch (error) {
    console.error('Error removing subject:', error)
  }
}
</script>

<style scoped>
.exam-types-page {
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

.actions-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.col-6 {
  flex: 1;
}

/* Assign mappings styles */
.assign-area {
  background: var(--color-bg-scaffold);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.assign-area h5 {
  margin-bottom: 0.75rem;
  font-size: 0.95rem;
}

.assign-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.dropdown-item {
  flex: 2;
}

.input-item {
  flex: 1.5;
}

.btn-item {
  flex: 1;
  padding: 0.55rem 0 !important;
  box-shadow: none !important;
}
</style>
