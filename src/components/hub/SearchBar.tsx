import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router'
import { Search } from 'lucide-react'

/* The query lives in the URL (?q=) so a filtered hub can be linked and the
   back button behaves. "/" focuses the field from anywhere on the hub. */
export function SearchBar() {
  const [params, setParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const query = params.get('q') ?? ''

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target instanceof Element ? event.target : null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <label className="relative flex items-center">
      <span className="wb-visually-hidden">Search games and tools</span>
      <Search className="pointer-events-none absolute left-s2 size-4 text-fg-3" aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={query}
        placeholder="Search games and tools"
        onChange={(event) => {
          const value = event.target.value
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev)
              if (value) next.set('q', value)
              else next.delete('q')
              return next
            },
            { replace: true },
          )
        }}
        className="w-full border border-line-strong bg-bg py-s2 pr-8 pl-8 text-base placeholder:text-fg-3 focus-visible:border-accent"
      />
      <kbd
        aria-hidden
        className="pointer-events-none absolute right-s2 border border-line-strong bg-surface-2 px-[5px] font-mono text-xs text-fg-2 max-sm:hidden"
      >
        /
      </kbd>
    </label>
  )
}
