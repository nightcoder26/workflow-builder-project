import React from 'react'
import { Play, Save, History, User, Workflow } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflow'
import { Button } from '@/components/ui/button'
import { ProfileMenu } from '@/components/topbar/ProfileMenu'
import { WorkflowHistoryDropdown } from '@/components/topbar/WorkflowHistoryDropdown'
import { API_BASE } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useNavigate } from 'react-router-dom'

export const TopNav: React.FC = () => {
  const { workflowName, setWorkflowName, saveWorkflow, runTest, runTestBackend, canSave, loadExampleWorkflow } = useWorkflowStore()
  const nodes = useWorkflowStore(s => s.nodes)
  const isSaveEnabled = canSave()

  // compute a human-friendly reason when the Save button is disabled
  let saveDisabledReason: string | undefined
  if (!isSaveEnabled) {
    const triggers = nodes.filter(n => n.data.kind === 'trigger')
    if (triggers.length === 0) saveDisabledReason = 'Add one trigger node to enable saving.'
    else if (triggers.length > 1) saveDisabledReason = 'Only one trigger node is allowed; remove extra triggers to save.'
    else {
      const unconfigured = nodes.filter(n => !n.data.configured)
      if (unconfigured.length > 0) saveDisabledReason = `Configure ${unconfigured.length} node(s) before saving.`
      else saveDisabledReason = 'Workflow does not meet save requirements.'
    }
  }
  const { authenticated, user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="h-16 px-4 border-b border-slate-200 bg-white shadow-card flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Workflow className="w-6 h-6 text-primary" />
          <span className="font-semibold">Workflow Automation Platform</span>
        </div>
        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="ml-4 px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Untitled workflow"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={runTest}>
          <Play className="w-4 h-4 mr-2" /> Test Workflow
        </Button>
        <Button variant="secondary" onClick={runTestBackend}>
          <Play className="w-4 h-4 mr-2" /> Backend Test
        </Button>
        {!authenticated ? (
          <a href={`${API_BASE}/api/auth/google`}>
            <Button variant="ghost">Login with Google</Button>
          </a>
        ) : (
          <>
            <span className="text-sm text-slate-600">{user?.name || user?.email}</span>
            <Button variant="ghost" onClick={async ()=>{ await logout(); navigate('/login') }}>Logout</Button>
          </>
        )}
        <Button variant="ghost" onClick={() => {
          const id = window.prompt('Paste a Google Spreadsheet ID (leave blank to enter later)')
          loadExampleWorkflow(id && id.trim() ? id.trim() : undefined)
        }}>
          Example Workflow
        </Button>
        <Button disabled={!isSaveEnabled} onClick={saveWorkflow} title={saveDisabledReason}>
          <Save className="w-4 h-4 mr-2" /> Save Workflow
        </Button>
        <WorkflowHistoryDropdown>
          <Button variant="ghost">
            <History className="w-4 h-4 mr-2" /> History
          </Button>
        </WorkflowHistoryDropdown>
        <ProfileMenu>
          <Button variant="ghost">
            <User className="w-5 h-5" />
          </Button>
        </ProfileMenu>
      </div>
    </header>
  )
}
