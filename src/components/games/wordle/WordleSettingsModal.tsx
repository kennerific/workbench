import type { WordleSettings } from '../../../types/wordle'
import { Checkbox } from '../../common/Checkbox'
import { Modal } from '../../common/Modal'

interface WordleSettingsModalProps {
  open: boolean
  onClose: () => void
  settings: WordleSettings
  onChange: (settings: WordleSettings) => void
  /** Hard mode is fixed once a round has its first guess. */
  hardLocked: boolean
}

export function WordleSettingsModal({ open, onClose, settings, onChange, hardLocked }: WordleSettingsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <Checkbox
        label="Hard mode"
        help={
          hardLocked
            ? 'Takes effect from your next round. It cannot change once a round has started.'
            : 'Every revealed hint must be used in later guesses.'
        }
        checked={settings.hard}
        onChange={(hard) => onChange({ ...settings, hard })}
      />
      <Checkbox
        label="High contrast tiles"
        help="Orange and blue instead of green and amber, easier to tell apart with colour vision deficiency."
        checked={settings.highContrast}
        onChange={(highContrast) => onChange({ ...settings, highContrast })}
      />
    </Modal>
  )
}
