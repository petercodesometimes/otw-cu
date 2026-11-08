import { $ } from './lib/dom.js';
// Add a page here, then add pages/NAME.html, a section and navigation button in index.html.
export const pageNames = ['planner', 'classes', 'about'];
export async function loadPages() {
  await Promise.all(pageNames.map(async name => {
    const response = await fetch(`pages/${name}.html`);
    if (!response.ok) throw new Error(`Could not load ${name} page`);
    $(name).innerHTML = await response.text();
  }));
}
export function bindNavigation() {
  function showPage() {
    const name = location.hash.slice(1);
    const active = pageNames.includes(name) ? name : 'planner';
    pageNames.forEach(page => $(page).classList.toggle('hidden', page !== active));
    document.querySelectorAll('[data-tab]').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === active);
    });
  }
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.onclick = () => { location.hash = button.dataset.tab; };
  });
  window.addEventListener('hashchange', showPage);
  showPage();
}
