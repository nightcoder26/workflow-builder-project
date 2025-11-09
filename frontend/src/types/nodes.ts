import { Node, Edge } from 'reactflow'

export type Service = 'gmail' | 'sheets' | 'slack' | 'telegram' | 'gcal' | 'special'
export type NodeKind = 'trigger' | 'action' | 'special'

export type NodeConfig = Record<string, any>

export type AppNodeData = {
  id: string
  service: Service
  kind: NodeKind
  name: string
  configured: boolean
  status?: 'idle' | 'running' | 'success' ,
  
  startedAt?: number
  durationMs?: number
  config: NodeConfig
}

export type WorkflowState = {
  nodes: Node<AppNodeData>[]
  edges: Edge[]
}
