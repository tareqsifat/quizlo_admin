import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DashboardLayout,
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
        }
      ]
    }
  ]
})

export default router
