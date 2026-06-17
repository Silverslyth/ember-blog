/**
 * Ember Search — Terminal-style command palette
 * Ctrl+K to open · fuzzy matching · keyboard navigation
 */
(function () {
  'use strict';

  const toggleBtn = document.getElementById('search-toggle');
  const overlay   = document.getElementById('search-overlay');
  const input     = document.getElementById('search-input');
  const results   = document.getElementById('search-results');
  const resultCount = document.getElementById('search-count');

  if (!toggleBtn || !overlay || !input || !results) return;

  let index = null;
  let selectedIdx = -1;
  let visibleItems = [];

  // ── Fuzzy match ──────────────────────────────────
  function fuzzyMatch(query, str) {
    const q = query.toLowerCase();
    const s = str.toLowerCase();
    let qi = 0;
    let score = 0;
    let consecutive = 0;
    let prevMatch = -2;

    for (let i = 0; i < s.length && qi < q.length; i++) {
      if (s[i] === q[qi]) {
        qi++;
        // Bonus for consecutive matches
        if (i === prevMatch + 1) {
          consecutive++;
          score += consecutive * 3;
        } else {
          consecutive = 0;
          score += 1;
        }
        // Bonus for word-boundary match
        if (i === 0 || s[i - 1] === ' ' || s[i - 1] === '-' || s[i - 1] === '_') {
          score += 5;
        }
        prevMatch = i;
      } else {
        consecutive = 0;
      }
    }

    if (qi < q.length) return -1; // not all chars matched
    // Penalize gap between first and last match
    const span = prevMatch - (s.indexOf(q[0]));
    score -= Math.floor(span / 20);
    return score;
  }

  function search(query) {
    if (!index) return [];
    const terms = query.trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];

    return index
      .map(function (post) {
        const title = post.title || '';
        const desc  = post.description || '';
        const cats  = (post.categories || []).join(' ');
        const tags  = (post.tags || []).join(' ');

        let titleScore = 0;
        let descScore  = 0;
        let catScore   = 0;

        terms.forEach(function (term) {
          const ts = fuzzyMatch(term, title);
          const ds = fuzzyMatch(term, desc);
          const cs = fuzzyMatch(term, cats + ' ' + tags);
          if (ts > -1) titleScore += ts;
          if (ds > -1) descScore  += ds;
          if (cs > -1) catScore   += cs;
        });

        // Only include if at least one term matched the title or description
        if (titleScore === 0 && descScore === 0 && catScore === 0) return null;

        const totalScore = titleScore * 10 + descScore * 2 + catScore;
        return { post: post, score: totalScore, titleScore: titleScore };
      })
      .filter(Boolean)
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 12);
  }

  // ── Render ───────────────────────────────────────
  function render(items, query) {
    visibleItems = items;
    selectedIdx = items.length > 0 ? 0 : -1;

    if (!items.length) {
      results.innerHTML = '<div class="cmd-empty">No results for <strong>' + esc(query) + '</strong></div>';
      if (resultCount) resultCount.textContent = '';
      return;
    }

    if (resultCount) {
      resultCount.textContent = items.length + ' result' + (items.length !== 1 ? 's' : '');
    }

    results.innerHTML = items.map(function (item, i) {
      const p = item.post;
      const title = highlightMatches(p.title || 'Untitled', query);
      const cat   = (p.categories || [])[0];
      const date  = p.date || '';

      return '<div class="cmd-item' + (i === 0 ? ' cmd-item--selected' : '') + '" data-index="' + i + '">'
        + '<a href="' + esc(p.url) + '" class="cmd-item-link">'
        + '<span class="cmd-item-index">' + (i < 9 ? '&thinsp;' + (i + 1) : i + 1) + '</span>'
        + '<span class="cmd-item-body">'
        + '<span class="cmd-item-title">' + title + '</span>'
        + '<span class="cmd-item-meta">'
        + (cat ? '<span class="cmd-item-cat">' + esc(cat) + '</span>' : '')
        + (date ? '<span class="cmd-item-date">' + esc(date) + '</span>' : '')
        + '</span>'
        + '</span>'
        + '<span class="cmd-item-chevron">↵</span>'
        + '</a>'
        + '</div>';
    }).join('');
  }

  function updateSelection() {
    document.querySelectorAll('.cmd-item').forEach(function (el, i) {
      el.classList.toggle('cmd-item--selected', i === selectedIdx);
    });
    // Scroll selected into view
    const sel = document.querySelector('.cmd-item--selected');
    if (sel) sel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function highlightMatches(text, query) {
    const terms = query.split(/\s+/).filter(Boolean);
    let out = esc(text);
    terms.forEach(function (term) {
      // Highlight each char of the term that appears in order (fuzzy highlight)
      const chars = term.toLowerCase().split('');
      let ci = 0;
      out = out.replace(/[^<]*/g, function (m) {
        if (ci >= chars.length) return m;
        return m.replace(new RegExp('(' + escRe(chars[ci]) + ')', 'i'), function (match) {
          if (ci < chars.length && match.toLowerCase() === chars[ci]) {
            ci++;
            return '<mark class="cmd-mark">' + match + '</mark>';
          }
          return match;
        });
      });
    });
    return out;
  }

  // ── Open / Close ─────────────────────────────────
  function open() {
    overlay.hidden = false;
    toggleBtn.setAttribute('aria-expanded', 'true');
    input.value = '';
    results.innerHTML = '';
    selectedIdx = -1;
    visibleItems = [];
    input.focus();
    document.body.style.overflow = 'hidden';
    if (index === null) loadIndex();
  }

  function close() {
    overlay.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    toggleBtn.focus();
  }

  function navigate(e) {
    if (visibleItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = (selectedIdx + 1) % visibleItems.length;
      updateSelection();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = (selectedIdx - 1 + visibleItems.length) % visibleItems.length;
      updateSelection();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIdx >= 0 && visibleItems[selectedIdx]) {
        window.location.href = visibleItems[selectedIdx].post.url;
      }
    }
  }

  // ── Events ───────────────────────────────────────
  toggleBtn.addEventListener('click', open);
  document.getElementById('search-close')?.addEventListener('click', close);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) {
      e.preventDefault();
      close();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      overlay.hidden ? open() : close();
    }
    if (!overlay.hidden) navigate(e);
  });

  input.addEventListener('input', function () {
    const q = input.value.trim();
    if (!q) {
      results.innerHTML = '';
      selectedIdx = -1;
      visibleItems = [];
      return;
    }
    const items = search(q);
    render(items, q);
  });

  // ── Load index ───────────────────────────────────
  function loadIndex() {
    if (index !== null) return;
    fetch('/index.json')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data.map(function (p) {
          // Also index content for deeper matching
          return {
            title: p.title,
            description: p.description,
            content: p.content || '',
            categories: p.categories,
            tags: p.tags,
            date: p.date,
            url: p.url
          };
        });
      })
      .catch(function () {
        results.innerHTML = '<div class="cmd-empty">Could not load search index.</div>';
      });
  }

  // ── Helpers ──────────────────────────────────────
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
})();
