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
    // { label: 'Polling interval', type: 'select', options: ['1', '5', '15', '30'] },
  ],
  'gmail.sendEmail': [
    { label: 'To', type: 'text', placeholder: 'recipient@example.com' },
    { label: 'Cc', type: 'text', placeholder: 'cc@example.com' },
    { label: 'Bcc', type: 'text', placeholder: 'bcc@example.com' },
    { label: 'Subject', type: 'text', placeholder: 'Subject line' },
    { label: 'Body', type: 'textarea', placeholder: 'Message body (supports variables {{...}})' },
  ],
  'gmail.createDraft': [
    { label: 'To', type: 'text', placeholder: 'recipient@example.com' },
    { label: 'Subject', type: 'text', placeholder: 'Subject line' },
    { label: 'Body', type: 'textarea', placeholder: 'Draft content (supports variables {{...}})' },
  ],
  'sheets.addRow': [
    { label: 'Spreadsheet', type: 'text', placeholder: 'Invoices' },
    { label: 'Worksheet', type: 'text', placeholder: 'Sheet1' },
  ],
  'sheets.newRow': [
    { label: 'Spreadsheet', type: 'text', placeholder: 'Invoices' },
    { label: 'Worksheet', type: 'text', placeholder: 'Sheet1' },
    // { label: 'Polling interval (sec)', type: 'select', options: ['15','30','60','300'] },
  ],
  'sheets.rowUpdated': [
    { label: 'Spreadsheet', type: 'text', placeholder: 'Invoices' },
    { label: 'Worksheet', type: 'text', placeholder: 'Sheet1' },
    { label: 'Watch columns (comma)', type: 'text', placeholder: 'A,B,C' },
  ],
  'sheets.updateRow': [
    { label: 'Spreadsheet', type: 'text', placeholder: 'Invoices' },
    { label: 'Worksheet', type: 'text', placeholder: 'Sheet1' },
    { label: 'Row number', type: 'text', placeholder: '2' },
    { label: 'Values (JSON or CSV)', type: 'textarea', placeholder: '{"A":"123","B":"456"}' },
  ],
  'sheets.clearRow': [
    { label: 'Spreadsheet', type: 'text', placeholder: 'Invoices' },
    { label: 'Worksheet', type: 'text', placeholder: 'Sheet1' },
    { label: 'Row number', type: 'text', placeholder: '2' },
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
  'gcal.newEvent': [
    { label: 'Calendar', type: 'text', placeholder: 'Primary' },
    { label: 'Title contains', type: 'text', placeholder: 'Keyword (optional)' },
  ],
  'gcal.deleteEvent': [
    { label: 'Calendar', type: 'text', placeholder: 'Primary' },
    { label: 'Event ID', type: 'text', placeholder: 'evt_123...' },
  ],
  'gcal.eventSoon': [
    { label: 'Calendar', type: 'text', placeholder: 'Primary' },
    { label: 'Lead time (minutes)', type: 'select', options: ['5', '10', '15', '30', '60'] },
  ],
  'gcal.updateEvent': [
    { label: 'Calendar', type: 'text', placeholder: 'Primary' },
    { label: 'Event ID', type: 'text', placeholder: 'evt_123...' },
    { label: 'Title', type: 'text', placeholder: 'Updated title' },
    { label: 'Start time', type: 'text', placeholder: '2025-10-01T10:00' },
    { label: 'End time', type: 'text', placeholder: '2025-10-01T11:00' },
    { label: 'Location', type: 'text', placeholder: 'Room 101 (optional)' },
  ],
  'gcal.findEvent': [
    { label: 'Calendar', type: 'text', placeholder: 'Primary' },
    { label: 'Query', type: 'text', placeholder: 'Title or keyword' },
    { label: 'Start after', type: 'text', placeholder: '2025-10-01T00:00 (optional)' },
    { label: 'End before', type: 'text', placeholder: '2025-10-31T23:59 (optional)' },
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
  // simple mapping by known labels
  if (name === 'New Email Received') return 'gmail.newEmail'
  if (name === 'Send Email') return 'gmail.sendEmail'
  if (name === 'Create Draft') return 'gmail.createDraft'

  if (name === 'Add Row') return 'sheets.addRow'
  if (name === 'New Row Added') return 'sheets.newRow'
  if (name === 'Row Updated') return 'sheets.rowUpdated'
  if (name === 'Update Row') return 'sheets.updateRow'
  if (name === 'Clear Row') return 'sheets.clearRow'

  if (name === 'Create Event') return 'gcal.createEvent'
  if (name === 'New Event Created') return 'gcal.newEvent'
  if (name.includes('Event Starting')) return 'gcal.eventSoon'
  if (name === 'Update Event') return 'gcal.updateEvent'
  if (name === 'Delete Event') return 'gcal.deleteEvent'
  if (name === 'Find Event') return 'gcal.findEvent'

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
