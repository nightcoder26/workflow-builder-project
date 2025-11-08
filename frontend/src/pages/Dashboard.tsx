import React, { useEffect, useState } from 'react'
import { listWorkflows, deleteWorkflow } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Trash } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    setLoading(true)
    listWorkflows().then((r: any) => {
      if (!mounted) return
      setWorkflows(r.data || r.workflows || [])
    }).catch((err) => console.error('listWorkflows', err)).finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Delete this workflow? This action cannot be undone.')
    if (!ok) return
    try {
      setLoading(true)
      await deleteWorkflow(id)
      setWorkflows(wfs => wfs.filter(w => (w.id || w._id) !== id))
      alert('Workflow deleted')
    } catch (err: any) {
      console.error('deleteWorkflow', err)
      const msg = err?.message || String(err)
      if (/unauthorized|401/i.test(msg)) alert('Please log in to delete workflows.')
      else alert(`Failed to delete workflow: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Your Workflows</h2>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/workflow/new')}>Create New Workflow</Button>
          <Button variant="secondary" onClick={() => navigate('/settings')}>Account Settings</Button>
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="grid grid-cols-3 gap-4">
          {workflows.length === 0 ? (
            <div className="col-span-3 border p-6 text-center rounded">No workflows yet. Create your first workflow.</div>
          ) : workflows.map((w: any) => (
            <div key={w.id || w._id} className="border rounded p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{w.name}</div>
                  <div className="text-sm text-slate-500">Updated: {new Date(w.updatedAt).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button onClick={() => navigate(`/workflow/${w.id || w._id}`)} className="px-2 py-1 text-sm">Edit</Button>
                    <Button variant="ghost" onClick={() => handleDelete(w.id || w._id)} className="px-2 py-1 text-sm">
                      <Trash className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="text-sm text-slate-600">{w.isActive ? 'Active' : (w.isDraft ? 'Draft' : 'Saved')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Dashboard