import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Duplicate the schema used in QuestionsPage to test it in isolation
const questionImportSchema = z.array(
  z.object({
    subject_id: z.number(),
    question_text: z.string().min(5),
    question_bn: z.string().optional().nullable(),
    question_type: z.enum(['mcq', 'fill_gap', 'listen_answer', 'match_answer']).default('mcq'),
    audio_url: z.string().optional().nullable(),
    explanation: z.string().optional().nullable(),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    xp_value: z.number().default(10),
    options: z.array(
      z.object({
        option_text: z.string(),
        option_text_bn: z.string().optional().nullable(),
        is_correct: z.boolean().default(false),
        match_text: z.string().optional().nullable()
      })
    ).min(2, 'Must provide at least 2 options')
  })
)

describe('Questions Import Zod Schema Validation', () => {
  it('passes validation with a correctly structured MCQ payload', () => {
    const validPayload = [
      {
        subject_id: 3,
        question_text: 'What is the first month of the Bengali calendar?',
        question_bn: 'বাংলা পঞ্জিকার প্রথম মাস কোনটি?',
        question_type: 'mcq',
        difficulty: 'easy',
        xp_value: 10,
        options: [
          { option_text: 'Boishakh', option_text_bn: 'বৈশাখ', is_correct: true },
          { option_text: 'Ashar', option_text_bn: 'আষাঢ়', is_correct: false }
        ]
      }
    ]

    const result = questionImportSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('fails validation when subject_id is missing', () => {
    const invalidPayload = [
      {
        question_text: 'What is the first month of the Bengali calendar?',
        question_type: 'mcq',
        options: [
          { option_text: 'Boishakh', is_correct: true },
          { option_text: 'Ashar', is_correct: false }
        ]
      }
    ]

    const result = questionImportSchema.safeParse(invalidPayload)
    expect(result.success).toBe(false)
    const err = (result as any).error
    expect(err.issues[0].message).toContain('expected number')
  })

  it('fails validation when options list has less than 2 elements', () => {
    const invalidPayload = [
      {
        subject_id: 1,
        question_text: 'Spelling check question text here',
        question_type: 'mcq',
        options: [
          { option_text: 'Boishakh', is_correct: true }
        ]
      }
    ]

    const result = questionImportSchema.safeParse(invalidPayload)
    expect(result.success).toBe(false)
    const err = (result as any).error
    expect(err.issues[0].message).toContain('Must provide at least 2 options')
  })
})
