import React, { useState, useEffect } from 'react'
import { Card, Button, Swash, Icon, Modal, Field, TextInput, Select, TextArea } from '../asaas-ui'
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
      setError(e.message || 'تعذر حفظ المنحة الدراسية')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ animation: 'fade-in 0.25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--text-1)' }}>
            دليل المنح الدراسية <Swash>المعتمدة</Swash>
          </h1>
          <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0, maxWidth: 650, lineHeight: 1.6 }}>
            قاعدة بيانات المنح الدولية، متطلبات الأهلية والشروط الأكاديمية ومواعيد التقديم الرسمية.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          إضافة منحة جديدة
        </Button>
      </div>

      {showModal && (
        <Modal
          title="تسجيل منحة دراسية جديدة"
          onClose={() => setShowModal(false)}
          wide
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', gap: '0.75rem' }}>
              <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                {loading ? 'جاري الحفظ...' : 'حفظ واعتماد المنحة'}
              </Button>
              <Button variant="ghost" onClick={() => setShowModal(false)} type="button">
                إلغاء
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
            <p style={{ margin: 0, fontSize: '0.86rem', lineHeight: 1.6 }}>
              إدخال بيانات الجهة المانحة والشروط ومعايير الاستحقاق الأكاديمي.
            </p>

            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm, 8px)', background: 'rgba(248,81,73,0.06)', border: '1px solid rgba(248,81,73,0.3)', color: 'var(--unpaid)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
                <Field label="اسم المنحة الرسمي:">
                  {id => <TextInput id={id} required value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: DAAD Master Scholarship" />}
                </Field>
                <Field label="الجهة المانحة:">
                  {id => <TextInput id={id} required value={form.provider} onChange={e => set('provider', e.target.value)} placeholder="مثال: DAAD Germany" />}
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
                <Field label="دولة الدراسة:">
                  {id => <TextInput id={id} required value={form.country} onChange={e => set('country', e.target.value)} placeholder="Germany" />}
                </Field>
                <Field label="نوع التغطية المالية:">
                  {id => (
                    <Select id={id} value={form.funding_type} onChange={e => set('funding_type', e.target.value)}>
                      <option value="full">تمويل كامل (Full Funding)</option>
                      <option value="partial">تمويل جزئي (Partial)</option>
                      <option value="stipend">منحة معيشية (Stipend)</option>
                    </Select>
                  )}
                </Field>
              </div>

              <Field label="نبذة تعريفية بالمنحة:">
                {id => <TextInput id={id} value={form.description} onChange={e => set('description', e.target.value)} placeholder="وصف موجز للمنحة وأهدافها الرئيسية" />}
              </Field>

              <Field label="الرسالة والرؤية الأكاديمية (للتقييم الدلالي):">
                {id => <TextArea id={id} rows={2} value={form.mission_statement} onChange={e => set('mission_statement', e.target.value)} placeholder="تهدف المنحة لاستقطاب الكفاءات البحثية في مجالات الذكاء الاصطناعي والتكنولوجيا..." />}
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.9rem' }}>
                <Field label="الموعد النهائي للتقديم:">
                  {id => <TextInput id={id} required type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />}
                </Field>
                <Field label="الحد الأدنى للمعدل (Min GPA):">
                  {id => <TextInput id={id} type="number" step="0.1" min="0" max="4" value={form.requirements.min_gpa} onChange={e => setReq('min_gpa', e.target.value)} />}
                </Field>
              </div>

              <Field label="المجالات والحقول المشمولة (مفصولة بفاصلة):">
                {id => <TextInput id={id} value={form.fields_of_study} onChange={e => set('fields_of_study', e.target.value)} placeholder="AI, Computer Science, Engineering" />}
              </Field>

              <Field label="الوثائق الإلزامية (مفصولة بفاصلة):">
                {id => <TextInput id={id} value={form.requirements.required_documents as any} onChange={e => setReq('required_documents', e.target.value)} />}
              </Field>
            </form>
          </div>
        </Modal>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {scholarships.map(s => {
          const isFull = s.funding_type === 'full'
          const isPartial = s.funding_type === 'partial'
          const tone = isFull ? 'paid' : isPartial ? 'partial' : 'neutral'
          const label = isFull ? 'تمويل كامل' : isPartial ? 'تمويل جزئي' : 'منحة معيشية'
          const icon = isFull ? 'checkCircle' : isPartial ? 'clock' : 'wallet'

          return (
            <Card key={s.id} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.2rem', color: 'var(--text-1)' }}>
                    {s.name}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
                    {s.provider} — {s.country}
                  </div>
                </div>
                <span className={`pill pill--${tone}`} style={{ fontSize: '0.74rem' }}>
                  <Icon name={icon as any} />
                  {label}
                </span>
              </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-2)', lineHeight: 1.6, margin: '0.75rem 0' }}>
              {s.description}
            </p>

            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.6rem 0' }}>
              {s.fields_of_study?.map((f: string, i: number) => (
                <span key={i} style={{ fontSize: '0.74rem', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--text-2)' }}>
                  {f}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', borderTop: '1px solid var(--border-soft)', paddingTop: '0.65rem', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                الموعد النهائي: {s.deadline}
              </span>
              {s.requirements?.min_gpa && (
                <span style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                  أدنى معدل: {s.requirements.min_gpa}
                </span>
              )}
            </div>
          </Card>
        )})}
      </div>
    </div>
  )
}
