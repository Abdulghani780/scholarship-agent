import React, { useState, useEffect } from 'react'
import { Card, Glass, Button, StatusPill, Swash, Icon } from '../asaas-ui'
import { getScholarships, createScholarship } from '../api/client'

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', provider: '', country: '', description: '',
    mission_statement: '', deadline: '2026-12-31', funding_type: 'full',
    fields_of_study: 'AI, Computer Science, Data Science', application_url: '',
    requirements: { min_gpa: '3.0', degree_levels: ['master', 'phd'], required_documents: 'Transcript, Motivation Letter, 2 Reference Letters' }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = () => getScholarships().then(setScholarships).catch(() => {})
  useEffect(() => { load() }, [])

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setReq = (k: string, v: any) => setForm(f => ({ ...f, requirements: { ...f.requirements, [k]: v } }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createScholarship({
        ...form,
        fields_of_study: form.fields_of_study.split(',').map(s => s.trim()).filter(Boolean),
        requirements: {
          ...form.requirements,
          min_gpa: form.requirements.min_gpa ? parseFloat(form.requirements.min_gpa) : null,
          required_documents: (form.requirements.required_documents as any).split(',').map((s: string) => s.trim()).filter(Boolean),
        }
      })
      setShowModal(false)
      load()
    } catch (e: any) {
      setError(e.message || 'فشل في حفظ المنحة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ animation: 'fade-in 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--text-1)' }}>
            دليل المنح الدراسية <Swash>المعتمدة</Swash>
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', margin: 0 }}>
            قاعدة بيانات المنح الدولية ومتطلبات القبول ومواعيد التقديم الرسمية.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          ➕ إضافة منحة جديدة
        </Button>
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <Card style={{ maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>
                ➕ إضافة منحة دراسية <Swash>جديدة</Swash>
              </h2>
              <button type="button" onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-3)' }}>
                ✕
              </button>
            </div>

            {error && (
              <div style={{ padding: '0.75rem', borderRadius: 8, background: 'rgba(248,81,73,0.1)', color: 'var(--unpaid)', marginBottom: '1rem', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>اسم المنحة:</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="DAAD Scholarship" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الجهة المانحة:</label>
                  <input required value={form.provider} onChange={e => set('provider', e.target.value)} placeholder="DAAD Germany" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>دولة الدراسة:</label>
                  <input required value={form.country} onChange={e => set('country', e.target.value)} placeholder="Germany" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>نوع التمويل:</label>
                  <select value={form.funding_type} onChange={e => set('funding_type', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)' }}>
                    <option value="full" style={{ background: '#161b22' }}>تمويل كامل (Full Funding)</option>
                    <option value="partial" style={{ background: '#161b22' }}>تمويل جزئي (Partial)</option>
                    <option value="stipend" style={{ background: '#161b22' }}>منحة شهرية (Stipend)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>رسالة المنحة ورؤيتها (للتقييم الدلالي بالذكاء الاصطناعي):</label>
                <textarea rows={2} value={form.mission_statement} onChange={e => set('mission_statement', e.target.value)} placeholder="تهدف المنحة لاستقطاب الكفاءات البحثية في مجالات الذكاء الاصطناعي والتكنولوجيا..." style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>آخر موعد للتقديم (Deadline):</label>
                  <input required type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الحد الأدنى للمعدل (Min GPA):</label>
                  <input type="number" step="0.1" min="0" max="4" value={form.requirements.min_gpa} onChange={e => setReq('min_gpa', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>المجالات والحقول الدراسية (فاصلة):</label>
                <input value={form.fields_of_study} onChange={e => set('fields_of_study', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الوثائق الإلزامية (فاصلة):</label>
                <input value={form.requirements.required_documents as any} onChange={e => setReq('required_documents', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 6, background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <Button variant="ghost" onClick={() => setShowModal(false)} type="button">إلغاء</Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'جاري الحفظ...' : '💾 حفظ المنحة'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {scholarships.map(s => (
          <Card key={s.id} style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.2rem', color: 'var(--text-1)' }}>
                  {s.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                  {s.provider} · 🌍 {s.country}
                </div>
              </div>
              <StatusPill status={s.funding_type === 'full' ? 'paid' : 'partial'} />
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-2)', lineHeight: 1.6, margin: '0.75rem 0' }}>
              {s.description}
            </p>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.6rem 0' }}>
              {s.fields_of_study?.map((f: string, i: number) => (
                <span key={i} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: 6, background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                  {f}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                ⏰ {s.deadline}
              </span>
              {s.requirements?.min_gpa && (
                <span style={{ color: 'var(--text-3)' }}>
                  أدنى معدل: {s.requirements.min_gpa}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
