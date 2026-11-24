import { $, esc } from '../../lib/dom.js';
import { mins } from '../../lib/time.js';
import { dayName, todayIso } from '../../lib/date.js';
import { dueLabel, hoursLabel, verifiedLabel } from '../../lib/labels.js';
import { place, categories } from '../../data/locations.js';
import { state, save } from '../../state/store.js';

// Exhaustive route search keeps the MVP at eight errands.
const MAX_ERRANDS = 8;
let filter = 'all';

export function focusErrandForm() {
  setTimeout(() => { $('add').scrollIntoView({ block: 'center' }); $('task').focus(); }, 50);
}

export function renderErrands() {
  $('filters').innerHTML = [{ id: 'all', label: 'All' }, ...categories].map(c =>
    `<button class="pill ${filter === c.id ? 'selected' : ''}" data-filter="${c.id}">${c.label}</button>`
  ).join('');
  const shown = state.tasks.filter(t => filter === 'all' || place(t.loc).category === filter);
  $('errandlist').innerHTML = shown.map(t => {
    const p = place(t.loc);
    const details = [
      t.dueDate && dueLabel(t),
      t.scheduled && (t.scheduled === todayIso() ? 'Planned for today' : `Planned for ${dayName(t.scheduled)}`),
      t.shared && `Shared with ${esc(t.shared)}`
    ].filter(Boolean);
    return `<div class="card errand">
      <h3>${esc(t.name)} · ${t.duration} min</h3>
      <p class="meta">${esc(p.short)} · ${hoursLabel(p)} · ${verifiedLabel(p)}${t.note ? ` · ${esc(t.note)}` : ''}</p>
      ${details.length ? `<p class="meta">${details.join(' · ')}</p>` : ''}
      <button class="link danger" data-delete="${t.id}">Remove</button></div>`;
  }).join('') || `<p class="meta">${state.tasks.length ? 'No errands in this category.' : 'Nothing on your list yet. Add one on the right.'}</p>`;
}

export function bindErrands(onChange) {
  $('filters').onclick = e => {
    const button = e.target.closest('[data-filter]');
    if (!button) return;
    filter = button.dataset.filter;
    renderErrands();
  };
  $('errandlist').onclick = e => {
    const remove = e.target.closest('[data-delete]');
    if (!remove) return;
    const id = Number(remove.dataset.delete);
    state.tasks = state.tasks.filter(t => t.id !== id);
    save();
    onChange();
  };
  $('add').onsubmit = e => {
    e.preventDefault();
    if (state.tasks.length >= MAX_ERRANDS) {
      $('errandmessage').textContent = 'This MVP supports up to eight errands. Remove one to add another.';
      return;
    }
    const dueTime = $('duetime').value ? mins($('duetime').value) : null;
    let dueDate = $('duedate').value || null;
    if (dueTime != null && !dueDate) dueDate = todayIso();
    $('errandmessage').textContent = '';
    state.tasks.push({
      id: Date.now(),
      name: $('task').value.trim() || 'New errand',
      loc: $('location').value,
      duration: +$('duration').value,
      dueDate,
      dueTime,
      note: $('note').value.trim(),
      shared: $('shared').value.trim(),
      scheduled: null
    });
    save();
    $('add').reset();
    onChange();
  };
}
