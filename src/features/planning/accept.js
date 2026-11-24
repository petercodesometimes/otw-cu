import { state, save } from '../../state/store.js';

// Freezes one of today's windows as the accepted plan.
export function acceptWindow(day, index) {
  const w = day.windows[index];
  state.accepted = {
    date: day.date, start: w.start, end: w.end, origin: w.origin, dest: w.dest, buffer: w.buffer,
    nextName: w.next?.name ?? null, nextStart: w.next?.start ?? null,
    walking: w.best.walking, finish: w.best.finish,
    stops: w.best.route.map(t => ({
      id: t.id, name: t.name, loc: t.loc, duration: t.duration, note: t.note,
      walk: t.walk, arrival: t.arrival, begin: t.begin, done: t.done, finished: false
    })),
    movedIds: w.skipped.map(t => t.id),
    active: null
  };
  save();
}

export function clearAccepted() {
  state.accepted = null;
  save();
}

export const nextStop = accepted => accepted?.stops.find(s => !s.finished) ?? null;

// Start walking to the next stop, or mark it done (which completes the errand).
export function advance() {
  const acc = state.accepted, stop = nextStop(acc);
  if (!stop) return;
  if (acc.active !== stop.id) {
    acc.active = stop.id;
  } else {
    stop.finished = true;
    acc.active = null;
    state.tasks = state.tasks.filter(t => t.id !== stop.id);
  }
  save();
}
