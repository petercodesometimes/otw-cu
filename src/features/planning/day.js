import { state } from '../../state/store.js';
import { optimize } from './optimizer.js';
import { todayIso, dayName } from '../../lib/date.js';

// The planning day and where it starts. Free windows shorter than MIN_WINDOW are ignored.
export const DAY_START = 540;   // 9:00 AM
export const DAY_END = 1080;    // 6:00 PM
export const MIN_WINDOW = 20;
export const HOME = 'low';

export const nowMinutes = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

export function classesOn(date) {
  return state.classes.filter(c => c.days.includes(dayName(date))).sort((a, b) => a.start - b.start);
}

// The latest finish time an errand allows on `date`: null = no limit, -1 = already overdue.
function deadlineOn(task, date) {
  if (!task.dueDate) return null;
  if (task.dueDate < date) return -1;
  if (task.dueDate === date) return task.dueTime ?? 1440;
  return null;
}

// Errands to plan on `date`: those scheduled for it, plus unscheduled ones on today.
export function candidatesFor(date, { includeUnscheduled = date === todayIso() } = {}) {
  return state.tasks
    .filter(t => t.scheduled === date || (includeUnscheduled && !t.scheduled))
    .map(t => ({ ...t, deadline: deadlineOn(t, date) }));
}

function gapsOn(classes) {
  const gaps = [];
  let cursor = DAY_START, loc = HOME;
  for (const c of classes) {
    if (c.start - cursor >= MIN_WINDOW) gaps.push({ start: cursor, end: c.start, origin: loc, dest: c.loc, next: c });
    cursor = Math.max(cursor, c.end);
    loc = c.loc;
  }
  if (DAY_END - cursor >= MIN_WINDOW) gaps.push({ start: cursor, end: DAY_END, origin: loc, dest: null, next: null });
  return gaps;
}

// Finds free windows between the day's classes, then fills them in order:
// each window gets the best route over errands not already placed earlier.
// Today's accepted window keeps its frozen route.
export function planDay(date = todayIso(), { candidates } = {}) {
  const classes = classesOn(date);
  const gaps = gapsOn(classes);
  let accepted = date === todayIso() && state.accepted?.date === date ? state.accepted : null;
  if (accepted && !gaps.some(g => g.start === accepted.start)) accepted = null;
  const locked = new Set(accepted ? accepted.stops.map(s => s.id) : []);
  let remaining = (candidates || candidatesFor(date)).filter(t => !locked.has(t.id));

  const windows = gaps.map(gap => {
    const buffer = gap.dest ? state.settings.buffer : 0;
    if (accepted && gap.start === accepted.start) {
      return {
        ...gap, buffer, waiting: accepted.stops.length, skipped: [], accepted,
        best: { route: accepted.stops, walking: accepted.walking, finish: accepted.finish }
      };
    }
    const waiting = remaining.length;
    const best = optimize(remaining, gap.start, gap.end, gap.origin, gap.dest, buffer);
    const placed = new Set(best.route.map(t => t.id));
    remaining = remaining.filter(t => !placed.has(t.id));
    return { ...gap, buffer, waiting, best, skipped: remaining };
  });
  return { date, classes, windows, unplanned: remaining, accepted };
}
