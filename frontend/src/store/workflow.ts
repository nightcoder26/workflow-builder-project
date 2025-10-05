import { create } from 'zustand'
import { Edge, Node, applyEdgeChanges, applyNodeChanges, Connection, MarkerType } from 'reactflow'
import { AppNodeData, Service } from '@/types/nodes'
import { SERVICE_META } from '@/nodes/constants'

export type ConnectionState = {
  connected: boolean
  label?: string
}

type Connections = Record<Service, ConnectionState & { token?: string }>

type HistoryItem = { nodes: Node<AppNodeData>[]; edges: Edge[] }

type DragPayload = { type: string; service: Service }

const initialConnections: Connections = {
  gmail: { connected: false },
  sheets: { connected: false },
  slack: { connected: false },
  telegram: { connected: false },
  gcal: { connected: false },
  special: { connected: true },
}

type Store = {
  nodes: Node<AppNodeData>[]
  edges: Edge[]
  connections: Connections
  loadingService?: Service
  configOpenId?: string
  workflowName: string
  history: HistoryItem[]
  future: HistoryItem[]
  startDragNode: (e: React.DragEvent, payload: DragPayload) => void
  onDrop: (evt: React.DragEvent, pos: { x: number; y: number }) => void
  onNodesChange: (changes: any) => void
  onEdgesChange: (changes: any) => void
  onConnect: (connection: Connection) => void
  insertConditionOnEdge: (edgeId: string) => void
  openConfig: (id: string) => void
  closeConfig: () => void
  saveNodeConfig: (id: string, config: Record<string, any>) => void
  deleteNode: (id: string) => void
  connectService: (service: Service) => Promise<void>
  disconnectService: (service: Service) => void
  setWorkflowName: (name: string) => void
  saveWorkflow: () => void
  runTest: () => Promise<void>
  loadExampleWorkflow: (spreadsheetId?: string) => void
  canSave: () => boolean
  undo: () => void
  redo: () => void
}

function snapshot(state: Store): HistoryItem {
  return { nodes: JSON.parse(JSON.stringify(state.nodes)), edges: JSON.parse(JSON.stringify(state.edges)) }
}

function pushHistory(set: any) {
  set((s: Store) => ({ history: [...s.history, snapshot(s)], future: [] }))
}

function parseNodeLabel(type: string): { name: string; kind: 'trigger'|'action'|'special' } {
  if (type.includes('new') || type.includes('labelEmail') || type.includes('rowUpdated') || type.includes('eventSoon')) return { name: labelFromType(type), kind: 'trigger' }
  if (type.startsWith('special')) return { name: labelFromType(type), kind: 'special' }
  return { name: labelFromType(type), kind: 'action' }
}

function labelFromType(type: string) {
  const map: Record<string, string> = {
    'gmail.newEmail': 'New Email Received',
    'gmail.labelEmail': 'Specific Label Email',
    'gmail.sendEmail': 'Send Email',
    'gmail.createDraft': 'Create Draft',
    'gmail.reply': 'Reply to Email',
    'sheets.newRow': 'New Row Added',
    'sheets.rowUpdated': 'Row Updated',
    'sheets.addRow': 'Add Row',
    'sheets.updateRow': 'Update Row',
    'sheets.findRow': 'Find Row',
    'sheets.clearRow': 'Clear Row',
    'slack.newMessage': 'New Message in Channel',
    'slack.newDm': 'New Direct Message',
    'slack.sendMessage': 'Send Message to Channel',
    'slack.sendDm': 'Send Direct Message',
    'slack.createChannel': 'Create Channel',
    'slack.addReaction': 'Add Reaction to Message',
    'telegram.newMessage': 'New Message Received',
    'telegram.sendMessage': 'Send Message',
    'telegram.sendPhoto': 'Send Photo',
    'telegram.sendDocument': 'Send Document',
    'telegram.reply': 'Reply to Message',
    'gcal.newEvent': 'New Event Created',
    'gcal.eventSoon': 'Event Starting Soon',
    'gcal.createEvent': 'Create Event',
    'gcal.updateEvent': 'Update Event',
    'gcal.deleteEvent': 'Delete Event',
    'gcal.findEvent': 'Find Event',
    'special.delay': 'Delay',
    'special.condition': 'Condition / Filter',
    'special.transform': 'Data Transformer',
  }
  return map[type] ?? type
}

