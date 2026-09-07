window.MAELYS = window.MAELYS || {};

window.MAELYS.Search = (function () {
  'use strict';

  var STORAGE_KEY = 'maelys_recent_searches';
  var MAX_RECENT = 6;
  var overlayEl = null;
  var inputEl = null;
  var resultsEl = null;
  var isOpen = false;
  var debounceTimer = null;

  function getRecentSearches() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveRecentSearch(query) {
    var searches = getRecentSearches();
    query = query.trim().toLowerCase();
    if (!query) return;

    var filtered = [];
    for (var i = 0; i < searches.length; i++) {
      if (searches[i] !== query) filtered.push(searches[i]);
    }
    filtered.unshift(query);
    if (filtered.length > MAX_RECENT) filtered = filtered.slice(0, MAX_RECENT);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      // storage unavailable
    }
  }

  function clearRecentSearches() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function searchAll(query) {
    if (!query || query.length < 2) return { products: [], collections: [], articles: [] };

    var q = query.toLowerCase().trim();
    var products = window.MAELYS.products || [];
    var collections = window.MAELYS.collections || [];
    var journal = window.MAELYS.journal || [];

    var matchedProducts = [];
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      if (matchScore(q, [p.name, p.collection, p.type, p.description, p.shortDescription, p.fragranceFamily, (p.topNotes || []).join(' '), (p.heartNotes || []).join(' '), (p.baseNotes || []).join(' '), (p.tags || []).join(' '), (p.moods || []).join(' ')]) > 0) {
        matchedProducts.push({ product: p, score: matchScore(q, [p.name, p.collection, p.type, p.description, p.shortDescription, p.fragranceFamily]) });
      }
    }
    matchedProducts.sort(function (a, b) { return b.score - a.score; });
    matchedProducts = matchedProducts.slice(0, 5);

    var matchedCollections = [];
    for (var j = 0; j < collections.length; j++) {
      var c = collections[j];
      if (matchScore(q, [c.name, c.description]) > 0) {
        matchedCollections.push({ collection: c, score: matchScore(q, [c.name, c.description]) });
      }
    }
    matchedCollections.sort(function (a, b) { return b.score - a.score; });

    var matchedArticles = [];
    for (var k = 0; k < journal.length; k++) {
      var a = journal[k];
      if (matchScore(q, [a.title, a.category, a.excerpt, a.content]) > 0) {
        matchedArticles.push({ article: a, score: matchScore(q, [a.title, a.category, a.excerpt]) });
      }
    }
    matchedArticles.sort(function (a, b) { return b.score - a.score; });
    matchedArticles = matchedArticles.slice(0, 3);

    return {
      products: matchedProducts.map(function (m) { return m.product; }),
      collections: matchedCollections.map(function (m) { return m.collection; }),
      articles: matchedArticles.map(function (m) { return m.article; })
    };
  }

  function matchScore(query, fields) {
    var score = 0;
    var q = query.toLowerCase();
    for (var i = 0; i < fields.length; i++) {
      if (!fields[i]) continue;
      var text = fields[i].toLowerCase();
      if (text === q) score += 100;
      else if (text.indexOf(q) === 0) score += 50;
      else if (text.indexOf(q) !== -1) score += 10;
      else {
        var words = q.split(/\s+/);
        for (var w = 0; w < words.length; w++) {
          if (words[w] && text.indexOf(words[w]) !== -1) score += 5;
        }
      }
    }
    return score;
  }

  function renderResults(query) {
    if (!resultsEl) return;

    var results = searchAll(query);
    var total = results.products.length + results.collections.length + results.articles.length;

    if (total === 0 && query.length >= 2) {
      resultsEl.innerHTML = '<div style="text-align:center;padding:var(--space-3xl) 0;">' +
        '<p style="color:var(--color-muted);font-size:var(--text-lg);">No results found for "' + escapeHtml(query) + '"</p>' +
        '<p style="color:var(--color-surface-elevated);font-size:var(--text-sm);margin-top:var(--space-sm);">Try a different search term</p>' +
      '</div>';
      return;
    }

    if (total === 0) {
      renderSuggestions();
      return;
    }

    var html = '';

    if (results.products.length > 0) {
      html += '<div class="search-section" style="margin-bottom:var(--space-2xl);">' +
        '<div style="font-size:var(--text-xs);letter-spacing:var(--tracking-widest);text-transform:uppercase;color:var(--color-muted);margin-bottom:var(--space-lg);">Fragrances</div>';
      for (var i = 0; i < results.products.length; i++) {
        var p = results.products[i];
        var imgUrl = (p.images && p.images.main) ? p.images.main : '';
        var imgHtml = imgUrl ?
          '<img src="' + imgUrl + '" alt="' + p.name + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy">' :
          '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:var(--text-sm);color:var(--color-accent);background:var(--color-surface);">' + p.name.charAt(0) + '</div>';
        html += '<a href="#/product/' + p.slug + '" class="search-result-item" data-close-search style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border);text-decoration:none;color:var(--color-text);transition:opacity var(--transition-base);">' +
          '<div style="width:48px;height:60px;overflow:hidden;flex-shrink:0;">' + imgHtml + '</div>' +
          '<div style="flex:1;">' +
            '<div style="font-family:var(--font-display);font-size:var(--text-lg);">' + p.name + '</div>' +
            '<div style="font-size:var(--text-xs);color:var(--color-muted);">' + p.collection + ' \u00b7 ' + p.type + '</div>' +
          '</div>' +
          '<div style="font-size:var(--text-sm);color:var(--color-text);">$' + p.price + '</div>' +
        '</a>';
      }
      html += '</div>';
    }

    if (results.collections.length > 0) {
      html += '<div class="search-section" style="margin-bottom:var(--space-2xl);">' +
        '<div style="font-size:var(--text-xs);letter-spacing:var(--tracking-widest);text-transform:uppercase;color:var(--color-muted);margin-bottom:var(--space-lg);">Collections</div>';
      for (var j = 0; j < results.collections.length; j++) {
        var c = results.collections[j];
        html += '<a href="#/collections/' + c.slug + '" class="search-result-item" data-close-search style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border);text-decoration:none;color:var(--color-text);">' +
          '<div style="flex:1;">' +
            '<div style="font-family:var(--font-display);font-size:var(--text-lg);">' + c.name + '</div>' +
            '<div style="font-size:var(--text-xs);color:var(--color-muted);">Collection</div>' +
          '</div>' +
        '</a>';
      }
      html += '</div>';
    }

    if (results.articles.length > 0) {
      html += '<div class="search-section">' +
        '<div style="font-size:var(--text-xs);letter-spacing:var(--tracking-widest);text-transform:uppercase;color:var(--color-muted);margin-bottom:var(--space-lg);">Journal</div>';
      for (var k = 0; k < results.articles.length; k++) {
        var a = results.articles[k];
        html += '<a href="#/journal/' + a.slug + '" class="search-result-item" data-close-search style="display:flex;align-items:center;gap:var(--space-md);padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border);text-decoration:none;color:var(--color-text);">' +
          '<div style="flex:1;">' +
            '<div style="font-family:var(--font-display);font-size:var(--text-lg);">' + a.title + '</div>' +
            '<div style="font-size:var(--text-xs);color:var(--color-muted);">' + a.category + ' \u00b7 ' + a.readTime + '</div>' +
          '</div>' +
        '</a>';
      }
      html += '</div>';
    }

    resultsEl.innerHTML = html;

    var closeLinks = resultsEl.querySelectorAll('[data-close-search]');
    for (var n = 0; n < closeLinks.length; n++) {
      closeLinks[n].addEventListener('click', function () {
        close();
      });
    }
  }

  function renderSuggestions() {
    if (!resultsEl) return;

    var recent = getRecentSearches();

    if (recent.length === 0) {
      resultsEl.innerHTML = '<div style="text-align:center;padding:var(--space-3xl) 0;">' +
        '<p style="color:var(--color-surface-elevated);font-size:var(--text-sm);">Start typing to search fragrances, collections, and articles</p>' +
      '</div>';
      return;
    }

    var html = '<div style="margin-top:var(--space-2xl);width:100%;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-lg);">' +
        '<span style="font-size:var(--text-xs);letter-spacing:var(--tracking-widest);text-transform:uppercase;color:var(--color-muted);">Recent Searches</span>' +
        '<button class="btn btn-ghost btn-sm" id="search-clear-recent" style="padding:0;font-size:var(--text-xs);">Clear All</button>' +
      '</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:var(--space-xs);">';

    for (var i = 0; i < recent.length; i++) {
      html += '<button class="tag" data-recent-search="' + escapeHtml(recent[i]) + '">' + escapeHtml(recent[i]) + '</button>';
    }

    html += '</div></div>';
    resultsEl.innerHTML = html;

    var clearBtn = document.getElementById('search-clear-recent');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        clearRecentSearches();
        renderSuggestions();
      });
    }

    var tags = resultsEl.querySelectorAll('[data-recent-search]');
    for (var j = 0; j < tags.length; j++) {
      tags[j].addEventListener('click', function () {
        var q = this.getAttribute('data-recent-search');
        if (inputEl) {
          inputEl.value = q;
          inputEl.focus();
        }
        renderResults(q);
      });
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;

    overlayEl = document.querySelector('.search-overlay');
    if (!overlayEl) return;

    overlayEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    inputEl = overlayEl.querySelector('.search-overlay-input') || overlayEl.querySelector('.search-input');
    resultsEl = overlayEl.querySelector('.search-overlay-results') || overlayEl.querySelector('.search-body');

    if (inputEl) {
      inputEl.value = '';
      inputEl.focus();
    }

    renderSuggestions();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;

    if (overlayEl) overlayEl.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function toggle() {
    if (isOpen) close();
    else open();
  }

  function handleInput(e) {
    var query = e.target.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      if (query.length >= 2) {
        renderResults(query);
      } else {
        renderSuggestions();
      }
    }, 150);
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      close();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!inputEl) return;
    var query = inputEl.value.trim();
    if (query.length >= 2) {
      saveRecentSearch(query);
      renderResults(query);
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function init() {
    overlayEl = document.querySelector('.search-overlay');

    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.key === '/' && !isOpen) {
        e.preventDefault();
        open();
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    });

    var searchToggles = document.querySelectorAll('.search-toggle, [data-search-toggle]');
    for (var i = 0; i < searchToggles.length; i++) {
      searchToggles[i].addEventListener('click', function (e) {
        e.preventDefault();
        toggle();
      });
    }

    if (overlayEl) {
      var closeBtn = overlayEl.querySelector('.search-overlay-close') || overlayEl.querySelector('.search-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', close);
      }

      overlayEl.addEventListener('click', function(e) {
        if (e.target === overlayEl || e.target.classList.contains('search-backdrop')) {
          close();
        }
      });

      inputEl = overlayEl.querySelector('.search-overlay-input') || overlayEl.querySelector('.search-input');
      resultsEl = overlayEl.querySelector('.search-overlay-results') || overlayEl.querySelector('.search-body');

      if (inputEl) {
        inputEl.addEventListener('input', handleInput);
        inputEl.addEventListener('keydown', handleKeydown);
      }

      overlayEl.addEventListener('submit', handleSubmit);
    }
  }

  return {
    init: init,
    open: open,
    close: close,
    toggle: toggle,
    searchAll: searchAll,
    getRecentSearches: getRecentSearches,
    clearRecentSearches: clearRecentSearches
  };
})();
