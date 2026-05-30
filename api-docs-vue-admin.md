# Quizlo API Documentation — Vue Admin Panel

> **For:** Vue.js Admin Panel Development Team
> **Backend:** Laravel 13 · PHP 8.3 · MySQL 8 · Redis · Laravel Passport (OAuth2)
> **Base URL:** `https://api.quizlo.app/api/v1`
> **Version:** v2.0 · Updated: May 2026

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Standard Response Format](#2-standard-response-format)
3. [Dashboard](#3-dashboard)
4. [Exam Type Management](#4-exam-type-management)
5. [Content Management — Questions](#5-content-management--questions)
6. [Content Management — Lessons](#6-content-management--lessons)
7. [User Management](#7-user-management)
8. [Exam Schedule Management](#8-exam-schedule-management)
9. [Analytics](#9-analytics)
10. [Public Endpoints (No Auth)](#10-public-endpoints-no-auth)
11. [Error Reference](#11-error-reference)

---

## 1. Authentication & Authorization

### Auth Flow for Admin Panel

The admin panel uses **Client Credentials Grant** (OAuth2). This is different from the mobile app's Password Grant. The admin does **not** log in via phone/OTP — it authenticates via a pre-issued admin client.

> **Token Scope Required:** `admin`
> All admin routes are protected by the `AdminOnly` middleware which enforces the `admin` scope.

### Step 1 — Obtain Admin Token

**`POST /oauth/token`**

> This is a Passport endpoint, **not** prefixed with `/api/v1`.

**Request Body (application/x-www-form-urlencoded)**

| Field           | Type   | Required | Description                                  |
| --------------- | ------ | -------- | -------------------------------------------- |
| `grant_type`    | string | ✅       | Must be `client_credentials`                 |
| `client_id`     | string | ✅       | Admin OAuth client ID (from `oauth_clients`) |
| `client_secret` | string | ✅       | Admin OAuth client secret                    |
| `scope`         | string | ✅       | Must be `admin`                              |

**Example Request**

```json
POST /oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=2&client_secret=YOUR_SECRET&scope=admin
```

**Success Response `200 OK`**

```json
{
    "token_type": "Bearer",
    "expires_in": 1296000,
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
}
```

| Field          | Type    | Description                        |
| -------------- | ------- | ---------------------------------- |
| `token_type`   | string  | Always `Bearer`                    |
| `expires_in`   | integer | Seconds until expiry (15 days)     |
| `access_token` | string  | JWT Bearer token for all API calls |

### Step 2 — Using the Token

Include the token in **every** admin API request:

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...
Content-Type: application/json
Accept: application/json
```

### Token Expiry & Renewal

- Admin tokens expire in **15 days**
- Client Credentials grant has **no refresh token** — simply re-fetch using the client credentials
- Recommended: store client ID + secret securely in env vars, auto-renew when `401` is received

---

## 2. Standard Response Format

All API responses follow this envelope structure.

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "message": null,
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total": 250,
      "last_page": 13,
      "from": 1,
      "to": 20
    }
  }
}
```

### Error Response

```json
{
    "success": false,
    "data": null,
    "message": "Validation failed",
    "errors": {
        "field_name": ["Error message here."]
    }
}
```

### HTTP Status Codes

| Code | Meaning               | When Used                                 |
| ---- | --------------------- | ----------------------------------------- |
| 200  | OK                    | Successful GET, PUT, PATCH                |
| 201  | Created               | Successful POST (resource created)        |
| 204  | No Content            | Successful DELETE                         |
| 400  | Bad Request           | Malformed request body                    |
| 401  | Unauthorized          | Missing or invalid Bearer token           |
| 403  | Forbidden             | Valid token but wrong scope (not `admin`) |
| 404  | Not Found             | Resource does not exist                   |
| 422  | Unprocessable Entity  | Validation errors                         |
| 500  | Internal Server Error | Server-side failure                       |

---

## 3. Dashboard

### GET /admin/dashboard/stats

Returns aggregate platform statistics for the admin dashboard overview.

**Authentication:** Required (`admin` scope)
**Query Parameters:** None

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": {
        "users": {
            "total": 15420,
            "active_today": 3201,
            "new_this_week": 412,
            "active_this_month": 8903
        },
        "content": {
            "total_questions": 8540,
            "total_lessons": 320,
            "total_subjects": 35,
            "total_exam_types": 1
        },
        "engagement": {
            "answers_submitted_today": 87250,
            "lessons_completed_today": 1204,
            "model_tests_today": 302
        },
        "top_exam_types": [
            {
                "id": 1,
                "name": "BCS Preliminary",
                "code": "BCS",
                "enrolled_users": 14900
            }
        ]
    },
    "message": null
}
```

---

## 4. Exam Type Management

### GET /admin/exam-types

Lists all exam types (active and inactive).

**Authentication:** Required (`admin` scope)
**Query Parameters:** None

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "BCS Preliminary",
            "name_bn": "বিসিএস প্রিলিমিনারি",
            "code": "BCS",
            "slug": "bcs-preliminary",
            "description": "Bangladesh Civil Service Preliminary Exam",
            "icon": "bcs-icon",
            "is_active": true,
            "sort_order": 1,
            "subjects_count": 12,
            "enrolled_users_count": 14900,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-05-01T10:00:00Z"
        }
    ],
    "message": null
}
```

---

### POST /admin/exam-types

Creates a new exam type.

**Authentication:** Required (`admin` scope)

**Request Body (application/json)**

| Field         | Type    | Required | Validation                             | Description                   |
| ------------- | ------- | -------- | -------------------------------------- | ----------------------------- |
| `name`        | string  | ✅       | max:100                                | English name e.g. "HSC Exam"  |
| `name_bn`     | string  | ✅       | max:100                                | Bangla name e.g. "এইচএসসি"    |
| `code`        | string  | ✅       | max:30, unique, uppercase              | Unique code e.g. "HSC"        |
| `slug`        | string  | ✅       | max:100, unique, lowercase, kebab-case | URL slug e.g. "hsc-exam"      |
| `description` | string  | ❌       | nullable                               | Longer description            |
| `icon`        | string  | ❌       | nullable, max:100                      | Icon identifier or filename   |
| `is_active`   | boolean | ❌       | default: true                          | Whether visible to users      |
| `sort_order`  | integer | ❌       | min:0, default: 0                      | Display order (lower = first) |

**Example Request**

```json
{
    "name": "HSC Exam",
    "name_bn": "এইচএসসি পরীক্ষা",
    "code": "HSC",
    "slug": "hsc-exam",
    "description": "Higher Secondary Certificate Examination",
    "is_active": true,
    "sort_order": 2
}
```

**Success Response `201 Created`**

```json
{
    "success": true,
    "data": {
        "id": 2,
        "name": "HSC Exam",
        "name_bn": "এইচএসসি পরীক্ষা",
        "code": "HSC",
        "slug": "hsc-exam",
        "is_active": true,
        "sort_order": 2,
        "created_at": "2026-05-29T09:00:00Z",
        "updated_at": "2026-05-29T09:00:00Z"
    },
    "message": "Exam type created successfully."
}
```

**Validation Errors `422`**

```json
{
    "success": false,
    "data": null,
    "message": "Validation failed",
    "errors": {
        "code": ["The code has already been taken."],
        "slug": ["The slug has already been taken."]
    }
}
```

---

### PUT /admin/exam-types/{examType}

Updates an existing exam type. Supports full replacement.

**Authentication:** Required (`admin` scope)
**Route Parameter:** `examType` — integer, the exam type ID

**Request Body (application/json):** Same fields as POST, all optional on PUT.

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": {
        "id": 2,
        "name": "HSC Exam Updated",
        "name_bn": "এইচএসসি পরীক্ষা",
        "code": "HSC",
        "slug": "hsc-exam",
        "is_active": false,
        "sort_order": 3,
        "updated_at": "2026-05-29T10:00:00Z"
    },
    "message": "Exam type updated successfully."
}
```

---

### POST /admin/exam-types/{examType}/subjects

Assigns a subject to an exam type (or updates assignment metadata).

**Authentication:** Required (`admin` scope)
**Route Parameter:** `examType` — integer, the exam type ID

**Request Body (application/json)**

| Field           | Type    | Required | Validation               | Description                                   |
| --------------- | ------- | -------- | ------------------------ | --------------------------------------------- |
| `subject_id`    | integer | ✅       | exists:subjects,id       | ID of an existing subject                     |
| `is_active`     | boolean | ❌       | default: true            | Whether subject is visible for this exam type |
| `sort_order`    | integer | ❌       | min:0, default: 0        | Display order within exam type                |
| `total_marks`   | integer | ❌       | nullable, min:1, max:500 | Marks allocated (e.g. BCS Bangla = 35)        |
| `syllabus_note` | string  | ❌       | nullable                 | Notes about this subject's syllabus           |

**Example Request**

```json
{
    "subject_id": 5,
    "is_active": true,
    "sort_order": 1,
    "total_marks": 35,
    "syllabus_note": "Covers grammar, literature, and composition"
}
```

**Success Response `201 Created`**

```json
{
    "success": true,
    "data": {
        "exam_type_id": 1,
        "subject_id": 5,
        "subject_name": "Bangla",
        "is_active": true,
        "sort_order": 1,
        "total_marks": 35,
        "syllabus_note": "Covers grammar, literature, and composition"
    },
    "message": "Subject assigned to exam type."
}
```

---

### DELETE /admin/exam-types/{examType}/subjects/{subject}

Removes a subject from an exam type. Does **not** delete the subject itself.

**Authentication:** Required (`admin` scope)
**Route Parameters:**

- `examType` — integer, exam type ID
- `subject` — integer, subject ID

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": null,
    "message": "Subject removed from exam type."
}
```

---

## 5. Content Management — Questions

### GET /admin/questions

Paginated list of all questions with optional filters.

**Authentication:** Required (`admin` scope)

**Query Parameters**

| Parameter      | Type    | Required | Description                            |
| -------------- | ------- | -------- | -------------------------------------- |
| `page`         | integer | ❌       | Page number (default: 1)               |
| `per_page`     | integer | ❌       | Items per page (default: 20, max: 100) |
| `exam_type_id` | integer | ❌       | Filter by exam type                    |
| `subject_id`   | integer | ❌       | Filter by subject                      |
| `topic_id`     | integer | ❌       | Filter by topic                        |
| `difficulty`   | string  | ❌       | Filter: `easy`, `medium`, `hard`       |
| `is_active`    | boolean | ❌       | Filter by active status (`1` or `0`)   |
| `search`       | string  | ❌       | Search in question_text (min 3 chars)  |
| `source_batch` | string  | ❌       | Filter by BCS batch e.g. `BCS-44`      |

**Example Request**

```
GET /api/v1/admin/questions?exam_type_id=1&subject_id=3&difficulty=hard&page=1&per_page=20
```

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": [
        {
            "id": 101,
            "subject_id": 3,
            "subject_name": "Bangladesh Affairs",
            "topic_id": 12,
            "topic_name": "History",
            "lesson_id": 45,
            "question_text": "বাংলাদেশের প্রথম রাষ্ট্রপতি কে ছিলেন?",
            "question_bn": "বাংলাদেশের প্রথম রাষ্ট্রপতি কে ছিলেন?",
            "explanation": "বঙ্গবন্ধু শেখ মুজিবুর রহমান ছিলেন...",
            "difficulty": "medium",
            "xp_value": 10,
            "is_active": true,
            "options": [
                {
                    "id": 401,
                    "option_text": "শেখ মুজিবুর রহমান",
                    "is_correct": true,
                    "sort_order": 1
                },
                {
                    "id": 402,
                    "option_text": "জিয়াউর রহমান",
                    "is_correct": false,
                    "sort_order": 2
                },
                {
                    "id": 403,
                    "option_text": "আবু সাইদ চৌধুরী",
                    "is_correct": false,
                    "sort_order": 3
                },
                {
                    "id": 404,
                    "option_text": "এ কে ফজলুল হক",
                    "is_correct": false,
                    "sort_order": 4
                }
            ],
            "exam_types": [
                {
                    "id": 1,
                    "code": "BCS",
                    "source_batch": "BCS-44",
                    "source_year": 2022
                }
            ],
            "created_at": "2026-01-15T00:00:00Z",
            "updated_at": "2026-03-01T00:00:00Z"
        }
    ],
    "meta": {
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 8540,
            "last_page": 427
        }
    }
}
```

---

### POST /admin/questions

Creates a new question with its answer options.

**Authentication:** Required (`admin` scope)

**Request Body (application/json)**

| Field                       | Type    | Required      | Validation                  | Description                       |
| --------------------------- | ------- | ------------- | --------------------------- | --------------------------------- |
| `subject_id`                | integer | ✅            | exists:subjects,id          | Subject this question belongs to  |
| `topic_id`                  | integer | ❌            | nullable, exists:topics,id  | Topic within the subject          |
| `lesson_id`                 | integer | ❌            | nullable, exists:lessons,id | Associated lesson                 |
| `question_text`             | string  | ✅            | min:5                       | Question text (English or mixed)  |
| `question_bn`               | string  | ❌            | nullable                    | Bangla version of the question    |
| `explanation`               | string  | ❌            | nullable                    | Explanation shown after answer    |
| `difficulty`                | string  | ✅            | in:easy,medium,hard         | Difficulty level                  |
| `xp_value`                  | integer | ❌            | min:1, max:100, default:10  | XP awarded for correct answer     |
| `is_active`                 | boolean | ❌            | default: true               | Whether question is in rotation   |
| `options`                   | array   | ✅            | min:2, max:6 items          | Answer options                    |
| `options.*.option_text`     | string  | ✅            | min:1                       | Option text (English)             |
| `options.*.option_text_bn`  | string  | ❌            | nullable                    | Option text (Bangla)              |
| `options.*.is_correct`      | boolean | ✅            |                             | Exactly one option must be `true` |
| `options.*.sort_order`      | integer | ❌            | min:0                       | Display order                     |
| `exam_types`                | array   | ❌            | nullable                    | Exam type tags                    |
| `exam_types.*.exam_type_id` | integer | ✅ (if array) | exists:exam_types,id        | Exam type to tag this question to |
| `exam_types.*.source_batch` | string  | ❌            | nullable, max:20            | e.g. "BCS-44"                     |
| `exam_types.*.source_year`  | integer | ❌            | nullable, year format       | e.g. 2022                         |

**Example Request**

```json
{
    "subject_id": 3,
    "topic_id": 12,
    "question_text": "বাংলাদেশের স্বাধীনতা দিবস কোন তারিখে?",
    "question_bn": "বাংলাদেশের স্বাধীনতা দিবস কোন তারিখে?",
    "explanation": "২৬ মার্চ ১৯৭১ সালে বাংলাদেশ স্বাধীনতা ঘোষণা করে।",
    "difficulty": "easy",
    "xp_value": 10,
    "options": [
        { "option_text": "২৬ মার্চ", "is_correct": true, "sort_order": 1 },
        { "option_text": "১৬ ডিসেম্বর", "is_correct": false, "sort_order": 2 },
        {
            "option_text": "২১ ফেব্রুয়ারি",
            "is_correct": false,
            "sort_order": 3
        },
        { "option_text": "৭ মার্চ", "is_correct": false, "sort_order": 4 }
    ],
    "exam_types": [
        { "exam_type_id": 1, "source_batch": "BCS-43", "source_year": 2021 }
    ]
}
```

**Success Response `201 Created`**

```json
{
    "success": true,
    "data": {
        "id": 8541,
        "subject_id": 3,
        "question_text": "বাংলাদেশের স্বাধীনতা দিবস কোন তারিখে?",
        "difficulty": "easy",
        "xp_value": 10,
        "is_active": true,
        "options": [
            {
                "id": 33501,
                "option_text": "২৬ মার্চ",
                "is_correct": true,
                "sort_order": 1
            },
            {
                "id": 33502,
                "option_text": "১৬ ডিসেম্বর",
                "is_correct": false,
                "sort_order": 2
            },
            {
                "id": 33503,
                "option_text": "২১ ফেব্রুয়ারি",
                "is_correct": false,
                "sort_order": 3
            },
            {
                "id": 33504,
                "option_text": "৭ মার্চ",
                "is_correct": false,
                "sort_order": 4
            }
        ],
        "created_at": "2026-05-29T09:00:00Z"
    },
    "message": "Question created successfully."
}
```

---

### PUT /admin/questions/{question}

Updates an existing question and its options.

**Authentication:** Required (`admin` scope)
**Route Parameter:** `question` — integer, question ID

**Request Body:** Same as POST. Any field provided will be updated. Options array, if provided, will **replace** all existing options.

**Success Response `200 OK`**

```json
{
  "success": true,
  "data": { ... },
  "message": "Question updated successfully."
}
```

---

### DELETE /admin/questions/{question}

Soft-deletes a question (sets `is_active = false`). Does not permanently destroy the record.

**Authentication:** Required (`admin` scope)
**Route Parameter:** `question` — integer, question ID

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": null,
    "message": "Question deactivated successfully."
}
```

---

### POST /admin/questions/import

Bulk imports questions from a structured JSON payload (for BCS PDF import).

**Authentication:** Required (`admin` scope)

**Request Body (application/json)**

| Field                       | Type    | Required | Description                             |
| --------------------------- | ------- | -------- | --------------------------------------- |
| `exam_type_id`              | integer | ✅       | Exam type to tag all imported questions |
| `source_batch`              | string  | ✅       | e.g. `BCS-44`                           |
| `source_year`               | integer | ✅       | e.g. `2022`                             |
| `questions`                 | array   | ✅       | Array of question objects               |
| `questions.*.subject_id`    | integer | ✅       | Subject ID                              |
| `questions.*.question_text` | string  | ✅       | Question text                           |
| `questions.*.options`       | array   | ✅       | Options (same format as POST)           |

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": {
        "imported": 100,
        "skipped": 3,
        "errors": [
            { "index": 5, "reason": "Duplicate question text detected." }
        ]
    },
    "message": "100 questions imported, 3 skipped."
}
```

---

### POST /admin/questions/{question}/exam-types

Tags an existing question to additional exam types.

**Authentication:** Required (`admin` scope)
**Route Parameter:** `question` — integer, question ID

**Request Body (application/json)**

| Field          | Type    | Required | Description      |
| -------------- | ------- | -------- | ---------------- |
| `exam_type_id` | integer | ✅       | Exam type to tag |
| `source_batch` | string  | ❌       | e.g. `BCS-45`    |
| `source_year`  | integer | ❌       | e.g. `2023`      |

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": null,
    "message": "Question tagged to exam type."
}
```

---

## 6. Content Management — Lessons

### GET /admin/lessons

Paginated list of all lessons.

**Authentication:** Required (`admin` scope)

**Query Parameters**

| Parameter      | Type    | Required | Description                  |
| -------------- | ------- | -------- | ---------------------------- |
| `page`         | integer | ❌       | Page number (default: 1)     |
| `per_page`     | integer | ❌       | Items per page (default: 20) |
| `exam_type_id` | integer | ❌       | Filter by exam type          |
| `subject_id`   | integer | ❌       | Filter by subject            |
| `difficulty`   | string  | ❌       | `easy`, `medium`, `hard`     |
| `is_active`    | boolean | ❌       | `1` or `0`                   |

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": [
        {
            "id": 45,
            "exam_type_id": 1,
            "exam_type_name": "BCS Preliminary",
            "subject_id": 3,
            "subject_name": "Bangladesh Affairs",
            "topic_id": 12,
            "topic_name": "History",
            "title": "মুক্তিযুদ্ধের ইতিহাস",
            "title_bn": "মুক্তিযুদ্ধের ইতিহাস",
            "description": "বাংলাদেশের মুক্তিযুদ্ধ সম্পর্কে বিস্তারিত",
            "xp_reward": 20,
            "coin_reward": 10,
            "difficulty": "medium",
            "question_count": 10,
            "sort_order": 1,
            "is_active": true,
            "created_at": "2026-01-15T00:00:00Z"
        }
    ],
    "meta": {
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 320,
            "last_page": 16
        }
    }
}
```

---

### POST /admin/lessons

Creates a new lesson.

**Authentication:** Required (`admin` scope)

**Request Body (application/json)**

| Field            | Type    | Required | Validation                 | Description                        |
| ---------------- | ------- | -------- | -------------------------- | ---------------------------------- |
| `exam_type_id`   | integer | ✅       | exists:exam_types,id       | Exam type this lesson belongs to   |
| `subject_id`     | integer | ✅       | exists:subjects,id         | Subject of this lesson             |
| `topic_id`       | integer | ❌       | nullable, exists:topics,id | Optional topic                     |
| `title`          | string  | ✅       | max:200                    | Lesson title (English)             |
| `title_bn`       | string  | ✅       | max:200                    | Lesson title (Bangla)              |
| `description`    | string  | ❌       | nullable                   | Short description                  |
| `xp_reward`      | integer | ❌       | min:0, default:20          | XP for completing this lesson      |
| `coin_reward`    | integer | ❌       | min:0, default:10          | Coins for completing this lesson   |
| `difficulty`     | string  | ✅       | in:easy,medium,hard        | Difficulty level                   |
| `question_count` | integer | ❌       | min:1, max:50, default:10  | Number of questions in this lesson |
| `sort_order`     | integer | ❌       | min:0, default:0           | Display order                      |
| `is_active`      | boolean | ❌       | default:true               | Whether visible to users           |

**Example Request**

```json
{
    "exam_type_id": 1,
    "subject_id": 3,
    "topic_id": 12,
    "title": "Liberation War History",
    "title_bn": "মুক্তিযুদ্ধের ইতিহাস",
    "description": "Covers key events of the 1971 Liberation War",
    "xp_reward": 20,
    "coin_reward": 10,
    "difficulty": "medium",
    "question_count": 10,
    "sort_order": 1
}
```

**Success Response `201 Created`**

```json
{
    "success": true,
    "data": {
        "id": 321,
        "exam_type_id": 1,
        "subject_id": 3,
        "title": "Liberation War History",
        "title_bn": "মুক্তিযুদ্ধের ইতিহাস",
        "difficulty": "medium",
        "xp_reward": 20,
        "coin_reward": 10,
        "question_count": 10,
        "is_active": true,
        "created_at": "2026-05-29T09:00:00Z"
    },
    "message": "Lesson created successfully."
}
```

---

### PUT /admin/lessons/{lesson}

Updates an existing lesson.

**Authentication:** Required (`admin` scope)
**Route Parameter:** `lesson` — integer, lesson ID

**Request Body:** Same fields as POST, all optional.

**Success Response `200 OK`**

```json
{
  "success": true,
  "data": { ... },
  "message": "Lesson updated successfully."
}
```

---

## 7. User Management

### GET /admin/users

Paginated list of all users with optional search/filter.

**Authentication:** Required (`admin` scope)

**Query Parameters**

| Parameter      | Type    | Required | Description                                   |
| -------------- | ------- | -------- | --------------------------------------------- |
| `page`         | integer | ❌       | Page number (default: 1)                      |
| `per_page`     | integer | ❌       | Items per page (default: 20, max: 100)        |
| `search`       | string  | ❌       | Search by name or phone                       |
| `is_active`    | boolean | ❌       | Filter by active status (`1` or `0`)          |
| `exam_type_id` | integer | ❌       | Filter users enrolled in a specific exam type |
| `district`     | string  | ❌       | Filter by district                            |
| `sort_by`      | string  | ❌       | `created_at`, `name` (default: `created_at`)  |
| `sort_dir`     | string  | ❌       | `asc` or `desc` (default: `desc`)             |

**Example Request**

```
GET /api/v1/admin/users?search=sajid&exam_type_id=1&is_active=1&page=1
```

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": [
        {
            "id": 1001,
            "name": "Sajid Ahmed",
            "phone": "+8801700000000",
            "email": "sajid@example.com",
            "avatar": null,
            "district": "Dhaka",
            "division": "Dhaka",
            "daily_goal": 20,
            "is_active": true,
            "exam_types": [
                {
                    "id": 1,
                    "name": "BCS Preliminary",
                    "code": "BCS",
                    "is_primary": true,
                    "target_year": 2027,
                    "enrolled_at": "2026-01-10T00:00:00Z"
                }
            ],
            "stats": {
                "total_xp": 4250,
                "level": 5,
                "current_streak": 12,
                "current_hearts": 5,
                "coin_balance": 230
            },
            "created_at": "2026-01-10T00:00:00Z",
            "updated_at": "2026-05-20T00:00:00Z"
        }
    ],
    "meta": {
        "pagination": {
            "current_page": 1,
            "per_page": 20,
            "total": 15420,
            "last_page": 772
        }
    }
}
```

