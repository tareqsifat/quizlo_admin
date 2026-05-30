# Quizlo — Vue Admin Panel Software Development Document
### Admin Frontend Team · v1.0

**Framework:** Vue 3  
**Language:** TypeScript  
**Architecture:** Modular + Composition API  
**State Management:** Pinia  
**Router:** Vue Router  
**HTTP Client:** Axios  
**UI Framework:** PrimeVue  
**Build Tool:** Vite

---

# 1. Core Principles

## 1.1 SOLID Principles

| Principle | Implementation |
|---|---|
| Single Responsibility | Components, composables, stores, and services must have one responsibility only |
| Open/Closed | Extend modules without modifying core architecture |
| Liskov Substitution | Services/composables interchangeable without breaking components |
| Interface Segregation | Small composables and services instead of massive utilities |
| Dependency Inversion | Components depend on abstractions/services |

---

# 2. Application Architecture

```text
Pages
  ↓
Composable / Store
  ↓
Service Layer
  ↓
Axios API Client
  ↓
Laravel API
```

Rules:
- Components never directly call Axios
- Business logic stays outside UI
- Shared logic belongs in composables
- Global state only inside Pinia

---

# 3. Directory Structure

```text
src/
├── modules/
│   ├── auth/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── composables/
│   │   ├── services/
│   │   ├── store/
│   │   ├── validation/
│   │   └── routes/
│   │
│   ├── users/
│   ├── content/
│   ├── exams/
│   ├── gamification/
│   ├── analytics/
│   └── notifications/
│
├── shared/
│   ├── components/
│   ├── composables/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── router/
├── layouts/
├── plugins/
├── constants/
└── assets/
```

---

# 4. Component Rules

## 4.1 Component Responsibility

Rules:
- One component = one responsibility
- Avoid components larger than 300 lines
- Separate table, form, modal, and card components

Example:
```text
UserTable.vue
UserForm.vue
UserFilter.vue
UserDetailsModal.vue
```

---

# 5. Composition API Rules

Use:
```vue
<script setup lang="ts">
```

Avoid:
- Options API
- Massive lifecycle-heavy components

---

# 6. State Management

## 6.1 Pinia Rules

Only store:
- Auth state
- Shared dashboard data
- User session
- Shared filters

Do NOT store:
- Temporary form state
- Single component state

---

# 7. API Layer Rules

## 7.1 Service Layer Mandatory

Bad:
```ts
axios.get('/users')
```

Good:
```ts
userService.getUsers()
```

Example:
```text
modules/users/services/userService.ts
```

---

# 8. Axios Architecture

## 8.1 Centralized API Client

```text
shared/services/apiClient.ts
```

Features:
- JWT injection
- Refresh token handling
- Error interceptor
- Request timeout
- API logging

---

# 9. Validation Rules

Use:
- Zod
OR
- Yup + VeeValidate

Structure:
```text
modules/users/validation/userCreateSchema.ts
```

Rules:
- Validation schemas must stay outside components
- No inline validation spaghetti

---

# 10. Authentication Flow

Authentication handled via:
- Laravel Passport
- JWT access token
- Refresh token flow

Rules:
- Route guards mandatory
- Role-based middleware mandatory
- Never trust frontend validation alone

---

# 11. Routing Rules

Structure:
```text
modules/users/routes/index.ts
```

Rules:
- Lazy load all routes
- Use route meta permissions
- Admin-only routes protected

Example:
```ts
meta: {
  requiresAuth: true,
  permission: 'admin'
}
```

---

# 12. Shared UI Rules

Shared reusable UI:
```text
shared/components/
```

Examples:
- BaseButton
- BaseTable
- BaseModal
- BaseInput
- Pagination

Rules:
- Avoid duplicate UI implementation
- Reusable components must stay generic

---

# 13. Error Handling

Use centralized error mapper.

Example response:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

Rules:
- Never expose raw backend errors directly
- Toast notifications centralized

---

# 14. Table Handling Rules

All large datasets:
- Server-side pagination
- Debounced search
- Sorting support
- Filter persistence

---

# 15. Performance Rules

Mandatory:
- Lazy route loading
- Dynamic imports
- Debounced API calls
- Virtualized large tables
- Avoid unnecessary watchers

---

# 16. TypeScript Rules

Mandatory:
- Strict typing
- Shared API interfaces

Example:
```text
shared/types/
```

Avoid:
- any
- dynamic untyped responses

---

# 17. Environment Rules

Use:
```text
.env.development
.env.staging
.env.production
```

Never hardcode:
- URLs
- Secrets
- API endpoints

---

# 18. API Response Standard

```json
{
  "success": true,
  "data": {},
  "message": null,
  "meta": {}
}
```

---

# 19. Security Rules

Mandatory:
- XSS protection
- Escape unsafe HTML
- Route permission validation
- CSRF awareness
- Token expiration handling

---

# 20. Naming Convention

```text
PascalCase → Components
camelCase → Variables/functions
kebab-case → Route paths
```

Examples:
```text
UserTable.vue
useAuth.ts
userService.ts
```

---

# 21. Testing Strategy

Use:
- Vitest
- Cypress

Test Types:
- Unit tests
- Component tests
- E2E tests

---

# 22. CI/CD Rules

Pipeline must:
- Run lint
- Run type check
- Run tests
- Build production bundle

---

# 23. Development Rules Summary

Mandatory:
- Modular architecture
- Composition API only
- Service layer abstraction
- Reusable composables
- Strict TypeScript
- Shared API handling
- Centralized error handling
- Clean scalable architecture

