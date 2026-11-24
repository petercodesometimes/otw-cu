import { $, esc } from '../../lib/dom.js';
import { clock, fmt } from '../../lib/time.js';
import { place } from '../../data/locations.js';
import { walk } from './walking.js';
import { optimize } from './optimizer.js';
import { acceptWindow, clearAccepted } from './accept.js';
import { routeMap, legOf } from '../../components/route-map.js';

function reason(t, w) {
  const p = place(t.loc);
  const earliest = Math.max(w.start + walk(w.origin, t.loc), p.open) + t.duration;
  if (earliest > p.close) return `${p.short} closes at ${fmt(p.close)} before you could finish.`;
  if (t.deadline != null && earliest > t.deadline) return 'Can’t finish before it’s due.';
  if (!optimize([t], w.start, w.end, w.origin, w.dest, w.buffer).route.length) {
    if (p.open > w.start + walk(w.origin, t.loc)) return `${p.short} doesn’t open until ${fmt(p.open)}.`;
    const need = walk(w.origin, t.loc) + (w.dest ? walk(t.loc, w.dest) : 0);
    return `Needs ${t.duration} min plus ${need} min walking; only ${w.end - w.start - w.buffer} min here.`;
  }
  return 'Fits on its own, but this plan fits more errands with less walking.';
}

export function renderPlan(day, index) {
  const w = day.windows[index];
  if (!w) {
    $('plantitle').textContent = 'Plan';
    $('plansub').textContent = 'This window no longer exists.';
    $('steps').innerHTML = $('didntfit').innerHTML = $('planmap').innerHTML = '';
    $('startplan').classList.add('hidden');
    return;
  }
  $('plantitle').textContent = `Plan · ${clock(w.start)}–${clock(w.end)}`;
  $('plansub').textContent = w.next
    ? `Includes est. walking time and a ${w.buffer} min buffer. Class at ${fmt(w.next.start)}.`
    : 'Includes est. walking time. No more classes today.';

  let html = '', loc = w.origin, lastDone = w.start;
  w.best.route.forEach((t, k) => {
    if (t.walk && k > 0) html += `<p class="connector">Walk ${t.walk} min${t.begin > t.arrival ? ` · wait ${t.begin - t.arrival} min for opening` : ''}</p>`;
    html += `<div class="card stop solo"><h3>${clock(t.begin)} · ${esc(place(t.loc).short)}</h3>
      <p class="meta">${esc(t.name)} · ${t.duration} min</p></div>`;
    loc = t.loc;
    lastDone = t.done;
  });
  if (!w.best.route.length) {
    html += '<div class="card dashed"><h3>Nothing fits this window</h3><p class="meta">Try a longer window or a shorter errand.</p></div>';
  } else if (w.dest) {
    html += `<p class="connector">Walk ${walk(loc, w.dest)} min${w.buffer ? ` + ${w.buffer} min buffer` : ''}</p>
      <div class="card stop solo"><h3>${clock(lastDone)} · Done, head to class</h3>
      <p class="meta">Arrive ${esc(place(w.dest).short)} by ${clock(w.best.finish)}</p></div>`;
  } else {
    html += `<div class="card stop solo"><h3>${clock(lastDone)} · Done</h3><p class="meta">Free until ${clock(w.end)}</p></div>`;
  }
  $('steps').innerHTML = html;

  $('didntfit').innerHTML = w.skipped.map(t => {
    const later = day.windows.findIndex((x, j) => j > index && x.best.route.some(r => r.id === t.id));
    const action = later >= 0
      ? `<button class="outline sm" data-plan="${later}">Move to ${clock(day.windows[later].start)} window</button>`
      : '<p class="meta">Doesn’t fit any other window today.</p>';
    return `<div class="card dashed"><h3>Didn’t fit</h3>
      <p class="meta">${esc(t.name)} (${t.duration} min). ${reason(t, w)}</p>${action}</div>`;
  }).join('');

  $('planmap').innerHTML = routeMap({ legs: [legOf(w)], skipped: w.skipped.map(t => t.loc) });

  const button = $('startplan');
  button.classList.toggle('hidden', !w.best.route.length);
  button.dataset.window = index;
  button.dataset.mode = w.accepted ? 'replan' : 'start';
  button.textContent = w.accepted ? 'Re-plan this window' : day.accepted ? 'Start plan (replaces current plan)' : 'Start plan';
}

export function bindPlan(getDay, onChange) {
  $('back').onclick = () => { location.hash = 'today'; };
  $('didntfit').onclick = e => {
    const button = e.target.closest('[data-plan]');
    if (button) location.hash = `plan/${button.dataset.plan}`;
  };
  $('startplan').onclick = () => {
    const button = $('startplan');
    if (button.dataset.mode === 'replan') {
      clearAccepted();
      onChange();
      return;
    }
    acceptWindow(getDay(), Number(button.dataset.window));
    location.hash = 'today';
  };
}
