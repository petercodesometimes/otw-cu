import {
   place 
} from '../../data/locations.js';

// Estimated detour factor and walking speed (meters per minute).
export function walk(a,b){
  if(a===b)return 0;
  const p=place(a),q=place(b);
  return Math.ceil(Math.hypot((p.lat-q.lat)*111320,(p.lon-q.lon)*84200)*1.25/75)
}
