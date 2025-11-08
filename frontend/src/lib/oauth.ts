import { API_BASE, connectionsStatus } from './api'

function openPopup(url: string, name = 'oauth', w = 600, h = 700) {
  const left = window.screenX + (window.outerWidth - w) / 2
  const top = window.screenY + (window.outerHeight - h) / 2
  const opts = `toolbar=0,location=0,menubar=0,width=${w},height=${h},left=${left},top=${top}`
  const win = window.open(url, name, opts)
  if (win) win.focus()
  return win
}

export async function connectServiceWithPopup(service: string, pollInterval = 1500, timeoutMs = 2 * 60 * 1000) {
  // service: 'gmail' | 'sheets' | 'calendar' | 'slack'
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  let url = `${API_BASE}/api/connections/`
  if (service === 'slack') url += 'slack/auth'
  else url += `google/auth?service=${encodeURIComponent(service)}`
  if (token) {
    // include token so backend can establish session for the popup flow
    url += (url.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`
  }

  const popup = openPopup(url, `connect-${service}`)
  if (!popup) throw new Error('Unable to open popup. Please allow popups.')

  const start = Date.now()
  return new Promise<void>((resolve, reject) => {
    const timer = setInterval(async () => {
      if (popup.closed) {
        clearInterval(timer)
        // check once after closed
        try {
          const r = await connectionsStatus()
          const ok = Boolean((r.data as any)[service])
          if (ok) return resolve()
          return reject(new Error('Popup closed before connecting'))
        } catch (e) {
          return reject(new Error('Connection check failed'))
        }
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(timer)
        try { popup.close() } catch (e) {}
        return reject(new Error('Timeout waiting for OAuth'))
      }
      // poll backend for connection state
      try {
        const r = await connectionsStatus()
        const ok = Boolean((r.data as any)[service])
        if (ok) {
          clearInterval(timer)
          try { popup.close() } catch (e) {}
          return resolve()
        }
      } catch (err) {
        // ignore polling errors
      }
    }, pollInterval)
  })
}
