<template>
  <div class="exams-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Model Tests Scheduling</h3>
      <Button label="New Model Test" icon="pi pi-plus" @click="openNewDialog" />
    </div>

    <!-- DataTable listing scheduled exams/tests -->
    <DataTable :value="exams" class="p-datatable-sm" responsiveLayout="scroll">
      <Column field="id" header="ID" style="width: 70px" :sortable="true"></Column>
      <Column field="title" header="Exam Title" :sortable="true">
        <template #body="slotProps">
          <div class="exam-title-cell">
            <span class="exam-title-en">{{ slotProps.data.title }}</span>
            <span class="exam-title-bn" v-if="slotProps.data.title_bn">{{ slotProps.data.title_bn }}</span>
          </div>
        </template>
      </Column>
      <Column field="exam_type_name" header="Exam Registry" :sortable="true"></Column>
      <Column field="total_questions" header="Questions" :sortable="true">
        <template #body="slotProps">
          {{ slotProps.data.total_questions }} MCQs
        </template>
      </Column>
      <Column field="duration_minutes" header="Duration" :sortable="true">
        <template #body="slotProps">
          {{ slotProps.data.duration_minutes }} Mins
        </template>
      </Column>
      <Column field="xp_reward" header="XP Reward" :sortable="true">
        <template #body="slotProps">
          <span class="xp-pill"><i class="pi pi-bolt"></i> {{ slotProps.data.xp_reward }} XP</span>
        </template>
      </Column>
      <Column header="Status" style="width: 100px">
        <template #body="slotProps">
          <span :class="['badge-status', slotProps.data.is_active ? 'active' : 'inactive']">
            {{ slotProps.data.is_active ? 'Active' : 'Draft' }}
          </span>
        </template>
      </Column>
      <Column header="Actions" style="width: 110px">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" class="p-button-text p-button-rounded" @click="openEditDialog(slotProps.data)" />
          <Button icon="pi pi-trash" class="p-button-text p-button-rounded p-button-danger" @click="deleteExam(slotProps.data.id)" />
        </template>
      </Column>
    </DataTable>

    <!-- Dialog for creating/editing model tests -->
    <Dialog v-model:visible="examDialog" :header="dialogHeader" :modal="true" style="width: 500px" class="p-fluid">
      <div class="field mb-3">
        <label>Exam English Title *</label>
        <InputText v-model="examForm.title" required="true" />
      </div>
      <div class="field mb-3">
        <label>Exam Bangla Title</label>
        <InputText v-model="examForm.title_bn" />
      </div>
      <div class="form-row mb-3">
        <div class="field col-6">
          <label>Registry Scope *</label>
          <Dropdown v-model="examForm.exam_type_id" :options="examTypes" optionValue="id" optionLabel="name" placeholder="Select scope" />
        </div>
        <div class="field col-6">
          <label>Questions count *</label>
          <InputNumber v-model="examForm.total_questions" :min="10" :max="200" />
        </div>
      </div>
      <div class="form-row mb-3">
        <div class="field col-6">
          <label>Duration (Minutes) *</label>
          <InputNumber v-model="examForm.duration_minutes" :min="5" :max="180" />
        </div>
        <div class="field col-6">
          <label>XP Completion Reward</label>
          <InputNumber v-model="examForm.xp_reward" :min="0" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="examDialog = false" />
        <Button label="Schedule" icon="pi pi-check" @click="saveExam" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import apiClient from '../../../shared/services/apiClient'

const exams = ref<any[]>([])
const examTypes = ref<any[]>([])
const examDialog = ref(false)
const dialogHeader = ref('Schedule New Model Test')
const editingId = ref<number | null>(null)

const examForm = ref({
  title: '',
  title_bn: '',
  exam_type_id: null as number | null,
  total_questions: 100,
  duration_minutes: 60,
  xp_reward: 100
})

async function loadExams() {
  try {
    const etRes = await apiClient.get('/admin/exam-types')
    if (etRes.success) {
      examTypes.value = etRes.data
    }

    const mtRes = await apiClient.get('/admin/model-tests')
    if (mtRes.success) {
      exams.value = mtRes.data
    }
  } catch (error) {
    console.error('Error fetching exams:', error)
  }
}

onMounted(() => {
  loadExams()
})

function openNewDialog() {
  editingId.value = null
  dialogHeader.value = 'Schedule New Model Test'
  examForm.value = {
    title: '',
    title_bn: '',
    exam_type_id: null,
    total_questions: 100,
    duration_minutes: 60,
    xp_reward: 100
  }
  examDialog.value = true
}

function openEditDialog(exam: any) {
  editingId.value = exam.id
  dialogHeader.value = 'Edit Model Test'
  examForm.value = {
    title: exam.title,
    title_bn: exam.title_bn,
    exam_type_id: exam.exam_type_id,
    total_questions: exam.total_questions,
    duration_minutes: exam.duration_minutes,
    xp_reward: exam.xp_reward
  }
  examDialog.value = true
}

async function saveExam() {
  if (!examForm.value.title || !examForm.value.exam_type_id) return
  try {
    if (editingId.value) {
      const res = await apiClient.put(`/admin/model-tests/${editingId.value}`, examForm.value)
      if (res.success) {
        const idx = exams.value.findIndex(e => e.id === editingId.value)
        if (idx !== -1) exams.value[idx] = res.data
      }
    } else {
      const res = await apiClient.post('/admin/model-tests', examForm.value)
      if (res.success) {
        exams.value.push(res.data)
      }
    }
    examDialog.value = false
  } catch (error) {
    console.error('Error saving model test:', error)
  }
}

async function deleteExam(id: number) {
  if (!confirm('Delete this model test? This cannot be undone.')) return
  try {
    const res = await apiClient.delete(`/admin/model-tests/${id}`)
    if (res.success) {
      exams.value = exams.value.filter(e => e.id !== id)
    }
  } catch (error: any) {
    const msg = error?.response?.data?.message || 'Delete failed.'
    alert(msg)
  }
}
</script>

<style scoped>
.exams-page {
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

.exam-title-cell {
  display: flex;
  flex-direction: column;
}

.exam-title-en {
  font-weight: 600;
  font-size: 0.9rem;
}

.exam-title-bn {
  font-size: 0.775rem;
  color: var(--color-text-secondary);
}

.xp-pill {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background-color: var(--color-primary-surface);
  color: var(--color-primary-dark);
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.col-6 {
  flex: 1;
}
</style>
