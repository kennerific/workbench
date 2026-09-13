import { Link } from 'react-router'
import { findApp } from '../../data/apps'
import { Badge } from './Badge'
import { buttonClass } from './buttonClass'
import { PageHeader } from './PageHeader'

/** Holds a route open while its game is being built. */
export function ComingSoon({ id }: { id: string }) {
  const app = findApp(id)
  if (!app) return null

  return (
    <>
      <PageHeader title={app.name} note={app.description} />
      <div className="flex flex-col items-start gap-s3 border border-fg bg-surface px-s4 py-s6">
        <Badge tone="accent">Being built</Badge>
        <p className="max-w-[68ch] text-fg-2">This one is still being set up. Everything else in the hub works in the meantime.</p>
        <Link to="/" className={buttonClass()}>
          Back to all games
        </Link>
      </div>
    </>
  )
}
