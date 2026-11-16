import React, { useState, useEffect } from 'react'
import { Card, Button, Swash, ProgressBar, Icon } from '../asaas-ui'
import { getStudents, runMatch } from '../api/client'

const TIER_META: Record<string, { label: string; tone: 'paid' | 'partial' | 'unpaid'; icon: 'checkCircle' | 'clock' | 'alert' }> = {
  excellent: { label: 'مؤهل بامتياز', tone: 'paid', icon: 'checkCircle' },
  good: { label: 'مؤهل بدرجة جيدة', tone: 'paid', icon: 'checkCircle' },
  fair: { label: 'استيفاء جزئي للشروط', tone: 'partial', icon: 'clock' },
  weak: { label: 'غير مستوفٍ للشروط الأساسية', tone: 'unpaid', icon: 'alert' },
}

function DimensionRow({ label, value }: { label: string; value: number }) {
  const isPass = value >= 60
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
      <span style={{ color: 'var(--text-2)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ width: 80, height: 4, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: `${Math.min(100, Math.max(0, value))}%`, height: '100%', background: isPass ? 'var(--accent)' : 'var(--text-3)', borderRadius: 4 }} />
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, minWidth: 36, textAlign: 'left', fontVariantNumeric: 'tabular-nums', color: isPass ? 'var(--text-1)' : 'var(--text-3)' }}>
          {value.toFixed(0)}%
        </span>
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
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      setError(e.message || 'تعذر استكمال عملية الفحص والمفاضلة')
    } finally {
      setLoading(false)
    }
  }

  const selectedStudent = students.find(s => s.id === studentId)

  return (
    <div style={{ animation: 'fade-in 0.2s ease' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          تقييم الأهلية والمفاضلة <Swash>الأكاديمية</Swash>
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
          فحص ملف الطالب ومقارنة المعدل والخبرات والتوافق التخصصي مع اشتراطات المنح المتاحة.
        </p>
      </div>

      <Card style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) auto', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-2)' }}>
              ملف الطالب المطلوب فحصه:
            </label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 0.9rem',
                borderRadius: 8,
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-soft)',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            >
              <option value="">تحديد طالب من السجل الأكاديمي...</option>
              {students.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#161b22', color: '#fff' }}>
                  {s.name} — {s.major} (معدل: {s.gpa})
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            onClick={handleRunMatch}
            disabled={!studentId || loading}
            style={{ height: '42px', padding: '0 1.5rem', fontSize: '0.9rem', fontWeight: 600 }}
          >
            {loading ? 'جاري فحص المتطلبات...' : 'فحص الأهلية والمفاضلة'}
          </Button>
        </div>

        {selectedStudent && (
          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '1.25rem', fontSize: '0.82rem', color: 'var(--text-3)' }}>
            <span>المرحلة المستهدفة: <strong style={{ color: 'var(--text-1)' }}>{selectedStudent.target_degree}</strong></span>
            <span>الجنسية: <strong style={{ color: 'var(--text-1)' }}>{selectedStudent.nationality}</strong></span>
            <span>الأبحاث المنشورة: <strong style={{ color: 'var(--text-1)', fontVariantNumeric: 'tabular-nums' }}>{selectedStudent.publications}</strong></span>
          </div>
        )}
      </Card>

      {error && (
        <Card style={{ padding: '0.9rem 1.25rem', marginBottom: '1.5rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)', color: 'var(--unpaid)', fontSize: '0.88rem' }}>
          {error}
        </Card>
      )}

      {loading && (
        <Card style={{ padding: '3rem 1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--border-soft)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-1)' }}>
            جاري تدقيق الشروط واحتساب نسب التوافق الأكاديمي...
          </div>
          <div style={{ color: 'var(--text-3)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            مطابقة متطلبات المعدل، الكفاءة اللغوية، وملاءمة التخصص
          </div>
        </Card>
      )}

      {result && (
        <>
          {result.trigger_external_search && (
            <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gold)' }}>
                توصية: توسيع نطاق البحث خارج قاعدة البيانات الداخلية
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                {result.external_search_reason || 'نسب التطابق مع المنح المسجلة حالياً أقل من الحد الموصى به (40%). يُقترح تفعيل البحث في مصادر خارجية بديلة.'}
              </div>
            </Card>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <Card style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.6rem' }}>
                عوامل القوة الأكاديمية
              </div>
              <ul style={{ paddingRight: '1rem', fontSize: '0.84rem', lineHeight: 1.7, color: 'var(--text-2)', margin: 0 }}>
                {result.analysis?.strengths?.map((s: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{s}</li>
                ))}
              </ul>
            </Card>

            <Card style={{ padding: '1.25rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-1)', marginBottom: '0.6rem' }}>
                متطلبات تحتاج إلى تعزيز
              </div>
              <ul style={{ paddingRight: '1rem', fontSize: '0.84rem', lineHeight: 1.7, color: 'var(--text-2)', margin: 0 }}>
                {result.analysis?.weaknesses?.map((w: string, idx: number) => (
                  <li key={idx} style={{ marginBottom: '0.2rem' }}>{w}</li>
                ))}
                {result.analysis?.competitive_gaps?.map((g: string, idx: number) => (
                  <li key={`g-${idx}`} style={{ marginBottom: '0.2rem' }}>{g}</li>
                ))}
              </ul>
            </Card>
          </div>

          {result.analysis?.overall_competitiveness && (
            <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'var(--surface-2)', border: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontWeight: 600 }}>التقييم الأكاديمي الإجمالي</div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-2)', marginTop: '0.25rem', lineHeight: 1.6 }}>
                {result.analysis.overall_competitiveness}
              </div>
            </Card>
          )}

          <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '1.5rem 0 0.9rem', color: 'var(--text-1)' }}>
            نتائج المفاضلة وترتيب المنح
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {result.ranked_matches?.map((m: any) => {
              const meta = TIER_META[m.tier] || { label: m.tier, tone: 'partial', icon: 'clock' as const }
              const isExpanded = expandedId === m.scholarship_id

              return (
                <Card
                  key={m.scholarship_id}
                  style={{
                    padding: '1.25rem',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--border-soft)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>
                          {m.scholarship_name}
                        </span>
                        <span className={`pill pill--${meta.tone}`}>
                          <Icon name={meta.icon} />
                          {meta.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
                        آخر موعد للتقديم: <span style={{ color: 'var(--text-2)', fontVariantNumeric: 'tabular-nums' }}>{m.deadline}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <div style={{
                        fontSize: '1.6rem',
                        fontWeight: 700,
                        color: 'var(--text-1)',
                        lineHeight: 1,
                        fontVariantNumeric: 'tabular-nums',
                        fontFamily: 'var(--font-sans)'
                      }}>
                        {m.match_percentage.toFixed(0)}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: '0.15rem' }}>نسبة الاستيفاء</div>
                    </div>
                  </div>

                  <div style={{ margin: '0.75rem 0' }}>
                    <ProgressBar value={m.match_percentage} max={100} />
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                    {m.recommendation_reasons?.map((r: string, idx: number) => (
                      <span key={idx} style={{
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 4,
                        background: 'var(--surface-2)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {r}
                      </span>
                    ))}
                    {m.disqualifying_factors?.map((d: string, idx: number) => (
                      <span key={`d-${idx}`} style={{
                        fontSize: '0.75rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 4,
                        background: 'var(--surface-2)',
                        color: 'var(--unpaid)',
                        border: '1px solid var(--border-subtle)'
                      }}>
                        {d}
                      </span>
                    ))}
                  </div>

                  <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : m.scholarship_id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      {isExpanded ? 'إخفاء تفصيل المعايير ▲' : 'عرض تفصيل المعايير ▼'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.85rem 1rem',
                      borderRadius: 6,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-3)', marginBottom: '0.5rem' }}>
                        نتائج التقييم التفصيلي للأبعاد:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0 1.5rem' }}>
                        <DimensionRow label="المعدل التراكمي (GPA)" value={m.breakdown.gpa_score} />
                        <DimensionRow label="المرحلة والدرجة الأكاديمية" value={m.breakdown.degree_score} />
                        <DimensionRow label="اختبارات الكفاءة اللغوية" value={m.breakdown.language_score} />
                        <DimensionRow label="الجنسية والدول المؤهلة" value={m.breakdown.nationality_score} />
                        <DimensionRow label="مطابقة التخصص الدراسي" value={m.breakdown.major_score} />
                        <DimensionRow label="التوافق البحثي والموضوعي" value={m.breakdown.semantic_alignment_score} />
                        <DimensionRow label="الخبرات والمشاريع العملية" value={m.breakdown.experience_score} />
                        <DimensionRow label="الإنتاج والنشر العلمي" value={m.breakdown.publications_score} />
                      </div>
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
