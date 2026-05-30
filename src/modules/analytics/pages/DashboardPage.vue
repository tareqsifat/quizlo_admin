<template>
  <div class="dashboard-page animate-fade">
    <!-- Header Summary Grid -->
    <div class="stats-grid">
      <!-- Users KPI Card -->
      <div class="dashboard-card stat-card border-purple">
        <div class="card-header">
          <div class="icon-wrapper bg-purple">
            <UsersIcon class="icon" />
          </div>
          <span class="trend-indicator up">
            <i class="pi pi-arrow-up-right"></i> +4.2%
          </span>
        </div>
        <div class="card-body">
          <h3 class="stat-number">{{ stats.users.total }}</h3>
          <span class="stat-label">Total Registered Users</span>
        </div>
        <div class="card-footer">
          <span class="footer-meta">Active today: <strong>{{ stats.users.active_today }}</strong></span>
        </div>
      </div>

      <!-- Content KPI Card -->
      <div class="dashboard-card stat-card border-orange">
        <div class="card-header">
          <div class="icon-wrapper bg-orange">
            <BookOpenIcon class="icon" />
          </div>
          <span class="trend-indicator up">
            <i class="pi pi-arrow-up-right"></i> +12 new
          </span>
        </div>
        <div class="card-body">
          <h3 class="stat-number">{{ stats.content.total_questions }}</h3>
          <span class="stat-label">Total System Questions</span>
        </div>
        <div class="card-footer">
          <span class="footer-meta">Lessons: <strong>{{ stats.content.total_lessons }}</strong> | Subjects: <strong>{{ stats.content.total_subjects }}</strong></span>
        </div>
      </div>

      <!-- Engagement KPI Card -->
      <div class="dashboard-card stat-card border-blue">
        <div class="card-header">
          <div class="icon-wrapper bg-blue">
            <ActivityIcon class="icon" />
          </div>
          <span class="trend-indicator up">
            <i class="pi pi-arrow-up-right"></i> Steady
          </span>
        </div>
        <div class="card-body">
          <h3 class="stat-number">{{ stats.engagement.answers_submitted_today }}</h3>
          <span class="stat-label">Answers Submitted Today</span>
        </div>
        <div class="card-footer">
          <span class="footer-meta">Lessons Completed: <strong>{{ stats.engagement.lessons_completed_today }}</strong></span>
        </div>
      </div>

      <!-- Exams KPI Card -->
      <div class="dashboard-card stat-card border-green">
        <div class="card-header">
          <div class="icon-wrapper bg-green">
            <AwardIcon class="icon" />
          </div>
          <span class="trend-indicator down">
            <i class="pi pi-arrow-down-right"></i> -1.5%
          </span>
        </div>
        <div class="card-body">
          <h3 class="stat-number">{{ stats.engagement.model_tests_today }}</h3>
          <span class="stat-label">Model Tests Taken Today</span>
        </div>
        <div class="card-footer">
          <span class="footer-meta">Active exam categories: <strong>{{ stats.content.total_exam_types }}</strong></span>
        </div>
      </div>
    </div>

    <!-- Main Workspace Widgets -->
    <div class="dashboard-main">
      <div class="left-widget">
        <div class="dashboard-card widget-card">
          <div class="widget-header">
            <h4>Popular Exam Registries</h4>
            <span class="badge-status active">Live Count</span>
          </div>
          <div class="exam-list">
            <div v-for="et in stats.top_exam_types" :key="et.id" class="exam-item">
              <div class="exam-info">
                <i class="pi pi-briefcase exam-icon"></i>
                <div>
                  <div class="exam-name">{{ et.name }} ({{ et.code }})</div>
                  <div class="exam-meta">Database ID: {{ et.id }}</div>
                </div>
              </div>
              <div class="exam-count">
                <strong>{{ et.enrolled_users.toLocaleString() }}</strong>
                <span class="count-label">students enrolled</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="right-widget">
        <div class="dashboard-card widget-card">
          <div class="widget-header">
            <h4>System Operations logs</h4>
          </div>
          <div class="logs-list">
            <div class="log-item">
              <div class="log-time">14:02</div>
              <div class="log-desc">Question ID <strong>#103</strong> spell check updated.</div>
            </div>
            <div class="log-item">
              <div class="log-time">13:45</div>
              <div class="log-desc">Subject <strong>Bangla</strong> assigned to HSC.</div>
            </div>
            <div class="log-item">
              <div class="log-time">12:30</div>
              <div class="log-desc">Mock server synchronization completed.</div>
            </div>
            <div class="log-item">
              <div class="log-time">09:12</div>
              <div class="log-desc">Imported 100 new BCS questions.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  Users as UsersIcon, 
  BookOpen as BookOpenIcon, 
  Activity as ActivityIcon, 
  Award as AwardIcon 
} from 'lucide-vue-next'
import apiClient from '../../../shared/services/apiClient'

const stats = ref({
  users: { total: 0, active_today: 0, new_this_week: 0, active_this_month: 0 },
  content: { total_questions: 0, total_lessons: 0, total_subjects: 0, total_exam_types: 0 },
  engagement: { answers_submitted_today: 0, lessons_completed_today: 0, model_tests_today: 0 },
  top_exam_types: [] as any[]
})

async function fetchStats() {
  try {
    const res = await apiClient.get('/admin/dashboard/stats')
    if (res.success) {
      stats.value = res.data
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
  }
}

onMounted(() => {
  fetchStats()
  window.addEventListener('quizlo-api-mode-changed', fetchStats)
})

onUnmounted(() => {
  window.removeEventListener('quizlo-api-mode-changed', fetchStats)
})
</script>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.border-purple { border-left: 4px solid var(--color-primary); }
.border-orange { border-left: 4px solid var(--color-accent); }
.border-blue { border-left: 4px solid #3498DB; }
.border-green { border-left: 4px solid #27AE60; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon-wrapper {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-purple { background-color: var(--color-primary-surface); color: var(--color-primary); }
.bg-orange { background-color: #FEF9EC; color: var(--color-accent); }
.bg-blue { background-color: #EBF5FB; color: #3498DB; }
.bg-green { background-color: #E8F8F0; color: #27AE60; }

.icon {
  width: 22px;
  height: 22px;
}

.trend-indicator {
  font-size: 0.75rem;
  font-weight: 700;
}

.trend-indicator.up { color: #27AE60; }
.trend-indicator.down { color: #E74C3C; }

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  font-family: 'Outfit', sans-serif;
  letter-spacing: -0.03em;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.card-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-divider);
  padding-top: 0.75rem;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.dashboard-main {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 1024px) {
  .dashboard-main {
    grid-template-columns: 1fr;
  }
}

.widget-card {
  height: 100%;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-divider);
  padding-bottom: 0.75rem;
}

.widget-header h4 {
  font-size: 1rem;
  font-family: 'Outfit', sans-serif;
}

.exam-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exam-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-scaffold);
}

.exam-info {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.exam-icon {
  font-size: 1.2rem;
  color: var(--color-primary);
}

.exam-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.exam-meta {
  font-size: 0.75rem;
  color: var(--color-text-hint);
}

.exam-count {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.exam-count strong {
  font-size: 1.1rem;
  color: var(--color-primary-dark);
}

.count-label {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.log-item {
  display: flex;
  gap: 0.85rem;
  font-size: 0.825rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px dotted var(--color-border);
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  font-weight: 700;
  color: var(--color-primary);
  flex-shrink: 0;
}

.log-desc {
  color: var(--color-text-secondary);
}
</style>
