import React, { useState, useEffect } from 'react'
import { Card, Glass, Button, ProgressBar, StatusPill, Swash, Icon } from '../asaas-ui'
import { getStudents, runMatch } from '../api/client'

const TIER_META: Record<string, { label: string; status: 'paid' | 'partial' | 'unpaid' }> = {
  excellent: { label: 'تطابق استثنائي (ممتاز)', status: 'paid' },
  good: { label: 'تطابق قوي (جيد جداً)', status: 'paid' },
  fair: { label: 'تطابق متوسط (مقبول)', status: 'partial' },
  weak: { label: 'تطابق ضعيف', status: 'unpaid' },
}

function BreakdownItem({ label, value, icon }: { label: string; value: number; icon: string }) {
  const color = value >= 80 ? 'var(--paid)' : value >= 60 ? 'var(--accent)' : value >= 40 ? 'var(--partial)' : 'var(--unpaid)'
  return (
    <div style={{ marginBottom: '0.6rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.2rem' }}>
        <span style={{ color: 'var(--text-2)' }}>{icon} {label}</span>
        <span style={{ fontWeight: 700, color }}>{value.toFixed(0)}%</span>
      </div>
      <div style={{ background: 'var(--surface-3)', borderRadius: 20, height: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, value))}%`, background: color, borderRadius: 20, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
      </div>
    </div>
  )
}

export default function MatchPage() {
  const [students, setStudents] = useState<any[]>([])
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getStudents().then(setStudents).catch(() => {})
  }, [])

  async function handleRunMatch() {
    if (!studentId) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await runMatch(studentId)
      setResult(res)
    } catch (e: any) {
      setError(e.message || 'فشلت عملية المطابقة')
    } finally {
      setLoading(false)
    }
  }

  const selectedStudent = students.find(s => s.id === studentId)

  return (
    <div style={{ animation: 'fade-in 0.3s ease' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.4rem', color: 'var(--text-1)' }}>
          المطابقة والتحليل الأكاديمي <Swash>الذكي</Swash>
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.92rem', margin: 0 }}>
          فحص وتحليل ملف الطالب وفق خوارزمية المطابقة الهجينة (8 أبعاد) لتقييم فرص القبول والمنح الموصى بها.
        </p>
      </div>

      <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) auto', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-2)' }}>
              اختر ملف الطالب للفحص والتحليل:
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
              <option value="">-- اختر طالباً من القائمة --</option>
              {students.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#161b22', color: '#fff' }}>
                  {s.name} — {s.major} (معدل: {s.gpa}/4.0)
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            onClick={handleRunMatch}
            disabled={!studentId || loading}
            style={{ height: '46px', padding: '0 1.75rem', fontSize: '0.95rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ width: 18, height: 18 }} />
                جاري التحليل والمطابقة...
              </span>
            ) : (
              '⚡ بدء التدقيق والتحليل الذكي'
            )}
          </Button>
        </div>

        {selectedStudent && (
          <div style={{ marginTop: '1rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 20, background: 'var(--surface-3)', color: 'var(--gold)' }}>
              🎓 المرحلة: {selectedStudent.target_degree}
            </span>
            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 20, background: 'var(--surface-3)', color: 'var(--accent)' }}>
              🌍 الجنسية: {selectedStudent.nationality}
            </span>
            <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: 20, background: 'var(--surface-3)', color: 'var(--paid)' }}>
              📄 الأبحاث: {selectedStudent.publications}
            </span>
          </div>
        )}
      </Card>

      {error && (
        <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'rgba(248,81,73,0.08)', borderColor: 'rgba(248,81,73,0.25)', color: 'var(--unpaid)' }}>
          ⚠️ <strong>تنبيه:</strong> {error}
        </Card>
      )}

      {loading && (
        <Card style={{ padding: '3.5rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>
            ⚙️
          </div>
          <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', color: 'var(--text-1)' }}>
            الوكيل الذكي يفحص ملف الطالب ويحسب نسب التطابق الدلالي...
          </h3>
          <p style={{ color: 'var(--text-3)', fontSize: '0.88rem', margin: 0 }}>
            يتم فحص المؤهلات واللغات وحساب التوافق الدلالي مع رسائل المنح عبر محرك الذكاء الاصطناعي.
          </p>
        </Card>
      )}

      {result && (
        <>
          {result.trigger_external_search && (
            <Card style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(210,153,34,0.1)', borderColor: 'rgba(210,153,34,0.3)', color: 'var(--gold)' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.5rem' }}>📡</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem' }}>إشارة التوجيه التلقائي: تفعيل البحث الخارجي (External Search Trigger)</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '0.25rem' }}>
                    {result.external_search_reason || 'نسب التطابق مع المنح الداخلية منخفضة، يُوصى بتشغيل وكيل البحث الخارجي لتعويض الطالب.'}
                  </div>
                </div>
              </div>
            </Card>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <Card style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: 'var(--paid)' }}>
                <span>✅</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>نقاط القوة الأكاديمية</span>
              </div>
              <ul style={{ paddingRight: '1.2rem', fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--text-1)' }}>
                {result.analysis?.strengths?.map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </Card>

            <Card style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: 'var(--unpaid)' }}>
                <span>⚠️</span>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>نقاط الضعف والفجوات التنافسية</span>
              </div>
              <ul style={{ paddingRight: '1.2rem', fontSize: '0.88rem', lineHeight: 1.8, color: 'var(--text-1)' }}>
                {result.analysis?.weaknesses?.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
                {result.analysis?.competitive_gaps?.map((g: string, i: number) => (
                  <li key={`g-${i}`} style={{ color: 'var(--gold)' }}>{g}</li>
                ))}
              </ul>
            </Card>
          </div>

          {result.analysis?.overall_competitiveness && (
            <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'var(--surface-2)', borderRight: '4px solid var(--accent)' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', fontWeight: 600 }}>التقييم الشامل لفرص القبول:</div>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-1)', marginTop: '0.2rem', lineHeight: 1.6 }}>
                {result.analysis.overall_competitiveness}
              </div>
            </Card>
          )}

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '2rem 0 1rem', color: 'var(--text-1)' }}>
            🏆 المنح المرتبة حسب نسبة التطابق (Ranked Matches)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {result.ranked_matches?.map((m: any) => {
              const meta = TIER_META[m.tier] || { label: m.tier, status: 'partial' }
              const isTop = m.match_percentage >= 80

              return (
                <Card
                  key={m.scholarship_id}
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRight: `4px solid ${isTop ? 'var(--paid)' : m.match_percentage >= 50 ? 'var(--gold)' : 'var(--unpaid)'}`,
                    background: 'var(--surface-1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-1)' }}>
                          {m.scholarship_name}
                        </span>
                        <StatusPill status={meta.status} />
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
                        ⏰ الموعد النهائي: <strong style={{ color: 'var(--text-1)' }}>{m.deadline}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'left', minWidth: '90px' }}>
                      <div style={{
                        fontSize: '1.8rem',
                        fontWeight: 900,
                        color: isTop ? 'var(--paid)' : m.match_percentage >= 50 ? 'var(--gold)' : 'var(--unpaid)',
                        lineHeight: 1
                      }}>
                        {m.match_percentage.toFixed(0)}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.2rem' }}>نسبة التطابق</div>
                    </div>
                  </div>

                  <div style={{ margin: '0.9rem 0 0.75rem' }}>
                    <ProgressBar
                      value={m.match_percentage}
                      max={100}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
                    {m.recommendation_reasons?.map((r: string, idx: number) => (
                      <span key={idx} style={{
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 6,
                        background: 'rgba(63,185,80,0.1)',
                        color: 'var(--paid)',
                        border: '1px solid rgba(63,185,80,0.2)'
                      }}>
                        ✓ {r}
                      </span>
                    ))}
                    {m.disqualifying_factors?.map((d: string, idx: number) => (
                      <span key={`d-${idx}`} style={{
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 6,
                        background: 'rgba(248,81,73,0.1)',
                        color: 'var(--unpaid)',
                        border: '1px solid rgba(248,81,73,0.2)'
                      }}>
                        ✗ {d}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => setExpanded(expanded === m.scholarship_id ? null : m.scholarship_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      {expanded === m.scholarship_id ? '▲ إخفاء تفصيل درجات الأبعاد' : '▼ عرض تفصيل درجات الأبعاد (Score Breakdown)'}
                    </button>
                  </div>

                  {expanded === m.scholarship_id && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      borderRadius: 8,
                      background: 'var(--surface-2)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      <BreakdownItem label="المعدل التراكمي (GPA)" value={m.breakdown.gpa_score} icon="📊" />
                      <BreakdownItem label="الدرجة والمرحلة" value={m.breakdown.degree_score} icon="🎓" />
                      <BreakdownItem label="متطلبات اللغة" value={m.breakdown.language_score} icon="🗣️" />
                      <BreakdownItem label="أهلية الجنسية" value={m.breakdown.nationality_score} icon="🌍" />
                      <BreakdownItem label="مطابقة التخصص" value={m.breakdown.major_score} icon="📚" />
                      <BreakdownItem label="🤖 التوافق الدلالي (AI)" value={m.breakdown.semantic_alignment_score} icon="🧠" />
                      <BreakdownItem label="الخبرات والمشاريع" value={m.breakdown.experience_score} icon="💼" />
                      <BreakdownItem label="الأوراق البحثية" value={m.breakdown.publications_score} icon="📝" />
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
