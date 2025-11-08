import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './pages/App'
import { Dashboard, Settings } from './pages'
import './styles.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AuthPage from './pages/AuthPage'
import { useAuthStore } from './store/auth'

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticated, loading, loadStatus } = useAuthStore()
  const [initialized, setInitialized] = React.useState(false)

  React.useEffect(() => {
  let mounted = true
  if (!authenticated) {
    loadStatus().finally(() => mounted && setInitialized(true))
  } else {
    setInitialized(true)
  }
  return () => { mounted = false }
}, [])


  if (!initialized || loading) return <div className="p-6 text-slate-600">Loading...</div>
  if (!authenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/workflow/*" element={<Protected><App /></Protected>} />
          <Route path="/settings" element={<Protected><Settings /></Protected>} />
          <Route path="/" element={<Protected><Navigate to="/dashboard" replace /></Protected>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
  </React.StrictMode>
)
