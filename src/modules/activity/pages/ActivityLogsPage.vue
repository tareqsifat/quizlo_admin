<template>
  <div class="activity-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Activity Logs</h3>
      <Button icon="pi pi-refresh" label="Refresh" class="p-button-text p-button-sm" @click="fetchLogs" />
    </div>

    <div class="filter-bar">
      <span class="search-box">
        <i class="pi pi-search"></i>
        <InputText v-model="search" placeholder="Search path, action, method or IP" @input="onSearchInput" />
      </span>
      <Dropdown v-model="userId" :options="admins" optionValue="id" optionLabel="name" placeholder="All users"
                showClear filter class="dropdown-w" @change="resetAndFetch">
        <template #option="slotProps">
          <div class="user-cell">
            <span class="user-name">{{ slotProps.option.name }}</span>
            <span class="user-email" v-if="slotProps.option.email">{{ slotProps.option.email }}</span>
          </div>
        </template>
      </Dropdown>
    </div>

    <DataTable :value="logs" dataKey="id" class="p-datatable-sm" responsiveLayout="scroll"
               lazy paginator :first="pagination.first" :rows="pagination.rows" :totalRecords="pagination.total"
               :rowsPerPageOptions="[10, 25, 50]" :loading="loading"
               :sortField="sort.field" :sortOrder="sort.order" removableSort
               v-model:expandedRows="expandedRows"
               @page="onPage" @sort="onSort">
      <template #empty>No activity found.</template>
      <Column expander style="width: 40px" />
      <Column field="created_at" header="Time" :sortable="true" style="width: 170px">
        <template #body="slotProps">{{ formatTime(slotProps.data.created_at) }}</template>
      </Column>
      <Column header="User">
        <template #body="slotProps">
          <div class="user-cell" v-if="slotProps.data.user">
            <span class="user-name">
              {{ slotProps.data.user.name }}
              <span v-if="slotProps.data.user.is_admin" class="admin-tag">Admin</span>
            </span>
            <span class="user-email">{{ slotProps.data.user.email }}</span>
          </div>
          <span v-else-if="slotProps.data.user_id" class="muted">#{{ slotProps.data.user_id }} (deleted)</span>
          <span v-else class="muted">Guest</span>
        </template>
      </Column>
      <Column field="method" header="Method" :sortable="true" style="width: 100px">
        <template #body="slotProps">
          <span :class="['method-badge', slotProps.data.method.toLowerCase()]">{{ slotProps.data.method }}</span>
        </template>
      </Column>
      <Column field="path" header="Path / Action" :sortable="true">
        <template #body="slotProps">
          <div class="path-cell">
            <span class="path">/{{ slotProps.data.path }}</span>
            <span class="action" v-if="slotProps.data.action">{{ shortAction(slotProps.data.action) }}</span>
          </div>
        </template>
      </Column>
      <Column field="status_code" header="Status" :sortable="true" style="width: 100px">
        <template #body="slotProps">
          <span :class="['status-badge', statusClass(slotProps.data.status_code)]">{{ slotProps.data.status_code }}</span>
        </template>
      </Column>
      <Column field="duration_ms" header="Duration" :sortable="true" style="width: 110px">
        <template #body="slotProps">{{ slotProps.data.duration_ms }} ms</template>
      </Column>
      <Column field="ip" header="IP" style="width: 130px"></Column>

      <template #expansion="slotProps">
        <div class="log-details">
          <div><strong>Route:</strong> {{ slotProps.data.route || '—' }}</div>
          <div><strong>Action:</strong> {{ slotProps.data.action || '—' }}</div>
          <div><strong>User agent:</strong> {{ slotProps.data.user_agent || '—' }}</div>
          <div><strong>Request data:</strong></div>
          <pre v-if="slotProps.data.payload">{{ JSON.stringify(slotProps.data.payload, null, 2) }}</pre>
          <span v-else class="muted">None</span>
        </div>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import apiClient from '../../../shared/services/apiClient'

const logs = ref<any[]>([])
const admins = ref<any[]>([])
const loading = ref(false)
const expandedRows = ref({})

