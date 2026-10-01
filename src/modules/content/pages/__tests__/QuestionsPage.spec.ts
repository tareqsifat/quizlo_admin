import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import QuestionsPage from '../QuestionsPage.vue'

// jsdom doesn't implement matchMedia; PrimeVue's Dropdown needs it.
window.matchMedia = window.matchMedia || function () {
  return {
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {}
  } as any
}
window.alert = window.alert || (() => {})

vi.mock('../../../../shared/services/apiClient', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
  }
})

import apiClient from '../../../../shared/services/apiClient'

const mockedGet = apiClient.get as unknown as ReturnType<typeof vi.fn>
const mockedPost = apiClient.post as unknown as ReturnType<typeof vi.fn>

function mountPage() {
  return mount(QuestionsPage, {
    global: { plugins: [PrimeVue] }
  })
}

describe('QuestionsPage — Search Similar Questions', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedPost.mockReset()
    mockedGet.mockResolvedValue({ success: true, data: [] })
    mockedPost.mockResolvedValue({ success: true, data: {} })
  })

  it('calls the search-similar endpoint with the typed question text', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.questionForm.question_text = 'Who wrote the novel Gora?'
    mockedGet.mockResolvedValueOnce({
      success: true,
      data: [{ id: 42, question_text: 'Who wrote the novel Gora?', options: [], appearances: [] }]
    })

    await vm.openSearchSimilarDialog()
    await flushPromises()

    expect(mockedGet).toHaveBeenCalledWith(
      '/admin/questions/search-similar',
      { params: { q: 'Who wrote the novel Gora?' } }
    )
    expect(vm.similarResults).toHaveLength(1)
    expect(vm.similarDialog).toBe(true)
  })

  it('does not search when the question text is under 3 characters', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.questionForm.question_text = 'ab'
    await vm.openSearchSimilarDialog()

    expect(mockedGet).not.toHaveBeenCalledWith(
      expect.stringContaining('search-similar'),
      expect.anything()
    )
    expect(vm.similarDialog).toBe(false)
  })

  it('recording an appearance on an existing question does not call question-create', async () => {
    const wrapper = mountPage()
    await flushPromises()

    const vm = wrapper.vm as any
    vm.appearanceForm.exam_type_id = 7
    vm.appearanceForm.year = 2024
    vm.appearanceForm.source_batch = 'BCS-60'

    await vm.recordAppearanceOnExisting(42)
    await flushPromises()

    expect(mockedPost).toHaveBeenCalledWith(
      '/admin/questions/42/appearances',
      { exam_type_id: 7, year: 2024, source_batch: 'BCS-60' }
    )
    expect(mockedPost).not.toHaveBeenCalledWith('/admin/questions', expect.anything())
    expect(vm.questionDialog).toBe(false)
  })
})
