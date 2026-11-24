# OTW CU — editable MVP

Everything’s on the way.

Plain HTML, CSS, and JavaScript modules. No npm install, framework, or build step required.

## Start

1. Open the project folder in VS Code.
2. Open its terminal and run `python3 -m http.server 8000`.
3. Visit http://localhost:8000. Keep the terminal running.
4. Edit files, save, and refresh the browser. Do not open index.html directly: modules and page loading need HTTP.

## Pages

A desktop web app (columns stack on narrow screens), styled after the CodeCollab mockups:

- **Today** (`#today`): stats, a time-gutter timeline of classes and free windows, next-up card, waiting errands, and a route preview. After you start a plan it shows each stop, progress, and Start walking / Mark done.
- **Plan** (`#plan/N`): the route for today's free window N, what didn't fit and why, a route map, and Start plan.
- **Plan ahead** (`#ahead`): pick a day in any week, see its free time, add unscheduled errands to it, or auto-plan it.
- **Errands** (`#errands`): errand cards with location filters and an add form.
- **Classes** (`#classes`): import from an `.ics` file or pasted text, and edit classes.
- **Settings** (`#settings`): task hours (when errands can be planned), walking pace, buffer, and reset demo data.
- **Map** (`#map`): schematic route map per window, or all stops.
- **Walk together** (`#walk`): walking-buddy UI. Matching is not live; buddies are labeled sample profiles.

## Where to edit

| Change | File |
| --- | --- |
| Top bar and tabs | `index.html` |
| Page layouts | `pages/*.html` |
| Colors, typography, spacing | `styles/main.css` |
| Campus locations and sample hours | `src/data/locations.js` |
| Default errands, classes, settings, sample buddies | `src/data/demo.js` |
| Today page | `src/features/today/today.js` |
| Plan view and "didn't fit" explanations | `src/features/planning/planner.js` |
| Accepting a plan, Start walking, Mark done | `src/features/planning/accept.js` |
| Plan ahead page | `src/features/ahead/ahead.js` |
| Errands page | `src/features/errands/errands.js` |
| Classes page | `src/features/classes/classes.js` |
| Settings page | `src/features/settings/settings.js` |
| `.ics` and pasted-schedule parsing | `src/features/classes/import.js` |
| Map page | `src/features/map/map.js` |
| Interactive map (Leaflet + OpenStreetMap, real walking paths) | `src/components/live-map.js` |
| Offline fallback map drawing | `src/components/route-map.js` |
| Walk together page | `src/features/walk/walk.js` |
| Free windows and filling them with errands | `src/features/planning/day.js` |
| Route scoring and scheduling constraints | `src/features/planning/optimizer.js` |
| Walking-time estimates and pace | `src/features/planning/walking.js` |
| Browser saving and reset behavior | `src/state/store.js` |
| Dates, times, and due labels | `src/lib/date.js`, `src/lib/time.js`, `src/lib/labels.js` |
| Page loading and URL hash navigation | `src/router.js` |
| App startup and re-rendering | `src/main.js` |

## Add a page

1. Create `pages/shared.html` with the page's HTML.
2. Add `shared` to `pageNames` in `src/router.js`.
3. Add `<section id="shared" class="hidden"></section>` inside main in `index.html`.
4. Add `<button data-tab="shared">Shared</button>` to the tabs in the top bar.
5. Put behavior in `src/features/shared/shared.js` and wire it up in `src/main.js`.

Preserve existing element IDs when changing layouts because feature modules use them.

## Data conventions

- `loc` refers to a location's unique `id`.
- Class start/end, due times, and opening/closing times are minutes after midnight: 13:00 = 780.
- Errand `dueDate` and `scheduled` are `YYYY-MM-DD` strings or null. Unscheduled errands are planned on today.
- Task durations and arrival buffers are minutes.
- Location `lat`/`lon` supply walking estimates. Set `verified` to a date once hours are checked.
- Classes repeat weekly on their `days` (`'Mon'`…`'Fri'`). The schedule shows the whole day (midnight to midnight); errands are only planned inside task hours (`settings.dayStart`/`dayEnd`, default 8:00 AM–10:00 PM), set on the Settings page.
- Change demo data, then use Settings → Reset demo data to replace previously saved browser data.
- Unrecognized buildings in imported classes fall back to Low Library; fix them with Edit.

## Planning algorithm

Free windows are the gaps between today's classes. Windows are filled in order; each takes the best route over errands not already placed. Up to eight errands are evaluated in feasible orders. Plans maximize completed errands, then minimize walking, then prefer earlier arrival. The next class ends the window and sets its destination. Service duration must finish before closing and any task deadline. Final walking and the arrival buffer must fit too.

## Maps

Maps use [Leaflet](https://leafletjs.com) with OpenStreetMap tiles (loaded from the internet in `index.html`, no API key). Walking paths are drawn using the public FOSSGIS foot-routing server (`routing.openstreetmap.de`), which receives only building coordinates. Walking *times* still come from `walking.js` estimates. Without internet, the app falls back to a drawn schematic map. These free services are for light use; for heavier use, switch to a paid tile/routing provider or Google Maps (which needs an API key with billing).

## Checks

With Node.js installed, run `npm test` (no install required) or `node --test tests/*.test.js`.

## Remaining prototype limits

Campus hours are unverified demo data. Walking uses coordinate estimates, not real paths. Data stays in browser localStorage; no accounts, reminders, photo import, shared lists, or walking-buddy matching is implemented. Add verified hours, service eligibility, and walking directions before relying on this for real trips.
