import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cx } from '../../utils/cx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}

/* Built on <dialog>. showModal() gives the top layer, an inert page behind,
   Escape to close and focus restored to the opener, without a library. */
export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      // A click that lands on the dialog itself, not its content, is the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={cx(
        'm-auto w-[calc(100%-2rem)] border border-fg bg-surface p-0 text-fg shadow-float',
        'backdrop:bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] open:animate-rise',
        size === 'lg' ? 'max-w-[40rem]' : 'max-w-[30rem]',
      )}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <div className="flex items-center gap-s3 border-b border-line bg-surface-2 py-s2 pr-s2 pl-s4">
          <h2 id={titleId} className="text-lg">
            {title}
          </h2>
          <Button variant="quiet" size="icon" className="ml-auto" onClick={onClose} aria-label="Close">
            <X className="size-4" aria-hidden />
          </Button>
        </div>
        <div className="flex min-h-0 flex-col gap-s4 overflow-y-auto p-s4">{children}</div>
        {footer && <div className="flex flex-wrap gap-s2 border-t border-line-2 px-s4 py-s3">{footer}</div>}
      </div>
    </dialog>
  )
}
