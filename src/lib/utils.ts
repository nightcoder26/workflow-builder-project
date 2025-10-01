import { type ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function openOAuthPopup(url: string, name: string, width = 480, height = 720) {
  const y = window.top?.outerHeight ? Math.max((window.top!.outerHeight - height) / 2, 0) : 0
  const x = window.top?.outerWidth ? Math.max((window.top!.outerWidth - width) / 2, 0) : 0
  return window.open(url, name, `width=${width},height=${height},left=${x},top=${y}`)
}

export function formatDuration(ms: number) {
  const s = ms / 1000
  if (s < 1) return `${ms}ms`
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const r = Math.round(s % 60)
  return `${m}m ${r}s`
}
