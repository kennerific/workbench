import type { CrosswordPuzzle } from '../types/crossword'
import boardMeeting from './crosswords/board-meeting.json'
import stairwell from './crosswords/stairwell.json'
import arches from './crosswords/arches.json'
import movieNight from './crosswords/movie-night.json'

/* Built-in minis. Grid numbering is derived, never stored, and
   crosswords.test.ts pins every clue number to its intended answer. */
export const CROSSWORDS = [boardMeeting, stairwell, arches, movieNight] as CrosswordPuzzle[]
