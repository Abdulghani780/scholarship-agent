import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes, Link, useLocation } from 'react-router-dom'
import StudentsPage from './pages/StudentsPage'
import ScholarshipsPage from './pages/ScholarshipsPage'
import MatchPage from './pages/MatchPage'
import PlanPage from './pages/PlanPage'
import './index.css'

function Nav() {
  const { pathname } = useLocation()
  const links = [
    { to: '/', label: '🎓 الطلاب' },
    { to: '/scholarships', label: '📋 المنح' },
    { to: '/match', label: '🤖 المطابقة الذكية' },
    { to: '/plan', label: '📅 خطة التقديم' },
  ]
  return (
    <nav className="nav">
      <div className="nav-brand">🎓 وكيل المنح</div>
      <div className="nav-links">
        {links.map(l => (
          <Link key={l.to} to={l.to} className={pathname === l.to ? 'active' : ''}>{l.label}</Link>
        ))}
      </div>
    </nav>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Nav />
      <main className="main">
        <Routes>
          <Route path="/" element={<StudentsPage />} />
          <Route path="/scholarships" element={<ScholarshipsPage />} />
          <Route path="/match" element={<MatchPage />} />
          <Route path="/plan" element={<PlanPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  </React.StrictMode>
)
