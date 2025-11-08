import React, { useState, useEffect } from 'react'
import { updateProfile, changePassword, authMe } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'

export default function Settings() {
  const { user, loadStatus } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [pwdLoading, setPwdLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => { setName(user?.name || '') }, [user])

  const saveProfile = async () => {
    setSaving(true)
    try {
      await updateProfile({ name })
      await loadStatus()
      alert('Profile updated')
    } catch (err: any) {
      alert('Failed to update profile: ' + (err?.message || err))
    } finally { setSaving(false) }
  }

  const savePassword = async () => {
    setPwdLoading(true)
    try {
      await changePassword({ currentPassword, newPassword })
      alert('Password changed')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err: any) {
      alert('Failed to change password: ' + (err?.message || err))
    } finally { setPwdLoading(false) }
  }

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
      <div className="mb-6">
        <label className="block text-sm text-slate-600">Name</label>
        <input className="mt-1 w-full border rounded px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
        <div className="mt-2">
          <Button onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</Button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Change Password</h3>
        <label className="block text-sm text-slate-600">Current Password</label>
        <input className="mt-1 w-full border rounded px-3 py-2" type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} />
        <label className="block text-sm text-slate-600 mt-2">New Password</label>
        <input className="mt-1 w-full border rounded px-3 py-2" type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} />
        <div className="mt-2">
          <Button onClick={savePassword} disabled={pwdLoading}>{pwdLoading ? 'Saving...' : 'Change Password'}</Button>
        </div>
      </div>
    </div>
  )
}
