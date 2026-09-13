import { APPS, isInternal } from '../../data/apps'
import { getAppSummary } from '../../utils/summaries'
import { Modal } from './Modal'
import { Stats } from './Stats'

export function StatsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Your stats" size="lg">
      {/* Read storage only while open, so the numbers are current each time. */}
      {open && <StatsBody />}
    </Modal>
  )
}

function StatsBody() {
  return (
    <>
      {APPS.filter(isInternal).map((app) => {
        const summary = getAppSummary(app.id)
        return (
          <section key={app.id} className="flex flex-col gap-s2">
            <h3 className="flex items-center gap-s2 text-md">
              <span aria-hidden className="size-2.5 flex-none" style={{ background: `var(--accent-${app.accent})` }} />
              {app.name}
            </h3>
            {summary && summary.stats.length > 0 ? (
              <Stats items={summary.stats} />
            ) : (
              <p className="text-base text-fg-3">Not played yet.</p>
            )}
          </section>
        )
      })}
      <p className="text-sm text-fg-3">Stats live in this browser only. Clearing site data resets them.</p>
    </>
  )
}
