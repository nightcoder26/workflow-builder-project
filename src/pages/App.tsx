import React, { useEffect } from 'react'
import { TopNav } from '@/components/TopNav'
import { LeftSidebar } from '@/components/Sidebar/LeftSidebar'
import { WorkflowCanvas } from '@/components/Canvas/WorkflowCanvas'
import { NodeConfigPanel } from '@/components/ConfigPanel/NodeConfigPanel'
import 'reactflow/dist/style.css'
import { ReactFlowProvider } from 'reactflow'
import { useWorkflowStore } from '@/store/workflow'

export const App: React.FC = () => {
  const saveWorkflow = useWorkflowStore(s => s.saveWorkflow)
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
