<template>
  <div class="subjects-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Manage Subjects</h3>
      <Button label="New Subject" icon="pi pi-plus" @click="openNewDialog" />
    </div>

    <!-- Filters -->
    <div class="dashboard-card filter-card mb-3">
      <div class="filter-row">
        <div class="filter-item search-item">
          <label>Search</label>
          <InputText v-model="searchQuery" placeholder="Search by name..." class="search-input" />
        </div>
        <div class="filter-item">
          <label>Status</label>
          <Dropdown
            v-model="activeFilter"
            :options="activeOptions"
            optionValue="value"
            optionLabel="label"
            placeholder="All Statuses"
            showClear
            class="dropdown-w"
          />
        </div>
      </div>
    </div>

    <!-- DataTable -->
    <DataTable
      :value="filteredSubjects"
      dataKey="id"
      class="p-datatable-sm"
      paginator
      :rows="15"
      responsiveLayout="scroll"
    >
      <Column field="id" header="ID" :sortable="true" style="width: 70px" />
      <Column field="name" header="Name (EN)" :sortable="true" />
      <Column field="name_bn" header="Name (BN)" />
      <Column field="slug" header="Slug" />
      <Column header="Icon" style="width: 80px">
        <template #body="slotProps">
          <span class="icon-preview">{{ slotProps.data.icon || '—' }}</span>
        </template>
      </Column>
      <Column header="Color" style="width: 80px">
        <template #body="slotProps">
          <span
            v-if="slotProps.data.color_hex"
            class="color-swatch"
            :style="{ backgroundColor: slotProps.data.color_hex }"
            :title="slotProps.data.color_hex"
          />
          <span v-else class="text-muted">—</span>
        </template>
      </Column>
      <Column header="Status" style="width: 100px">
        <template #body="slotProps">
          <span :class="['badge-status', slotProps.data.is_active ? 'active' : 'inactive']">
            {{ slotProps.data.is_active ? 'Active' : 'Inactive' }}
          </span>
        </template>
      </Column>
      <Column header="Actions" style="width: 120px">
        <template #body="slotProps">
          <div class="actions-group">
            <Button icon="pi pi-pencil" class="p-button-text p-button-rounded" @click="editSubject(slotProps.data)" />
            <Button icon="pi pi-trash" class="p-button-text p-button-rounded p-button-danger" @click="deleteSubject(slotProps.data)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Create / Edit Dialog -->
    <Dialog v-model:visible="subjectDialog" :header="dialogHeader" :modal="true" style="width: 500px" class="p-fluid">
      <div class="field mb-3">
        <label for="sub_name">Name (English) *</label>
        <InputText
          id="sub_name"
          v-model.trim="form.name"
          autofocus
          @input="onNameInput"
          :class="{ 'p-invalid': submitted && !form.name }"
        />
        <small class="p-error" v-if="submitted && !form.name">English name is required.</small>
      </div>

      <div class="field mb-3">
        <label for="sub_name_bn">Name (Bangla) *</label>
        <InputText
          id="sub_name_bn"
          v-model.trim="form.name_bn"
          :class="{ 'p-invalid': submitted && !form.name_bn }"
        />
        <small class="p-error" v-if="submitted && !form.name_bn">Bangla name is required.</small>
      </div>

      <div class="field mb-3">
        <label for="sub_slug">Slug *</label>
        <InputText
          id="sub_slug"
          v-model.trim="form.slug"
          placeholder="auto-generated from name"
          :class="{ 'p-invalid': submitted && !form.slug || slugError }"
          @input="slugManuallyEdited = true"
        />
        <small class="p-error" v-if="submitted && !form.slug">Slug is required.</small>
        <small class="p-error" v-else-if="slugError">{{ slugError }}</small>
        <small class="helper-text" v-else>Auto-generated from name. Edit to override.</small>
      </div>

      <div class="form-row mb-3">
        <div class="field col-6">
          <label for="sub_icon">Icon Identifier</label>
          <InputText id="sub_icon" v-model.trim="form.icon" placeholder="e.g. pi-book" />
        </div>
        <div class="field col-6">
          <label for="sub_color">Color</label>
          <div class="color-input-row">
            <input
              id="sub_color"
              type="color"
              v-model="form.color_hex"
              class="native-color-picker"
            />
            <InputText v-model.trim="form.color_hex" placeholder="#3498DB" class="color-text-input" maxlength="7" />
          </div>
        </div>
      </div>

      <div class="field mb-3">
        <label class="mb-2">Active Status</label>
        <div class="flex align-items-center gap-2">
          <InputSwitch id="sub_active" v-model="form.is_active" />
          <span>{{ form.is_active ? 'Active — visible in system' : 'Inactive — hidden from system' }}</span>
        </div>
      </div>

      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="hideDialog" />
        <Button label="Save Subject" icon="pi pi-check" :loading="saving" @click="saveSubject" />
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
const subjects = ref<any[]>([])
const subjectDialog = ref(false)
const dialogHeader = ref('')
const submitted = ref(false)
const saving = ref(false)
const slugManuallyEdited = ref(false)
const slugError = ref('')
const searchQuery = ref('')
const activeFilter = ref<boolean | null>(null)

