import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes, NavLink, Link, useLocation } from 'react-router-dom'
import { Ambient, ToastProvider, SiteHeader, useTheme, Swash, TabBar, Icon } from './asaas-ui'
import './asaas-ui/styles/index.css'

import StudentsPage from './pages/StudentsPage'
import ScholarshipsPage from './pages/ScholarshipsPage'
import MatchPage from './pages/MatchPage'
import PlanPage from './pages/PlanPage'
import ModelSelectorBar from './components/ModelSelectorBar'

function ThemeButton() {
  const [theme, toggleTheme] = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'التحويل للمظهر الفاتح' : 'التحويل للمظهر الداكن'}
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border-soft)',
        borderRadius: '50%',
        width: 38,
        height: 38,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1.1rem',
        color: 'var(--text-1)',
        transition: 'transform 0.15s ease'
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}

function AppLayout() {
  const { pathname } = useLocation()

  const navLinks = (
    <>
      <NavLink to="/" end className={({ isActive }) => `asaas-nav-link ${isActive ? 'active' : ''}`}>
        🎓 الطلاب
      </NavLink>
      <NavLink to="/scholarships" className={({ isActive }) => `asaas-nav-link ${isActive ? 'active' : ''}`}>
        📋 المنح المتاحة
      </NavLink>
      <NavLink to="/match" className={({ isActive }) => `asaas-nav-link ${isActive ? 'active' : ''}`}>
        🤖 المطابقة الذكية
      </NavLink>
      <NavLink to="/plan" className={({ isActive }) => `asaas-nav-link ${isActive ? 'active' : ''}`}>
        📅 خطة التقديم
      </NavLink>
    </>
  )

  const brand = (
    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
      <img src="/logo-dark.png" alt="أساس" style={{ height: 32, width: 'auto' }} />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
          وكيل المنح الدراسية <Swash>الذكي</Swash>
        </span>
        <span style={{ fontSize: '0.7rem', color: 'var(--gold, #d29922)', fontWeight: 600 }}>
          ASAAS AI Intelligence
        </span>
      </div>
    </Link>
  )

  return (
    <div className="asaas-app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader
        brand={brand}
        nav={navLinks}
        actions={<ThemeButton />}
      />

      <main className="container" style={{ flex: 1, padding: '2rem 1.5rem 5rem', maxWidth: 1180, margin: '0 auto', width: '100%' }}>
        <ModelSelectorBar />

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
          <span>المطابقة</span>
        </NavLink>
        <NavLink to="/plan" className="tabbar-link">
          <Icon name="calendar" />
          <span>الخطة</span>
        </NavLink>
      </TabBar>
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
