/* search.js — client-side search against /index.json */
(function () {
  const toggleBtn = document.getElementById('search-toggle');
  const closeBtn  = document.getElementById('search-close');
  const overlay   = document.getElementById('search-overlay');
  const input     = document.getElementById('search-input');
  const results   = document.getElementById('search-results');

  if (!toggleBtn || !overlay || !input || !results) return;

  let index = null;       // cached search data
  let debounceTimer = null;

  // ── Open / close ────────────────────────────────
  function openSearch() {
    overlay.hidden = false;
    toggleBtn.setAttribute('aria-expanded', 'true');
    input.value = '';
    results.innerHTML = '';
    input.focus();
    document.body.style.overflow = 'hidden';
    loadIndex();
  }

  function closeSearch() {
    overlay.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggleBtn.focus();
  }

  toggleBtn.addEventListener('click', openSearch);
  if (closeBtn) closeBtn.addEventListener('click', closeSearch);

  // Close on backdrop click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSearch();
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeSearch();
    // Open on Ctrl+K / Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.hidden ? openSearch() : closeSearch();
    }
  });

  // ── Load index ───────────────────────────────────
  function loadIndex() {
    if (index !== null) return;
    fetch('/index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data;
        // If user already typed while loading
        if (input.value.trim()) runSearch(input.value.trim());
      })
      .catch(function () {
        results.innerHTML = '<p class="search-empty">Could not load search index.</p>';
      });
  }

  // ── Input handler ────────────────────────────────
  input.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) { results.innerHTML = ''; return; }
    debounceTimer = setTimeout(function () { runSearch(q); }, 150);
  });

  // ── Search logic ─────────────────────────────────
  function runSearch(query) {
    if (!index) return;

    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

    const scored = index
      .map(function (post) {
        const haystack = [
          post.title   || '',
          post.description || '',
          post.content || '',
          (post.categories || []).join(' '),
          (post.tags       || []).join(' ')
        ].join(' ').toLowerCase();

        // Score: title match worth more than body
        let score = 0;
        const titleLower = (post.title || '').toLowerCase();

        terms.forEach(function (term) {
          if (titleLower.includes(term))   score += 10;
          if (haystack.includes(term))      score += 1;
        });

        return { post: post, score: score };
      })
      .filter(function (item) { return item.score > 0; })
      .sort(function (a, b) { return b.score - a.score })
      .slice(0, 8);

    renderResults(scored, query);
  }

  // ── Render ───────────────────────────────────────
  function renderResults(scored, query) {
    if (!scored.length) {
      results.innerHTML = '<p class="search-empty">No results for <strong>' + escapeHtml(query) + '</strong></p>';
      return;
    }

    const html = scored.map(function (item) {
      const p = item.post;
      const title    = highlight(p.title    || 'Untitled', query);
      const excerpt  = highlight(truncate(p.description || p.content || '', 110), query);
      const cats     = (p.categories || []).map(function (c) {
        return '<span class="search-result-cat">' + escapeHtml(c) + '</span>';
      }).join('');

      return '<a href="' + escapeHtml(p.url) + '" class="search-result-item">'
        + '<div class="search-result-title">' + title + '</div>'
        + '<div class="search-result-meta">'
        + (p.date ? escapeHtml(p.date) + ' ' : '')
        + cats
        + '</div>'
        + (excerpt ? '<div class="search-result-excerpt">' + excerpt + '</div>' : '')
        + '</a>';
    }).join('');

    results.innerHTML = html;
  }

  // ── Helpers ──────────────────────────────────────
  function highlight(text, query) {
    const terms = query.split(/\s+/).filter(Boolean);
    let out = escapeHtml(text);
    terms.forEach(function (term) {
      const re = new RegExp('(' + escapeRegex(term) + ')', 'gi');
      out = out.replace(re, '<mark class="search-result-mark">$1</mark>');
    });
    return out;
  }

  function truncate(str, len) {
    if (str.length <= len) return str;
    return str.slice(0, len).replace(/\s+\S*$/, '') + '…';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
})();
