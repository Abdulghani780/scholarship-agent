import React, { useState, useEffect } from 'react'
import { Card, Glass, Button, StatusPill, Swash, ProgressBar } from '../asaas-ui'
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
      setError(e.message || 'فشل في إنشاء خطة التقديم')
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
      setError(e.message || 'لا توجد خطة سابقة لهذا الطالب')
    } finally {
      setLoading(false)
    }
  }

  const sp = plan?.scholarship_plans?.[activeTab]

  return (
    <div style={{ animation: 'fade-in 0.3s ease' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--text-1)' }}>
          خارطة طريق التقديم <Swash>المخصصة</Swash>
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', margin: 0 }}>
          مولد خطة التقديم الزمنية لكل منحة مستهدفة مع الوثائق المطلوبة والخطوات التنفيذية بالأولوية.
        </p>
      </div>

      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1fr) 140px auto auto', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-2)' }}>
              اختر الطالب:
            </label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-soft)',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            >
              <option value="">-- اختر طالباً --</option>
              {students.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#161b22', color: '#fff' }}>
                  {s.name} ({s.major})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-2)' }}>
              أفضل المنح:
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={topN}
              onChange={e => setTopN(parseInt(e.target.value) || 3)}
              style={{
                width: '100%',
                padding: '0.7rem 1rem',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-soft)',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          <Button
            variant="primary"
            onClick={handleGeneratePlan}
            disabled={!studentId || loading}
            style={{ height: '46px', padding: '0 1.5rem' }}
          >
            {loading ? 'جاري الإعداد...' : '🚀 توليد الخطة المخصصة'}
          </Button>

          <Button
            variant="ghost"
            onClick={handleLoadLatest}
            disabled={!studentId || loading}
            style={{ height: '46px', padding: '0 1.25rem' }}
          >
            📂 تحميل الخطة السابقة
          </Button>
        </div>
      </Card>

      {error && (
        <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(248,81,73,0.08)', borderColor: 'rgba(248,81,73,0.25)', color: 'var(--unpaid)' }}>
          ⚠️ {error}
        </Card>
      )}

      {loading && (
        <Card style={{ padding: '3.5rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>
            📅
          </div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: 'var(--text-1)' }}>
            الوكيل يجهز خارطة طريق التقديم وجدول الوثائق والنصائح الاستراتيجية...
          </h3>
          <p style={{ color: 'var(--text-3)', fontSize: '0.88rem', margin: 0 }}>
            يتم حساب المواعيد النهائية وترتيب أولويات التقديم بحسب نسبة القبول.
          </p>
        </Card>
      )}

      {plan && (
        <>
          <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(88,166,255,0.08), rgba(210,153,34,0.08))', borderColor: 'var(--accent)' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.8rem' }}>📌</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-1)' }}>ملخص الخطة والجدول الزمني:</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '0.2rem', lineHeight: 1.6 }}>
                  {plan.overall_timeline_summary}
                </div>
              </div>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', marginBottom: '1.25rem', paddingBottom: '0.25rem' }}>
            {plan.scholarship_plans?.map((p: any, idx: number) => {
              const active = activeTab === idx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  style={{
                    padding: '0.6rem 1.1rem',
                    borderRadius: 'var(--radius-sm, 8px)',
                    background: active ? 'var(--accent)' : 'var(--surface-2)',
                    color: active ? '#0d1117' : 'var(--text-2)',
                    fontWeight: active ? 700 : 500,
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border-soft)'}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontFamily: 'inherit',
                    fontSize: '0.88rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>[{p.priority_rank}] {p.scholarship_name.length > 22 ? p.scholarship_name.slice(0, 22) + '…' : p.scholarship_name}</span>
                  <span style={{
                    padding: '0.1rem 0.4rem',
                    borderRadius: 12,
                    background: active ? 'rgba(0,0,0,0.2)' : 'var(--surface-3)',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {p.match_percentage.toFixed(0)}%
                  </span>
                </button>
              )
            })}
          </div>

          {sp && (
            <div>
              <Card style={{ padding: '1.5rem', marginBottom: '1.25rem', borderRight: '4px solid var(--accent)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 0.3rem', color: 'var(--text-1)' }}>
                      {sp.scholarship_name}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                      ⏰ الموعد النهائي: <strong style={{ color: 'var(--gold)' }}>{sp.deadline}</strong> · التجهيز المقترح: <strong style={{ color: 'var(--text-1)' }}>~{sp.estimated_preparation_days} يوماً</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--paid)', lineHeight: 1 }}>
                      {sp.match_percentage.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>نسبة المطابقة</div>
                  </div>
                </div>

                {sp.key_tips?.length > 0 && (
                  <div style={{ marginTop: '1.25rem', padding: '1rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gold)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      💡 نصائح واستراتيجيات التقديم الخاصة بهذه المنحة:
                    </div>
                    <ul style={{ paddingRight: '1.2rem', fontSize: '0.86rem', lineHeight: 1.8, color: 'var(--text-1)', margin: 0 }}>
                      {sp.key_tips.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
                <Card style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    📄 قائمة الوثائق والمستندات المطلوبة (Document Checklist)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {sp.required_documents?.map((d: any, idx: number) => {
                      const statusVal = d.status === 'required' ? 'unpaid' : d.status === 'optional' ? 'paid' : 'partial'
                      const statusTxt = d.status === 'required' ? 'إلزامي' : d.status === 'optional' ? 'اختياري' : 'مشروط'
                      return (
                        <div key={idx} style={{ padding: '0.75rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-1)' }}>{d.name}</span>
                            <StatusPill status={statusVal} />
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.3rem', lineHeight: 1.5 }}>
                            {d.description}
                          </div>
                          {d.tips && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--accent)', marginTop: '0.3rem', fontWeight: 500 }}>
                              💡 {d.tips}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </Card>

                <Card style={{ padding: '1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1rem', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🗓️ الخطوات التنفيذية بالترتيب الزمني (Milestones)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {sp.application_steps?.map((step: any) => (
                      <div key={step.step_number} style={{ display: 'flex', gap: '0.9rem', padding: '0.75rem', borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: step.is_critical ? 'var(--unpaid)' : 'var(--accent)',
                          color: '#0d1117', fontWeight: 800, fontSize: '0.8rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {step.step_number}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-1)' }}>
                            {step.title}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                            {step.description}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--gold)', marginTop: '0.3rem', fontWeight: 600 }}>
                            📅 الإنجاز: {step.due_by}
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
