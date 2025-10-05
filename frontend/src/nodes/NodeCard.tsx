import React from 'react'
import { Handle, Position } from 'reactflow'
import { AppNodeData } from '@/types/nodes'
import { SERVICE_META } from './constants'
import { Pencil, X } from 'lucide-react'

export const NodeCard: React.FC<{ data: AppNodeData } & any> = ({ data }) => {
  const meta = SERVICE_META[data.service]
  const borderColor = data.configured ? 'border-success' : 'border-warning'

  return (
    <div className={`rounded-md shadow-card bg-white border ${borderColor} min-w-[220px]`}> 
      <div className="flex items-center gap-2 px-2 py-1 border-b">
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: meta.color, color: 'white' }}>
          <meta.Icon className="w-4 h-4" />
        </div>
        <div className="text-sm font-semibold flex-1 truncate">{data.name}</div>
        <span className={`text-[10px] px-2 py-0.5 rounded ${data.kind === 'trigger' ? 'bg-blue-100 text-blue-700' : data.kind === 'action' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{data.kind}</span>
      </div>
      <div className="p-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${data.configured ? 'bg-success' : 'bg-warning'}`} title={data.configured ? 'Configured' : 'Configuration needed'} />
          {data.status && <span className={`text-xs ${data.status==='error'?'text-error':data.status==='success'?'text-success':'text-slate-500'}`}>{data.status}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-slate-100 rounded" onClick={() => window.dispatchEvent(new CustomEvent('edit-node', { detail: { id: data.id } }))}>
            <Pencil className="w-4 h-4" />
          </button>
          <button className="p-1 hover:bg-slate-100 rounded" onClick={() => window.dispatchEvent(new CustomEvent('delete-node', { detail: { id: data.id } }))}>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {data.kind !== 'trigger' && (
        <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-slate-400" />
      )}
      {/* Right handle(s) */}
      {data.kind === 'special' && data.name.includes('Condition') ? (
        <>
          <Handle id="true" type="source" position={Position.Right} style={{ top: '35%' }} className="!w-2 !h-2 !bg-emerald-500" />
          <Handle id="false" type="source" position={Position.Right} style={{ top: '65%' }} className="!w-2 !h-2 !bg-red-500" />
        </>
      ) : (
        <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-slate-400" />
      )}
    </div>
  )
}
