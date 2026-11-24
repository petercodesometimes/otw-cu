import { $, esc, plural } from '../../lib/dom.js';
import { clock, fmt, hour, span } from '../../lib/time.js';
import { longDate } from '../../lib/date.js';
import { dueLabel } from '../../lib/labels.js';
import { place } from '../../data/locations.js';
import { state } from '../../state/store.js';
import { candidatesFor, nowMinutes } from '../planning/day.js';
import { clearAccepted, nextStop, advance } from '../planning/accept.js';
import { legOf } from '../../components/route-map.js';
import { showRoute } from '../../components/live-map.js';
import { focusErrandForm } from '../errands/errands.js';
import { dayGrid } from '../../components/day-grid.js';

// A card placed in the hourly day grid at `start`.
const row = (start, html) => ({ start, html });

// Shading for classes and free windows in the hourly day grid.
export const daySpans = day => [
  ...day.classes.map(c => ({ start: c.start, end: c.end, kind: 'class' })),
  ...day.windows.map(w => ({ start: w.start, end: w.end, kind: 'window' }))
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

// The window to suggest next: the first upcoming one with a route, else the first with a route.
export function primaryWindow(day) {
  const withRoute = day.windows.map((w, i) => ({ w, i })).filter(x => x.w.best.route.length);
  return withRoute.find(x => x.w.end > nowMinutes()) || withRoute[0] || null;
}

function classCard(c, leaveBy) {
  return `<div class="card class"><h3>${esc(c.name)}</h3>
    <p class="meta">${clock(c.start)} – ${clock(c.end)} · ${esc(place(c.loc).short)}${leaveBy != null ? ` · leave by ${clock(leaveBy)}` : ''}</p></div>`;
}

function windowRows(day, w, i, primary) {
  const route = w.best.route;
  const acc = day.accepted;
  if (w.accepted) return acceptedRows(w);
  if (!route.length) {
    return [row(w.start, `<div class="card"><p class="meta">Free ${clock(w.start)} – ${clock(w.end)} · ${w.waiting ? 'nothing fits this window' : 'nothing needed'}</p></div>`)];
  }
  const moved = acc ? route.filter(t => acc.movedIds.includes(t.id)) : [];
  if (moved.length) {
    return moved.map(t => row(w.start, `<div class="card window"><div class="wrow"><div>
      <h3>${esc(t.name)} · moved from ${clock(acc.start)}</h3>
      <p class="meta">${esc(place(t.loc).short)} · ${t.duration} min</p>
      <p class="meta">Window ${clock(w.start)} – ${clock(w.end)}</p></div>
      <button class="pill" data-plan="${i}">Edit</button></div></div>`));
  }
  const names = route.map(t => esc(t.name)).join(' · ');
  return [row(w.start, `<div class="card window"><div class="wrow"><div>
    <h3>Free window · ${clock(w.start)} – ${clock(w.end)}</h3>
    <p class="meta">${span(w.end - w.start)} · Fits ${plural(route.length, 'errand')} ${w.next ? 'before class' : 'after class'}</p>
    <p class="meta">${names}</p></div>
    <button class="${i === primary ? 'primary' : 'outline'} sm" data-plan="${i}">Plan this window</button></div></div>`)];
}

function acceptedRows(w) {
  const acc = w.accepted, next = nextStop(acc);
  const rows = [];
  acc.stops.forEach((s, k) => {
    if (s.walk) rows.push(row(s.arrival - s.walk, `<div class="card thin"><p class="meta">${clock(s.arrival - s.walk)} · Walk ${s.walk} min to ${esc(place(s.loc).short)}</p></div>`));
    const status = s.finished ? '<span class="status">Done ✓</span>'
      : s === next ? `<span class="badge">${acc.active === s.id ? 'On the way' : 'Next'}</span>`
      : '<span class="status">Not started</span>';
    rows.push(row(s.begin, `<div class="card stop ${s.finished ? 'finished' : ''}">
      <h3>${esc(s.name)}</h3><span class="meta">${clock(s.begin)} · ${esc(place(s.loc).short)} · ${s.duration} min</span>${status}</div>`));
  });
  const last = acc.stops.at(-1);
  const endText = acc.dest
    ? `${acc.buffer ? 'Buffer, then walk' : 'Walk'} to class (arrive ${clock(acc.finish)})`
    : `Done · free until ${clock(acc.end)}`;
  const endAt = last ? last.done : acc.start;
  rows.push(row(endAt, `<div class="card thin"><p class="meta">${clock(endAt)} · ${endText}</p></div>`));
  return rows;
}

export function renderToday(day) {
  const acc = day.accepted;
  const primary = primaryWindow(day);
  const waiting = candidatesFor(day.date);

  $('todaytitle').textContent = acc ? 'Today' : greeting();
  $('todaysub').textContent = longDate(day.date);

  // Accepted-plan banner
  $('acceptbanner').classList.toggle('hidden', !acc);
  if (acc) {
    const accIndex = day.windows.findIndex(w => w.accepted);
    const moved = day.windows.flatMap(w => w.best.route.filter(t => acc.movedIds.includes(t.id)).map(t => `${t.name} moved to your ${clock(w.start)} window.`));
    $('acceptbanner').innerHTML = `<div><h3>Plan accepted for ${clock(acc.start)} – ${clock(acc.end)}</h3>
      <p class="meta">${moved.length ? esc(moved.join(' ')) : 'Everything you planned fits in this window.'}</p></div>
      <div class="row gap"><button class="outline sm" id="undoplan">Undo</button><button class="outline sm" data-plan="${accIndex}">Edit plan</button></div>`;
  }

  // Stat cards
  const durations = day.windows.map(w => span(w.end - w.start)).join(', ');
  const stats = [
    [day.classes.length, 'Classes today'],
    [day.windows.length, `Free windows${durations ? ` (${durations})` : ''}`],
    acc ? [acc.stops.length, `Planned in ${clock(acc.start)} window`] : [waiting.length, 'Errands waiting']
  ];
  $('todaystats').innerHTML = stats.map(([n, label]) => `<div class="card stat"><b>${n}</b><span class="meta">${label}</span></div>`).join('');

  // Timeline: classes and windows in time order
  const leaveBy = new Map();
  day.windows.forEach(w => {
    const last = w.best.route.at(-1);
    if (w.next && last) leaveBy.set(w.next.id, last.done);
  });
  const items = [
    ...day.classes.map(c => ({ start: c.start, rows: [row(c.start, classCard(c, leaveBy.get(c.id)))] })),
    ...day.windows.map((w, i) => ({ start: w.start, rows: windowRows(day, w, i, primary?.i) }))
  ];
  $('daylist').innerHTML = dayGrid({
    entries: items.flatMap(item => item.rows),
    spans: daySpans(day),
    hours: day.hours,
    now: nowMinutes()
  });

  // Sidebar
  if (acc) {
    const next = nextStop(acc);
    const p = next && place(next.loc);
    $('upnext').innerHTML = next
      ? `<p class="small">${next.walk ? `Up next in ${next.walk} min walk` : 'Up next'}</p>
         <h2>${esc(next.name)} at ${esc(p.short)}</h2>
         <p class="small">Open until ${hour(p.close)}${next.note ? ` · ${esc(next.note)}` : ''}</p>
         <button class="light" id="advance">${acc.active === next.id ? 'Mark done' : 'Start walking'}</button>`
      : `<p class="small">All stops done</p><h2>${acc.dest ? `Head to ${esc(place(acc.dest).short)}` : 'Nice work'}</h2>
         <p class="small">${acc.dest ? `Arrive by ${clock(acc.finish)} for ${esc(acc.nextName)}` : 'Nothing else planned in this window.'}</p>
         <button class="light" id="finishplan">Clear plan</button>`;
    const done = acc.stops.filter(s => s.finished).length;
    $('sidecard').innerHTML = `<h3>Progress</h3><p class="meta">${done} of ${plural(acc.stops.length, 'errand')} done in this window</p>
      <div class="bar"><span style="width:${acc.stops.length ? done / acc.stops.length * 100 : 0}%"></span></div>`;
    $('routetitle').textContent = 'Route';
    showRoute('todaymap', { legs: [{ origin: acc.origin, stops: acc.stops, dest: acc.dest }], compact: true });
    $('routecaption').textContent = '';
  } else {
    const n = waiting.length;
    $('upnext').innerHTML = primary
      ? `<p class="small">Next up</p><h2>Free window at ${clock(primary.w.start)}</h2>
         <p class="small">${plural(primary.w.waiting, 'errand')} ${primary.w.waiting === 1 ? 'is' : 'are'} waiting. Plan ${primary.w.waiting === 1 ? 'it' : 'them'} ${primary.w.next ? 'before class' : 'today'}.</p>`
      : `<p class="small">Next up</p><h2>${n ? 'Nothing fits today' : 'All clear'}</h2>
         <p class="small">${n ? 'Try Plan ahead to move errands to another day.' : 'No errands waiting.'}</p>`;
    $('sidecard').innerHTML = `<h3>Errands waiting</h3>` + (waiting.length
      ? waiting.map(t => {
        const due = dueLabel(t);
        return `<div class="setting"><span>${esc(t.name)}</span>${t.dueDate ? `<span class="badge">${due}</span>` : `<span class="meta">${due}</span>`}</div>`;
      }).join('')
      : '<p class="meta">Nothing waiting.</p>');
    $('routetitle').textContent = 'Today’s route';
    showRoute('todaymap', { legs: primary ? [legOf(primary.w)] : [], compact: true });
    $('routecaption').textContent = primary ? `Suggested route for the ${clock(primary.w.start)} window.` : 'Plan a window to see stops here.';
  }
}

export function bindToday(onChange) {
  $('today').addEventListener('click', e => {
    const plan = e.target.closest('[data-plan]');
    if (plan) { location.hash = `plan/${plan.dataset.plan}`; return; }
    if (e.target.closest('#undoplan') || e.target.closest('#finishplan')) { clearAccepted(); onChange(); return; }
    if (e.target.closest('#advance')) { advance(); onChange(); }
  });
  $('addcta').onclick = () => {
    location.hash = 'errands';
    focusErrandForm();
  };
}
