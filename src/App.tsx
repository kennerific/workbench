import { BrowserRouter, Route, Routes } from 'react-router'
import { Shell } from './components/common/Shell'
import { HubPage } from './pages/HubPage'
import { WordlePage } from './pages/WordlePage'
import { ConnectionsPage } from './pages/ConnectionsPage'
import { BlackjackPage } from './pages/BlackjackPage'
import { CrosswordPage } from './pages/CrosswordPage'
import { EndBehaviorPage } from './pages/EndBehaviorPage'
import { NotFoundPage } from './pages/NotFoundPage'

// BASE_URL is "/workbench/"; the router wants it without the trailing slash.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

export function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HubPage />} />
          <Route path="wordle" element={<WordlePage />} />
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="blackjack" element={<BlackjackPage />} />
          <Route path="crossword" element={<CrosswordPage />} />
          <Route path="end-behavior" element={<EndBehaviorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
