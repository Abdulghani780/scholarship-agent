import { useState, useEffect } from 'react'
import { getStudents, createStudent } from '../api/client'

const DEGREE_OPTIONS = ['high_school', 'bachelor', 'master', 'phd']
const LANG_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']

function AddStudentForm({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', gpa: '', major: '',
    degree_level: 'bachelor', target_degree: 'master',
    nationality: '', country_of_residence: '',
    research_interests: '', languages: [{ language: 'Arabic', level: 'native', test_name: '', score: '' }],
    experiences: '', target_countries: '', target_fields: '', publications: '0',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: any) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await createStudent({
        ...form,
        gpa: parseFloat(form.gpa),
        publications: parseInt(form.publications),
        research_interests: form.research_interests.split(',').map(s => s.trim()).filter(Boolean),
        experiences: form.experiences.split('\n').map(s => s.trim()).filter(Boolean),
        target_countries: form.target_countries.split(',').map(s => s.trim()).filter(Boolean),
        target_fields: form.target_fields.split(',').map(s => s.trim()).filter(Boolean),
        languages: form.languages.map(l => ({
          ...l, score: l.score ? parseFloat(l.score) : null, test_name: l.test_name || null
        })),
      })
      onAdded()
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="card">
      <div className="section-title">➕ إضافة طالب جديد</div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-row">
        <div><label>الاسم الكامل</label><input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ahmed Al-Yamani" /></div>
        <div><label>البريد الإلكتروني</label><input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="ahmed@example.com" /></div>
      </div>
      <div className="form-row">
        <div><label>المعدل (GPA من 4.0)</label><input required type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={e => set('gpa', e.target.value)} /></div>
        <div><label>التخصص</label><input required value={form.major} onChange={e => set('major', e.target.value)} placeholder="Computer Science" /></div>
      </div>
      <div className="form-row">
        <div><label>الدرجة الحالية</label>
          <select value={form.degree_level} onChange={e => set('degree_level', e.target.value)}>
            {DEGREE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div><label>الدرجة المستهدفة</label>
          <select value={form.target_degree} onChange={e => set('target_degree', e.target.value)}>
            {DEGREE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div><label>الجنسية</label><input required value={form.nationality} onChange={e => set('nationality', e.target.value)} /></div>
        <div><label>بلد الإقامة</label><input required value={form.country_of_residence} onChange={e => set('country_of_residence', e.target.value)} /></div>
      </div>
      <label>الاهتمامات البحثية (مفصولة بفاصلة)</label>
      <input value={form.research_interests} onChange={e => set('research_interests', e.target.value)} placeholder="NLP, AI Agents, Arabic AI" />
      <label>اللغات</label>
      {form.languages.map((l, i) => (
        <div key={i} className="form-row" style={{ marginBottom: '0.5rem' }}>
          <input placeholder="اللغة" value={l.language} onChange={e => { const ls = [...form.languages]; ls[i] = { ...ls[i], language: e.target.value }; set('languages', ls) }} />
          <select value={l.level} onChange={e => { const ls = [...form.languages]; ls[i] = { ...ls[i], level: e.target.value }; set('languages', ls) }}>
            {LANG_LEVELS.map(lv => <option key={lv} value={lv}>{lv}</option>)}
          </select>
        </div>
      ))}
      <button type="button" className="btn btn-secondary" style={{ marginBottom: '0.9rem' }}
        onClick={() => set('languages', [...form.languages, { language: '', level: 'B2', test_name: '', score: '' }])}>
        + إضافة لغة
      </button>
      <label>الخبرات (سطر لكل خبرة)</label>
      <textarea rows={3} value={form.experiences} onChange={e => set('experiences', e.target.value)} placeholder="Research assistant in NLP lab&#10;Open-source contributor" />
      <div className="form-row">
        <div><label>الدول المستهدفة (فاصلة)</label><input value={form.target_countries} onChange={e => set('target_countries', e.target.value)} placeholder="Germany, USA" /></div>
        <div><label>المجالات المستهدفة (فاصلة)</label><input value={form.target_fields} onChange={e => set('target_fields', e.target.value)} placeholder="AI, NLP" /></div>
      </div>
      <label>عدد الأبحاث المنشورة</label>
      <input type="number" min="0" value={form.publications} onChange={e => set('publications', e.target.value)} />
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? <span className="spinner" /> : '💾 حفظ الطالب'}
      </button>
    </form>
  )
}

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)

  const load = () => getStudents().then(setStudents).catch(() => {})
  useEffect(() => { load() }, [])

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="page-title" style={{ margin: 0 }}>🎓 الطلاب المسجلون</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ إغلاق' : '➕ طالب جديد'}
        </button>
      </div>
      {showForm && <AddStudentForm onAdded={() => { setShowForm(false); load() }} />}
      {students.length === 0
        ? <div className="empty-state">لا يوجد طلاب مسجلون بعد</div>
        : <div className="grid">
          {students.map(s => (
            <div key={s.id} className="card">
              <div style={{ fontWeight: 700, marginBottom: '0.4rem' }}>{s.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.6rem' }}>{s.email}</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className="badge badge-blue">GPA: {s.gpa}</span>
                <span className="badge badge-green">{s.major}</span>
                <span className="badge badge-yellow">{s.target_degree} ←</span>
              </div>
              <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--muted)' }}>
                ID: <code>{s.id}</code>
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  )
}
