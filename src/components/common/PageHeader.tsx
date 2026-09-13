import type { ReactNode } from 'react'

/** What you are looking at, in one line, with the view's controls on the right. */
export function PageHeader({ title, note, children }: { title: string; note?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-s4 border-b border-fg pb-s3">
      <div className="flex min-w-0 flex-col gap-s1">
        <h1 className="text-2xl">{title}</h1>
        {note && <p className="max-w-[68ch] text-base text-fg-2">{note}</p>}
      </div>
      {children && <div className="flex max-w-full flex-wrap items-center gap-s2 sm:ml-auto">{children}</div>}
    </div>
  )
}
