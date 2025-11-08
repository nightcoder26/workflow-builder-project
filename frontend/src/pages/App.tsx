import React, { useEffect } from 'react'
import { TopNav } from '@/components/TopNav'
import { LeftSidebar } from '@/components/Sidebar/LeftSidebar'
import { WorkflowCanvas } from '@/components/Canvas/WorkflowCanvas'
import { NodeConfigPanel } from '@/components/ConfigPanel/NodeConfigPanel'
import 'reactflow/dist/style.css'
import { ReactFlowProvider } from 'reactflow'
import { useWorkflowStore } from '@/store/workflow'
import { useLocation } from 'react-router-dom'

export const App: React.FC = () => {
  const saveWorkflow = useWorkflowStore(s => s.saveWorkflow)
  const loadWorkflow = useWorkflowStore(s => s.loadWorkflow)
  const newWorkflow = useWorkflowStore(s => s.newWorkflow)
  const location = useLocation()

  // react to route changes: /workflow/new or /workflow/:id
  useEffect(() => {
    // handle paths:
    // /workflow or /workflow/          -> new workflow
    // /workflow/new                    -> new workflow
    // /workflow/:id                    -> load workflow by id
    const base = '/workflow'
    let rest = ''
    if (location.pathname === base || location.pathname === `${base}/`) {
      newWorkflow()
      return
    }
    if (location.pathname.startsWith(`${base}/`)) {
      rest = location.pathname.slice((`${base}/`).length).split('/')[0]
    }
    if (!rest) {
      newWorkflow()
      return
    }
    if (rest === 'new') {
      newWorkflow()
      return
    }
    loadWorkflow(rest).catch((err) => {
      console.warn('Failed to load workflow from URL:', err)
      newWorkflow()
    })
  }, [location.pathname, loadWorkflow, newWorkflow])
  useEffect(() => {
    const t = setInterval(() => saveWorkflow(), 30_000)
    return () => clearInterval(t)
  }, [saveWorkflow])
  return (
    <div className="min-h-screen bg-background text-slate-900">
      <TopNav />
      <div className="flex h-[calc(100vh-64px)]">
        <LeftSidebar />
        <main className="w-3/4 h-full border-l border-slate-200">
          <ReactFlowProvider>
            <WorkflowCanvas />
          </ReactFlowProvider>
        </main>
      </div>
      <NodeConfigPanel />
    </div>
  )
}

export default App
