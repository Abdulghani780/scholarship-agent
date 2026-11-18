import React, { useState, useEffect } from 'react'
import { Modal, Button, Field, Select, TextInput } from '../asaas-ui'
import { getSavedModelConfig, saveModelConfig } from '../api/client'

const MODELS = [
  { id: 'openrouter/free', label: '⚡ OpenRouter: الموجه التلقائي للنماذج المجانية (openrouter/free)' },
  { id: 'google/gemma-4-31b-it:free', label: '🏆 OpenRouter: جوجل جيما 31B المجاني (google/gemma-4-31b-it:free)' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: '🧠 OpenRouter: نيفيديا 550B العملاق المجاني (nemotron-3-ultra:free)' },
  { id: 'baidu/ernie-5.5-flash-preview:free', label: '🚀 OpenRouter: إيرني 5.5 فلاش المجاني (baidu/ernie-5.5-flash-preview:free)' },
  { id: 'gemini-2.5-flash', label: '💎 Google Gemini: 2.5 Flash (افتراضي النظام المدمج)' },
  { id: 'gemini-1.5-pro', label: '🔬 Google Gemini: 1.5 Pro (تحليل استدلالي عميق)' },
  { id: 'custom', label: '⚙️ نموذج مخصص (إدخال يدوي من OpenRouter أو Gemini)...' },
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
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.6 }}>
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
          <Field label="معرف النموذج المخصص (Model Identifier):" hint="مثال: meta-llama/llama-3.3-70b-instruct:free أو openrouter/free أو gemini-2.5-flash">
            {id => (
              <TextInput
                id={id}
                type="text"
                value={customModel}
                onChange={e => handleCustomModelChange(e.target.value)}
                placeholder="meta-llama/llama-3.3-70b-instruct:free"
              />
            )}
          </Field>
        )}

        <Field
          label="مفتاح API الخاص (Custom API Key):"
          hint="اتركه فارغاً للمفتاح النظامي المدمج، أو أدخل مفتاح OpenRouter (يبدأ بـ sk-or-...) أو Google Gemini. يُحفظ محلياً بأمان."
        >
          {id => (
            <TextInput
              id={id}
              type="password"
              value={cfg.api_key}
              onChange={e => handleApiKeyChange(e.target.value)}
              placeholder="sk-or-v1-... أو AIzaSy..."
            />
          )}
        </Field>
      </div>
    </Modal>
  )
}
