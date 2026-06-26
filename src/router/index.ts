import { createRouter, createWebHistory } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useAuthStore } from '../modules/auth/store/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../modules/auth/pages/LoginPage.vue')
    },
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.path !== '/login' && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
