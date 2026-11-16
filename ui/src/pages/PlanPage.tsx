import React, { useState, useEffect } from 'react'
import { Card, Button, Swash, Icon } from '../asaas-ui'
import { getStudents, generatePlan, getLatestPlan } from '../api/client'

export default function PlanPage() {
  const [students, setStudents] = useState<any[]>([])
  const [studentId, setStudentId] = useState('')
  const [topN, setTopN] = useState(4)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    getStudents().then(setStudents).catch(() => {})
  }, [])

  async function handleGeneratePlan() {
    if (!studentId) return
    setLoading(true)
    setError('')
    setPlan(null)
    try {
      const p = await generatePlan(studentId, topN)
      setPlan(p)
      setActiveTab(0)
    } catch (e: any) {
      setError(e.message || 'تعذر إعداد خطة التقديم، يرجى المحاولة لاحقاً')
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadLatest() {
    if (!studentId) return
    setLoading(true)
    setError('')
    try {
      const p = await getLatestPlan(studentId)
      setPlan(p)
      setActiveTab(0)
    } catch (e: any) {
      setError(e.message || 'لا توجد خطة معتمدة سابقة لهذا الملف')
    } finally {
      setLoading(false)
    }
  }

  const sp = plan?.scholarship_plans?.[activeTab]

  return (
    <div style={{ animation: 'fade-in 0.25s ease' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--text-1)' }}>
          خطة وإجراءات التقديم <Swash>الأكاديمي</Swash>
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0, maxWidth: 680, lineHeight: 1.6 }}>
          جدول زمني تنفيذي، قائمة التحقق من الوثائق الرسمية، ومصفوفة أولويات التقديم بحسب مواعيد الإغلاق ونسب القبول.
        </p>
      </div>

      <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) 140px auto auto', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-2)' }}>
              ملف الطالب المستهدف
            </label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-soft)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              <option value="">-- حدد ملف الطالب --</option>
              {students.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#161b22', color: '#fff' }}>
                  {s.name} — {s.major} (GPA {s.gpa})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-2)' }}>
              أعلى منح مستهدفة
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={topN}
              onChange={e => setTopN(parseInt(e.target.value) || 3)}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-soft)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <Button
            variant="primary"
            onClick={handleGeneratePlan}
            disabled={!studentId || loading}
            style={{ height: '42px', padding: '0 1.4rem' }}
          >
            {loading ? 'جاري الإعداد...' : 'إعداد خطة التقديم'}
          </Button>

          <Button
            variant="ghost"
            onClick={handleLoadLatest}
            disabled={!studentId || loading}
            style={{ height: '42px', padding: '0 1.1rem' }}
          >
            استرجاع الخطة المحفوظة
          </Button>
        </div>
      </Card>

      {error && (
        <div style={{
          padding: '0.85rem 1.1rem',
          marginBottom: '1.25rem',
          borderRadius: 'var(--radius-sm, 8px)',
          background: 'rgba(248,81,73,0.06)',
          border: '1px solid rgba(248,81,73,0.3)',
          color: 'var(--unpaid)',
          fontSize: '0.88rem'
        }}>
          {error}
        </div>
      )}

      {loading && (
        <Card style={{ padding: '3.5rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 32,
            height: 32,
            margin: '0 auto 1.25rem',
            borderRadius: '50%',
            border: '2px solid var(--border-soft)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <h3 style={{ margin: '0 0 0.4rem', fontSize: '1.05rem', color: 'var(--text-1)' }}>
            جاري جدولة المواعيد وتوليد مصفوفة المتطلبات التنفيذية...
          </h3>
          <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', margin: 0 }}>
            تحديد أولوية التقديم بحسب معايير القبول ومواعيد الإغلاق الرسمية.
          </p>
        </Card>
      )}

      {plan && (
        <>
          <div style={{
            padding: '1.1rem 1.4rem',
            marginBottom: '1.25rem',
            borderRadius: 'var(--radius-sm, 8px)',
            background: 'var(--surface-2)',
            border: '1px solid var(--border-soft)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem'
          }}>
            <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', fontWeight: 700 }}>
              الجدول الزمني العام ومسار الإجراءات
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-1)', lineHeight: 1.65 }}>
              {plan.overall_timeline_summary}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', marginBottom: '1.25rem', paddingBottom: '0.25rem' }}>
            {plan.scholarship_plans?.map((p: any, idx: number) => {
              const active = activeTab === idx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: 'var(--radius-sm, 8px)',
                    background: active ? 'var(--surface-3)' : 'var(--surface-2)',
                    color: active ? 'var(--text-1)' : 'var(--text-3)',
                    fontWeight: active ? 700 : 500,
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-soft)'}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'inherit',
                    fontSize: '0.85rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>#{p.priority_rank}</span>
                  <span>{p.scholarship_name.length > 24 ? p.scholarship_name.slice(0, 24) + '…' : p.scholarship_name}</span>
                  <span style={{
                    padding: '0.1rem 0.4rem',
                    borderRadius: 4,
                    background: 'var(--surface-1)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontVariantNumeric: 'tabular-nums',
                    color: p.match_percentage >= 80 ? 'var(--paid)' : p.match_percentage >= 60 ? 'var(--gold)' : 'var(--unpaid)'
                  }}>
                    {p.match_percentage.toFixed(0)}%
                  </span>
                </button>
              )
            })}
          </div>

          {sp && (
            <div>
              <Card style={{ padding: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--text-1)' }}>
                      {sp.scholarship_name}
                    </h2>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-3)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>
                        الموعد النهائي: <strong style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{sp.deadline}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        فترة الإعداد المقدرة: <strong style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{sp.estimated_preparation_days} يوماً</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'left', minWidth: 90 }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: sp.match_percentage >= 80 ? 'var(--paid)' : sp.match_percentage >= 60 ? 'var(--gold)' : 'var(--unpaid)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                      {sp.match_percentage.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>نسبة المطابقة</div>
                  </div>
                </div>

                {sp.key_tips?.length > 0 && (
                  <div style={{ marginTop: '1.25rem', padding: '1rem 1.15rem', borderRadius: 'var(--radius-sm, 8px)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-2)', marginBottom: '0.4rem' }}>
                      التوجيهات الاستراتيجية لمعايير القبول:
                    </div>
                    <ul style={{ paddingRight: '1.2rem', fontSize: '0.85rem', lineHeight: 1.8, color: 'var(--text-1)', margin: 0 }}>
                      {sp.key_tips.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                <Card style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-1)' }}>
                    قائمة الوثائق والمستندات الرسمية
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {sp.required_documents?.map((d: any, idx: number) => {
                      const isRequired = d.status === 'required' || !d.status
                      const isOptional = d.status === 'optional'
                      const tone = isRequired ? 'unpaid' : isOptional ? 'neutral' : 'partial'
                      const iconName = isRequired ? 'alert' : isOptional ? 'check' : 'clock'
                      const label = isRequired ? 'مستند إلزامي' : isOptional ? 'اختياري' : 'مشروط'
                      return (
                        <div key={idx} style={{ padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm, 8px)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-1)' }}>{d.name}</span>
                            <span className={`pill pill--${tone}`} style={{ fontSize: '0.72rem' }}>
                              <Icon name={iconName as any} />
                              {label}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                            {d.description}
                          </div>
                          {d.tips && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-2)', marginTop: '0.35rem', borderTop: '1px dashed var(--border-soft)', paddingTop: '0.35rem' }}>
                              ملاحظة: {d.tips}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>

                <Card style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-1)' }}>
                    المراحل التنفيذية والجدول الزمني
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {sp.application_steps?.map((step: any) => (
                      <div key={step.step_number} style={{ display: 'flex', gap: '0.85rem', padding: '0.75rem 0.9rem', borderRadius: 'var(--radius-sm, 8px)', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--surface-3)',
                          border: `1px solid ${step.is_critical ? 'var(--unpaid)' : 'var(--border-soft)'}`,
                          color: step.is_critical ? 'var(--unpaid)' : 'var(--text-2)',
                          fontWeight: 700, fontSize: '0.75rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontVariantNumeric: 'tabular-nums'
                        }}>
                          {step.step_number}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-1)' }}>
                              {step.title}
                            </span>
                            {step.is_critical && (
                              <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', borderRadius: 4, background: 'rgba(248,81,73,0.1)', color: 'var(--unpaid)', fontWeight: 600 }}>
                                مرحلة حرجة
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                            {step.description}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '0.35rem', fontVariantNumeric: 'tabular-nums' }}>
                            تاريخ الاستحقاق: {step.due_by}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
