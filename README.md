# Workbench

A home for small browser games and tools, built as a static site for GitHub
Pages. Everything runs in the browser; streaks, stats, chip balances and puzzle
progress are kept in `localStorage`.

Live at **https://kennerific.github.io/workbench/**.

| App | What it is |
| --- | --- |
| Wordle | Five letters, six guesses. A shared daily word and an unlimited mode, hard mode, high contrast tiles, stats and a shareable result grid. |
| Connections | Sixteen words, four hidden groups, four mistakes. Six built-in puzzles, a daily pick, and a loader for your own JSON puzzles. |
| Blackjack | Six-deck shoe, dealer stands on all 17s, 3:2 blackjack, split, double, insurance and surrender, with a persistent $1,000 bankroll. |
| Mini Crossword | Interactive 5x5 grids with keyboard navigation, a clock, and check and reveal tools. |
| Chartroom | A sibling site for drilling physical geography, linked from the hub. |

## Run it locally

Needs Node 22 or newer (CI uses 24).

```bash
npm install
npm run dev
```

Open http://localhost:5173/workbench/. The `/workbench/` base path applies in
development too, so links behave the same as on Pages.

| Script | Does |
| --- | --- |
| `npm run dev` | Vite dev server with hot reload |
| `npm run build` | Production build into `dist/`, plus the `404.html` copy for deep links |
| `npm run preview` | Serve the production build locally |
| `npm run check` | Typecheck, lint and unit tests; the same gate CI runs before deploying |
| `npm run wordlists` | Regenerate the Wordle answer and guess lists |

## Stack

Vite, React 19 and TypeScript, styled with Tailwind CSS v4 on top of the
Workbench design tokens. Icons are Lucide. Routing is React Router with the
Vite base path as its basename. Tests are Vitest.

## Layout

```text
src/
  components/
    common/     shell, masthead, modal, toast, buttons, stats, segmented control
    hub/        launcher tiles, search, tag filter, recently played
    games/      wordle/, connections/, blackjack/, crossword/
  data/         app registry, word lists, Connections and crossword puzzles
  hooks/        useLocalStorage, useKeyboard, useTheme, useTicker, and friends
  pages/        one component per route
  styles/       vendored Workbench tokens, base styles and the Tailwind mapping
  types/        state and data shapes for every game
  utils/        game rules as pure functions, each with a test file beside it
```

Game rules live in `src/utils` as pure functions (a reducer per game plus
helpers). Components render state and dispatch actions, which keeps every rule
unit-testable without a browser.

## Design system

The look comes from Workbench, the shared design language in the sibling
`workbench/` folder: square corners, hairline borders instead of card shadows,
mono type only for data, and one identity colour per app.

- `src/styles/tokens.css` and `base.css` are copies of `workbench/theme/`. To
  pick up a change, edit the source there (run `python tools/palette.py --write`
  for accent changes) and copy both files back over, keeping the header comment.
- `src/styles/index.css` points Tailwind at the tokens with `@theme inline`,
  so `bg-surface`, `text-fg-2`, `border-line-strong`, `bg-accent` and the rest
  are the Workbench values. Tailwind's default palette, radii and shadows are
  cleared on purpose.
- Each route stamps its app's accent on `<html>` (Wordle green, Connections
  violet, Blackjack vermillion, Crossword cobalt), so `accent` utilities follow
  the app you are in.
- Themes have three states: an explicit light or dark choice sets `data-theme`,
  and the default follows the system. The choice is applied before first paint.

`src/styles/contrast.test.ts` measures every text and background pair the games
use, in both themes, against WCAG AA. `src/content.test.ts` fails the build if
an em-dash appears anywhere in the source or copy.

## Saved data

Every key is prefixed `wb:` and stored as `{ "v": 1, "data": ... }`. A value
that fails to parse, or carries another version, is ignored rather than
crashing the page.

| Key | Holds |
| --- | --- |
| `wb:theme`, `wb:sound` | Theme choice and sound setting |
| `wb:favorites`, `wb:recent` | Pinned apps and recently played |
| `wb:wordle:*` | Mode, settings, the daily and unlimited rounds, stats per mode |
| `wb:connections:*` | Current puzzle, progress per puzzle, custom puzzles, stats |
| `wb:blackjack:table`, `wb:blackjack:stats` | The whole table including the shoe and bankroll, and stats |
| `wb:crossword:*` | Current puzzle, progress and clock per puzzle, stats and best times |

