import React, { useState, useEffect } from 'react'
import { Modal, Button, Field, Select, TextInput } from '../asaas-ui'
import { getSavedModelConfig, saveModelConfig } from '../api/client'

const MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (افتراضي - سريع ومثالي للمطابقة)' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (أحدث إصدار فائق السرعة)' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (مستقر وموثوق)' },
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
    <Modal
      title="إعدادات محرك التحليل والربط"
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', gap: '0.75rem' }}>
          <Button variant="primary" onClick={onClose}>
            حفظ وإغلاق
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-3)', lineHeight: 1.6 }}>
          تحديد نموذج المعالجة المعتمد ومفتاح الوصول (API Key) للتحليل والمفاضلة وإعداد الخطط.
        </p>

        <Field label="النموذج المعتمد للتحليل:">
          {id => (
            <Select
              id={id}
              value={isCustom ? 'custom' : cfg.model_name}
              onChange={e => handleModelChange(e.target.value)}
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        {isCustom && (
          <Field label="معرف النموذج المخصص (Custom Model Identifier):" hint="مثال: gemini-2.5-flash أو gemini-1.5-pro">
            {id => (
              <TextInput
                id={id}
                type="text"
                value={customModel}
                onChange={e => handleCustomModelChange(e.target.value)}
                placeholder="gemini-2.5-flash"
              />
            )}
          </Field>
        )}

        <Field
          label="مفتاح API الخاص (Custom API Key):"
          hint="اتركه فارغاً للاعتماد على المفتاح النظامي المدمج في الخادم. يُحفظ محلياً في متصفحك."
        >
          {id => (
            <TextInput
              id={id}
              type="password"
              value={cfg.api_key}
              onChange={e => handleApiKeyChange(e.target.value)}
              placeholder="AIzaSy..."
            />
          )}
        </Field>
      </div>
    </Modal>
  )
}
