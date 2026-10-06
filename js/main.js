(() => {
  'use strict';
  const root = document.documentElement;
  const KEY = 'theme';

  // Theme: follow the system unless the visitor has chosen one
  const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const current = () => root.dataset.theme || (systemDark() ? 'dark' : 'light');
  try { const saved = localStorage.getItem(KEY); if (saved) root.dataset.theme = saved; } catch (e) {}

  document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = document.getElementById('theme-toggle');
    const menuBtn = document.getElementById('menu-toggle');
    const nav = document.getElementById('nav');
    const links = [...nav.querySelectorAll('a')];

    const syncThemeLabel = () =>
      themeBtn.setAttribute('aria-label', `Switch to ${current() === 'dark' ? 'light' : 'dark'} theme`);
    syncThemeLabel();
    themeBtn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) {}
      syncThemeLabel();
    });

    // Mobile menu
    const setMenu = open => {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    links.forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

    // Highlight the nav link for the section in view
    const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));

    // Copy email
    document.querySelectorAll('[data-copy]').forEach(btn => {
      const label = btn.querySelector('[data-copy-label]');
      const original = label.textContent;
      btn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(btn.dataset.copy);
          label.textContent = 'Copied';
        } catch (e) {
          label.textContent = 'Copy failed. Use the email link above.';
        }
        setTimeout(() => (label.textContent = original), 2000);
      });
    });

    document.getElementById('year').textContent = new Date().getFullYear();
  });
})();