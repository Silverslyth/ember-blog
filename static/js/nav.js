/**
 * Ember — Dropdown navigation behavior
 * Handles touch toggle, keyboard, and mega-menu layout
 */
(function () {
  'use strict';

  const dropdowns = document.querySelectorAll('.nav-item--dropdown');

  // ── Mega-menu: auto-switch Categories (8+ children) to two-column layout ──
  dropdowns.forEach(function (item) {
    var menu = item.querySelector('.dropdown-menu');
    if (!menu) return;
    var children = menu.querySelectorAll('.dropdown-item');
    if (children.length >= 8) {
      menu.classList.add('dropdown-menu--mega');
    }
  });

  // ── Touch / click toggle (for devices without hover) ──
  dropdowns.forEach(function (item) {
    var toggle = item.querySelector('.nav-link');

    toggle.addEventListener('click', function (e) {
      // Only intercept on touch-capable devices, or if Ctrl is held (accessibility)
      var isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      if (!isTouchDevice && !e.ctrlKey) return; // let normal link behavior through on desktop

      var menu = item.querySelector('.dropdown-menu');
      if (!menu) return;

      // If already open, let the link navigate
      if (menu.classList.contains('show')) return;

      // Prevent navigation, show the dropdown instead
      e.preventDefault();
      menu.classList.add('show');
    });
  });

  // ── Click outside to close ──
  document.addEventListener('click', function (e) {
    dropdowns.forEach(function (item) {
      if (!item.contains(e.target)) {
        var menu = item.querySelector('.dropdown-menu');
        if (menu) menu.classList.remove('show');
      }
    });
  });

  // ── Escape key to close ──
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      dropdowns.forEach(function (item) {
        var menu = item.querySelector('.dropdown-menu');
        if (menu) menu.classList.remove('show');
      });
    }
  });

  // ── Close on link click inside dropdown ──
  document.querySelectorAll('.dropdown-link').forEach(function (link) {
    link.addEventListener('click', function () {
      var menu = link.closest('.dropdown-menu');
      if (menu) menu.classList.remove('show');
    });
  });

})();
