/**
 * Ember Search — Premium command palette
 * Linear · Raycast · Arc · Vercel inspired
 * Ctrl+K to open · fuzzy matching · recency boost · result grouping · keyboard-first
 */
(function () {
  'use strict';

  const overlay      = document.getElementById('search-overlay');
  const input        = document.getElementById('search-input');
  const results      = document.getElementById('search-results');
  const emptySt      = document.getElementById('search-empty');
  const startSt      = document.getElementById('search-start');
  const recentPanel  = document.getElementById('search-recent-panel');
  const recentList   = document.getElementById('search-recent-list');
  const popularList  = document.getElementById('search-popular-list');
  const filters      = document.getElementById('search-filters');
  const countLabel   = document.getElementById('search-count-label');
  const toggleBtn    = document.getElementById('search-toggle');
  const kbdHint      = document.getElementById('search-kbd-hint');

  if (!overlay || !input) return;

  let index = null;
  let indexLoading = false;
  let indexPromise = null;
  let selectedIdx = -1;
  let visibleItems = [];
  let activeCategory = '';
  let categories = [];
  let debounceTimer = null;

  const RECENT_KEY = 'ember:recent-searches';
  const MAX_RECENT = 5;
  const DEBOUNCE_MS = 60; // fast enough to feel instant, slow enough to avoid jank

  // ── Preload on hover ─────────────────────────────
  if (toggleBtn) {
    toggleBtn.addEventListener('mouseenter', preload, { once: true });
    toggleBtn.addEventListener('focus', preload, { once: true });
  }

  function preload() {
    if (index !== null || indexLoading) return;
    loadIndex();
  }

  // ── Recent searches (localStorage) ───────────────
  function getRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || []; }
    catch (e) { return []; }
  }

  function addRecent(url, title) {
    var recent = getRecent().filter(function (r) { return r.url !== url; });
    recent.unshift({ url: url, title: title });
    if (recent.length > MAX_RECENT) recent.pop();
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(recent)); }
    catch (e) {}
  }

  // ── Fuzzy match with word-boundary bonus ─────────
  function fuzzyScore(query, str) {
    if (!str) return -1;
    var q = query.toLowerCase();
    var s = str.toLowerCase();
    var qi = 0, score = 0, consecutive = 0, prevMatch = -2;
    for (var i = 0; i < s.length && qi < q.length; i++) {
      if (s[i] === q[qi]) {
        qi++;
        if (i === prevMatch + 1) { consecutive++; score += consecutive * 4; }
        else { consecutive = 0; score += 1; }
        // Word boundary bonus
        if (i === 0 || s[i-1] === ' ' || s[i-1] === '-' || s[i-1] === '_' || s[i-1] === '/') score += 6;
        // Case bonus (original casing preserved)
        if (str[i] === q[qi-1]) score += 1;
        prevMatch = i;
      } else { consecutive = 0; }
    }
    if (qi < q.length) return -1;
    return score;
  }

  // ── Recency boost ────────────────────────────────
  // Newer posts get a small score bump so fresh content surfaces
  function recencyBoost(dateStr) {
    if (!dateStr) return 0;
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    var days = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 1) return 8;
    if (days < 7) return 5;
    if (days < 30) return 3;
    if (days < 90) return 1;
    return 0;
  }

  // ── Search ───────────────────────────────────────
  function search(query, catFilter) {
    if (!index) return [];
    var terms = query.trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];

    return index
      .map(function (post) {
        if (catFilter && (!post.categories || post.categories.indexOf(catFilter) === -1)) return null;
        var title = post.title || '';
        var desc  = post.description || '';
        var cats  = (post.categories || []).join(' ');
        var tags  = (post.tags || []).join(' ');

        var titleScore = 0, descScore = 0, catScore = 0, exactBonus = 0;
        terms.forEach(function (term) {
          var ts = fuzzyScore(term, title);
          var ds = fuzzyScore(term, desc);
          var cs = fuzzyScore(term, cats + ' ' + tags);
          if (ts > -1) titleScore += ts;
          if (ds > -1) descScore  += ds;
          if (cs > -1) catScore   += cs;
          // Exact title match gets massive bonus
          if (title.toLowerCase() === term.toLowerCase()) exactBonus += 50;
          if (title.toLowerCase().indexOf(term.toLowerCase()) === 0) exactBonus += 15;
        });
        if (titleScore === 0 && descScore === 0 && catScore === 0 && exactBonus === 0) return null;
        var finalScore = titleScore * 12 + descScore * 2 + catScore * 1 + exactBonus + recencyBoost(post.date);
        return { post: post, score: finalScore };
      })
      .filter(Boolean)
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 15);
  }

  // ── Group results by category/tag ────────────────
  function groupResults(items) {
    if (items.length <= 4) return [{ label: 'Results', items: items }];

    var groups = [];
    var used = {};
    var seenCategories = {};

    items.forEach(function (item) {
      var cat = (item.post.categories || [])[0];
      if (cat && !seenCategories[cat] && Object.keys(seenCategories).length < 3) {
        seenCategories[cat] = [];
      }
    });

    // If we have meaningful groups, use them
    if (Object.keys(seenCategories).length >= 2) {
      items.forEach(function (item) {
        var cat = (item.post.categories || [])[0];
        if (cat && seenCategories[cat]) {
          seenCategories[cat].push(item);
          used[item.post.url] = true;
        }
      });

      var catNames = Object.keys(seenCategories);
      catNames.forEach(function (cat) {
        if (seenCategories[cat].length > 0) {
          groups.push({ label: cat, items: seenCategories[cat] });
        }
      });

      // Remainder
      var rest = items.filter(function (item) { return !used[item.post.url]; });
      if (rest.length > 0) {
        groups.push({ label: 'More', items: rest });
      }
    } else {
      groups.push({ label: 'Results', items: items });
    }

    return groups;
  }

  // ── Extract categories from index ────────────────
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
    var html = '<span class="search-filter-label">Filter</span>'
      + '<button class="search-filter-chip' + (activeCategory === '' ? ' is-active' : '') + '" data-category="">All</button>';
    categories.slice(0, 8).forEach(function (c) {
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

  // ── Get result icon ──────────────────────────────
  function resultIcon(post) {
    var title = (post.title || '').toLowerCase();
    if (title.indexOf('guide') !== -1 || title.indexOf('setup') !== -1 || title.indexOf('how') !== -1) return '📋';
    if (title.indexOf('vs') !== -1 || title.indexOf('compar') !== -1) return '⚖';
    var cats = (post.categories || []).join(' ').toLowerCase();
    if (cats.indexOf('linux') !== -1) return '🐧';
    if (cats.indexOf('streaming') !== -1) return '📡';
    if (cats.indexOf('privacy') !== -1) return '🔒';
    if (cats.indexOf('self-hosting') !== -1) return '🏠';
    return '📄';
  }

  // ── Highlight matching text ──────────────────────
  function highlightText(text, query) {
    if (!query.trim() || !text) return escHtml(text);
    var terms = query.split(/\s+/).filter(Boolean);
    var out = escHtml(text);
    terms.forEach(function (term) {
      var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
    });
    return out;
  }

  // ── Render results ───────────────────────────────
  function renderResults(items, query) {
    visibleItems = items;
    selectedIdx = items.length > 0 ? 0 : -1;

    results.innerHTML = '';
    emptySt.hidden = true;
    startSt.hidden = true;

    if (!items.length) {
      results.hidden = true;
      emptySt.hidden = false;
      if (countLabel) countLabel.textContent = '0 results';
      return;
    }

    var totalCount = items.length;
    if (countLabel) countLabel.textContent = totalCount + ' result' + (totalCount !== 1 ? 's' : '');

    var groups = groupResults(items);
    results.hidden = false;
    var flatIdx = 0;

    results.innerHTML = groups.map(function (group) {
      var groupHtml = '<div class="search-result-group">';
      if (groups.length > 1) {
        groupHtml += '<div class="search-result-group-header">' + escHtml(group.label) + '</div>';
      }
      groupHtml += group.items.map(function (item) {
        var p = item.post;
        var title = highlightText(p.title || 'Untitled', query);
        var cat = (p.categories || [])[0];
        var date = p.date || '';
        var icon = resultIcon(p);
        var idx = flatIdx++;
        return '<a href="' + escAttr(p.url) + '" class="search-result-item' + (idx === 0 ? ' is-selected' : '') + '" data-index="' + idx + '">'
          + '<span class="search-result-icon" aria-hidden="true">' + icon + '</span>'
          + '<span class="search-result-body">'
          + '<span class="search-result-title">' + title + '</span>'
          + '<span class="search-result-meta">'
          + (cat ? '<span class="search-result-cat">' + escHtml(cat) + '</span>' : '')
          + (date ? '<span class="search-result-date">' + escHtml(date) + '</span>' : '')
          + '</span>'
          + '</span>'
          + '</a>';
      }).join('');
      groupHtml += '</div>';
      return groupHtml;
    }).join('');
  }

  function selectItem(idx) {
    document.querySelectorAll('.search-result-item').forEach(function (el, i) {
      el.classList.toggle('is-selected', i === idx);
    });
    var sel = document.querySelector('.search-result-item.is-selected');
    if (sel) sel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // ── Popular guides ───────────────────────────────
  function loadPopular() {
    if (!popularList || !index) return;
    var popularUrls = [];
    var overlayEl = document.getElementById('search-overlay');
    if (overlayEl && overlayEl.dataset.popular) {
      try { popularUrls = JSON.parse(overlayEl.dataset.popular); } catch(e) {}
    }
    if (!popularUrls.length) return;

    var items = popularUrls.map(function (url) {
      for (var i = 0; i < index.length; i++) {
        if (index[i].url && index[i].url.indexOf(url) !== -1) return index[i];
      }
      return null;
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
    toggleBtn.setAttribute('aria-expanded', 'true');
    input.value = '';
    results.innerHTML = '';
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
    // Focus with a tiny delay so the animation doesn't glitch
    setTimeout(function () { input.focus(); }, 80);
  }

  function close() {
    overlay.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggleBtn.focus();
  }

  function doSearch() {
    var q = input.value.trim();
    if (!q) {
      results.hidden = true;
      results.innerHTML = '';
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
    if (filters) filters.hidden = true;
    var items = search(q, activeCategory);
    renderResults(items, q);
  }

  function debouncedSearch() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(doSearch, DEBOUNCE_MS);
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
        close();
        window.location.href = p.url;
      }
    }
  }

  // ── Events ───────────────────────────────────────
  toggleBtn.addEventListener('click', function () {
    overlay.hidden ? open() : close();
  });

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
    // Escape on input with text → clear first, close on second press
    if (e.key === 'Escape') {
      if (!overlay.hidden) {
        if (input.value.trim()) {
          e.preventDefault();
          input.value = '';
          doSearch();
        } else {
          e.preventDefault();
          close();
        }
      }
      return;
    }

    // Ctrl+K / Cmd+K toggle
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.hidden ? open() : close();
      return;
    }

    // Navigation
    if (!overlay.hidden) navigate(e);
  });

  // Debounced input
  input.addEventListener('input', debouncedSearch);

  // ── Load index ───────────────────────────────────
  function loadIndex() {
    if (indexLoading) return indexPromise;
    indexLoading = true;
    indexPromise = fetch('/index.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        index = data.map(function (p) { return {
          title: p.title,
          description: p.description,
          content: p.content || '',
          categories: p.categories,
          tags: p.tags,
          date: p.date,
          url: p.url
        };});
        loadCategories();
        loadPopular();
        if (input.value.trim()) doSearch();
      })
      .catch(function () {
        index = [];
        results.hidden = false;
        results.innerHTML = '<div class="search-empty"><div class="search-empty-icon">⚠</div><p>Could not load search index.</p></div>';
      });
    return indexPromise;
  }

  // ── Helpers ──────────────────────────────────────
  function escHtml(s)  { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function escAttr(s)  { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

})();
