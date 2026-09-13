import type { ConnectionsStats } from '../../../types/connections'
import { Modal } from '../../common/Modal'
import { Stats } from '../../common/Stats'

export function ConnectionsStatsModal({ open, onClose, stats }: { open: boolean; onClose: () => void; stats: ConnectionsStats }) {
  return (
    <Modal open={open} onClose={onClose} title="Statistics">
      <Stats
        items={[
          { label: 'Played', value: stats.played },
          { label: 'Solved', value: stats.solved },
          { label: 'Perfect', value: stats.perfect },
          { label: 'Streak', value: stats.currentStreak },
          { label: 'Best', value: stats.bestStreak },
        ]}
      />
      <p className="text-sm text-fg-3">A perfect game finds all four groups without a mistake.</p>
    </Modal>
  )
}
