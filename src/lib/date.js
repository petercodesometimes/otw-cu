// Calendar dates are local "YYYY-MM-DD" strings so they compare and store cleanly.
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const fromIso = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const todayIso = () => iso(new Date());
export const addDays = (s, n) => { const d = fromIso(s); d.setDate(d.getDate() + n); return iso(d); };
export const daysBetween = (a, b) => Math.round((fromIso(b) - fromIso(a)) / 864e5);
export const dayName = s => DAY_NAMES[fromIso(s).getDay()];
// Monday of the week containing s.
export const weekStart = s => addDays(s, -((fromIso(s).getDay() + 6) % 7));

const format = (s, options) => fromIso(s).toLocaleDateString('en-US', options);
export const weekdayLong = s => format(s, { weekday: 'long' });       // Tuesday
export const shortDate = s => format(s, { weekday: 'short', month: 'short', day: 'numeric' }); // Mon, Nov 23
export const longDate = s => format(s, { weekday: 'long', month: 'long', day: 'numeric' });    // Monday, November 23
export const monthDay = s => format(s, { month: 'short', day: 'numeric' });                     // Nov 23
