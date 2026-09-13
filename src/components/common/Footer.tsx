export function Footer() {
  return (
    <footer className="mt-s5 border-t border-line">
      <div className="mx-auto flex max-w-shell flex-wrap gap-x-s5 gap-y-s2 px-s5 pt-s4 pb-s6 font-mono text-xs text-fg-3 max-sm:px-s4">
        <span>Workbench</span>
        <span>Progress stays in this browser</span>
        <a className="ml-auto text-fg-3 underline hover:text-fg" href="https://github.com/kennerific/workbench">
          Source
        </a>
      </div>
    </footer>
  )
}
