import React, { useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { useNavigate, useLocation } from 'react-router-dom'

export const ProfileMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false)
  const logout = useAuthStore(s => s.logout)
  const navigate = useNavigate()

  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const location = useLocation()

  const handleLogout = async () => {
    // show confirmation UI first
    setConfirming(true)
  }

  const doLogout = async () => {
    setLoading(true)
    try {
      await logout()
    } catch (e) {
      // ignore errors
    } finally {
      setLoading(false)
      setConfirming(false)
      setOpen(false)
      // preserve return-to location so login can redirect back
      const returnTo = encodeURIComponent(location.pathname + (location.search || ''))
      navigate(`/login?returnTo=${returnTo}`)
    }
  }

  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>{children}</div>
      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded shadow-card p-3 text-sm">
          {!confirming ? (
            <>
              <button className={`w-full text-left px-2 py-1 rounded hover:bg-slate-100 ${loading ? 'opacity-60 pointer-events-none' : ''}`} onClick={() => { setOpen(false); navigate('/settings') }}>Settings</button>
              <button className={`w-full text-left px-2 py-1 rounded hover:bg-slate-100 ${loading ? 'opacity-60 pointer-events-none' : ''}`} onClick={() => { setOpen(false); navigate('/dashboard') }}>Connected accounts</button>
              <button className={`w-full text-left px-2 py-1 rounded hover:bg-slate-100 text-error ${loading ? 'opacity-60 pointer-events-none' : ''}`} onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <div className="space-y-2">
              <div className="text-sm">Are you sure you want to log out?</div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 rounded bg-slate-100" onClick={() => { if (!loading) { setConfirming(false) } }} disabled={loading}>Cancel</button>
                <button className="px-3 py-1 rounded bg-red-600 text-white flex items-center" onClick={doLogout} disabled={loading}>
                  {loading && <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />}
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
