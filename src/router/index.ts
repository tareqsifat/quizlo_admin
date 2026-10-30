import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useAuthStore } from '../modules/auth/store/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../modules/auth/pages/LoginPage.vue'),
      meta: { guestOnly: true }
    },
    {
      path: '/',
      component: DashboardLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../modules/analytics/pages/DashboardPage.vue')
        },
        {
          path: 'exam-types',
          name: 'exam-types',
          component: () => import('../modules/exams/pages/ExamTypesPage.vue')
        },
        {
          path: 'lessons',
          name: 'lessons',
          component: () => import('../modules/content/pages/LessonsPage.vue')
        },
        {
          path: 'questions',
          name: 'questions',
          component: () => import('../modules/content/pages/QuestionsPage.vue')
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../modules/users/pages/UsersPage.vue')
        },
        {
          path: 'exams',
          name: 'exams',
          component: () => import('../modules/exams/pages/ExamsPage.vue')
        },
        {
          path: 'subjects',
          name: 'subjects',
          component: () => import('../modules/subjects/pages/SubjectsPage.vue')
        },
        {
          path: 'exam-type-subjects',
          name: 'exam-type-subjects',
          component: () => import('../modules/subjects/pages/ExamTypeSubjectsPage.vue')
        },
        {
          path: 'topics',
          name: 'topics',
          component: () => import('../modules/subjects/pages/TopicsPage.vue')
        },
        {
          path: 'activity-logs',
          name: 'activity-logs',
          component: () => import('../modules/activity/pages/ActivityLogsPage.vue')
        }
      ]
    },
    { path: '/dashboard', redirect: '/' },
    // Unknown URLs used to render a blank page; send them to the dashboard (or login via the guard)
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  // Any route that isn't explicitly guest-only requires a logged-in admin
  if (!to.meta.guestOnly && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
