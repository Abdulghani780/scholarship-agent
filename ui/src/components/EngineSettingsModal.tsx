import React, { useState, useEffect } from 'react'
import { Card, Button, Modal, Icon } from '../asaas-ui'
import { getSavedModelConfig, saveModelConfig } from '../api/client'

const MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (افتراضي - سريع ودقيق)' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (عالي الأداء)' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (مستقر)' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (تحليل استدلالي موسع)' },
  { id: 'custom', label: 'نموذج مخصص (إدخال يدوي)...' },
]

export default function EngineSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [cfg, setCfg] = useState(getSavedModelConfig())
  const [isCustom, setIsCustom] = useState(false)
  const [customModel, setCustomModel] = useState('')

  useEffect(() => {
    const saved = getSavedModelConfig()
    const found = MODELS.find(m => m.id === saved.model_name)
    if (!found && saved.model_name) {
      setIsCustom(true)
      setCustomModel(saved.model_name)
    }
  }, [isOpen])

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

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <Card style={{ maxWidth: 480, width: '100%', padding: '1.5rem', background: 'var(--surface-1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>
              إعدادات محرك التحليل والربط
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-3)' }}>
              تحديد نموذج الذكاء الاصطناعي ومفتاح الوصول (API Key)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-3)' }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.4rem' }}>
              النموذج المعتمد للتحليل:
            </label>
            <select
              value={isCustom ? 'custom' : cfg.model_name}
              onChange={e => handleModelChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: 6,
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-soft)',
                fontFamily: 'inherit',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#161b22', color: '#fff' }}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {isCustom && (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '0.3rem' }}>
                اسم النموذج المخصص (Custom Model Identifier):
              </label>
              <input
                type="text"
                value={customModel}
                onChange={e => handleCustomModelChange(e.target.value)}
                placeholder="e.g. gemini-2.5-flash"
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  borderRadius: 6,
                  background: 'var(--surface-3)',
                  color: 'var(--text-1)',
                  border: '1px solid var(--border-soft)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: '0.4rem' }}>
              مفتاح API الخاص (Custom API Key):
            </label>
            <input
              type="password"
              value={cfg.api_key}
              onChange={e => handleApiKeyChange(e.target.value)}
              placeholder="اتركه فارغاً للاعتماد على المفتاح النظامي المدمج"
              style={{
                width: '100%',
                padding: '0.55rem 0.8rem',
                borderRadius: 6,
                background: 'var(--surface-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--border-soft)',
                fontSize: '0.85rem'
              }}
            />
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.74rem', color: 'var(--text-3)' }}>
              يُحفظ المفتاح محلياً في جلسة المتصفح الخاصة بك ويُرسل مع طلبات المعالجة.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <Button variant="primary" onClick={onClose} style={{ padding: '0 1.25rem', height: 38, fontSize: '0.88rem' }}>
            حفظ وإغلاق
          </Button>
        </div>
      </Card>
    </div>
  )
}
