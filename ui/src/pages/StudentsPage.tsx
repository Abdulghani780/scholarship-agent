import React, { useState, useEffect } from 'react'
import { Card, Button, Swash } from '../asaas-ui'
import { getStudents, createStudent } from '../api/client'

const DEGREE_OPTIONS = [
  { val: 'bachelor', label: 'بكالوريوس (Bachelor)' },
  { val: 'master', label: 'ماجستير (Master)' },
  { val: 'phd', label: 'دكتوراه (PhD)' },
  { val: 'high_school', label: 'ثانوية عامة (High School)' },
]

function AddStudentModal({ onAdded, onClose }: { onAdded: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', email: '', gpa: '3.75', major: 'Artificial Intelligence',
    degree_level: 'bachelor', target_degree: 'master',
    nationality: 'Yemeni', country_of_residence: 'Yemen',
    research_interests: 'NLP, Large Language Models, Multi-Agent Systems',
    languages: [{ language: 'Arabic', level: 'native', test_name: '', score: '' }, { language: 'English', level: 'B2', test_name: 'IELTS', score: '6.5' }],
    experiences: 'مساعد باحث في مختبر الذكاء الاصطناعي\nمطور ومصمم وكلاء برمجية',
    target_countries: 'Germany, USA, United Kingdom', target_fields: 'AI, NLP, Computer Science', publications: '1',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createStudent({
        ...form,
        gpa: parseFloat(form.gpa),
        publications: parseInt(form.publications) || 0,
        research_interests: form.research_interests.split(',').map(s => s.trim()).filter(Boolean),
        experiences: form.experiences.split('\n').map(s => s.trim()).filter(Boolean),
        target_countries: form.target_countries.split(',').map(s => s.trim()).filter(Boolean),
        target_fields: form.target_fields.split(',').map(s => s.trim()).filter(Boolean),
        languages: form.languages.map(l => ({
          ...l, score: l.score ? parseFloat(l.score) : null, test_name: l.test_name || null
        })),
      })
      onAdded()
      onClose()
    } catch (e: any) {
      setError(e.message || 'تعذر حفظ بيانات الطالب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <Card style={{ maxWidth: 660, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>
              تسجيل ملف طالب <Swash>جديد</Swash>
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>
              إدخال السجل الأكاديمي، المؤهلات اللغوية، والاهتمامات البحثية.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.2rem',
              cursor: 'pointer',
              color: 'var(--text-3)',
              lineHeight: 1,
              padding: '0.3rem'
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm, 8px)', background: 'rgba(248,81,73,0.06)', border: '1px solid rgba(248,81,73,0.3)', color: 'var(--unpaid)', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>اسم الطالب الكامل</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: عبدالغني علي" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>البريد الإلكتروني الأكاديمي</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@example.com" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>المعدل التراكمي (GPA من 4.0)</label>
              <input required type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={e => set('gpa', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>التخصص الأكاديمي</label>
              <input required value={form.major} onChange={e => set('major', e.target.value)} placeholder="Computer Science" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الدرجة الحالية</label>
              <select value={form.degree_level} onChange={e => set('degree_level', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }}>
                {DEGREE_OPTIONS.map(d => <option key={d.val} value={d.val} style={{ background: '#161b22' }}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>المرحلة المستهدفة</label>
              <select value={form.target_degree} onChange={e => set('target_degree', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }}>
                {DEGREE_OPTIONS.map(d => <option key={d.val} value={d.val} style={{ background: '#161b22' }}>{d.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الجنسية</label>
              <input required value={form.nationality} onChange={e => set('nationality', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>بلد الإقامة</label>
              <input required value={form.country_of_residence} onChange={e => set('country_of_residence', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الاهتمامات البحثية (مفصولة بفاصلة)</label>
            <input value={form.research_interests} onChange={e => set('research_interests', e.target.value)} placeholder="NLP, Deep Learning, Cloud Systems" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الخبرات السابقة والمشاريع (سطر لكل خبرة)</label>
            <textarea rows={2} value={form.experiences} onChange={e => set('experiences', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', resize: 'vertical', fontFamily: 'inherit', fontSize: '0.88rem' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الدول المستهدفة للابتعاث</label>
              <input value={form.target_countries} onChange={e => set('target_countries', e.target.value)} placeholder="Germany, USA, UK" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الأوراق البحثية</label>
              <input type="number" min="0" value={form.publications} onChange={e => set('publications', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-soft)', paddingTop: '0.85rem' }}>
            <Button variant="ghost" onClick={onClose} type="button">إلغاء</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'جاري الحفظ...' : 'حفظ واعتماد الملف'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  const load = () => getStudents().then(setStudents).catch(() => {})
  useEffect(() => { load() }, [])

  return (
    <div style={{ animation: 'fade-in 0.25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--text-1)' }}>
            سجل الطلاب <Swash>المعتمدين</Swash>
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0, maxWidth: 650, lineHeight: 1.6 }}>
            إدارة المؤهلات والدرجات الأكاديمية والاهتمامات البحثية الموثقة للمطابقة مع معايير المنح الدولية.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          تسجيل طالب جديد
        </Button>
      </div>

      {showModal && <AddStudentModal onAdded={load} onClose={() => setShowModal(false)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {students.map(s => (
          <Card key={s.id} style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.2rem', color: 'var(--text-1)' }}>{s.name}</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>{s.email}</div>
              </div>
              <span style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--gold)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border-soft)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-sm, 6px)',
                fontVariantNumeric: 'tabular-nums'
              }}>
                GPA {s.gpa}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
              <span style={{ fontSize: '0.76rem', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--text-2)' }}>
                {s.major}
              </span>
              <span style={{ fontSize: '0.76rem', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--text-2)' }}>
                المرحلة المستهدفة: {s.target_degree}
              </span>
              <span style={{ fontSize: '0.76rem', padding: '0.2rem 0.55rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--text-3)' }}>
                {s.nationality}
              </span>
            </div>

            {s.research_interests?.length > 0 && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.65rem', borderTop: '1px solid var(--border-soft)', paddingTop: '0.6rem', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-2)', fontWeight: 600 }}>الاهتمامات البحثية: </strong>
                {s.research_interests.join(' · ')}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
