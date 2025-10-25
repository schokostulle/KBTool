// js/main.js

export function bindAuthTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.toggle('active', b === btn));
      panels.forEach(p => p.classList.toggle('active', p.id === btn.dataset.tab));
    });
  });
}

export function uiMsg(id, text, kind='info') {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `msg ${kind}`;
  el.textContent = text;
}

export function initDashboardNav() {
  const links = document.querySelectorAll('.sidebar .nav-item[data-link]');
  const views = document.querySelectorAll('.content .view');
  links.forEach(link => {
    link.addEventListener('click', () => {
      links.forEach(l => l.classList.toggle('active', l === link));
      views.forEach(v => v.classList.toggle('active', `view-${link.dataset.link}` === v.id));
    });
  });
}

export function seedNews(items) {
  const ul = document.getElementById('newsList');
  if (!ul) return;
  ul.innerHTML = '';
  for (const n of items) {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${escapeHtml(n.title)}</strong> — <span style="color:#98a5be">${n.ts}</span><br>${escapeHtml(n.text)}`;
    ul.appendChild(li);
  }
}

function escapeHtml(s='') {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}