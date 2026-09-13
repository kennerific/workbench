import type { ConnectionsPuzzle } from '../types/connections'
import warmUp from './connections/warm-up.json'
import kitchenDrawer from './connections/kitchen-drawer.json'
import nightSky from './connections/night-sky.json'
import weatherReport from './connections/weather-report.json'
import aroundTheHouse from './connections/around-the-house.json'
import punchLines from './connections/punch-lines.json'

/* Built-in puzzles. Every file is checked by puzzleProblems in
   connections.test.ts, so a malformed puzzle fails the build, not the player. */
export const PUZZLES = [warmUp, kitchenDrawer, nightSky, weatherReport, aroundTheHouse, punchLines] as ConnectionsPuzzle[]