---

### GET /admin/users/{user}

Get detailed profile and stats for a single user.

**Authentication:** Required (`admin` scope)
**Route Parameter:** `user` — integer, user ID

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": {
        "id": 1001,
        "name": "Sajid Ahmed",
        "phone": "+8801700000000",
        "email": "sajid@example.com",
        "avatar": null,
        "district": "Dhaka",
        "division": "Dhaka",
        "daily_goal": 20,
        "first_session_completed": true,
        "is_active": true,
        "exam_types": [
            {
                "id": 1,
                "name": "BCS Preliminary",
                "code": "BCS",
                "is_primary": true,
                "target_year": 2027,
                "enrolled_at": "2026-01-10T00:00:00Z"
            }
        ],
        "gamification": {
            "xp": {
                "total_xp": 4250,
                "level": 5
            },
            "streak": {
                "current_streak": 12,
                "longest_streak": 30,
                "freeze_count": 2
            },
            "hearts": {
                "current_hearts": 5,
                "max_hearts": 5
            },
            "coins": {
                "balance": 230
            }
        },
        "mastery": [
            {
                "exam_type_id": 1,
                "subject_id": 3,
                "subject_name": "Bangladesh Affairs",
                "mastery_percentage": 62.5,
                "total_answered": 240,
                "total_correct": 150,
                "badge_earned": false
            }
        ],
        "achievements_count": 8,
        "created_at": "2026-01-10T00:00:00Z",
        "updated_at": "2026-05-20T00:00:00Z"
    }
}
```

---

### PATCH /admin/users/{user}/toggle-active

Activates or deactivates a user account. Toggles the current `is_active` state.

**Authentication:** Required (`admin` scope)
**Route Parameter:** `user` — integer, user ID
**Request Body:** None required.

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": {
        "id": 1001,
        "is_active": false
    },
    "message": "User account deactivated."
}
```

