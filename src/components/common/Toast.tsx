import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { cx } from '../../utils/cx'
import { ToastContext, type ToastOptions, type ToastTone } from './toastContext'

interface Toast {
  id: number
  message: string
  tone: ToastTone
}

const TONES: Record<ToastTone, string> = {
  neutral: 'border-fg bg-fg text-bg',
  ok: 'border-ok bg-ok text-ok-on',
  danger: 'border-danger bg-danger text-danger-on',
}

const MAX_VISIBLE = 3

/* Short game messages ("Not in word list", "One away"). They float below the
   masthead, never take focus, and are announced politely. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)

  const show = useCallback((message: string, { tone = 'neutral', duration = 1800 }: ToastOptions = {}) => {
    const id = ++nextId.current
    setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), { id, message, tone }])
    window.setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), duration)
  }, [])

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[calc(var(--header-h)+12px)] z-50 flex flex-col items-center gap-s2 px-s4"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={cx('animate-rise border px-s3 py-s2 text-base font-semibold shadow-float', TONES[toast.tone])}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
