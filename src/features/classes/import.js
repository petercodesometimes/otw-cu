import { places } from '../../data/locations.js';

// Parses class schedules from calendar files (.ics) and pasted text.
// Each result: { name, days: ['Mon', ...], start, end, where } with times in minutes after midnight.

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ICS_DAYS = { MO: 'Mon', TU: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' };
const WORD_DAYS = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const LETTER_DAYS = { M: 'Mon', T: 'Tue', W: 'Wed', R: 'Thu', F: 'Fri', S: 'Sat', U: 'Sun' };
const sortDays = days => [...new Set(days)].sort((a, b) => WEEK.indexOf(a) - WEEK.indexOf(b));

// Match free text like "Hamilton Hall 309" to a known place id, or null.
export function matchPlace(text) {
  const t = (text || '').toLowerCase();
  if (t.length < 3) return null;
  const hit = places.find(p => t.includes(p.short.toLowerCase()) || t.includes(p.id));
  return hit ? hit.id : null;
}

// "10:00", "1:15pm", "13:00" → minutes. Times without am/pm before 8 are read as afternoon.
export function parseClock(text) {
  const m = text.trim().toLowerCase().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a|p)?$/);
  if (!m) return NaN;
  let h = +m[1];
  const min = +(m[2] || 0), suffix = m[3];
  if (suffix) {
    if (suffix[0] === 'p' && h < 12) h += 12;
    if (suffix[0] === 'a' && h === 12) h = 0;
  } else if (h < 8) {
    h += 12;
  }
  return h > 23 || min > 59 ? NaN : h * 60 + min;
}

function parseDays(text) {
  const days = [];
  for (const token of text.split(/[\s,/&|+-]+/).filter(Boolean)) {
    const word = WORD_DAYS[token.slice(0, 3).toLowerCase()];
    if (word) days.push(word);
    else if (/^[MTWRFSU]{2,}$/.test(token)) days.push(...[...token].map(c => LETTER_DAYS[c]));
  }
  return sortDays(days);
}

const TIME = String.raw`\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?`;
const RANGE = new RegExp(`(${TIME})\\s*(?:-|–|—|to)\\s*(${TIME})`, 'i');
const DAY_WORD = /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b|\b[MTWRFSU]{2,}\b/i;
const trimSeparators = s => s.replace(/^[\s,;·|:-]+|[\s,;·|:-]+$/g, '');

// One class per line, e.g. "Intro Stats, Mon/Wed/Fri, 10:00-11:15, Hamilton Hall".
export function parsePasted(text) {
  const classes = [], errors = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const range = line.match(RANGE);
    const dayAt = line.search(DAY_WORD);
    if (!range || dayAt < 0) { errors.push(i + 1); return; }
    const start = parseClock(range[1]);
    let end = parseClock(range[2]);
    if (end <= start && !/[ap]/i.test(range[2])) end += 720;
    const days = parseDays(line.slice(dayAt, range.index));
    const name = trimSeparators(line.slice(0, dayAt));
    if (!name || !days.length || !(end > start)) { errors.push(i + 1); return; }
    classes.push({ name, days, start, end, where: trimSeparators(line.slice(range.index + range[0].length)) });
  });
  return { classes, errors };
}

function icsTime(value) {
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!m || !m[4]) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const date = value.endsWith('Z') ? new Date(Date.UTC(y, mo - 1, d, h, mi)) : new Date(y, mo - 1, d, h, mi);
  return { minutes: date.getHours() * 60 + date.getMinutes(), day: WEEK[(date.getDay() + 6) % 7] };
}

const unescapeIcs = s => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();

// Reads VEVENTs; weekly events are merged by name and time so one class appears once.
export function parseIcs(text) {
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const events = [];
  let event = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') event = {};
    else if (line === 'END:VEVENT') { if (event) events.push(event); event = null; }
    else if (event) {
      const colon = line.indexOf(':');
      if (colon > 0) event[line.slice(0, colon).split(';')[0].toUpperCase()] = line.slice(colon + 1);
    }
  }
  const merged = new Map();
  let skipped = 0;
  for (const e of events) {
    const start = e.DTSTART && icsTime(e.DTSTART), end = e.DTEND && icsTime(e.DTEND);
    if (!start || !end || !e.SUMMARY) { skipped++; continue; }
    const byDay = (e.RRULE || '').match(/BYDAY=([^;]+)/);
    const days = byDay ? byDay[1].split(',').map(d => ICS_DAYS[d.slice(-2)]).filter(Boolean) : [start.day];
    const name = unescapeIcs(e.SUMMARY), where = unescapeIcs(e.LOCATION || '');
    const key = `${name}|${start.minutes}|${end.minutes}|${where}`;
    const found = merged.get(key);
    if (found) found.days = sortDays([...found.days, ...days]);
    else merged.set(key, { name, days: sortDays(days), start: start.minutes, end: end.minutes, where });
  }
  return { classes: [...merged.values()], skipped };
}