---

## 8. Exam Schedule Management

### GET /admin/exam-schedules

Lists exam schedules with optional exam type filter.

**Authentication:** Required (`admin` scope)

**Query Parameters**

| Parameter      | Type    | Required | Description                           |
| -------------- | ------- | -------- | ------------------------------------- |
| `exam_type_id` | integer | ❌       | Filter by exam type                   |
| `upcoming`     | boolean | ❌       | If `1`, returns only future schedules |

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "exam_type_id": 1,
            "exam_type_name": "BCS Preliminary",
            "batch_label": "47th BCS",
            "exam_stage": "preliminary",
            "scheduled_date": "2027-01-15",
            "is_confirmed": true,
            "note": "Tentative date as per BPSC circular",
            "days_remaining": 231,
            "created_at": "2026-05-01T00:00:00Z"
        }
    ]
}
```

---

### POST /admin/exam-schedules

Creates a new exam schedule entry (used for countdown feature in Flutter app).

**Authentication:** Required (`admin` scope)

**Request Body (application/json)**

| Field            | Type    | Required | Validation                       | Description                          |
| ---------------- | ------- | -------- | -------------------------------- | ------------------------------------ |
| `exam_type_id`   | integer | ✅       | exists:exam_types,id             | Associated exam type                 |
| `batch_label`    | string  | ❌       | nullable, max:50                 | e.g. "47th BCS", "SSC 2027"          |
| `exam_stage`     | string  | ✅       | in:preliminary,written,viva,main | Stage of the exam                    |
| `scheduled_date` | date    | ✅       | date format: Y-m-d, after:today  | Exam date                            |
| `is_confirmed`   | boolean | ❌       | default: false                   | Whether date is officially confirmed |
| `note`           | string  | ❌       | nullable, max:255                | Optional note for context            |

**Example Request**

```json
{
    "exam_type_id": 1,
    "batch_label": "47th BCS",
    "exam_stage": "preliminary",
    "scheduled_date": "2027-01-15",
    "is_confirmed": true,
    "note": "Based on official BPSC circular dated May 2026"
}
```

**Success Response `201 Created`**

```json
{
    "success": true,
    "data": {
        "id": 2,
        "exam_type_id": 1,
        "batch_label": "47th BCS",
        "exam_stage": "preliminary",
        "scheduled_date": "2027-01-15",
        "is_confirmed": true,
        "note": "Based on official BPSC circular dated May 2026",
        "created_at": "2026-05-29T09:00:00Z"
    },
    "message": "Exam schedule created."
}
```

---

## 9. Analytics

### GET /admin/analytics/daily-actives

Returns daily active user counts for the past N days.

**Authentication:** Required (`admin` scope)

**Query Parameters**

| Parameter | Type    | Required | Description                                          |
| --------- | ------- | -------- | ---------------------------------------------------- |
| `days`    | integer | ❌       | Number of past days to return (default: 30, max: 90) |

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": {
        "period_days": 30,
        "daily_actives": [
            { "date": "2026-05-29", "active_users": 3201 },
            { "date": "2026-05-28", "active_users": 3089 },
            { "date": "2026-05-27", "active_users": 2950 }
        ],
        "average_dau": 3080,
        "peak_day": { "date": "2026-05-22", "active_users": 3512 }
    }
}
```

