import { useState, useEffect } from 'react'
import { getScholarships, createScholarship } from '../api/client'

const DEGREE_OPTIONS = ['high_school', 'bachelor', 'master', 'phd']

function AddScholarshipForm({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState({
    name: '', provider: '', country: '', description: '',
    mission_statement: '', deadline: '', funding_type: 'full',
    fields_of_study: '', application_url: '',
    requirements: { min_gpa: '', degree_levels: ['master'], required_documents: '' }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const setReq = (k: string, v: any) => setForm(f => ({ ...f, requirements: { ...f.requirements, [k]: v } }))

  async function submit(e: any) {
    e.preventDefault(); setLoading(true); setError('')
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
      onAdded()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="section-title">➕ إضافة منحة جديدة</div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-row">
        <div><label>اسم المنحة</label><input required value={form.name} onChange={e => set('name', e.target.value)} /></div>
        <div><label>الجهة المانحة</label><input required value={form.provider} onChange={e => set('provider', e.target.value)} /></div>
      </div>
      <div className="form-row">
        <div><label>البلد</label><input required value={form.country} onChange={e => set('country', e.target.value)} /></div>
        <div><label>نوع التمويل</label>
          <select value={form.funding_type} onChange={e => set('funding_type', e.target.value)}>
            {['full', 'partial', 'stipend'].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <label>الوصف</label>
      <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
      <label>رسالة المنحة (للتقييم الدلالي)</label>
      <textarea rows={2} value={form.mission_statement} onChange={e => set('mission_statement', e.target.value)} />
      <div className="form-row">
        <div><label>آخر موعد للتقديم</label><input required type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} /></div>
        <div><label>أدنى معدل (GPA)</label><input type="number" step="0.1" min="0" max="4" value={form.requirements.min_gpa} onChange={e => setReq('min_gpa', e.target.value)} /></div>
      </div>
      <label>الدرجات العلمية المقبولة</label>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
        {DEGREE_OPTIONS.map(d => (
          <label key={d} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.requirements.degree_levels.includes(d)}
              onChange={e => {
                const list = e.target.checked
                  ? [...form.requirements.degree_levels, d]
                  : form.requirements.degree_levels.filter(x => x !== d)
                setReq('degree_levels', list)
              }} />
            {d}
          </label>
        ))}
      </div>
      <label>المجالات الدراسية (فاصلة)</label>
      <input value={form.fields_of_study} onChange={e => set('fields_of_study', e.target.value)} placeholder="AI, NLP, Computer Science" />
      <label>الوثائق المطلوبة (فاصلة)</label>
      <input value={form.requirements.required_documents as any} onChange={e => setReq('required_documents', e.target.value)} placeholder="Transcript, Motivation Letter, Reference Letters" />
      <label>رابط التقديم (اختياري)</label>
      <input type="url" value={form.application_url} onChange={e => set('application_url', e.target.value)} />
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? <span className="spinner" /> : '💾 حفظ المنحة'}
      </button>
    </form>
  )
}

export default function ScholarshipsPage() {
  const [scholarships, setScholarships] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const load = () => getScholarships().then(setScholarships).catch(() => {})
  useEffect(() => { load() }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>📋 المنح الدراسية</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ إغلاق' : '➕ منحة جديدة'}
        </button>
      </div>
      {showForm && <AddScholarshipForm onAdded={() => { setShowForm(false); load() }} />}
      {scholarships.length === 0
        ? <div className="empty-state">لا توجد منح مسجلة بعد</div>
        : <div className="grid">
          {scholarships.map(s => (
            <div key={s.id} className="card">
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.3rem' }}>{s.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '0.6rem' }}>{s.provider} · {s.country}</div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className="badge badge-blue">{s.funding_type}</span>
                <span className="badge badge-yellow">⏰ {s.deadline}</span>
              </div>
              {s.requirements?.min_gpa && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
                  أدنى GPA: {s.requirements.min_gpa}
                </div>
              )}
            </div>
          ))}
        </div>
      }
    </div>
  )
}
