import React, { useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { API_BASE } from '@/lib/api'
import { useNavigate } from 'react-router-dom'

export const AuthPage: React.FC = () => {
  const { loading, error, authenticated, loadStatus } = useAuthStore()
  const [mode, setMode] = React.useState<'login' | 'register'>('login')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [name, setName] = React.useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadStatus()
  }, [])

  useEffect(() => {
    if (authenticated) {
      navigate('/', { replace: true })
    }
  }, [authenticated, navigate])
useEffect(() => {
  console.log("[AuthPage] loadStatus triggered");
  loadStatus().then(() => console.log("[AuthPage] loadStatus complete"));
}, []);

useEffect(() => {
  console.log("[AuthPage] authenticated:", authenticated);
  if (authenticated) {
    console.log("[AuthPage] Redirecting to /");
    navigate('/', { replace: true });
  }
}, [authenticated, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (mode === 'register') {
        await useAuthStore.getState().register(email, password, name)
      } else {
        await useAuthStore.getState().login(email, password)
      }
      // Redirect to dashboard/home after login
      navigate('/dashboard', { replace: true })
    } catch (err) {
      // error handled in store
    }
  }

  // Handle OAuth redirect token (e.g. /login?token=...)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      (async () => {
        localStorage.setItem('token', token)
        // refresh auth status then navigate to dashboard
        try {
          await useAuthStore.getState().loadStatus()
        } catch (e) {
          // ignore
        }
        // clean URL and redirect to dashboard
        window.history.replaceState({}, document.title, window.location.pathname)
        navigate('/dashboard', { replace: true })
      })()
    }
  }, [navigate])
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Checking authentication...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <a
            className="text-sm text-primary underline"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              setMode(mode === 'login' ? 'register' : 'login')
            }}
          >
            {mode === 'login' ? 'Create account' : 'Have an account? Sign in'}
          </a>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="text-sm text-slate-600">Name</label>
              <input
                className="mt-1 w-full border rounded px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
              />
            </div>
          )}
          <div>
            <label className="text-sm text-slate-600">Email</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-600">Password</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Minimum 8 characters.</p>
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <Button disabled={loading} type="submit" className="w-full">
            {loading
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-2">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs text-slate-500">or</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        <a href={`${API_BASE}/api/auth/google`}>
          <Button variant="secondary" className="w-full">
            Continue with Google
          </Button>
        </a>
      </div>
    </div>
  )
}

export default AuthPage
