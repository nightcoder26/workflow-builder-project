import { create } from 'zustand'
import { authLogin, authLogout, authRegister, getAuthStatus } from '@/lib/api'

export type AuthState = {
  loading: boolean
  user: any | null
  authenticated: boolean
  error?: string
  loadStatus: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  loading: false,
  user: null,
  authenticated: false,
  error: undefined,

  loadStatus: async () => {
    console.log('[AuthStore] loadStatus triggered. Token:', localStorage.getItem('token'))
    try {
      set({ loading: true })
      const r = await getAuthStatus()
      console.log('[AuthStore] loadStatus response:', r)
      set({
        authenticated: !!r.authenticated,
        user: r.user || null,
        error: undefined,
      })
    } catch (e: any) {
      console.error('[AuthStore] loadStatus error:', e)
      set({ authenticated: false, user: null, error: e?.message })
    } finally {
      set({ loading: false })
    }
  },

  register: async (email, password, name) => {
    console.log('[AuthStore] register called')
    set({ loading: true, error: undefined })
    try {
      const res = await authRegister({ email, password, name })
      console.log('[AuthStore] register response:', res)
      localStorage.setItem('token', res.token)
      await useAuthStore.getState().loadStatus()
    } catch (e: any) {
      set({ error: e?.message || 'Registration failed' })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  login: async (email, password) => {
    console.log('[AuthStore] login called')
    set({ loading: true, error: undefined })
    try {
      const res = await authLogin({ email, password })
      console.log('[AuthStore] login response:', res)
      localStorage.setItem('token', res.token)
      await useAuthStore.getState().loadStatus()
    } catch (e: any) {
      console.error('[AuthStore] login error:', e)
      set({ error: e?.message || 'Login failed' })
      throw e
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    console.log('[AuthStore] logout called')
    set({ loading: true, error: undefined })
    try {
      await authLogout()
      localStorage.removeItem('token')
      set({ authenticated: false, user: null })
    } catch (e: any) {
      set({ error: e?.message || 'Logout failed' })
    } finally {
      set({ loading: false })
    }
  },
}))
