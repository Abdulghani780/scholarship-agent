const BASE = '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || 'Request failed')
  }
  return res.json()
}

// Model & API preferences stored in localStorage
export function getSavedModelConfig(): { model_name: string; api_key: string } {
  try {
    const raw = localStorage.getItem('asaas_ai_config')
    if (raw) return JSON.parse(raw)
  } catch {}
  return { model_name: 'gemini-2.5-flash', api_key: '' }
}

export function saveModelConfig(config: { model_name: string; api_key: string }): void {
  try {
    localStorage.setItem('asaas_ai_config', JSON.stringify(config))
  } catch {}
}

// Students
export const getStudents = () => req<any[]>('/students')
export const getStudent = (id: string) => req<any>(`/students/${id}`)
export const createStudent = (body: any) => req<any>('/students', { method: 'POST', body: JSON.stringify(body) })

// Scholarships
export const getScholarships = () => req<any[]>('/scholarships')
export const createScholarship = (body: any) => req<any>('/scholarships', { method: 'POST', body: JSON.stringify(body) })

// Matching with configurable model and API key
export const runMatch = (studentId: string, options?: { model_name?: string; api_key?: string }) => {
  const cfg = getSavedModelConfig()
  const payload = {
    model_name: options?.model_name || cfg.model_name,
    api_key: options?.api_key || cfg.api_key || undefined,
  }
  return req<any>(`/match/${studentId}`, { method: 'POST', body: JSON.stringify(payload) })
}

// Plans with configurable model and API key
export const generatePlan = (studentId: string, topN = 5, options?: { model_name?: string; api_key?: string }) => {
  const cfg = getSavedModelConfig()
  const payload = {
    top_n: topN,
    model_name: options?.model_name || cfg.model_name,
    api_key: options?.api_key || cfg.api_key || undefined,
  }
  return req<any>(`/plans/${studentId}`, { method: 'POST', body: JSON.stringify(payload) })
}

export const getLatestPlan = (studentId: string) => req<any>(`/plans/${studentId}/latest`)

export const chatWithAssistant = (messages: { role: string; content: string }[], studentId?: string) => {
  const cfg = getSavedModelConfig()
  const payload = {
    messages,
    student_id: studentId,
    model_name: cfg.model_name,
    api_key: cfg.api_key || undefined,
  }
  return req<{ reply: string }>('/assistant', { method: 'POST', body: JSON.stringify(payload) })
}
