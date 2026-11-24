import { $, esc } from './lib/dom.js';
import { shortDate, todayIso } from './lib/date.js';
import { places } from './data/locations.js';
import { state } from './state/store.js';
import { loadPages, bindNavigation, currentRoute } from './router.js';
import { setPace } from './features/planning/walking.js';
import { planDay } from './features/planning/day.js';
import { renderToday, bindToday } from './features/today/today.js';
import { renderAhead, bindAhead } from './features/ahead/ahead.js';
import { renderErrands, bindErrands } from './features/errands/errands.js';
import { renderClasses, bindClasses } from './features/classes/classes.js';
import { renderMap, bindMap } from './features/map/map.js';
import { renderWalk, bindWalk } from './features/walk/walk.js';
import { renderPlan, bindPlan } from './features/planning/planner.js';

const PACE = { Slow: 0.85, Average: 1, Fast: 1.15 };

function getDay() {
  setPace(PACE[state.settings.pace] || 1);
  return planDay(todayIso());
}

// Re-render every page from state; cheap at MVP scale and keeps pages in sync.
function render() {
  const day = getDay();
  const { page, param } = currentRoute();
  $('headerdate').textContent = shortDate(todayIso());
  renderToday(day);
  renderAhead();
  renderErrands();
  renderClasses();
  renderMap(day);
  renderWalk(day);
  if (page === 'plan') renderPlan(day, Number(param));
}

async function start() {
  await loadPages();
  for (const id of ['location', 'classlocation']) {
    $(id).innerHTML = places.map(p => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  }
  bindToday(render);
  bindAhead(render);
  bindErrands(render);
  bindClasses(render);
  bindMap(getDay, render);
  bindWalk(render);
  bindPlan(getDay, render);
  bindNavigation(render);
}
start().catch(error => {
  console.error(error);
  $('today').textContent = 'Could not load the app. Run it using the local server described in README.md.';
});
