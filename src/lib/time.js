// Clock times are same-day local times represented as minutes after midnight.
export function mins(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return NaN;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
export function fmt(value) {
  value = Math.round(value);
  return `${Math.floor(value / 60) % 12 || 12}:${String(value % 60).padStart(2, '0')} ${value < 720 ? 'AM' : 'PM'}`;
}
