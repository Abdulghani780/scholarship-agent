import React, { useState, useEffect } from 'react'
import { Card, Button, Swash, Modal, Field, TextInput, Select, TextArea } from '../asaas-ui'
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
    <Modal
      title="تسجيل ملف طالب جديد"
      onClose={onClose}
      wide
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', gap: '0.75rem' }}>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'جاري الحفظ...' : 'حفظ واعتماد الملف'}
          </Button>
          <Button variant="ghost" onClick={onClose} type="button">
            إلغاء
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
        <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
          إدخال السجل الأكاديمي، المؤهلات اللغوية، والاهتمامات البحثية للمطابقة مع معايير المنح.
        </p>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm, 8px)', background: 'rgba(248,81,73,0.06)', border: '1px solid rgba(248,81,73,0.3)', color: 'var(--unpaid)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
            <Field label="اسم الطالب الكامل:">
              {id => <TextInput id={id} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="عبدالغني علي" />}
            </Field>
            <Field label="البريد الإلكتروني الأكاديمي:">
              {id => <TextInput id={id} required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="student@example.com" />}
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
            <Field label="المعدل التراكمي (GPA من 4.0):">
              {id => <TextInput id={id} required type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={e => set('gpa', e.target.value)} />}
            </Field>
            <Field label="التخصص الأكاديمي:">
              {id => <TextInput id={id} required value={form.major} onChange={e => set('major', e.target.value)} placeholder="Computer Science" />}
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
            <Field label="الدرجة الحالية:">
              {id => (
                <Select id={id} value={form.degree_level} onChange={e => set('degree_level', e.target.value)}>
                  {DEGREE_OPTIONS.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                </Select>
              )}
            </Field>
            <Field label="المرحلة المستهدفة:">
              {id => (
                <Select id={id} value={form.target_degree} onChange={e => set('target_degree', e.target.value)}>
                  {DEGREE_OPTIONS.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
                </Select>
              )}
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
            <Field label="الجنسية:">
              {id => <TextInput id={id} required value={form.nationality} onChange={e => set('nationality', e.target.value)} />}
            </Field>
            <Field label="بلد الإقامة:">
              {id => <TextInput id={id} required value={form.country_of_residence} onChange={e => set('country_of_residence', e.target.value)} />}
            </Field>
          </div>

          <Field label="الاهتمامات البحثية (مفصولة بفاصلة):">
            {id => <TextInput id={id} value={form.research_interests} onChange={e => set('research_interests', e.target.value)} placeholder="NLP, Deep Learning, Cloud Systems" />}
          </Field>

          <Field label="الخبرات السابقة والمشاريع (سطر لكل خبرة):">
            {id => <TextArea id={id} rows={2} value={form.experiences} onChange={e => set('experiences', e.target.value)} />}
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '0.9rem' }}>
            <Field label="الدول المستهدفة للابتعاث:">
              {id => <TextInput id={id} value={form.target_countries} onChange={e => set('target_countries', e.target.value)} placeholder="Germany, USA, UK" />}
            </Field>
            <Field label="الأوراق البحثية:">
              {id => <TextInput id={id} type="number" min="0" value={form.publications} onChange={e => set('publications', e.target.value)} />}
            </Field>
          </div>
        </form>
      </div>
    </Modal>
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