---

### GET /admin/analytics/retention

User retention analysis by exam type.

**Authentication:** Required (`admin` scope)

**Query Parameters**

| Parameter      | Type    | Required | Description                       |
| -------------- | ------- | -------- | --------------------------------- |
| `exam_type_id` | integer | ❌       | Filter by exam type               |
| `period`       | string  | ❌       | `week` or `month` (default: week) |

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": {
        "exam_type_id": 1,
        "exam_type_name": "BCS Preliminary",
        "period": "week",
        "retention": {
            "day_1": 85.2,
            "day_3": 62.1,
            "day_7": 45.8,
            "day_14": 31.2,
            "day_30": 22.5
        },
        "cohort_size": 412
    }
}
```

---

### GET /admin/analytics/subject-performance

Performance analytics per subject for a given exam type.

**Authentication:** Required (`admin` scope)

**Query Parameters**

| Parameter      | Type    | Required | Description                    |
| -------------- | ------- | -------- | ------------------------------ |
| `exam_type_id` | integer | ✅       | Required — filter by exam type |

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": {
        "exam_type_id": 1,
        "subjects": [
            {
                "subject_id": 3,
                "subject_name": "Bangladesh Affairs",
                "total_questions": 1200,
                "total_answers": 85000,
                "average_accuracy": 58.3,
                "average_mastery": 52.1,
                "hardest_topic": "Constitutional History",
                "completion_rate": 68.5
            }
        ]
    }
}
```

