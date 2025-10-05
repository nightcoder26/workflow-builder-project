import React, { useCallback, useEffect, useMemo, useState } from 'react'
import ReactFlow, { Background, Controls, MiniMap, useReactFlow } from 'reactflow'
import { useWorkflowStore } from '@/store/workflow'
import { NodeCard } from '@/nodes/NodeCard'
import './context-menu.css'

const nodeTypes = { appNode: NodeCard }

export const WorkflowCanvas: React.FC = () => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, onDrop, openConfig, deleteNode, undo, redo, insertConditionOnEdge } = useWorkflowStore()
  const rf = useReactFlow()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const bounds = (event.target as HTMLElement).getBoundingClientRect()
    const position = rf.project({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })
    onDrop(event, position)
  }, [rf, onDrop])

  const defaultEdgeOptions = useMemo(() => ({ type: 'smoothstep', animated: true as const }), [])

  useEffect(() => {
    const onEdit = (e: any) => openConfig(e.detail.id)
    const onDel = (e: any) => deleteNode(e.detail.id)
    window.addEventListener('edit-node', onEdit as any)
    window.addEventListener('delete-node', onDel as any)
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.shiftKey ? redo() : undo() }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { redo() }
    }
    window.addEventListener('keydown', keyHandler)
    return () => {
      window.removeEventListener('edit-node', onEdit as any)
      window.removeEventListener('delete-node', onDel as any)
      window.removeEventListener('keydown', keyHandler)
    }
  }, [openConfig, deleteNode, undo, redo])

  return (
    <div className="w-full h-full" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY }) }}>
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={(_, edge) => insertConditionOnEdge(edge.id)}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <MiniMap className="!bg-white !border !border-slate-200 !rounded" />
        <Controls className="!bg-white !border !border-slate-200 !rounded" />
        <Background />
      </ReactFlow>

      {menu && (
        <div className="rf-context-menu" style={{ left: menu.x, top: menu.y }} onMouseLeave={() => setMenu(null)}>
          <button onClick={() => setMenu(null)}>Add node here (open palette)</button>
          <button onClick={() => { rf.fitView(); setMenu(null) }}>Fit view</button>
          <button onClick={() => { rf.zoomIn(); setMenu(null) }}>Zoom in</button>
          <button onClick={() => { rf.zoomOut(); setMenu(null) }}>Zoom out</button>
          <button onClick={() => setMenu(null)}>Select all</button>
        </div>
      )}

      <div className="absolute left-2 bottom-2 bg-white border border-slate-200 rounded shadow-card px-2 py-1 text-xs">Zoom: {(rf.getZoom() * 100).toFixed(0)}%</div>
    </div>
  )
}
