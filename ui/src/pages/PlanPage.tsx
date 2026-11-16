import { useState, useEffect } from 'react'
import { getStudents, generatePlan, getLatestPlan } from '../api/client'

export default function PlanPage() {
  const [students, setStudents] = useState<any[]>([])
  const [studentId, setStudentId] = useState('')
  const [topN, setTopN] = useState(5)
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => { getStudents().then(setStudents).catch(() => {}) }, [])

  async function generate() {
    if (!studentId) return
    setLoading(true); setError(''); setPlan(null)
    try {
      const p = await generatePlan(studentId, topN)
      setPlan(p); setActiveTab(0)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function loadLatest() {
    if (!studentId) return
    try { const p = await getLatestPlan(studentId); setPlan(p); setActiveTab(0) }
    catch (e: any) { setError(e.message) }
  }

  const sp = plan?.scholarship_plans?.[activeTab]

  return (
    <div>
      <h1 className="page-title">📅 خطة التقديم</h1>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="form-row">
          <div>
            <label>الطالب</label>
            <select value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="">-- اختر طالباً --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label>عدد المنح في الخطة</label>
            <input type="number" min="1" max="10" value={topN} onChange={e => setTopN(parseInt(e.target.value))} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-success" onClick={generate} disabled={!studentId || loading}>
            {loading ? <><span className="spinner" /> جاري الإعداد...</> : '🚀 إنشاء خطة جديدة'}
          </button>
          <button className="btn btn-secondary" onClick={loadLatest} disabled={!studentId}>
            📂 تحميل آخر خطة
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)' }}>
          <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 1rem' }} />
          <div>الوكيل يُعد خارطة الطريق وتفاصيل كل منحة...<br />قد يستغرق دقيقة أو دقيقتين</div>
        </div>
      )}

      {plan && (
        <>
          <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
            📌 {plan.overall_timeline_summary}
          </div>

          <div className="tabs">
            {plan.scholarship_plans.map((p: any, i: number) => (
              <div key={i} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                [{p.priority_rank}] {p.scholarship_name.length > 20 ? p.scholarship_name.slice(0, 20) + '…' : p.scholarship_name}
                <span className={`badge`} style={{ marginRight: '0.4rem', background: 'rgba(0,0,0,0.2)' }}>
                  {p.match_percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>

          {sp && (
            <div>
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{sp.scholarship_name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      ⏰ الموعد النهائي: <strong>{sp.deadline}</strong> · 
                      تقريباً {sp.estimated_preparation_days} يوم للتجهيز
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--accent2)' }}>{sp.match_percentage.toFixed(0)}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>تطابق</div>
                  </div>
                </div>
                {sp.key_tips?.length > 0 && (
                  <div style={{ marginTop: '0.9rem', background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>💡 نصائح استراتيجية</div>
                    <ul style={{ paddingRight: '1.2rem', fontSize: '0.88rem', lineHeight: 1.8 }}>
                      {sp.key_tips.map((t: string, i: number) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="card">
                  <div className="section-title">📄 الوثائق المطلوبة</div>
                  {sp.required_documents.map((d: any, i: number) => (
                    <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 500 }}>{d.name}</span>
                        <span className={`badge ${d.status === 'required' ? 'badge-red' : d.status === 'optional' ? 'badge-green' : 'badge-yellow'}`}>
                          {d.status === 'required' ? 'مطلوب' : d.status === 'optional' ? 'اختياري' : 'مشروط'}
                        </span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>{d.description}</div>
                      {d.tips && <div style={{ color: 'var(--accent)', fontSize: '0.78rem', marginTop: '0.15rem' }}>💡 {d.tips}</div>}
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="section-title">🗓️ خطوات التقديم</div>
                  <ul className="step-list">
                    {sp.application_steps.map((step: any) => (
                      <li key={step.step_number}>
                        <div className={`step-num ${step.is_critical ? 'critical' : ''}`}>{step.step_number}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{step.title}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5, marginTop: '0.15rem' }}>{step.description}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--accent)', marginTop: '0.2rem' }}>📅 {step.due_by}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
