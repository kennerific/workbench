import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/* House rule: no em-dashes anywhere a player could read. Source, data and the
   page shell are all scanned, comments included, so none can slip through. */
// Built from its code point so this file does not match itself.
const EM_DASH = String.fromCharCode(0x2014)
const root = fileURLToPath(new URL('..', import.meta.url))

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return files(path)
    return /\.(tsx?|json|css|html|md)$/.test(entry.name) ? [path] : []
  })
}

describe('copy', () => {
  it('contains no em-dashes', () => {
    const scanned = [...files(join(root, 'src')), join(root, 'index.html'), join(root, 'README.md')]
    const offenders = scanned.flatMap((path) =>
      readFileSync(path, 'utf8')
        .split('\n')
        .flatMap((line, i) => (line.includes(EM_DASH) ? [`${path.slice(root.length)}:${i + 1}`] : [])),
    )
    expect(offenders).toEqual([])
  })
})
