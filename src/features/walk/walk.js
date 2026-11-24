import { $, esc, plural } from '../../lib/dom.js';
import { clock } from '../../lib/time.js';
import { place } from '../../data/locations.js';
import { sampleBuddies } from '../../data/demo.js';
import { state, save } from '../../state/store.js';
import { walk } from '../planning/walking.js';
import { nowMinutes } from '../planning/day.js';

// The next window that ends with a walk to class: upcoming if any, else today's first.
function nextWalk(day) {
  const toClass = day.windows.filter(w => w.next);
  return toClass.find(w => w.next.start >= nowMinutes()) || toClass[0];
}

export function renderWalk(day) {
  const w = nextWalk(day);
  const prefs = state.walk;
  $('nextwalk').innerHTML = w
    ? `<h3>Your ${clock(w.best.finish)} walk to ${esc(place(w.dest).short)}</h3>
       <p class="meta">${plural(sampleBuddies.length, 'sample match')} for your route and time · ${esc(w.next.name)} at ${clock(w.next.start)}</p>`
    : '<h3>No walks to class today</h3><p class="meta">Add classes to find people heading your way.</p>';
  $('buddies').innerHTML = w && prefs.visible
    ? sampleBuddies.map(b => {
      const waved = prefs.waved.includes(b.id);
      const leaves = w.best.finish - walk(b.from, w.dest);
      return `<div class="card"><h3>${b.name} · ${esc(w.next.name)}</h3>
        <p class="meta">Sample profile · leaves ${esc(place(b.from).short)} ${clock(leaves)}</p>
        <button class="pill ${waved ? 'selected' : ''}" data-wave="${b.id}">${waved ? 'Waved' : 'Wave'}</button></div>`;
    }).join('')
    : w ? '<p class="meta">Turn on “Show me to matches” to see people heading your way.</p>' : '';
  $('showme').textContent = prefs.visible ? 'On' : 'Off';
  $('publicspots').textContent = prefs.publicOnly ? 'On' : 'Off';
}

export function bindWalk(onChange) {
  $('buddies').onclick = e => {
    const button = e.target.closest('[data-wave]');
    if (!button) return;
    const id = button.dataset.wave, waved = state.walk.waved;
    state.walk.waved = waved.includes(id) ? waved.filter(x => x !== id) : [...waved, id];
    save();
    onChange();
  };
  $('showme').onclick = () => { state.walk.visible = !state.walk.visible; save(); onChange(); };
  $('publicspots').onclick = () => { state.walk.publicOnly = !state.walk.publicOnly; save(); onChange(); };
  $('buddiescta').onclick = () => {
    $('walknote').textContent = 'Live matching isn’t available yet. The people shown are sample profiles.';
  };
}
