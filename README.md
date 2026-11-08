# OTW CU — editable MVP

Everything’s on the way.

Plain HTML, CSS, and JavaScript modules. No npm install, framework, or build step required.

## Start

1. Unzip the project and open the `otw-cu-editable` folder in VS Code.
2. Open its terminal and run `python3 -m http.server 8000`.
3. Visit http://localhost:8000. Keep the terminal running.
4. Edit files, save, and refresh the browser. Do not open index.html directly: modules and page loading need HTTP.

## Where to edit

| Change | File |
| --- | --- |
| Logo, header, navigation, footer | `index.html` |
| Planner page layout and form fields | `pages/planner.html` |
| Classes page layout | `pages/classes.html` |
| About page content | `pages/about.html` |
| Colors, typography, spacing, mobile layout | `styles/main.css` |
| Add/remove campus locations and change sample hours | `src/data/locations.js` |
| Default stops and classes | `src/data/demo.js` |
| Add/remove/select stops, stop list rendering | `src/features/errands/errands.js` |
| Class creation, overlap checks, class list rendering | `src/features/classes/classes.js` |
| Class-aware window, timeline, deferred-task explanations | `src/features/planning/planner.js` |
| Route scoring and scheduling constraints | `src/features/planning/optimizer.js` |
| Walking-time estimates or future directions API | `src/features/planning/walking.js` |
| Campus route drawing | `src/components/campus-map.js` |
| Browser saving and reset behavior | `src/state/store.js` |
| Time parsing/formatting | `src/lib/time.js` |
| DOM lookup and text escaping | `src/lib/dom.js` |
| Page loading and URL hash navigation | `src/router.js` |
| App startup and connecting features | `src/main.js` |

These are separate page templates in one application. Navigation supports #planner, #classes, and #about; no framework router is needed.

## Add a page

1. Create `pages/shared.html` with the page's HTML.
2. Add `shared` to `pageNames` in `src/router.js`.
3. Add `<section id="shared" class="hidden"></section>` inside main in `index.html`.
4. Add `<button data-tab="shared">Shared lists</button>` to the navigation.
5. Put behavior in `src/features/shared/shared.js`, export its setup function, and call it in `src/main.js` after `loadPages()`.

Preserve existing element IDs when changing layouts because feature modules use them.

## Data conventions

- `loc` refers to a location's unique `id`.
- Class start/end, deadlines, and opening/closing times are minutes after midnight: 13:00 = 780.
- Task durations and arrival buffers are minutes.
- Location `lat`/`lon` supply walking estimates; `x`/`y` position schematic map markers.
- Change demo data, then click About MVP → Reset demo data to replace previously saved browser data.
- Classes are for one planning day; recurring schedules and overnight windows are not supported.

## Planning algorithm

Up to eight stops are evaluated in feasible orders. Plans maximize completed tasks, then minimize walking, then prefer earlier arrival. The next class truncates the window and sets its destination. Service duration must finish before closing and any task deadline. Final walking and the arrival buffer must fit too.

## Checks

With Node.js installed, run `npm test` (no install required) or `node --test tests/*.test.js`.

## Remaining prototype limits

Campus hours are unverified demo data. Walking uses coordinate estimates, not real paths. Data stays in browser localStorage; no accounts, database, shared lists, or friend matching is implemented. Add verified hours, service eligibility, and walking directions before relying on this for real trips.
