import { cx } from '../../utils/cx'

export type ButtonVariant = 'default' | 'primary' | 'danger' | 'quiet'
export type ButtonSize = 'md' | 'sm' | 'icon'

const VARIANTS: Record<ButtonVariant, string> = {
  default: 'border-line-strong bg-surface text-fg hover:bg-surface-2 disabled:hover:bg-surface',
  primary: 'border-accent bg-accent text-accent-on hover:brightness-108 disabled:hover:brightness-100',
  danger: 'border-danger bg-danger text-danger-on hover:brightness-108 disabled:hover:brightness-100',
  quiet: 'border-transparent bg-transparent text-fg-2 hover:bg-surface-2 hover:text-fg disabled:hover:bg-transparent',
}

const SIZES: Record<ButtonSize, string> = {
  md: 'px-s3 py-s2 text-base',
  sm: 'px-s2 py-s1 text-sm',
  icon: 'size-[34px] p-0',
}

/** Workbench button classes, for anything that should look like a button (links included). */
export function buttonClass(variant: ButtonVariant = 'default', size: ButtonSize = 'md', className?: string): string {
  return cx(
    'inline-flex items-center justify-center gap-s2 border whitespace-nowrap cursor-pointer select-none',
    'transition-[background-color,border-color,color,filter,transform] duration-(--dur-1) active:translate-y-px',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
