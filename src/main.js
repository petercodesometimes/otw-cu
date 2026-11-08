import { $, esc } from './lib/dom.js';
import { places } from './data/locations.js';
import { resetState } from './state/store.js';
import { loadPages, bindNavigation } from './router.js';
import { renderErrands, bindErrands } from './features/errands/errands.js';
import { renderClasses, bindClasses } from './features/classes/classes.js';
import { plan } from './features/planning/planner.js';

async function start() {
  await loadPages();
  for (const id of ['origin', 'destination', 'location', 'classlocation']) {
    $(id).innerHTML = places.map(place =>
      `<option value="${esc(place.id)}">${esc(place.name)}</option>`
    ).join('');
  }
  $('destination').value = 'mudd';
  bindNavigation();
  bindErrands(plan);
  bindClasses(plan);
  $('plan').onclick = plan;
  $('reset').onclick = () => {
    resetState();
    renderErrands();
    renderClasses();
    plan();
  };
  renderErrands();
  renderClasses();
  plan();
}
start().catch(error => {
  console.error(error);
  $('planner').textContent = 'Could not load the app. Run it using the local server described in README.md.';
});
