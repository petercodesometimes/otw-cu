import { $ } from './lib/dom.js';
// Add a page here, then add pages/NAME.html and a section and tab in index.html.
// Hashes may carry a parameter: #plan/1 opens the plan for free window 1.
export const pageNames = ['today', 'ahead', 'errands', 'classes', 'map', 'walk', 'settings', 'plan'];
export async function loadPages() {
  await Promise.all(pageNames.map(async name => {
    const response = await fetch(`pages/${name}.html`);
    if (!response.ok) throw new Error(`Could not load ${name} page`);
    $(name).innerHTML = await response.text();
  }));
}
export function currentRoute() {
  const [name, param] = location.hash.slice(1).split('/');
  return { page: pageNames.includes(name) ? name : 'today', param };
}
export function bindNavigation(onShow) {
  function showPage() {
    const { page, param } = currentRoute();
    pageNames.forEach(name => $(name).classList.toggle('hidden', name !== page));
    const tab = page === 'plan' ? 'today' : page;
    document.querySelectorAll('[data-tab]').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });
    onShow(page, param);
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.onclick = () => { location.hash = button.dataset.tab; };
  });
  window.addEventListener('hashchange', showPage);
  showPage();
}
