import React from 'react'
import { useWorkflowStore } from '@/store/workflow'
import { useForm } from 'react-hook-form'
import { SERVICE_META } from '@/nodes/constants'
import { Button } from '@/components/ui/button'

const FIELDS: Record<string, { label: string; type: 'text' | 'textarea' | 'checkbox' | 'select'; options?: string[]; placeholder?: string; help?: string }[]> = {
  'gmail.newEmail': [
    { label: 'Subject contains', type: 'text', placeholder: 'Invoice', help: 'Filter emails by subject substring' },
    { label: 'Sender email', type: 'text', placeholder: 'name@example.com' },
    { label: 'Has attachment', type: 'checkbox' },
    { label: 'Polling interval', type: 'select', options: ['1', '5', '15', '30'] },
  ],
  'sheets.addRow': [
    { label: 'Spreadsheet', type: 'text', placeholder: 'Invoices' },
    { label: 'Worksheet', type: 'text', placeholder: 'Sheet1' },
  ],
  'slack.sendMessage': [
    { label: 'Channel', type: 'text', placeholder: '#general' },
    { label: 'Message', type: 'textarea', placeholder: 'Text, supports variables {{...}}' },
  ],
  'gcal.createEvent': [
    { label: 'Calendar', type: 'text', placeholder: 'Primary' },
    { label: 'Title', type: 'text', placeholder: 'Event title' },
    { label: 'Start time', type: 'text', placeholder: '2025-10-01T10:00' },
    { label: 'End time', type: 'text', placeholder: '2025-10-01T11:00' },
  ],
  'special.delay': [
    { label: 'Duration (seconds)', type: 'text', placeholder: '60' },
  ],
  'special.condition': [
    { label: 'Variable', type: 'text', placeholder: '{{Gmail.Subject}}' },
    { label: 'Condition', type: 'select', options: ['equals', 'contains', 'greater than', 'less than'] },
    { label: 'Value', type: 'text', placeholder: 'invoice' },
  ],
  'special.transform': [
    { label: 'Input variable', type: 'text', placeholder: '{{Node.Var}}' },
    { label: 'Transformation', type: 'select', options: ['uppercase', 'lowercase', 'trim'] },
    { label: 'Output variable name', type: 'text', placeholder: 'Result' },
  ],
}

function fieldsForNodeName(name: string): keyof typeof FIELDS | undefined {
  const entry = Object.entries(FIELDS).find(([_, __]) => false)
  // simple mapping by known names
  if (name.includes('New Email')) return 'gmail.newEmail'
  if (name.includes('Add Row')) return 'sheets.addRow'
  if (name.includes('Send Message') && name.includes('Channel')) return 'slack.sendMessage'
  if (name.includes('Create Event')) return 'gcal.createEvent'
  if (name.includes('Delay')) return 'special.delay'
  if (name.includes('Condition')) return 'special.condition'
  if (name.includes('Transformer')) return 'special.transform'
  return undefined
}

export const NodeConfigPanel: React.FC = () => {
  const { nodes, configOpenId, closeConfig, saveNodeConfig } = useWorkflowStore()
  const node = nodes.find(n => n.id === configOpenId)
  const defaultValues = node?.data.config ?? {}
  const { register, handleSubmit } = useForm({ defaultValues })

  if (!node) return null
  const meta = SERVICE_META[node.data.service]
  const fields = fieldsForNodeName(node.data.name)

  const onSubmit = (values: any) => {
    saveNodeConfig(node.id, values)
  }

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-slate-200 shadow-card animate-slide-in">
      <div className="h-14 border-b flex items-center gap-2 px-4">
        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: meta.color, color: 'white' }}>
          <meta.Icon className="w-4 h-4" />
        </div>
        <div className="font-semibold text-sm flex-1">{node.data.name}</div>
        <button className="text-slate-500 hover:text-slate-700" onClick={closeConfig}>✕</button>
      </div>
      <form className="p-4 space-y-3 overflow-auto h-[calc(100%-56px-60px)]" onSubmit={handleSubmit(onSubmit)}>
        {fields ? (
          FIELDS[fields].map((f) => (
            <div key={f.label} className="space-y-1">
              <label className="text-sm font-medium">{f.label}</label>
              {f.type === 'text' && <input className="w-full border rounded px-2 py-1" placeholder={f.placeholder} {...register(f.label)} />}
              {f.type === 'textarea' && <textarea className="w-full border rounded px-2 py-1" rows={4} placeholder={f.placeholder} {...register(f.label)} />}
              {f.type === 'checkbox' && <input type="checkbox" className="w-4 h-4" {...register(f.label)} />}
              {f.type === 'select' && (
                <select className="w-full border rounded px-2 py-1" {...register(f.label)}>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {f.help && <p className="text-xs text-slate-500">{f.help}</p>}
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-500">No configurable fields for this node.</div>
        )}
      </form>
      <div className="h-14 border-t flex items-center justify-end gap-2 px-4">
        <Button variant="secondary" onClick={closeConfig}>Cancel</Button>
        <Button onClick={() => { /* could test config */ }}>Test</Button>
        <Button onClick={handleSubmit(onSubmit)}>Save</Button>
      </div>
    </div>
  )
}
