import React, { useState, useEffect } from 'react'
import { Card, Button, Swash, Icon } from '../asaas-ui'
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
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <Card style={{ maxWidth: 660, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-soft)', paddingBottom: '0.85rem' }}>
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-1)' }}>
                  تسجيل منحة دراسية <Swash>جديدة</Swash>
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>
                  إدخال بيانات الجهة المانحة ومعايير الاستحقاق الأكاديمي.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
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
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>اسم المنحة الرسمي</label>
                  <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="مثال: DAAD Master Scholarship" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الجهة المانحة</label>
                  <input required value={form.provider} onChange={e => set('provider', e.target.value)} placeholder="مثال: DAAD Germany" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>دولة الدراسة</label>
                  <input required value={form.country} onChange={e => set('country', e.target.value)} placeholder="Germany" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>نوع التغطية المالية</label>
                  <select value={form.funding_type} onChange={e => set('funding_type', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }}>
                    <option value="full" style={{ background: '#161b22' }}>تمويل كامل (Full Funding)</option>
                    <option value="partial" style={{ background: '#161b22' }}>تمويل جزئي (Partial)</option>
                    <option value="stipend" style={{ background: '#161b22' }}>منحة معيشية (Stipend)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>نبذة تعريفية بالمنحة</label>
                <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="وصف موجز للمنحة وأهدافها الرئيسية" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الرسالة والرؤية الأكاديمية (للتقييم الدلالي)</label>
                <textarea rows={2} value={form.mission_statement} onChange={e => set('mission_statement', e.target.value)} placeholder="تهدف المنحة لاستقطاب الكفاءات البحثية في مجالات الذكاء الاصطناعي والتكنولوجيا..." style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الموعد النهائي للتقديم</label>
                  <input required type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الحد الأدنى للمعدل (Min GPA)</label>
                  <input type="number" step="0.1" min="0" max="4" value={form.requirements.min_gpa} onChange={e => setReq('min_gpa', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>المجالات والحقول المشمولة (مفصولة بفاصلة)</label>
                <input value={form.fields_of_study} onChange={e => set('fields_of_study', e.target.value)} placeholder="AI, Computer Science, Engineering" style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: '0.3rem' }}>الوثائق الإلزامية (مفصولة بفاصلة)</label>
                <input value={form.requirements.required_documents as any} onChange={e => setReq('required_documents', e.target.value)} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm, 6px)', background: 'var(--surface-2)', color: 'var(--text-1)', border: '1px solid var(--border-soft)', fontFamily: 'inherit', fontSize: '0.88rem' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-soft)', paddingTop: '0.85rem' }}>
                <Button variant="ghost" onClick={() => setShowModal(false)} type="button">إلغاء</Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? 'جاري الحفظ...' : 'حفظ واعتماد المنحة'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
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
