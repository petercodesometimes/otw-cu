import { place } from '../../data/locations.js';

// Walking pace multiplier (1 = average). Set from Classes → Settings.
let pace = 1;
export const setPace = factor => { pace = factor; };

// Estimated detour factor and walking speed (meters per minute).
export function walk(a, b) {
  if (a === b) return 0;
  const p = place(a), q = place(b);
  return Math.ceil(Math.hypot((p.lat - q.lat) * 111320, (p.lon - q.lon) * 84200) * 1.25 / (75 * pace));
}
