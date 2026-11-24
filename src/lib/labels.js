import { fmt, hour } from './time.js';
import { todayIso, daysBetween, dayName, monthDay } from './date.js';
import { esc } from './dom.js';

// "Due 5 PM" (today), "Due Fri" (this week), "Due Dec 4", or "No deadline".
export function dueLabel(task) {
  if (!task.dueDate) return 'No deadline';
  const days = daysBetween(todayIso(), task.dueDate);
  if (days < 0) return 'Overdue';
  if (days === 0) return task.dueTime != null ? `Due ${hour(task.dueTime)}` : 'Due today';
  const when = days < 7 ? dayName(task.dueDate) : monthDay(task.dueDate);
  return `Due ${when}${task.dueTime != null ? ` ${fmt(task.dueTime)}` : ''}`;
}

export const hoursLabel = p => `Open ${hour(p.open)}–${hour(p.close)}`;
export const verifiedLabel = p => (p.verified ? `Verified ${esc(p.verified)}` : 'Hours unverified');
