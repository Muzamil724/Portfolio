(() => {
  'use strict';
  const root = document.documentElement;
  const KEY = 'theme';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Theme: follow the system unless the visitor has chosen one
  const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
  const current = () => root.dataset.theme || (systemDark() ? 'dark' : 'light');
  try { const saved = localStorage.getItem(KEY); if (saved) root.dataset.theme = saved; } catch (e) {}
  if (!reduce) root.classList.add('js');

  document.addEventListener('DOMContentLoaded', () => {
    const themeBtn = $('#theme-toggle');
    const menuBtn = $('#menu-toggle');
    const nav = $('#nav');
    const links = $$('a', nav);
    const header = $('.site-header');

    /* ---------- Theme toggle (circular reveal where supported) ---------- */
    const syncThemeLabel = () =>
      themeBtn.setAttribute('aria-label', `Switch to ${current() === 'dark' ? 'light' : 'dark'} theme`);
    syncThemeLabel();
    themeBtn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      const apply = () => {
        root.dataset.theme = next;
        try { localStorage.setItem(KEY, next); } catch (e) {}
        syncThemeLabel();
      };
      if (!document.startViewTransition || reduce) return apply();
      const r = themeBtn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(apply).ready.then(() =>
        root.animate(
          { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          { duration: 550, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' }
        )
      );
    });

    /* ---------- Mobile menu ---------- */
    const setMenu = open => {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    links.forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

    /* ---------- Active nav link ---------- */
    const sections = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => spy.observe(s));

    /* ---------- Copy email ---------- */
    $$('[data-copy]').forEach(btn => {
      const label = $('[data-copy-label]', btn);
      const original = label.textContent;
      btn.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(btn.dataset.copy); label.textContent = 'Copied'; }
        catch (e) { label.textContent = 'Failed'; }
        setTimeout(() => (label.textContent = original), 2000);
      });
    });

    $('#year').textContent = new Date().getFullYear();

    /* ---------- Hero: deploy-pipeline strip inside the status card ---------- */
    const status = $('.status');
    if (status) {
      const pipe = document.createElement('div');
      pipe.className = 'pipe';
      pipe.setAttribute('aria-hidden', 'true');
      pipe.innerHTML = '<span class="stage">build</span><i></i><span class="stage">push</span><i></i><span class="stage">deploy</span><b>healthy</b>';
      status.appendChild(pipe);
    }

    /* ---------- Scroll progress + timeline line ---------- */
    const bar = document.createElement('div');
    bar.className = 'progress';
    header.appendChild(bar);
    const timeline = $('.timeline');
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = root.scrollHeight - innerHeight;
        bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
        if (timeline) {
          const r = timeline.getBoundingClientRect();
          const p = Math.min(Math.max((innerHeight * 0.65 - r.top) / r.height, 0), 1);
          timeline.style.setProperty('--prog', (p * 100).toFixed(1) + '%');
        }
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    onScroll();

    if (reduce) return;

    /* ---------- Scroll reveals (staggered per group) ---------- */
    const targets = '.section h2, .section .sub, .prose p, .facts li, .skill-row, .group, .card, .timeline > li, .cert-list li, .link';
    const counts = new Map();
    const reveal = new IntersectionObserver((entries, o) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); o.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    $$(targets).forEach(el => {
      const n = counts.get(el.parentNode) || 0;
      counts.set(el.parentNode, n + 1);
      el.style.setProperty('--d', Math.min(n, 5) * 70 + 'ms');
      $$('.tags li', el).forEach((t, i) => t.style.setProperty('--i', i));
      el.classList.add('reveal');
      reveal.observe(el);
    });

    if (!finePointer) return;

    /* ---------- Hero spotlight that eases toward the cursor ---------- */
    const hero = $('.hero');
    let tx = 78, ty = 30, cx = tx, cy = ty, raf = 0;
    const step = () => {
      cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
      hero.style.setProperty('--px', cx.toFixed(2) + '%');
      hero.style.setProperty('--py', cy.toFixed(2) + '%');
      raf = Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05 ? requestAnimationFrame(step) : 0;
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 100;
      ty = ((e.clientY - r.top) / r.height) * 100;
      if (!raf) raf = requestAnimationFrame(step);
    });

    /* ---------- Card spotlight ---------- */
    document.addEventListener('pointermove', e => {
      const el = e.target.closest('.card, .link, .skill-row');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', e.clientX - r.left + 'px');
      el.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true });
  });
})();