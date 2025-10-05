import React from 'react'
import { Play, Save, History, User, Workflow } from 'lucide-react'
import { useWorkflowStore } from '@/store/workflow'
import { Button } from '@/components/ui/button'
import { ProfileMenu } from '@/components/topbar/ProfileMenu'
import { WorkflowHistoryDropdown } from '@/components/topbar/WorkflowHistoryDropdown'

export const TopNav: React.FC = () => {
  const { workflowName, setWorkflowName, saveWorkflow, runTest, canSave, loadExampleWorkflow } = useWorkflowStore()

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
        <Button variant="ghost" onClick={() => {
          const id = window.prompt('Paste a Google Spreadsheet ID (leave blank to enter later)')
          loadExampleWorkflow(id && id.trim() ? id.trim() : undefined)
        }}>
          Example Workflow
        </Button>
        <Button disabled={!canSave()} onClick={saveWorkflow}>
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
