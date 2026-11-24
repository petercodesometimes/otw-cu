import { $ } from '../../lib/dom.js';
import { hour, mins, toInput } from '../../lib/time.js';
import { state, save, resetState } from '../../state/store.js';
import { taskHours } from '../planning/day.js';

export function renderSettings() {
  const { start, end } = taskHours();
  // Skip fields being edited so typing isn't interrupted by a re-render.
  if (document.activeElement !== $('daystart')) $('daystart').value = toInput(start);
  if (document.activeElement !== $('dayend')) $('dayend').value = toInput(end % 1440);
  $('pace').value = state.settings.pace;
  $('buffer').value = String(state.settings.buffer);
}

export function bindSettings(onChange) {
  const saved = text => { $('settingsmsg').textContent = text; };
  const saveHours = () => {
    const start = mins($('daystart').value);
    let end = mins($('dayend').value);
    if (end === 0) end = 1440;   // 12:00 AM end = midnight
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    if (end - start < 30) {
      $('hourserror').textContent = 'Day end must be at least 30 minutes after it starts.';
      return;
    }
    $('hourserror').textContent = '';
    state.settings.dayStart = start;
    state.settings.dayEnd = end;
    save();
    saved(`Saved. Errands are planned ${hour(start)} – ${hour(end)}.`);
    onChange();
  };
  $('daystart').onchange = saveHours;
  $('dayend').onchange = saveHours;
  $('pace').onchange = () => { state.settings.pace = $('pace').value; save(); saved('Saved walking pace.'); onChange(); };
  $('buffer').onchange = () => { state.settings.buffer = Number($('buffer').value); save(); saved('Saved buffer.'); onChange(); };
  $('reset').onclick = () => {
    if (!confirm('Replace your errands, classes, plan, and settings with the demo data?')) return;
    resetState();
    saved('Demo data restored.');
    onChange();
  };
}
