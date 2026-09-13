import { useId } from 'react'

interface CheckboxProps {
  label: string
  help?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

export function Checkbox({ label, help, checked, disabled, onChange }: CheckboxProps) {
  const id = useId()
  const helpId = `${id}-help`

  return (
    <div className="flex items-start gap-s3">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-describedby={help ? helpId : undefined}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 size-4 flex-none cursor-pointer accent-accent disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="cursor-pointer text-md text-fg">
          {label}
        </label>
        {help && (
          <p id={helpId} className="text-sm text-fg-3">
            {help}
          </p>
        )}
      </div>
    </div>
  )
}
