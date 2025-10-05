import React, { useState } from 'react'

export const WorkflowHistoryDropdown: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <div onClick={() => setOpen(!open)}>{children}</div>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded shadow-card p-2 text-sm">
          <div className="px-2 py-1 text-slate-500">No previous versions</div>
        </div>
      )}
    </div>
  )
}