---

## 10. Public Endpoints (No Auth)

These endpoints are accessible without authentication and are used during app initialization / onboarding.

### GET /exam-types

Returns the list of active exam types. Used in onboarding to let users pick their exam type.

**Authentication:** Not required
**Query Parameters:** None

**Success Response `200 OK`**

```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "name": "BCS Preliminary",
            "name_bn": "বিসিএস প্রিলিমিনারি",
            "code": "BCS",
            "slug": "bcs-preliminary",
            "description": "Bangladesh Civil Service Preliminary Exam",
            "icon": "bcs-icon",
            "sort_order": 1
        }
    ]
}
```

> **Note for Vue team:** This endpoint is primarily for the Flutter app's onboarding screen. Admin panel should use `GET /admin/exam-types` for management, which includes inactive exam types and richer metadata.

---

## 11. Error Reference

### Common Error Responses

#### 401 Unauthorized

```json
{
    "success": false,
    "data": null,
    "message": "Unauthenticated.",
    "errors": null
}
```

> **Fix:** Ensure `Authorization: Bearer <token>` header is present. Re-fetch token if expired.

#### 403 Forbidden

```json
{
    "success": false,
    "data": null,
    "message": "This action is unauthorized.",
    "errors": null
}
```

> **Fix:** Ensure the token was fetched with `scope=admin`. User-scoped tokens cannot access admin routes.

