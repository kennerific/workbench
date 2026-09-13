/* Copy text to the clipboard. The async Clipboard API needs a secure context;
   the fallback selects a hidden textarea. It is placed inside an open modal
   when there is one, because a modal dialog makes the rest of the page inert
   and a textarea there could not be selected. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Permission denied or unavailable: try the fallback.
  }

  try {
    const host = document.querySelector('dialog[open]') ?? document.body
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    host.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}
