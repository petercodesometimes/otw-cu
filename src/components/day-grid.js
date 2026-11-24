import { hour } from '../lib/time.js';

// Calendar-style day: one row per hour, midnight to midnight.
// entries: [{ start, html }] — each card is placed in the hour it starts.
// spans:   [{ start, end, kind }] — shading that fills the hours it covers ('class' | 'window').
// hours:   task hours { start, end }; hours fully outside are drawn compact and hatched.
// now:     minutes after midnight for the red current-time line, or null.
export function dayGrid({ entries = [], spans = [], hours, now = null }) {
  const offSpans = [{ start: 0, end: hours.start, kind: 'off' }, { start: hours.end, end: 1440, kind: 'off' }];
  let html = '<div class="daygrid">';
  for (let h = 0; h < 24; h++) {
    const a = h * 60, b = a + 60;
    const off = b <= hours.start || a >= hours.end;
    const shades = [...offSpans, ...spans]
      .filter(s => s.start < b && s.end > a)
      .map(s => {
        const top = (Math.max(s.start, a) - a) / 60 * 100;
        const bottom = (Math.min(s.end, b) - a) / 60 * 100;
        return `<span class="shade ${s.kind}" style="top:${top}%;height:${bottom - top}%"></span>`;
      }).join('');
    const content = entries
      .filter(e => Math.floor(e.start / 60) === h)
      .sort((x, y) => x.start - y.start)
      .map(e => e.html).join('');
    const nowLine = now != null && now >= a && now < b
      ? `<span class="nowline" style="top:${(now - a) / 60 * 100}%" title="Now"></span>` : '';
    html += `<div class="hrow${off ? ' off' : ''}"><span class="hlabel">${hour(a)}</span>
      <div class="hcell">${shades}${nowLine}<div class="hcontent">${content}</div></div></div>`;
  }
  return `${html}</div>`;
}
