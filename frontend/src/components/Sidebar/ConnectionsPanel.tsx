import React, { useState } from 'react'
import { useWorkflowStore } from '@/store/workflow'
import { Button } from '@/components/ui/button'
import { Mail, FileSpreadsheet, Slack, Send, Calendar } from 'lucide-react'
import { connectionsStatus, API_BASE } from '@/lib/api'

export const ConnectionsPanel: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { connections, connectService, disconnectService, loadingService } = useWorkflowStore()
  const [open, setOpen] = useState(true)
  const [backendConn, setBackendConn] = useState<Record<string, boolean> | null>(null)

  React.useEffect(() => {
    connectionsStatus().then((r) => setBackendConn(r.data)).catch(() => setBackendConn(null))
  }, [])

  const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="border rounded-md shadow-card bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2"><span>{icon}</span><span className="font-medium text-sm">{title}</span></div>
        <span className="text-xs text-slate-500">{open ? 'Hide' : 'Show'}</span>
      </div>
      {open && <div className="p-3 space-y-3">{children}</div>}
    </div>
  )

  const Row: React.FC<{ name: string; service: keyof typeof connections; icon: React.ReactNode; color: string; extra?: React.ReactNode }> = ({ name, service, icon, color, extra }) => {
    const c = connections[service]
    return (
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center`} style={{ background: color, color: 'white' }}>{icon}</div>
          <div>
            <div className="text-sm font-medium">{name}</div>
            <div className="text-xs text-slate-500 h-4">{c.connected ? c.label : 'Not connected'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${c.connected ? 'bg-success' : 'bg-slate-300'}`} />
          {!c.connected ? (
            service === 'telegram' ? (
              <div className="flex items-center gap-2">
                <input className="border rounded px-2 py-1 text-sm" placeholder="Bot Token" />
                <Button disabled={!!loadingService} onClick={() => connectService(service)}>{loadingService === service ? 'Connecting...' : 'Connect'}</Button>
              </div>
            ) : (
              <Button disabled={!!loadingService} onClick={() => connectService(service)}>{loadingService === service ? 'Connecting...' : 'Connect'}</Button>
            )
          ) : (
            <Button variant="secondary" onClick={() => disconnectService(service)}>Disconnect</Button>
          )}
        </div>
        {extra}
      </div>
    )
  }

  if (collapsed) return null

  return (
    <>
    <Section title="Connected Accounts" icon={<span className="w-2 h-2 bg-primary rounded-full inline-block" />}> 
      <Row name="Gmail" service="gmail" icon={<Mail className="w-4 h-4" />} color="#EA4335" />
      <Row name="Google Sheets" service="sheets" icon={<FileSpreadsheet className="w-4 h-4" />} color="#34A853" />
      {/* <Row name="Slack" service="slack" icon={<Slack className="w-4 h-4" />} color="#4A154B" />
      <Row name="Telegram" service="telegram" icon={<Send className="w-4 h-4" />} color="#0088cc" extra={<a className="text-xs text-primary underline" href="#" onClick={(e)=>e.preventDefault()}>How to create a Telegram Bot</a>} /> */}
      <Row name="Google Calendar" service="gcal" icon={<Calendar className="w-4 h-4" />} color="#4285F4" />
    </Section>
    <div className="mt-4">
      <Section title="Backend Connections" icon={<span className="w-2 h-2 bg-emerald-500 rounded-full inline-block" />}> 
        {backendConn ? (
          <div className="space-y-2 text-sm">
            {/* <div className="flex items-center justify-between">
              <span>Gmail</span>
              <span className={`text-xs ${backendConn.gmail ? 'text-emerald-600' : 'text-slate-500'}`}>{backendConn.gmail ? 'connected' : 'not connected'}</span>
              <button className="text-primary underline text-xs" onClick={() => connectService('gmail')}>Connect</button>
            </div>
            <div className="flex items-center justify-between">
              <span>Google Sheets</span>
              <span className={`text-xs ${backendConn.googleSheets ? 'text-emerald-600' : 'text-slate-500'}`}>{backendConn.googleSheets ? 'connected' : 'not connected'}</span>
              <button className="text-primary underline text-xs" onClick={() => connectService('sheets')}>Connect</button>
            </div>
            <div className="flex items-center justify-between">
              <span>Google Calendar</span>
              <span className={`text-xs ${backendConn.googleCalendar ? 'text-emerald-600' : 'text-slate-500'}`}>{backendConn.googleCalendar ? 'connected' : 'not connected'}</span>
              <button className="text-primary underline text-xs" onClick={() => connectService('gcal')}>Connect</button>
            </div>
            <div className="flex items-center justify-between">
              <span>Slack</span>
              <span className={`text-xs ${backendConn.slack ? 'text-emerald-600' : 'text-slate-500'}`}>{backendConn.slack ? 'connected' : 'not connected'}</span>
              <button className="text-primary underline text-xs" onClick={() => connectService('slack')}>Connect</button>
            </div> */}
          </div>
        ) : (
          <div className="text-xs text-slate-500">Not signed in or unable to fetch connections status.</div>
        )}
      </Section>
    </div>
    </>
  )
}
