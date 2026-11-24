import { $, esc, plural } from '../../lib/dom.js';
import { clock } from '../../lib/time.js';
import { todayIso, addDays, weekStart, dayName, fromIso, monthDay, weekdayLong, longDate } from '../../lib/date.js';
import { dueLabel } from '../../lib/labels.js';
import { place } from '../../data/locations.js';
import { state, save } from '../../state/store.js';
import { planDay, classesOn, candidatesFor } from '../planning/day.js';
import { focusErrandForm } from '../errands/errands.js';

let selected = todayIso();

const lastWord = name => { const w = name.trim().split(/\s+/).at(-1); return w[0].toUpperCase() + w.slice(1); };
const row = (time, card) => `<div class="trow"><span class="tlabel">${clock(time)}</span>${card}</div>`;

function dayStatus(date) {
  const today = todayIso();
  if (date < today) return 'Past';
  if (state.tasks.some(t => t.scheduled === date) || (date === today && state.accepted?.date === today)) return 'Planned';
  const due = state.tasks.find(t => t.dueDate === date);
  if (due) return `${lastWord(due.name)} due`;
  if (!classesOn(date).length) return 'Free day';
  if (date === today && candidatesFor(today).length) return 'Needs plan';
  return 'No errands';
}

export function renderAhead() {
  const today = todayIso();
  const start = weekStart(selected);
  $('weeklabel').textContent = `${monthDay(start)} – ${fromIso(addDays(start, 6)).getDate()}`;
  $('week').innerHTML = Array.from({ length: 7 }, (_, k) => {
    const date = addDays(start, k);
    return `<button class="day ${date === selected ? 'selected' : ''} ${date === today ? 'today' : ''}" data-day="${date}">
      <span>${dayName(date)}</span><b>${fromIso(date).getDate()}</b><span>${dayStatus(date)}</span></button>`;
  }).join('');

  const day = planDay(selected);
  $('aheadtitle').textContent = `${longDate(selected)}: free time and plan`;
  const items = [
    ...day.classes.map(c => ({
      start: c.start,
      html: row(c.start, `<div class="card class"><h3>${esc(c.name)}</h3><p class="meta">${clock(c.start)} – ${clock(c.end)} · ${esc(place(c.loc).short)}</p></div>`)
    })),
    ...day.windows.map(w => ({
      start: w.start,
      html: w.best.route.length
        ? w.best.route.map(t => row(t.begin, `<div class="card stop solo"><h3>${esc(t.name)}</h3><p class="meta">${esc(place(t.loc).short)} · ${t.duration} min</p></div>`)).join('')
        : row(w.start, `<div class="card window"><p class="meta">Free window ${clock(w.start)} – ${clock(w.end)} · nothing planned</p></div>`)
    }))
  ].sort((a, b) => a.start - b.start);
  $('aheadlist').innerHTML = items.map(i => i.html).join('') || '<p class="meta">No free time on this day.</p>';

  $('aheaddidntfit').innerHTML = day.unplanned.length
    ? `<div class="card dashed"><h3>Didn’t fit on ${weekdayLong(selected)}</h3><p class="meta">${day.unplanned.map(t => esc(t.name)).join(' · ')}. Try another day or a shorter errand.</p></div>`
    : '';

  const past = selected < today;
  const unscheduled = state.tasks.filter(t => !t.scheduled);
  const scheduledHere = state.tasks.filter(t => t.scheduled === selected);
  let side = '';
  if (selected === today) {
    side += '<p class="meta">Unscheduled errands are planned on Today automatically.</p>';
  } else if (past) {
    side += '<p class="meta">This day has passed.</p>';
  } else {
    side += '<p class="meta">Unscheduled errands</p>' + (unscheduled.length
      ? unscheduled.map(t => `<div class="setting"><span>${esc(t.name)} <span class="small muted">${dueLabel(t)}</span></span><button class="pill" data-schedule="${t.id}">Add</button></div>`).join('')
      : '<p class="meta">None — everything has a day.</p>');
  }
  if (scheduledHere.length && selected !== today) {
    side += `<p class="meta spaced">On ${weekdayLong(selected)}</p>` + scheduledHere.map(t =>
      `<div class="setting"><span>${esc(t.name)}</span><button class="pill" data-unschedule="${t.id}">Remove</button></div>`).join('');
  }
  $('aheadadd').innerHTML = side;
  $('autoplan').textContent = `Auto-plan ${weekdayLong(selected)}`;
  $('autoplan').disabled = past || selected === today;
}

function autoPlan() {
  const candidates = candidatesFor(selected, { includeUnscheduled: true });
  const day = planDay(selected, { candidates });
  const placed = day.windows.flatMap(w => w.best.route).filter(t => !t.scheduled);
  for (const t of placed) state.tasks.find(x => x.id === t.id).scheduled = selected;
  save();
  return placed.length
    ? `Added ${plural(placed.length, 'errand')} to ${weekdayLong(selected)}.`
    : `Nothing else fits on ${weekdayLong(selected)}.`;
}

export function bindAhead(onChange) {
  const message = text => { $('aheadmsg').textContent = text; };
  $('week').onclick = e => {
    const day = e.target.closest('[data-day]');
    if (!day) return;
    selected = day.dataset.day;
    message('');
    renderAhead();
  };
  $('prevweek').onclick = () => { selected = addDays(selected, -7); message(''); renderAhead(); };
  $('nextweek').onclick = () => { selected = addDays(selected, 7); message(''); renderAhead(); };
  $('aheadadd').onclick = e => {
    const add = e.target.closest('[data-schedule]'), remove = e.target.closest('[data-unschedule]');
    const id = Number((add || remove)?.dataset.schedule ?? (add || remove)?.dataset.unschedule);
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    task.scheduled = add ? selected : null;
    save();
    message('');
    onChange();
  };
  $('autoplan').onclick = () => {
    const text = autoPlan();
    onChange();
    message(text);
  };
  $('aheadnew').onclick = () => {
    location.hash = 'errands';
    focusErrandForm();
  };
}
