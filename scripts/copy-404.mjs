// GitHub Pages serves 404.html for any path it has no file for. Making that
// file the app shell lets the client router handle deep links on refresh.
import { copyFileSync } from 'node:fs'

copyFileSync(new URL('../dist/index.html', import.meta.url), new URL('../dist/404.html', import.meta.url))
console.log('copied dist/index.html to dist/404.html')
