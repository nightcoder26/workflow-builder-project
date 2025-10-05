import React, { useState } from 'react'
import { ConnectionsPanel } from './ConnectionsPanel'
import { NodePalette } from './NodePalette'
import { Menu } from 'lucide-react'

export const LeftSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <aside className={`${collapsed ? 'w-12' : 'w-1/4'} h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-200`}> 
      <div className="h-12 border-b border-slate-200 flex items-center justify-between px-2">
        <button className="p-2 hover:bg-slate-100 rounded" onClick={() => setCollapsed(!collapsed)}>
          <Menu className="w-5 h-5" />
        </button>
        {!collapsed && <span className="text-sm font-medium">Connections & Nodes</span>}
        <div className="w-8" />
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-4">
        <ConnectionsPanel collapsed={collapsed} />
        <NodePalette collapsed={collapsed} />
      </div>
    </aside>
  )
}
