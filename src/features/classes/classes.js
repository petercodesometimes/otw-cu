import { $, esc, plural } from '../../lib/dom.js';
import { clock, mins, toInput } from '../../lib/time.js';
import { place } from '../../data/locations.js';
import { state, save, resetState } from '../../state/store.js';
import { matchPlace, parseIcs, parsePasted } from './import.js';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PACES = ['Slow', 'Average', 'Fast'];
const BUFFERS = [0, 5, 10];
const FALLBACK_PLACE = 'low';
let editingId = null;

const next = (list, value) => list[(list.indexOf(value) + 1) % list.length];
const overlaps = (a, ignoreId) => state.classes.find(c =>
  c.id !== ignoreId && c.days.some(d => a.days.includes(d)) && a.start < c.end && a.end > c.start);

export function renderClasses() {
  $('classlist').innerHTML = state.classes
    .slice()
    .sort((a, b) => WEEKDAYS.indexOf(a.days[0]) - WEEKDAYS.indexOf(b.days[0]) || a.start - b.start)
    .map(c => `<div class="card ${editingId === c.id ? 'editing' : ''}"><div class="row"><h3>${esc(c.name)}</h3>
      <button class="pill" data-edit="${c.id}">${editingId === c.id ? 'Editing' : 'Edit'}</button></div>
      <p class="meta">${c.days.join(' / ')} · ${clock(c.start)}–${clock(c.end)} · ${esc(place(c.loc).short)}</p></div>`)
    .join('') || '<p class="meta">No classes yet. Import them above or add one on the right.</p>';
  $('pace').textContent = state.settings.pace;
  $('buffer').textContent = `${state.settings.buffer} min`;
}

function setEditing(c) {
  editingId = c ? c.id : null;
  $('classformtitle').textContent = c ? 'Edit class' : 'Or add one manually';
  $('editactions').classList.toggle('hidden', !c);
  $('classerror').textContent = '';
  if (c) {
    $('classname').value = c.name;
    $('classstart').value = toInput(c.start);
    $('classend').value = toInput(c.end);
    $('classlocation').value = c.loc;
    document.querySelectorAll('[name=classday]').forEach(box => { box.checked = c.days.includes(box.value); });
    setTimeout(() => $('classname').focus(), 0);
  } else {
    $('classform').reset();
  }
}

// Adds parsed classes, skipping overlaps; unknown buildings fall back to Low Library.
function importClasses(parsed, problems = 0) {
  let added = 0, clashes = 0, unknown = 0;
  for (const c of parsed) {
    let loc = matchPlace(c.where);
    if (!loc) { loc = FALLBACK_PLACE; unknown++; }
    const entry = { id: Date.now() + state.classes.length, name: c.name, days: c.days, start: c.start, end: c.end, loc };
    if (overlaps(entry)) { clashes++; continue; }
    state.classes.push(entry);
    added++;
  }
  save();
  const notes = [`Imported ${plural(added, 'class')}.`];
  if (clashes) notes.push(`${plural(clashes, 'class')} skipped because ${clashes === 1 ? 'it overlaps' : 'they overlap'} existing classes.`);
  if (problems) notes.push(`${problems} ${problems === 1 ? 'entry' : 'entries'} couldn’t be read.`);
  if (unknown) notes.push(`${plural(unknown, 'building')} not recognized; set to ${place(FALLBACK_PLACE).short}. Use Edit to fix.`);
  $('importmsg').textContent = notes.join(' ');
}

export function bindClasses(onChange) {
  $('classdays').insertAdjacentHTML('beforeend', WEEKDAYS.slice(0, 5).map(day =>
    `<label class="pill check"><input type="checkbox" name="classday" value="${day}">${day}</label>`).join(''));

  $('importtop').onclick = () => {
    $('importcard').scrollIntoView({ block: 'center' });
    $('importcard').classList.add('flash');
    setTimeout(() => $('importcard').classList.remove('flash'), 900);
  };
  $('uploadics').onclick = () => $('icsfile').click();
  const readFile = async file => {
    if (!file) return;
    const { classes, skipped } = parseIcs(await file.text());
    if (!classes.length) { $('importmsg').textContent = 'No classes found in that file.'; return; }
    importClasses(classes, skipped);
    onChange();
  };
  $('icsfile').onchange = e => { readFile(e.target.files[0]); e.target.value = ''; };
  $('importcard').addEventListener('dragover', e => { e.preventDefault(); $('importcard').classList.add('drop'); });
  $('importcard').addEventListener('dragleave', () => $('importcard').classList.remove('drop'));
  $('importcard').addEventListener('drop', e => {
    e.preventDefault();
    $('importcard').classList.remove('drop');
    readFile(e.dataTransfer.files[0]);
  });
  $('pastebtn').onclick = () => { $('pastebox').classList.toggle('hidden'); $('pastetext').focus(); };
  $('pasteimport').onclick = () => {
    const { classes, errors } = parsePasted($('pastetext').value);
    if (!classes.length) {
      $('importmsg').textContent = 'Couldn’t read that. Use one class per line: Name, Days, Start-End, Building.';
      return;
    }
    importClasses(classes, errors.length);
    $('pastetext').value = '';
    $('pastebox').classList.add('hidden');
    onChange();
  };
  $('photobtn').onclick = () => {
    $('importmsg').textContent = 'Adding by photo isn’t available yet. Upload an .ics file or paste your schedule instead.';
  };

  $('classlist').onclick = e => {
    const edit = e.target.closest('[data-edit]');
    if (!edit) return;
    const c = state.classes.find(x => String(x.id) === edit.dataset.edit);
    setEditing(editingId === c.id ? null : c);
    renderClasses();
  };
  $('classcancel').onclick = () => { setEditing(null); renderClasses(); };
  $('classdelete').onclick = () => {
    state.classes = state.classes.filter(c => c.id !== editingId);
    save();
    setEditing(null);
    onChange();
  };
  $('classform').onsubmit = e => {
    e.preventDefault();
    const days = [...document.querySelectorAll('[name=classday]:checked')].map(box => box.value);
    const start = mins($('classstart').value), end = mins($('classend').value);
    const error = text => { $('classerror').textContent = text; };
    if (!days.length) return error('Pick at least one day.');
    if (!(end > start)) return error('Class end must be later than start.');
    const entry = { name: $('classname').value.trim() || 'Class', days, start, end, loc: $('classlocation').value };
    const clash = overlaps(entry, editingId);
    if (clash) return error(`This overlaps ${clash.name}.`);
    const existing = state.classes.find(c => c.id === editingId);
    if (existing) Object.assign(existing, entry);
    else state.classes.push({ id: Date.now(), ...entry });
    save();
    setEditing(null);
    onChange();
  };

  $('pace').onclick = () => { state.settings.pace = next(PACES, state.settings.pace); save(); onChange(); };
  $('buffer').onclick = () => { state.settings.buffer = next(BUFFERS, state.settings.buffer); save(); onChange(); };
  $('reset').onclick = () => {
    if (!confirm('Replace your errands, classes, and plan with the demo data?')) return;
    resetState();
    setEditing(null);
    onChange();
  };
}
