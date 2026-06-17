/**
 * Ember Search — Modern documentation search (Linear / Raycast / Vercel style)
 * Ctrl+K to open · fuzzy matching · recent searches · category filtering
 */
(function () {
  'use strict';

  const overlay   = document.getElementById('search-overlay');
  const input     = document.getElementById('search-input');
  const results   = document.getElementById('search-results');
  const emptySt   = document.getElementById('search-empty');
  const startSt   = document.getElementById('search-start');
  const recentPanel = document.getElementById('search-recent-panel');
  const recentList  = document.getElementById('search-recent-list');
  const popularList = document.getElementById('search-popular-list');
  const filters   = document.getElementById('search-filters');
  const countLabel = document.getElementById('search-count-label');

  if (!overlay || !input) return;

  let index = null;
  let selectedIdx = -1;
  let visibleItems = [];
  let activeCategory = '';
  let categories = [];

  const RECENT_KEY = 'ember:recent-searches';
  const MAX_RECENT = 5;

  // ── Recent searches (localStorage) ────────────────
  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch (e) { return []; }
  }

  function addRecent(url, title) {
    const recent = getRecent().filter(function (r) { return r.url !== url; });
    recent.unshift({ url: url, title: title });
    if (recent.length > MAX_RECENT) recent.pop();
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); }
    catch (e) {}
  }

  // ── Fuzzy match ──────────────────────────────────
  function fuzzyScore(query, str) {
    const q = query.toLowerCase();
    const s = str.toLowerCase();
    let qi = 0, score = 0, consecutive = 0, prevMatch = -2;
    for (let i = 0; i < s.length && qi < q.length; i++) {
      if (s[i] === q[qi]) {
        qi++;
        if (i === prevMatch + 1) { consecutive++; score += consecutive * 3; }
        else { consecutive = 0; score += 1; }
        if (i === 0 || s[i-1] === ' ' || s[i-1] === '-' || s[i-1] === '_') score += 5;
        prevMatch = i;
      } else { consecutive = 0; }
    }
    if (qi < q.length) return -1;
    return score;
  }

  function search(query, catFilter) {
    if (!index) return [];
    const terms = query.trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];

    return index
      .map(function (post) {
        if (catFilter && (!post.categories || post.categories.indexOf(catFilter) === -1)) return null;
        const title = post.title || '';
        const desc  = post.description || '';
        const cats  = (post.categories || []).join(' ');
        const tags  = (post.tags || []).join(' ');

        let titleScore = 0, descScore = 0, catScore = 0;
        terms.forEach(function (term) {
          const ts = fuzzyScore(term, title);
          const ds = fuzzyScore(term, desc);
          const cs = fuzzyScore(term, cats + ' ' + tags);
          if (ts > -1) titleScore += ts;
          if (ds > -1) descScore  += ds;
          if (cs > -1) catScore   += cs;
        });
        if (titleScore === 0 && descScore === 0 && catScore === 0) return null;
        return { post: post, score: titleScore * 10 + descScore * 2 + catScore };
      })
      .filter(Boolean)
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 12);
  }

  // ── Extract categories from index ─────────────────
  function loadCategories() {
    if (!index) return;
    var catMap = {};
    index.forEach(function (p) {
      (p.categories || []).forEach(function (c) {
        catMap[c] = (catMap[c] || 0) + 1;
      });
    });
    categories = Object.keys(catMap).sort(function (a, b) {
      return (catMap[b] || 0) - (catMap[a] || 0);
    });
    renderFilterChips();
  }

  function renderFilterChips() {
    if (!filters) return;
    var html = '<span class="search-filter-label">Filter by</span>'
      + '<button class="search-filter-chip' + (activeCategory === '' ? ' is-active' : '') + '" data-category="">All</button>';
    categories.forEach(function (c) {
      html += '<button class="search-filter-chip' + (activeCategory === c ? ' is-active' : '') + '" data-category="' + escAttr(c) + '">' + escHtml(c) + '</button>';
    });
    filters.innerHTML = html;

    filters.querySelectorAll('.search-filter-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        activeCategory = this.dataset.category;
        renderFilterChips();
        if (input.value.trim()) doSearch();
      });
    });
  }

  // ── Render ───────────────────────────────────────
  function highlightText(text, query) {
    if (!query.trim()) return escHtml(text);
    var terms = query.split(/\s+/).filter(Boolean);
    var out = escHtml(text);
    terms.forEach(function (term) {
      var chars = term.toLowerCase().split('');
      var ci = 0;
      out = out.replace(/[^<]*/g, function (m) {
        if (ci >= chars.length) return m;
        return m.replace(new RegExp('(' + escRe(chars[ci]) + ')', 'i'), function (match) {
          if (ci < chars.length && match.toLowerCase() === chars[ci]) {
            ci++;
            return '<mark>' + match + '</mark>';
          }
          return match;
        });
      });
    });
    return out;
  }

  function renderResults(items, query) {
    visibleItems = items;
    selectedIdx = items.length > 0 ? 0 : -1;

    results.innerHTML = '';
    emptySt.hidden = true;
    startSt.hidden = true;

    if (!items.length) {
      results.hidden = true;
      emptySt.hidden = false;
      countLabel.textContent = '';
      return;
    }

    if (countLabel) countLabel.textContent = items.length + ' result' + (items.length !== 1 ? 's' : '');

    results.hidden = false;
    results.innerHTML = items.map(function (item, i) {
      var p = item.post;
      var title = highlightText(p.title || 'Untitled', query);
      var cat = (p.categories || [])[0];
      var date = p.date || '';
      return '<a href="' + escAttr(p.url) + '" class="search-result-item' + (i === 0 ? ' is-selected' : '') + '" data-index="' + i + '">'
        + '<span class="search-result-body">'
        + '<span class="search-result-title">' + title + '</span>'
        + '<span class="search-result-meta">'
        + (cat ? '<span class="search-result-cat">' + escHtml(cat) + '</span>' : '')
        + (date ? '<span class="search-result-date">' + escHtml(date) + '</span>' : '')
        + '</span>'
        + '</span>'
        + '</a>';
    }).join('');
  }

  function selectItem(idx) {
    document.querySelectorAll('.search-result-item').forEach(function (el, i) {
      el.classList.toggle('is-selected', i === idx);
    });
    var sel = document.querySelector('.search-result-item.is-selected');
    if (sel) sel.scrollIntoView({ block: 'nearest' });
  }

  // ── Popular guides ───────────────────────────────
  function loadPopular() {
    if (!popularList || !index) return;
    var popularUrls = [];
    // Try to get from a data attribute, otherwise fallback
    var overlayEl = document.getElementById('search-overlay');
    if (overlayEl && overlayEl.dataset.popular) {
      try { popularUrls = JSON.parse(overlayEl.dataset.popular); } catch(e) {}
    }
    if (!popularUrls.length) return;

    var items = popularUrls.map(function (url) {
      var found = null;
      for (var i = 0; i < index.length; i++) {
        if (index[i].url && index[i].url.indexOf(url) !== -1) { found = index[i]; break; }
      }
      return found;
    }).filter(Boolean).slice(0, 4);

    if (!items.length) return;
    popularList.innerHTML = items.map(function (p) {
      return '<a href="' + escAttr(p.url) + '" class="search-panel-item">'
        + '<span class="search-panel-item-icon">→</span>'
        + '<span class="search-panel-item-text">' + escHtml(p.title || 'Untitled') + '</span>'
        + '</a>';
    }).join('');
  }

  function renderRecent() {
    if (!recentList) return;
    var recent = getRecent();
    if (!recent.length) { recentPanel.hidden = true; return; }
    recentPanel.hidden = false;
    recentList.innerHTML = recent.slice(0, 5).map(function (r) {
      return '<a href="' + escAttr(r.url) + '" class="search-panel-item">'
        + '<span class="search-panel-item-icon">⌘</span>'
        + '<span class="search-panel-item-text">' + escHtml(r.title) + '</span>'
        + '</a>';
    }).join('');
  }

  // ── Open / Close ─────────────────────────────────
  function open() {
    overlay.hidden = false;
    document.getElementById('search-toggle').setAttribute('aria-expanded', 'true');
    input.value = '';
    results.hidden = true;
    emptySt.hidden = true;
    startSt.hidden = false;
    activeCategory = '';
    selectedIdx = -1;
    visibleItems = [];
    document.body.style.overflow = 'hidden';
    if (filters) filters.hidden = false;
    if (countLabel) countLabel.textContent = '';
    renderRecent();
    if (index === null) loadIndex();
    else { loadCategories(); loadPopular(); }
    input.focus();
  }

  function close() {
    overlay.hidden = true;
    document.getElementById('search-toggle').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.getElementById('search-toggle').focus();
  }

  function doSearch() {
    var q = input.value.trim();
    if (!q) {
      results.hidden = true;
      emptySt.hidden = true;
      startSt.hidden = false;
      if (filters) filters.hidden = false;
      selectedIdx = -1;
      visibleItems = [];
      if (countLabel) countLabel.textContent = '';
      renderRecent();
      return;
    }
    startSt.hidden = true;
    var items = search(q, activeCategory);
    renderResults(items, q);
  }

  function navigate(e) {
    if (results.hidden || visibleItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = (selectedIdx + 1) % visibleItems.length;
      selectItem(selectedIdx);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = (selectedIdx - 1 + visibleItems.length) % visibleItems.length;
      selectItem(selectedIdx);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && visibleItems[selectedIdx]) {
        var p = visibleItems[selectedIdx].post;
        addRecent(p.url, p.title);
        window.location.href = p.url;
      }
    }
  }

  function openSelected() {
    if (selectedIdx >= 0 && visibleItems[selectedIdx]) {
      var p = visibleItems[selectedIdx].post;
      addRecent(p.url, p.title);
      window.location.href = p.url;
    }
  }

  // ── Events ───────────────────────────────────────
  document.getElementById('search-toggle')?.addEventListener('click', open);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  // Click on result item
  results.addEventListener('click', function (e) {
    var item = e.target.closest('.search-result-item');
    if (item) {
      var idx = parseInt(item.dataset.index);
      if (idx >= 0 && visibleItems[idx]) {
        var p = visibleItems[idx].post;
        addRecent(p.url, p.title);
      }
    }
  });

  // Click on recent / popular items
  document.getElementById('search-start')?.addEventListener('click', function (e) {
    var item = e.target.closest('.search-panel-item');
    if (item && item.tagName === 'A') {
      var title = item.querySelector('.search-panel-item-text')?.textContent || '';
      addRecent(item.getAttribute('href'), title);
      close();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) { e.preventDefault(); close(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.hidden ? open() : close();
    }
    if (!overlay.hidden) navigate(e);
  });

  input.addEventListener('input', doSearch);

  // ── Load index ───────────────────────────────────
  function loadIndex() {
    if (index !== null) return;
    fetch('/index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data.map(function (p) { return {
          title: p.title, description: p.description, content: p.content || '',
          categories: p.categories, tags: p.tags, date: p.date, url: p.url
        };});
        loadCategories();
        loadPopular();
        if (input.value.trim()) doSearch();
      })
      .catch(function () {
        results.hidden = false;
        results.innerHTML = '<div class="search-empty"><p>Could not load search index.</p></div>';
      });
  }

  // ── Helpers ──────────────────────────────────────
  function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
})();