const sampleNodes: Node<AppNodeData>[] = [
  {
    id: 'n1',
    type: 'appNode',
    position: { x: 120, y: 140 },
    data: {
      id: 'n1',
      service: 'gmail',
      kind: 'trigger',
      name: 'New Email Received',
      configured: true,
      // trigger: look for subject containing 'test'
      config: { subject: 'test', sinceMs: 0 }
    }
  },
  {
    id: 'n2',
    type: 'appNode',
    position: { x: 520, y: 140 },
    data: {
      id: 'n2',
      service: 'sheets',
      kind: 'action',
      name: 'Add Row',
      configured: true,
      // action: write to spreadsheet named 'test' (for demo you can use spreadsheetId instead)
      config: { spreadsheet: 'test', worksheet: 'Sheet1', rowNumber: 2 }
    }
  }
]

const sampleEdges: Edge[] = [
  { id: 'e1-2', source: 'n1', target: 'n2', style: { stroke: SERVICE_META.gmail.color }, markerEnd: { type: MarkerType.ArrowClosed } },
]

export const useWorkflowStore = create<Store>((set, get) => ({
  nodes: sampleNodes,
  edges: sampleEdges,
  connections: initialConnections,
  workflowName: 'Sample: Invoice Processing',
  history: [],
  future: [],

  startDragNode: (e, payload) => {
    e.dataTransfer.setData('application/node', JSON.stringify(payload))
  },

  onDrop: (evt, pos) => {
    const data = evt.dataTransfer.getData('application/node')
    if (!data) return
    const payload = JSON.parse(data) as DragPayload
    const id = `n${Date.now()}`
    const meta = SERVICE_META[payload.service]
    const label = parseNodeLabel(payload.type)
    const node: Node<AppNodeData> = {
      id,
      type: 'appNode',
      position: pos,
      data: { id, service: payload.service, kind: label.kind, name: label.name, configured: label.kind === 'trigger' ? true : false, config: {} }
    }
    pushHistory(set)
    set((s) => ({ nodes: [...s.nodes, node] }))
  },

  onNodesChange: (changes) => {
    pushHistory(set)
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) }))
  },

  onEdgesChange: (changes) => {
    pushHistory(set)
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }))
  },

  onConnect: (connection) => {
    const source = get().nodes.find(n => n.id === connection.source)
    const color = source ? SERVICE_META[source.data.service].color : '#94a3b8'
    pushHistory(set)
    set((s) => ({ edges: [...s.edges, { ...connection, id: `${connection.source}-${connection.target}-${Date.now()}`, style: { stroke: color }, markerEnd: { type: MarkerType.ArrowClosed } }] as Edge[] }))
  },

  insertConditionOnEdge: (edgeId) => {
    const { edges, nodes } = get()
    const edge = edges.find(e => e.id === edgeId)
    if (!edge) return
    const id = `n${Date.now()}`
    const conditionNode: Node<AppNodeData> = {
      id,
      type: 'appNode',
      position: { x: 0, y: 0 },
      data: { id, service: 'special', kind: 'special', name: 'Condition / Filter', configured: false, config: {} }
    }
    // place node midway between source and target
    const src = nodes.find(n => n.id === edge.source)
    const tgt = nodes.find(n => n.id === edge.target)
    if (src && tgt) {
      conditionNode.position = { x: (src.position.x + tgt.position.x) / 2, y: (src.position.y + tgt.position.y) / 2 }
    }
    const newEdges: Edge[] = edges.filter(e => e.id !== edgeId)
    newEdges.push({ id: `${edge.source}-${id}`, source: edge.source!, target: id, markerEnd: { type: MarkerType.ArrowClosed } })
    newEdges.push({ id: `${id}-${edge.target}`, source: id, target: edge.target!, markerEnd: { type: MarkerType.ArrowClosed } })
    pushHistory(set)
    set((s) => ({ nodes: [...s.nodes, conditionNode], edges: newEdges }))
  },

  openConfig: (id) => set({ configOpenId: id }),
  closeConfig: () => set({ configOpenId: undefined }),

  saveNodeConfig: (id, config) => {
    set((s) => ({ nodes: s.nodes.map(n => n.id === id ? { ...n, data: { ...n.data, config, configured: true } } : n), configOpenId: undefined }))
  },

  deleteNode: (id) => {
    pushHistory(set)
    set((s) => ({ nodes: s.nodes.filter(n => n.id !== id), edges: s.edges.filter(e => e.source !== id && e.target !== id) }))
  },

  connectService: async (service) => {
    if (service === 'special') return
    set({ loadingService: service })
    // Simulate popup OAuth and completion
    await new Promise(res => setTimeout(res, 1200))
    set((s) => ({ connections: { ...s.connections, [service]: { connected: true, label: `${service}@example.com` } }, loadingService: undefined }))
  },

  disconnectService: (service) => set((s) => ({ connections: { ...s.connections, [service]: { connected: false } } })),

  setWorkflowName: (name) => set({ workflowName: name }),

  saveWorkflow: () => {
    const { nodes, edges, workflowName } = get()
    const payload = { savedAt: Date.now(), nodes, edges, workflowName }
    const key = 'workflow:last'
    localStorage.setItem(key, JSON.stringify(payload))
    pushHistory(set)
  },

  loadExampleWorkflow: (spreadsheetId?: string) => {
    const n1: Node<AppNodeData> = {
      id: 'ex-gmail',
      type: 'appNode',
      position: { x: 120, y: 140 },
      data: { id: 'ex-gmail', service: 'gmail', kind: 'trigger', name: 'New Email Received', configured: true, config: { subject: 'test', sinceMs: 0 } }
    }
    const n2: Node<AppNodeData> = {
      id: 'ex-sheets',
      type: 'appNode',
      position: { x: 520, y: 140 },
      data: { id: 'ex-sheets', service: 'sheets', kind: 'action', name: 'Add Row', configured: !!spreadsheetId, config: { spreadsheetId: spreadsheetId || '', sheetName: 'Sheet1', rowNumber: 2, values: ['{{Gmail.subject}}','{{Gmail.from}}','{{Gmail.date}}'] } }
    }
    const e: Edge[] = [{ id: 'ex-e1', source: 'ex-gmail', target: 'ex-sheets', style: { stroke: SERVICE_META.gmail.color }, markerEnd: { type: MarkerType.ArrowClosed } }]
    pushHistory(set)
    set(() => ({ nodes: [n1, n2], edges: e }))
    // if spreadsheetId wasn't provided, open config for the sheets node so user can paste it
    if (!spreadsheetId) set({ configOpenId: 'ex-sheets' })
  },

  runTest: async () => {
    const { nodes, edges } = get()
    const outputs: Record<string, any> = {}

    for (const n of nodes) {
      set((s) => ({ nodes: s.nodes.map(x => x.id === n.id ? { ...x, data: { ...x.data, status: 'running', startedAt: Date.now() } } : x) }))

      try {
        if (n.data.service === 'gmail' && n.data.kind === 'trigger') {
          const sinceMs = Number(n.data.config?.sinceMs ?? 0)
          const url = `http://localhost:4000/api/emails/updates?sinceMs=${sinceMs}`
          const resp = await fetch(url)
          if (!resp.ok) throw new Error(`Gmail API error ${resp.status}`)
          const json = await resp.json()
          const messages = json.messages ?? []

          // apply subject filter from node config (case-insensitive)
          const subjFilter = String(n.data.config?.subject || '').trim().toLowerCase()
          const matched = subjFilter ? messages.filter((m: any) => String(m.subject || '').toLowerCase().includes(subjFilter)) : messages

          outputs[n.id] = matched

          const durationMs = 100 + Math.round(Math.random() * 300)
          set((s) => ({ nodes: s.nodes.map(x => x.id === n.id ? { ...x, data: { ...x.data, status: 'success', durationMs, configMatchCount: matched.length } } : x) }))
          if (matched.length === 0) {
            // no matching emails found — mark as success but downstream nodes should be skipped
            // add a short delay to make UX visible
            await new Promise(res => setTimeout(res, 200))
            continue
          }

        } else if (n.data.service === 'sheets' && n.data.name && n.data.name.toLowerCase().includes('add row')) {
          const incoming = edges.filter(e => e.target === n.id).map(e => e.source)
          let values: any[] = []
          if (incoming.length > 0) {
            const srcOut = outputs[incoming[0]]
            if (Array.isArray(srcOut) && srcOut.length > 0) {
              const m = srcOut[srcOut.length - 1]
              values = [m.subject || m.snippet || '', m.from || '', m.date || '']
            }
          }
          if (values.length === 0) {
            if (Array.isArray(n.data.config?.values) && n.data.config.values.length) values = n.data.config.values
            else values = ['(no-data)']
          }

          const sheetIdRaw = n.data.config?.spreadsheetId || n.data.config?.spreadsheet || n.data.config?.spreadsheetName
          const sheetName = n.data.config?.worksheet || n.data.config?.sheetName || 'Sheet1'

          // Basic validation: Google spreadsheetId is long (usually > 20 chars) and contains no spaces.
          if (!sheetIdRaw || typeof sheetIdRaw !== 'string' || sheetIdRaw.length < 20 || /\s/.test(sheetIdRaw)) {
            const hint = `Invalid spreadsheet identifier "${sheetIdRaw}". Please use the spreadsheetId (the long id in the sheet URL) or update the backend to resolve by name.`
            set((s) => ({ nodes: s.nodes.map(x => x.id === n.id ? { ...x, data: { ...x.data, status: 'error', error: hint } } : x) }))
            continue
          }

          const body = {
            spreadsheetId: sheetIdRaw,
            sheetName,
            rowNumber: n.data.config?.rowNumber || 2,
            values,
          }

          const resp = await fetch('http://localhost:4000/api/sheets/update-row', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
          })
          if (!resp.ok) {
            const text = await resp.text()
            throw new Error(`Sheets API error ${resp.status}: ${text}`)
          }
          const json = await resp.json()
          outputs[n.id] = json
          const durationMs = 120 + Math.round(Math.random() * 400)
          set((s) => ({ nodes: s.nodes.map(x => x.id === n.id ? { ...x, data: { ...x.data, status: 'success', durationMs } } : x) }))

        } else {
          await new Promise(res => setTimeout(res, 200))
          outputs[n.id] = { ok: true }
          const durationMs = 80 + Math.round(Math.random() * 200)
          set((s) => ({ nodes: s.nodes.map(x => x.id === n.id ? { ...x, data: { ...x.data, status: 'success', durationMs } } : x) }))
        }
      } catch (err: any) {
        const message = String(err?.message ?? err)
        set((s) => ({ nodes: s.nodes.map(x => x.id === n.id ? { ...x, data: { ...x.data, status: 'error', error: message } } : x) }))
      }
    }
  },

  canSave: () => {
    const { nodes } = get()
    const triggers = nodes.filter(n => n.data.kind === 'trigger')
    if (triggers.length !== 1) return false
    return nodes.every(n => n.data.configured)
  },

  undo: () => {
    set((s) => {
      if (s.history.length === 0) return s
      const prev = s.history[s.history.length - 1]
      const future = [{ nodes: s.nodes, edges: s.edges }, ...s.future]
      return { nodes: prev.nodes, edges: prev.edges, history: s.history.slice(0, -1), future }
    })
  },

  redo: () => {
    set((s) => {
      if (s.future.length === 0) return s
      const next = s.future[0]
      const history = [...s.history, { nodes: s.nodes, edges: s.edges }]
      return { nodes: next.nodes, edges: next.edges, future: s.future.slice(1), history }
    })
  },
}))
