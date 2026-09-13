import { createContext } from 'react'

export type ToastTone = 'neutral' | 'ok' | 'danger'

export interface ToastOptions {
  tone?: ToastTone
  /** Milliseconds on screen. */
  duration?: number
}

export interface ToastApi {
  show: (message: string, options?: ToastOptions) => void
}

export const ToastContext = createContext<ToastApi>({ show: () => {} })
