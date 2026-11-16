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

// Students
export const getStudents = () => req<any[]>('/students')
export const getStudent = (id: string) => req<any>(`/students/${id}`)
export const createStudent = (body: any) => req<any>('/students', { method: 'POST', body: JSON.stringify(body) })

// Scholarships
export const getScholarships = () => req<any[]>('/scholarships')
export const createScholarship = (body: any) => req<any>('/scholarships', { method: 'POST', body: JSON.stringify(body) })

// Matching
export const runMatch = (studentId: string) => req<any>(`/match/${studentId}`, { method: 'POST' })

// Plans
export const generatePlan = (studentId: string, topN = 5) =>
  req<any>(`/plans/${studentId}?top_n=${topN}`, { method: 'POST' })
export const getLatestPlan = (studentId: string) => req<any>(`/plans/${studentId}/latest`)
