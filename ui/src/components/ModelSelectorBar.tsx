import React, { useState, useEffect } from 'react'
import { Card, Glass, Icon } from '../asaas-ui'
import { getSavedModelConfig, saveModelConfig } from '../api/client'

const MODELS = [
  { id: 'gemini-2.5-flash', label: '⭐ Gemini 2.5 Flash (الأحدث والموصى به)' },
  { id: 'gemini-3.6-flash', label: '⚡ Gemini 3.6 Flash (عالي الأداء)' },
  { id: 'gemini-1.5-flash', label: '🚀 Gemini 1.5 Flash (سريع ومستقر)' },
  { id: 'gemini-1.5-pro', label: '🧠 Gemini 1.5 Pro (تفكير عميق)' },
  { id: 'custom', label: '✏️ نموذج آخر (إدخال يدوي)...' },
]

export default function ModelSelectorBar() {
  const [cfg, setCfg] = useState(getSavedModelConfig())
  const [isCustom, setIsCustom] = useState(false)
  const [customModel, setCustomModel] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    const saved = getSavedModelConfig()
    const found = MODELS.find(m => m.id === saved.model_name)
    if (!found) {
      setIsCustom(true)
      setCustomModel(saved.model_name)
    }
  }, [])

  function handleModelChange(val: string) {
    if (val === 'custom') {
      setIsCustom(true)
    } else {
      setIsCustom(false)
      const next = { ...cfg, model_name: val }
      setCfg(next)
      saveModelConfig(next)
    }
  }

  function handleCustomModelChange(val: string) {
    setCustomModel(val)
    const next = { ...cfg, model_name: val }
    setCfg(next)
    saveModelConfig(next)
  }

  function handleApiKeyChange(val: string) {
    const next = { ...cfg, api_key: val }
    setCfg(next)
    saveModelConfig(next)
  }

  return (
    <Card className="model-selector-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(88,166,255,0.2), rgba(210,153,34,0.2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            🤖
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
              اختيار نموذج الذكاء الاصطناعي (AI Model & API Control)
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
              النموذج النشط حالياً: <span style={{ color: 'var(--gold, #d29922)', fontWeight: 600 }}>{cfg.model_name}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={isCustom ? 'custom' : cfg.model_name}
            onChange={e => handleModelChange(e.target.value)}
            style={{
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-sm, 8px)',
              background: 'var(--surface-2, rgba(255,255,255,0.06))',
              color: 'var(--text-1)',
              border: '1px solid var(--border-soft, rgba(255,255,255,0.12))',
              fontFamily: 'inherit',
              fontSize: '0.85rem',
              minWidth: '220px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id} style={{ background: '#161b22', color: '#fff' }}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            style={{
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-sm, 8px)',
              background: cfg.api_key ? 'rgba(63,185,80,0.15)' : 'var(--surface-2, rgba(255,255,255,0.06))',
              color: cfg.api_key ? 'var(--paid, #3fb950)' : 'var(--text-2)',
              border: `1px solid ${cfg.api_key ? 'var(--paid)' : 'var(--border-soft)'}`,
              fontFamily: 'inherit',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            🔑 {cfg.api_key ? 'مفتاح API مخصص ✓' : 'إدخال API Key'}
          </button>
        </div>
      </div>

      {isCustom && (
        <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-subtle)' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)', display: 'block', marginBottom: '0.3rem' }}>
            أدخل اسم الموديل يدوياً (e.g. gemini-3.6-flash, gemini-pro, or fine-tuned model):
          </label>
          <input
            type="text"
            value={customModel}
            onChange={e => handleCustomModelChange(e.target.value)}
            placeholder="gemini-2.5-flash"
            style={{
              width: '100%',
              padding: '0.5rem 0.8rem',
              borderRadius: 6,
              background: 'var(--surface-3)',
              color: 'var(--text-1)',
              border: '1px solid var(--border-soft)',
              fontSize: '0.88rem'
            }}
          />
        </div>
      )}

      {showApiKey && (
        <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid var(--border-subtle)' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-3)', display: 'block', marginBottom: '0.3rem' }}>
            مفتاح API المخصص (Custom Gemini API Key) — اختياري:
          </label>
          <input
            type="password"
            value={cfg.api_key}
            onChange={e => handleApiKeyChange(e.target.value)}
            placeholder="AQ.Ab8... أو اتركه فارغاً لاستخدام المفتاح المدمج"
            style={{
              width: '100%',
              padding: '0.5rem 0.8rem',
              borderRadius: 6,
              background: 'var(--surface-3)',
              color: 'var(--text-1)',
              border: '1px solid var(--border-soft)',
              fontSize: '0.88rem'
            }}
          />
          <div style={{ fontSize: '0.74rem', color: 'var(--text-3)', marginTop: '0.25rem' }}>
            💡 يتم حفظ المفتاح والنموذج محلياً في متصفحك وسيتم استخدامه في جميع استدعاءات المطابقة والخطط.
          </div>
        </div>
      )}
    </Card>
  )
}
