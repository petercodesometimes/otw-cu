import { $, esc } from '../../lib/dom.js';
import { clock, fmt } from '../../lib/time.js';
import { place } from '../../data/locations.js';
import { state, save } from '../../state/store.js';
import { legOf } from '../../components/route-map.js';
import { showRoute } from '../../components/live-map.js';
import { acceptWindow } from '../planning/accept.js';
import { primaryWindow } from '../today/today.js';

// 'auto' follows the accepted (or suggested) window; otherwise a window index or 'all'.
let choice = 'auto';

function resolve(day) {
  if (choice === 'all') return 'all';
  if (choice !== 'auto' && day.windows[choice]?.best.route.length) return choice;
  const accepted = day.windows.findIndex(w => w.accepted);
  return accepted >= 0 ? accepted : primaryWindow(day)?.i ?? null;
}

function stopCards(w, offset) {
  let html = '';
  w.best.route.forEach((t, k) => {
    html += `<div class="card"><h3>${offset + k + 1} · ${esc(place(t.loc).short)}</h3>
      <p class="meta">${esc(t.name)} · ${t.walk ? `${t.walk} min away` : 'right here'}</p></div>`;
  });
  if (w.dest) html += `<div class="card"><h3>C · ${esc(place(w.dest).short)}</h3><p class="meta">${esc(w.next.name)} at ${fmt(w.next.start)}</p></div>`;
  return html;
}

export function renderMap(day) {
  const routed = day.windows.map((w, i) => ({ w, i })).filter(x => x.w.best.route.length);
  const current = resolve(day);
  $('mappick').innerHTML = routed.map(({ w, i }) =>
    `<button class="pill ${current === i ? 'selected' : ''}" data-window="${i}">${clock(w.start)} window</button>`).join('')
    + (routed.length > 1 ? `<button class="pill ${current === 'all' ? 'selected' : ''}" data-window="all">All stops</button>` : '');

  if (current === null) {
    showRoute('bigmap');
    $('maplist').innerHTML = '<div class="card"><h3>No route yet</h3><p class="meta">Add errands, or open a free window on Today to plan one.</p></div>';
    $('mapstart').classList.add('hidden');
    return;
  }
  if (current === 'all') {
    showRoute('bigmap', { legs: routed.map(x => legOf(x.w)), skipped: day.unplanned.map(t => t.loc) });
    let offset = 0, list = '';
    for (const { w } of routed) {
      list += `<p class="meta spaced">${clock(w.start)} – ${clock(w.end)} window</p>` + stopCards(w, offset);
      offset += w.best.route.length;
    }
    $('maplist').innerHTML = list;
    $('mapstart').classList.add('hidden');
    return;
  }
  const w = day.windows[current];
  const skipped = w.skipped;
  showRoute('bigmap', { legs: [legOf(w)], skipped: skipped.map(t => t.loc) });
  $('maplist').innerHTML = `<div class="card window solid"><h3>Total walk ${w.best.walking} min est.</h3>
      <p class="meta">${w.dest ? `Arrive ${clock(w.best.finish)}` : `Done by ${clock(w.best.finish)}`}</p></div>`
    + stopCards(w, 0)
    + skipped.map(t => `<a class="card dashed linkcard" href="#plan/${current}"><h3>? · ${esc(place(t.loc).short)} ${esc(t.name.split(' ').at(-1))}</h3>
        <p class="meta">Skipped, see Plan</p></a>`).join('');
  const startedHere = w.accepted && state.accepted.active;
  $('mapstart').classList.toggle('hidden', !!startedHere);
  $('mapstart').dataset.window = current;
}

export function bindMap(getDay, onChange) {
  $('mappick').onclick = e => {
    const button = e.target.closest('[data-window]');
    if (!button) return;
    choice = button.dataset.window === 'all' ? 'all' : Number(button.dataset.window);
    onChange();
  };
  $('mapstart').onclick = () => {
    const day = getDay(), index = Number($('mapstart').dataset.window);
    if (!day.windows[index].accepted) acceptWindow(day, index);
    state.accepted.active = state.accepted.stops.find(s => !s.finished)?.id ?? null;
    save();
    choice = 'auto';
    location.hash = 'today';
  };
}