const search = ref('')
const userId = ref<number | null>(null)
const pagination = ref({ first: 0, rows: 10, total: 0 })
// Newest first by default; sortOrder -1 = desc, 1 = asc (PrimeVue convention)
const sort = ref<{ field: string | undefined; order: number | undefined }>({ field: 'created_at', order: -1 })

let requestId = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

async function fetchLogs() {
  const current = ++requestId
  loading.value = true
  try {
    const params: Record<string, string | number> = {
      page: Math.floor(pagination.value.first / pagination.value.rows) + 1,
      per_page: pagination.value.rows,
      sort_by: sort.value.field || 'created_at',
      sort_dir: sort.value.field && sort.value.order === 1 ? 'asc' : 'desc'
    }
    if (search.value.trim()) params.search = search.value.trim()
    if (userId.value) params.user_id = userId.value

    const res = await apiClient.get('/admin/activity-logs', { params })
    if (current !== requestId) return   // a newer page/sort/filter request superseded this one
    if (res.success) {
      logs.value = res.data
      pagination.value.total = res.meta?.total ?? res.data.length
    }
  } catch (error) {
    console.error('Error loading activity logs:', error)
  } finally {
    if (current === requestId) loading.value = false
  }
}

async function fetchAdmins() {
  try {
    const res = await apiClient.get('/admin/activity-logs/admins')
    if (res.success) admins.value = res.data
  } catch (error) {
    console.error('Error loading admin users:', error)
  }
}

function resetAndFetch() {
  pagination.value.first = 0
  fetchLogs()
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(resetAndFetch, 300)
}

function onPage(event: { first: number; rows: number }) {
  pagination.value.first = event.first
  pagination.value.rows = event.rows
  fetchLogs()
}

function onSort(event: { sortField?: any; sortOrder?: number | null }) {
  // removableSort: a third click clears sorting, which falls back to newest first
  sort.value = {
    field: typeof event.sortField === 'string' ? event.sortField : undefined,
    order: event.sortOrder ?? undefined
  }
  resetAndFetch()
}

function formatTime(value: string) {
  return value ? new Date(value).toLocaleString() : ''
}

function shortAction(action: string) {
  return action.split('\\').pop()
}

function statusClass(code: number) {
  if (code >= 500) return 'error'
  if (code >= 400) return 'warn'
  return 'ok'
}

function loadAll() {
  fetchAdmins()
  fetchLogs()
}

onMounted(() => {
  loadAll()
  window.addEventListener('quizlo-api-mode-changed', loadAll)
})

onUnmounted(() => {
  clearTimeout(searchTimer)
  window.removeEventListener('quizlo-api-mode-changed', loadAll)
})
</script>

<style scoped>
.activity-page {
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

.filter-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 240px;
  max-width: 420px;
}

.search-box i {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-hint);
}

.search-box :deep(input) {
  width: 100%;
  padding-left: 2.25rem;
}

.dropdown-w {
  min-width: 220px;
}

.user-cell {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.user-email {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.admin-tag {
  margin-left: 0.35rem;
  background-color: var(--color-primary-surface);
  color: var(--color-primary-dark);
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 700;
}

.muted {
  color: var(--color-text-hint);
  font-size: 0.85rem;
}

.method-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 4px;
  background-color: var(--color-bg-scaffold);
  border: 1px solid var(--color-border);
}

.method-badge.get { background-color: #EBF5FB; color: #3498DB; border-color: transparent; }
.method-badge.post { background-color: #E8F8F0; color: #27AE60; border-color: transparent; }
.method-badge.put,
.method-badge.patch { background-color: #FEF9EC; color: var(--color-accent-dark); border-color: transparent; }
.method-badge.delete { background-color: #FDECEC; color: #E74C3C; border-color: transparent; }

.path-cell {
  display: flex;
  flex-direction: column;
  word-break: break-all;
}

.path {
  font-family: monospace;
  font-size: 0.825rem;
}

.action {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
}

.status-badge.ok { color: #27AE60; }
.status-badge.warn { color: var(--color-accent-dark); }
.status-badge.error { color: #E74C3C; }

.log-details {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.825rem;
  padding: 0.5rem 1rem;
  word-break: break-all;
}

.log-details pre {
  background-color: var(--color-bg-scaffold);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  font-size: 0.75rem;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
