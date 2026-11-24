// Clock times are same-day local times represented as minutes after midnight.
export function mins(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return NaN;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
// 13:30 → "1:30 PM"
export function fmt(value) {
  value = Math.round(value);
  return `${clock(value)} ${value < 720 ? 'AM' : 'PM'}`;
}
// 13:30 → "1:30"
export function clock(value) {
  value = Math.round(value);
  return `${Math.floor(value / 60) % 12 || 12}:${String(value % 60).padStart(2, '0')}`;
}
// 13:00 → "1 PM", 13:30 → "1:30 PM", 24:00 → "midnight"
export function hour(value) {
  if (value >= 1440) return 'midnight';
  const h = value % 60 ? clock(value) : String(Math.floor(value / 60) % 12 || 12);
  return `${h} ${value < 720 ? 'AM' : 'PM'}`;
}
// 45 → "45 min", 120 → "2 hr", 95 → "1 hr 35 min"
export function span(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60)} hr${rest ? ` ${rest} min` : ''}`;
}
// "HH:MM" for <input type="time">
export function toInput(value) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
