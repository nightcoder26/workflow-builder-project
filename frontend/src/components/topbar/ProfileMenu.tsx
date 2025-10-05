import React, { useState } from 'react'

export const ProfileMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>{children}</div>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded shadow-card p-2 text-sm">
          <button className="w-full text-left px-2 py-1 rounded hover:bg-slate-100">Connected accounts</button>
          <button className="w-full text-left px-2 py-1 rounded hover:bg-slate-100">Settings</button>
          <button className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 text-error">Logout</button>
        </div>
      )}
    </div>
  )
}
