import { seed } from '../data/demo.js';
const KEY = 'otw-v3';
let state;
try {
  state = JSON.parse(localStorage.getItem(KEY)) || seed();
} catch {
  state = seed();
}
export { state };
export function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
export function resetState() {
  state = seed();
  save();
}
