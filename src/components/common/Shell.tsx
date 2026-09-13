import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { appForPath } from '../../data/apps'
import { recordRecent } from '../../utils/recent'
import { Footer } from './Footer'
import { Masthead } from './Masthead'
import { ToastProvider } from './Toast'

/* The frame every view sits in. The current app's accent is stamped on <html>
   rather than a wrapper, because the derived tokens (accent-soft, focus) are
   computed at :root and would otherwise keep the hub's graphite. */
export function Shell() {
  const { pathname } = useLocation()
  const app = appForPath(pathname)

  useEffect(() => {
    document.documentElement.dataset.accent = app?.accent ?? 'graphite'
    document.title = app ? `${app.name} · Workbench` : 'Workbench'
    if (app) recordRecent(app.id)
  }, [app])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col">
        <Masthead app={app} />
        <main className="mx-auto flex w-full max-w-shell flex-1 flex-col gap-s5 px-s5 py-s5 max-sm:px-s4">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ToastProvider>
  )
}