#### 404 Not Found

```json
{
    "success": false,
    "data": null,
    "message": "Resource not found.",
    "errors": null
}
```

#### 422 Validation Error

```json
{
    "success": false,
    "data": null,
    "message": "Validation failed",
    "errors": {
        "exam_type_id": ["The exam type field is required."],
        "options": ["At least 2 options are required."]
    }
}
```

#### 500 Server Error

```json
{
    "success": false,
    "data": null,
    "message": "An unexpected error occurred. Please try again.",
    "errors": null
}
```

---

## Appendix — Data Enums Reference

| Field          | Allowed Values                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `difficulty`   | `easy`, `medium`, `hard`                                                                                                             |
| `exam_stage`   | `preliminary`, `written`, `viva`, `main`                                                                                             |
| `session_type` | `lesson`, `model_test`, `practice`, `exam_mode`                                                                                      |
| `xp reason`    | `correct_answer`, `lesson_complete`, `streak_bonus`, `daily_goal_met`, `model_test_complete`, `league_promotion`, `streak_milestone` |
| `coin reason`  | `lesson_complete`, `streak_milestone`, `daily_goal_met`, `streak_freeze_purchase`, `extra_heart_purchase`, `hint_purchase`           |
| `league_tier`  | `Bronze` (1), `Silver` (2), `Gold` (3), `Platinum` (4), `Diamond` (5)                                                                |

---

_Quizlo API Documentation — Vue Admin Panel · v2.0 · May 2026_
_Backend: Laravel 13 · PHP 8.3 · MySQL 8 · Redis · Laravel Passport (OAuth2)_
