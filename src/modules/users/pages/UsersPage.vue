<template>
  <div class="users-page animate-fade">
    <div class="page-actions">
      <h3 class="section-title">Registered Candidates</h3>
    </div>

    <!-- Users DataTable -->
    <DataTable :value="users" dataKey="id" class="p-datatable-sm" responsiveLayout="scroll">
      <Column field="id" header="ID" style="width: 70px" :sortable="true"></Column>
      <Column field="name" header="Candidate Name" :sortable="true">
        <template #body="slotProps">
          <div class="user-cell">
            <span class="user-name">{{ slotProps.data.name }}</span>
            <span class="user-email" v-if="slotProps.data.email">{{ slotProps.data.email }}</span>
          </div>
        </template>
      </Column>
      <Column field="phone" header="Phone Number"></Column>
      <Column field="level" header="Level" :sortable="true">
        <template #body="slotProps">
          <span class="level-badge">Lvl {{ slotProps.data.level }}</span>
        </template>
      </Column>
      <Column field="streak" header="Active Streak" :sortable="true">
        <template #body="slotProps">
          <span class="streak-text">
            <i class="pi pi-bolt"></i> {{ slotProps.data.streak }} Days
          </span>
        </template>
      </Column>
      <Column header="Balancy / Ledger">
        <template #body="slotProps">
          <div class="balance-cell">
            <span class="bal-pill coin" title="Coins balance">
              <i class="pi pi-dollar"></i> {{ slotProps.data.coins }}
            </span>
            <span class="bal-pill heart" title="Hearts balance">
              <i class="pi pi-heart"></i> {{ slotProps.data.hearts }}/5
            </span>
            <span class="bal-pill xp" title="XP balance">
              {{ slotProps.data.xp }} XP
            </span>
          </div>
        </template>
      </Column>
      <Column header="Status" style="width: 100px">
        <template #body="slotProps">
          <span :class="['badge-status', slotProps.data.is_active ? 'active' : 'inactive']">
            {{ slotProps.data.is_active ? 'Active' : 'Suspended' }}
          </span>
        </template>
      </Column>
      <Column header="Operations" style="width: 150px">
        <template #body="slotProps">
          <Button 
            :label="slotProps.data.is_active ? 'Suspend' : 'Activate'" 
            :class="[slotProps.data.is_active ? 'p-button-danger' : 'p-button-success', 'p-button-text p-button-sm']"
            @click="toggleUserStatus(slotProps.data.id)" 
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import apiClient from '../../../shared/services/apiClient'

const users = ref<any[]>([])

async function loadUsers() {
  try {
    const res = await apiClient.get('/admin/users')
    if (res.success) {
      users.value = res.data
    }
  } catch (error) {
    console.error('Error fetching users:', error)
  }
}

onMounted(() => {
  loadUsers()
  window.addEventListener('quizlo-api-mode-changed', loadUsers)
})

onUnmounted(() => {
  window.removeEventListener('quizlo-api-mode-changed', loadUsers)
})

async function toggleUserStatus(id: number) {
  try {
    const res = await apiClient.patch(`/admin/users/${id}/toggle-active`)
    if (res.success) {
      const idx = users.value.findIndex(u => u.id === id)
      users.value[idx] = res.data
    }
  } catch (error) {
    console.error('Error toggling user status:', error)
  }
}
</script>

<style scoped>
.users-page {
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

.level-badge {
  background-color: var(--color-primary-surface);
  color: var(--color-primary-dark);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-weight: 700;
  font-size: 0.725rem;
}

.streak-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-streak);
}

.balance-cell {
  display: flex;
  gap: 0.5rem;
}

.bal-pill {
  font-size: 0.725rem;
  font-weight: 700;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
}

.bal-pill.coin { background-color: #FEF9EC; color: var(--color-accent-dark); }
.bal-pill.heart { background-color: #FDECEC; color: var(--color-heart); }
.bal-pill.xp { background-color: var(--color-bg-scaffold); border: 1px solid var(--color-border); color: var(--color-text-primary); }
</style>
