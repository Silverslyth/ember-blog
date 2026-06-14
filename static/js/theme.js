/* theme.js — dark/light mode toggle with localStorage persistence */
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('theme-toggle');
  const STORAGE_KEY = 'ember-theme';
  const DARK = 'dark';
  const LIGHT = 'light';

  // Resolve initial theme: stored preference → system preference → dark
  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === DARK || stored === LIGHT) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? LIGHT : DARK;
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (btn) btn.setAttribute('aria-label', theme === DARK ? 'Switch to light mode' : 'Switch to dark mode');
  }

  // Apply before first paint (already set in <html> but this syncs the button label)
  applyTheme(getInitialTheme());

  if (btn) {
    btn.addEventListener('click', function () {
      const current = root.getAttribute('data-theme');
      const next = current === DARK ? LIGHT : DARK;
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });
  }

  // Sync across tabs
  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY && (e.newValue === DARK || e.newValue === LIGHT)) {
      applyTheme(e.newValue);
    }
  });

  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      mobileNav.hidden = expanded;
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!navToggle.contains(e.target) && !mobileNav.contains(e.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileNav.hidden = true;
      }
    });
  }
})();
