import { useState, useEffect } from 'react'
import { getStudents, runMatch } from '../api/client'

const TIER_CLASS: any = { excellent: 'match-excellent', good: 'match-good', fair: 'match-fair', weak: 'match-weak' }
const TIER_BADGE: any = { excellent: 'badge-green', good: 'badge-blue', fair: 'badge-yellow', weak: 'badge-red' }
const TIER_LABEL: any = { excellent: 'ممتاز', good: 'جيد', fair: 'مقبول', weak: 'ضعيف' }

function PctBar({ value }: { value: number }) {
  const color = value >= 80 ? 'var(--accent2)' : value >= 60 ? 'var(--accent)' : value >= 40 ? 'var(--warn)' : 'var(--danger)'
  return (
    <div className="pct-bar-wrap">
      <div className="pct-bar" style={{ width: `${value}%`, background: color }} />
    </div>
  )
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginBottom: '0.4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.15rem' }}>
        <span>{label}</span><span>{value.toFixed(0)}%</span>
      </div>
      <PctBar value={value} />
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

  useEffect(() => { getStudents().then(setStudents).catch(() => {}) }, [])

  async function run() {
    if (!studentId) return
    setLoading(true); setError(''); setResult(null)
    try {
      const r = await runMatch(studentId)
      setResult(r)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div>
      <h1 className="page-title">🤖 المطابقة الذكية</h1>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <label>اختر الطالب</label>
        <select value={studentId} onChange={e => setStudentId(e.target.value)} style={{ marginBottom: '1rem' }}>
          <option value="">-- اختر طالباً --</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name} (GPA: {s.gpa})</option>)}
        </select>
        <button className="btn btn-success" onClick={run} disabled={!studentId || loading}>
          {loading ? <><span className="spinner" /> جاري التحليل...</> : '🚀 تشغيل وكيل المطابقة'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
          <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 1rem' }} />
          <div>الوكيل يحلل ملف الطالب ويحسب نسب التطابق...<br />قد يستغرق 30-60 ثانية</div>
        </div>
      )}

      {result && (
        <>
          {result.trigger_external_search && (
            <div className="alert alert-info">
              ⚠️ نسب التطابق الداخلي منخفضة — يُنصح بتفعيل البحث الخارجي عن منح إضافية<br />
              <small>{result.external_search_reason}</small>
            </div>
          )}

          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div className="section-title">📊 تحليل الملف الأكاديمي</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--accent2)' }}>✅ نقاط القوة</div>
                <ul style={{ paddingRight: '1rem', fontSize: '0.88rem', lineHeight: 1.7 }}>
                  {result.analysis.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--danger)' }}>⚠️ نقاط الضعف</div>
                <ul style={{ paddingRight: '1rem', fontSize: '0.88rem', lineHeight: 1.7 }}>
                  {result.analysis.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>
            {result.analysis.competitive_gaps?.length > 0 && (
              <div style={{ marginTop: '0.9rem', background: 'var(--surface2)', borderRadius: 8, padding: '0.75rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.9rem' }}>🎯 الفجوات التنافسية</div>
                <ul style={{ paddingRight: '1rem', fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--muted)' }}>
                  {result.analysis.competitive_gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="section-title">🏆 المنح المرتبة حسب نسبة التطابق</div>
          {result.ranked_matches.map((m: any) => (
            <div key={m.scholarship_id} className={`match-card ${TIER_CLASS[m.tier] || ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div>
                  <span style={{ fontWeight: 700 }}>{m.scholarship_name}</span>
                  <span className={`badge ${TIER_BADGE[m.tier]}`} style={{ marginRight: '0.5rem' }}>{TIER_LABEL[m.tier]}</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: '1.2rem', color: m.match_percentage >= 60 ? 'var(--accent2)' : m.match_percentage >= 40 ? 'var(--warn)' : 'var(--danger)' }}>
                  {m.match_percentage.toFixed(0)}%
                </span>
              </div>
              <PctBar value={m.match_percentage} />
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {m.recommendation_reasons?.map((r: string, i: number) => (
                  <span key={i} className="chip">✓ {r}</span>
                ))}
              </div>
              {m.disqualifying_factors?.length > 0 && (
                <div style={{ marginTop: '0.5rem' }}>
                  {m.disqualifying_factors.map((d: string, i: number) => (
                    <span key={i} className="chip" style={{ background: 'rgba(248,81,73,0.1)', borderColor: 'rgba(248,81,73,0.3)', color: 'var(--danger)' }}>✗ {d}</span>
                  ))}
                </div>
              )}
              <button className="btn btn-secondary" style={{ marginTop: '0.6rem', fontSize: '0.78rem', padding: '0.3rem 0.7rem' }}
                onClick={() => setExpanded(expanded === m.scholarship_id ? null : m.scholarship_id)}>
                {expanded === m.scholarship_id ? '▲ إخفاء التفاصيل' : '▼ عرض التفاصيل'}
              </button>
              {expanded === m.scholarship_id && (
                <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <BreakdownRow label="المعدل (GPA)" value={m.breakdown.gpa_score} />
                  <BreakdownRow label="الدرجة العلمية" value={m.breakdown.degree_score} />
                  <BreakdownRow label="اللغات" value={m.breakdown.language_score} />
                  <BreakdownRow label="الجنسية" value={m.breakdown.nationality_score} />
                  <BreakdownRow label="التخصص" value={m.breakdown.major_score} />
                  <BreakdownRow label="🤖 التوافق الدلالي (AI)" value={m.breakdown.semantic_alignment_score} />
                  <BreakdownRow label="الخبرات" value={m.breakdown.experience_score} />
                  <BreakdownRow label="الأبحاث" value={m.breakdown.publications_score} />
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  )
}
