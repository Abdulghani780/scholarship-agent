import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes, NavLink, Link } from 'react-router-dom'
import { Ambient, ToastProvider, SiteHeader, useTheme, Swash, TabBar, Icon, AssistantWidget, type AssistantConfig } from './asaas-ui'
import './asaas-ui/styles/index.css'

import StudentsPage from './pages/StudentsPage'
import ScholarshipsPage from './pages/ScholarshipsPage'
import MatchPage from './pages/MatchPage'
import PlanPage from './pages/PlanPage'
import EngineSettingsModal from './components/EngineSettingsModal'
import { getSavedModelConfig, chatWithAssistant, getStudents } from './api/client'

function HeaderActions({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [theme, toggleTheme] = useTheme()
  const cfg = getSavedModelConfig()
  const shortModel = cfg.model_name.replace('gemini-', '')

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <button
        type="button"
        onClick={onOpenSettings}
        title="إعدادات محرك التحليل والـ API"
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-soft)',
          borderRadius: 8,
          height: 36,
          padding: '0 0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          cursor: 'pointer',
          fontSize: '0.82rem',
          color: 'var(--text-2)',
          fontFamily: 'inherit',
          transition: 'border-color 0.15s ease'
        }}
      >
        <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{shortModel}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>إعدادات الربط</span>
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'التحويل للمظهر الفاتح' : 'التحويل للمظهر الداكن'}
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border-soft)',
          borderRadius: '50%',
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-1)'
        }}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} width={17} height={17} />
      </button>
    </div>
  )
}

function AppLayout() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    try {
      return localStorage.getItem('asaas_active_student_id') || ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    getStudents().then(list => {
      setStudents(list)
      if (list.length > 0 && !activeStudentId) {
        setActiveStudentId(list[0].id)
        try { localStorage.setItem('asaas_active_student_id', list[0].id) } catch {}
      }
    }).catch(() => {})
  }, [])

  function handleSelectStudent(id: string) {
    setActiveStudentId(id)
    try { localStorage.setItem('asaas_active_student_id', id) } catch {}
  }

  const activeStudent = students.find(s => s.id === activeStudentId) || students[0]

  const assistantConfig: AssistantConfig = {
    title: 'المستشار الأكاديمي الذكي',
    subtitle: activeStudent ? `${activeStudent.name} (${activeStudent.major})` : 'وكيل التقييم والمطابقة الاستراتيجي',
    user: {
      id: activeStudent ? activeStudent.id : 'student-session',
      displayName: activeStudent ? activeStudent.name : 'طالب المنح'
    },
    intro: activeStudent
      ? `أهلاً بك يا ${activeStudent.name}! تم تحميل ملفك الأكاديمي بمعدل (${activeStudent.gpa}/4.00) وتخصص (${activeStudent.major}). يمكنك استشارتي في أي وقت لمطابقة ملفك مع المنح أو إعداد خطتك الدراسية.`
      : 'أهلاً بك! أنا مستشارك الأكاديمي الذكي. يمكنني تحليل مؤهلاتك، فحص شروط أي منحة، واقتراح خطة قبول وتفعيل البحث الخارجي لملفك.',
    placeholder: 'اسأل عن أي منحة، متطلبات القبول، أو خطة تقديمك...',
    students: students.map(s => ({ id: s.id, name: s.name, major: s.major, gpa: s.gpa })),
    activeStudentId: activeStudent?.id,
    onSelectStudent: handleSelectStudent,
    suggestions: activeStudent ? [
      `هل يؤهلني معدلي (${activeStudent.gpa}) للتقديم على منحة DAAD؟`,
      `ما هي أفضل المنح المتوافقة مع تخصص ${activeStudent.major}؟`,
      'كيف أسد الفجوات التنافسية في ملفي لزيادة فرص قبولي؟',
      'ابحث لي عن منح إضافية ممولة بالكامل تناسب ملفي',
    ] : [
      'ما هي أفضل منحة تناسب تخصص الذكاء الاصطناعي؟',
      'كيف أسد الفجوات التنافسية لزيادة فرص قبولي في DAAD؟',
      'ما هي المستندات الأساسية للتقديم على منحة تشيفنينغ؟',
      'ابحث لي عن منح ممولة بالكامل للدراسات العليا',
    ],
    ask: async (messages) => {
      const res = await chatWithAssistant(messages, activeStudent?.id)
      return { reply: res.reply }
    },
  }

  const navLinks = (
    <>
      <NavLink to="/" end className={({ isActive }) => `asaas-nav-link ${isActive ? 'active' : ''}`}>
        ملفات الطلاب
      </NavLink>
      <NavLink to="/scholarships" className={({ isActive }) => `asaas-nav-link ${isActive ? 'active' : ''}`}>
        دليل المنح
      </NavLink>
      <NavLink to="/match" className={({ isActive }) => `asaas-nav-link ${isActive ? 'active' : ''}`}>
        المفاضلة والقبول
      </NavLink>
      <NavLink to="/plan" className={({ isActive }) => `asaas-nav-link ${isActive ? 'active' : ''}`}>
        خطة التقديم
      </NavLink>
    </>
  )

  const brand = (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
      <img src="/logo-dark.png" alt="أساس" style={{ height: 28, width: 'auto' }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
          بوابة المنح الدراسية <Swash>المعتمدة</Swash>
        </span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 500 }}>
          نظام تقييم ومفاضلة القبول الأكاديمي
        </span>
      </div>
    </Link>
  )

  return (
    <div className="asaas-app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader
        brand={brand}
        nav={navLinks}
        actions={<HeaderActions onOpenSettings={() => setIsSettingsOpen(true)} />}
      />

      <main className="container" style={{ flex: 1, padding: '2rem 1.5rem 5rem', maxWidth: 1140, margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<StudentsPage />} />
          <Route path="/scholarships" element={<ScholarshipsPage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/plan" element={<PlanPage />} />
        </Routes>
      </main>

      <TabBar>
        <NavLink to="/" end className="tabbar-link">
          <Icon name="users" />
          <span>الطلاب</span>
        </NavLink>
        <NavLink to="/scholarships" className="tabbar-link">
          <Icon name="receipt" />
          <span>المنح</span>
        </NavLink>
        <NavLink to="/match" className="tabbar-link">
          <Icon name="sparkle" />
          <span>المفاضلة</span>
        </NavLink>
        <NavLink to="/plan" className="tabbar-link">
          <Icon name="calendar" />
          <span>الخطة</span>
        </NavLink>
      </TabBar>

      <AssistantWidget {...assistantConfig} />
      <EngineSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <Ambient />
        <AppLayout />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
)