const activeOptions = [
  { label: 'Active', value: true },
  { label: 'Inactive', value: false },
]

const form = ref({
  id: null as number | null,
  name: '',
  name_bn: '',
  slug: '',
  icon: '',
  color_hex: '#3498db',
  is_active: true,
})

// ─── Computed ───────────────────────────────────────────────────
const filteredSubjects = computed(() => {
  return subjects.value.filter(s => {
    const q = searchQuery.value.toLowerCase()
    if (q && !s.name.toLowerCase().includes(q) && !s.name_bn.toLowerCase().includes(q)) return false
    if (activeFilter.value !== null && s.is_active !== activeFilter.value) return false
    return true
  })
})

// ─── Data Loading ───────────────────────────────────────────────
async function loadData() {
  try {
    const res = await apiClient.get('/admin/subjects')
    if (res.success) subjects.value = res.data
  } catch (e) {
    console.error('Failed to load subjects', e)
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('quizlo-api-mode-changed', loadData)
})
onUnmounted(() => {
  window.removeEventListener('quizlo-api-mode-changed', loadData)
})

// ─── Slug helpers ───────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function onNameInput() {
  if (!slugManuallyEdited.value) {
    form.value.slug = slugify(form.value.name)
  }
  slugError.value = ''
}

// ─── Dialog controls ────────────────────────────────────────────
function openNewDialog() {
  form.value = { id: null, name: '', name_bn: '', slug: '', icon: '', color_hex: '#3498db', is_active: true }
  slugManuallyEdited.value = false
  slugError.value = ''
  submitted.value = false
  dialogHeader.value = 'Add Subject'
  subjectDialog.value = true
}

function editSubject(s: any) {
  form.value = { ...s, icon: s.icon || '', color_hex: s.color_hex || '#3498db' }
  slugManuallyEdited.value = true // don't overwrite slug on edit
  slugError.value = ''
  submitted.value = false
  dialogHeader.value = 'Edit Subject'
  subjectDialog.value = true
}

function hideDialog() {
  subjectDialog.value = false
}

// ─── Save ───────────────────────────────────────────────────────
async function saveSubject() {
  submitted.value = true
  slugError.value = ''

  if (!form.value.name || !form.value.name_bn || !form.value.slug) return

  saving.value = true
  try {
    const payload = {
      name:      form.value.name,
      name_bn:   form.value.name_bn,
      slug:      form.value.slug,
      icon:      form.value.icon || null,
      color_hex: form.value.color_hex || null,
      is_active: form.value.is_active,
    }

    if (form.value.id) {
      const res = await apiClient.put(`/admin/subjects/${form.value.id}`, payload)
      if (res.success) {
        const idx = subjects.value.findIndex(s => s.id === form.value.id)
        if (idx !== -1) subjects.value[idx] = res.data
        subjectDialog.value = false
      }
    } else {
      const res = await apiClient.post('/admin/subjects', payload)
      if (res.success) {
        subjects.value.push(res.data)
        subjectDialog.value = false
      }
    }
  } catch (err: any) {
    // Surface slug uniqueness or other validation errors
    const errors = err?.response?.data?.errors
    if (errors?.slug) {
      slugError.value = errors.slug[0]
    } else {
      alert('Save failed. Please check your input and try again.')
    }
  } finally {
    saving.value = false
  }
}

// ─── Delete ─────────────────────────────────────────────────────
async function deleteSubject(s: any) {
  if (!confirm(`Delete subject "${s.name}"? This cannot be undone.`)) return
  try {
    const res = await apiClient.delete(`/admin/subjects/${s.id}`)
    if (res.success) {
      subjects.value = subjects.value.filter(sub => sub.id !== s.id)
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message || 'Delete failed.'
    alert(msg)
  }
}
</script>

<style scoped>
.subjects-page {
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
.dropdown-w { width: 160px; }

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

.color-swatch {
  display: inline-block;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.15);
}

.icon-preview {
  font-size: 0.85rem;
  opacity: 0.7;
}

/* Form styles */
.form-row {
  display: flex;
  gap: 1rem;
}
.col-6 { flex: 1; }

.color-input-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.native-color-picker {
  width: 40px;
  height: 36px;
  padding: 2px;
  border: 1px solid var(--color-border, rgba(255,255,255,0.1));
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
}

.color-text-input {
  flex: 1;
}

.helper-text {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.text-muted { opacity: 0.4; }
.mb-3 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.flex { display: flex; }
.align-items-center { align-items: center; }
.gap-2 { gap: 0.5rem; }
</style>