## Adding a game or tool

1. Add an entry to `src/data/apps.ts` with an id, name, description, tags,
   accent and a Lucide icon. For something hosted elsewhere, use
   `status: 'external'` with an `href` and you are done.
2. Put the rules in `src/utils/<game>.ts` with a `<game>.test.ts` beside it.
3. Build the UI in `src/components/games/<game>/`, add a page in `src/pages/`,
   and register the route in `src/App.tsx`.
4. Optionally add a reader in `src/utils/summaries.ts`, which feeds the tile's
   meta line and the global stats modal.

## Adding Connections puzzles

A puzzle is four groups of four words. Levels run from 0 (most straightforward)
to 3 (trickiest) and each level is used once:

```json
{
  "id": "my-puzzle",
  "title": "My puzzle",
  "groups": [
    { "label": "Shades of red", "level": 0, "words": ["CRIMSON", "SCARLET", "RUBY", "MAROON"] },
    { "label": "Chess pieces", "level": 1, "words": ["KING", "QUEEN", "ROOK", "BISHOP"] },
    { "label": "Rivers", "level": 2, "words": ["NILE", "AMAZON", "THAMES", "DANUBE"] },
    { "label": "Fire___", "level": 3, "words": ["WORK", "PLACE", "FLY", "MAN"] }
  ]
}
```

- **Built in:** save the file in `src/data/connections/`, write words in capitals
  with groups in level order, and import it in `src/data/connections.ts`. The
  test suite rejects a malformed puzzle or a word used twice.
- **Just for you:** in the game, open Puzzles, then Load your own, and paste the
  JSON or pick the file. Up to ten custom puzzles are kept in the browser.

## Adding crosswords

A mini is five rows of five characters, capital letters or `#` for a black
square, plus clues keyed by the number printed in the grid:

```json
{
  "id": "board-meeting",
  "title": "Board meeting",
  "solution": ["#BET#", "BOARD", "ANGER", "DELAY", "#SET#"],
  "clues": {
    "across": { "1": "Wager", "4": "Get on, as a train", "6": "Fury", "7": "Hold-up at the airport", "8": "Lay out, as the table for dinner" },
    "down": { "1": "Skeleton parts", "2": "Bird with a famously sharp eye", "3": "Reward for a good dog", "4": "Not good", "5": "Like a desert" }
  }
}
```

Numbers are never stored: they are derived from the grid in reading order, the
same way a printed crossword numbers its squares. Save the file in
`src/data/crosswords/`, import it in `src/data/crosswords.ts`, and add its
expected answers to `src/data/crosswords.test.ts`. That test fails if a clue is
missing, a clue has no matching slot, or a number leads to a different word.

## Word lists

`npm run wordlists` rebuilds `src/data/wordle-answers.ts` and
`wordle-guesses.ts` from SCOWL through the `wordlist-english` package. Answers
are common five-letter words without plurals, past tenses, comparatives or
short -ing forms; guesses accept a much wider list. The daily word walks a
seeded shuffle of the answers, so changing the answer list changes future daily
words.

## Deployment

`.github/workflows/deploy.yml` runs on every push to `main`: install, `npm run
check`, build, then publish `dist/` with the official Pages actions. A failing
check never deploys.

One-time setup for a new copy of the repo: the repository must be public on a
free plan, and Pages must use GitHub Actions as its source (Settings, Pages,
Source), or:

```bash
gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow
```

If the repository is renamed, change `base` in `vite.config.ts` to match. The
build copies `index.html` to `404.html` so a refresh on a deep link such as
`/workbench/crossword` still loads the app.

## Credits

- Word lists derived from SCOWL, copyright Kevin Atkinson, used under its
  permissive licence; the full notice is in the generated word list files.
- Icons from Lucide (ISC licence).
- Archivo, IBM Plex Mono and Spectral from Google Fonts (SIL Open Font Licence).
