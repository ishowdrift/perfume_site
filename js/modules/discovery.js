window.MAELYS = window.MAELYS || {};

window.MAELYS.Discovery = (function () {
  'use strict';

  var state = {
    moods: [],
    notes: [],
    intensity: [],
    season: [],
    gender: []
  };

  var allMoods = ['warm', 'fresh', 'clean', 'dark', 'mysterious', 'sensual'];
  var allNotes = [];
  var allIntensities = ['Moderate', 'Long Lasting', 'Intense'];
  var allSeasons = ['All Seasons', 'Spring/Summer', 'Fall/Winter'];
  var allGenders = ['Feminine', 'Masculine', 'Unisex'];

  var containerEl = null;
  var onFilterChange = null;

  function extractNotes() {
    var notes = {};
    var products = window.MAELYS.products || [];
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var allN = [].concat(p.topNotes || [], p.heartNotes || [], p.baseNotes || []);
      for (var j = 0; j < allN.length; j++) {
        var note = allN[j];
        if (!notes[note]) notes[note] = 0;
        notes[note]++;
      }
    }
    var sorted = Object.keys(notes).sort(function (a, b) { return notes[b] - notes[a]; });
    return sorted.slice(0, 12);
  }

  function filterProducts() {
    var products = window.MAELYS.products || [];
    var results = [];

    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var match = true;

      if (state.moods.length > 0) {
        var moodMatch = false;
        for (var m = 0; m < state.moods.length; m++) {
          if (p.moods && p.moods.indexOf(state.moods[m]) !== -1) {
            moodMatch = true;
            break;
          }
        }
        if (!moodMatch) match = false;
      }

      if (match && state.intensity.length > 0) {
        if (state.intensity.indexOf(p.longevity) === -1) match = false;
      }

      if (match && state.season.length > 0) {
        if (state.season.indexOf(p.season) === -1) match = false;
      }

      if (match && state.gender.length > 0) {
        if (state.gender.indexOf(p.gender) === -1) match = false;
      }

      if (match && state.notes.length > 0) {
        var allN = [].concat(p.topNotes || [], p.heartNotes || [], p.baseNotes || []);
        var noteMatch = false;
        for (var n = 0; n < state.notes.length; n++) {
          if (allN.indexOf(state.notes[n]) !== -1) {
            noteMatch = true;
            break;
          }
        }
        if (!noteMatch) match = false;
      }

      if (match) results.push(p);
    }

    return results;
  }

  function toggleFilter(category, value) {
    var arr = state[category];
    if (!arr) return;

    var idx = arr.indexOf(value);
    if (idx === -1) {
      arr.push(value);
    } else {
      arr.splice(idx, 1);
    }

    render();
    if (typeof onFilterChange === 'function') {
      onFilterChange(filterProducts(), state);
    }
  }

  function clearAll() {
    state.moods = [];
    state.notes = [];
    state.intensity = [];
    state.season = [];
    state.gender = [];
    render();
    if (typeof onFilterChange === 'function') {
      onFilterChange(filterProducts(), state);
    }
  }

  function getActiveFilterCount() {
    var count = 0;
    for (var key in state) {
      if (state.hasOwnProperty(key)) {
        count += state[key].length;
      }
    }
    return count;
  }

  function renderTagButtons(category, items) {
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var isActive = state[category] && state[category].indexOf(items[i]) !== -1;
      html += '<button class="tag' + (isActive ? ' active' : '') + '" data-discovery-category="' + category + '" data-discovery-value="' + items[i] + '">' + items[i] + '</button>';
    }
    return html;
  }

  function renderFilters() {
    if (!containerEl) return;

    var products = window.MAELYS.products || [];
    var filtered = filterProducts();
    var activeCount = getActiveFilterCount();

    var html = '<div class="discovery-sidebar">' +
      '<div class="section-header" style="margin-bottom:var(--space-2xl);">' +
        '<div class="section-label">Find Your Fragrance</div>' +
        '<h2 class="section-title">Fragrance Discovery</h2>' +
        '<p class="section-desc">Filter by mood, ingredients, and intensity to find compositions that resonate with you.</p>' +
      '</div>';

    html += '<div class="discovery-filter-group">' +
      '<div class="discovery-filter-title">Mood</div>' +
      '<div class="filter-bar">' + renderTagButtons('moods', allMoods) + '</div>' +
    '</div>';

    if (allNotes.length > 0) {
      html += '<div class="discovery-filter-group">' +
        '<div class="discovery-filter-title">Key Notes</div>' +
        '<div class="filter-bar">' + renderTagButtons('notes', allNotes.slice(0, 8)) + '</div>' +
      '</div>';
    }

    html += '<div class="discovery-filter-group">' +
      '<div class="discovery-filter-title">Intensity</div>' +
      '<div class="filter-bar">' + renderTagButtons('intensity', allIntensities) + '</div>' +
    '</div>';

    html += '<div class="discovery-filter-group">' +
      '<div class="discovery-filter-title">Season</div>' +
      '<div class="filter-bar">' + renderTagButtons('season', allSeasons) + '</div>' +
    '</div>';

    html += '<div class="discovery-filter-group">' +
      '<div class="discovery-filter-title">Gender</div>' +
      '<div class="filter-bar">' + renderTagButtons('gender', allGenders) + '</div>' +
    '</div>';

    if (activeCount > 0) {
      html += '<button class="btn btn-ghost btn-sm" id="discovery-clear-all" style="align-self:flex-start;">Clear All Filters (' + activeCount + ')</button>';
    }

    html += '</div>';

    html += '<div>' +
      '<div class="discovery-results-count">' + filtered.length + ' fragrance' + (filtered.length !== 1 ? 's' : '') + ' found</div>' +
      '<div class="products-grid stagger-children">';

    for (var i = 0; i < filtered.length; i++) {
      html += renderProductCard(filtered[i]);
    }

    if (filtered.length === 0) {
      html += '<div style="grid-column:1/-1;text-align:center;padding:var(--space-4xl) 0;">' +
        '<p style="color:var(--color-muted);font-size:var(--text-lg);margin-bottom:var(--space-md);">No fragrances match your criteria</p>' +
        '<button class="btn btn-secondary" id="discovery-reset-empty">Reset Filters</button>' +
      '</div>';
    }

    html += '</div></div></div>';

    containerEl.innerHTML = html;
    bindFilterEvents();
  }

  function renderProductCard(product) {
    var imgUrl = (product.images && product.images.main) ? product.images.main : '';
    var imgHtml = imgUrl ?
      '<img src="' + imgUrl + '" alt="' + product.name + '" style="width:100%;height:100%;object-fit:cover;transition:transform 0.6s var(--ease-out);" loading="lazy">' :
      '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:var(--text-4xl);color:var(--color-accent);background:var(--color-surface);">' + product.name.charAt(0) + '</div>';

    var badges = '';
    if (product.newArrival) badges += '<span class="badge badge-new">New</span> ';
    if (product.limitedEdition) badges += '<span class="badge badge-accent">Limited</span> ';

    return '<article class="card" data-reveal>' +
      '<a href="#/product/' + product.slug + '" class="card-image-wrap" style="position:relative;overflow:hidden;">' +
        '<span style="position:absolute;top:var(--space-md);left:var(--space-md);display:flex;gap:var(--space-2xs);z-index:2;">' + badges + '</span>' +
        imgHtml +
      '</a>' +
      '<div class="card-body">' +
        '<div class="card-category">' + product.collection + '</div>' +
        '<h3 class="card-title"><a href="#/product/' + product.slug + '" style="text-decoration:none;color:inherit;">' + product.name + '</a></h3>' +
        '<p class="card-subtitle">' + product.shortDescription + '</p>' +
        '<div class="card-price">$' + product.price + '</div>' +
      '</div>' +
    '</article>';
  }

  function bindFilterEvents() {
    var tagBtns = document.querySelectorAll('[data-discovery-category]');
    for (var i = 0; i < tagBtns.length; i++) {
      tagBtns[i].addEventListener('click', function () {
        var category = this.getAttribute('data-discovery-category');
        var value = this.getAttribute('data-discovery-value');
        toggleFilter(category, value);
      });
    }

    var clearBtn = document.getElementById('discovery-clear-all');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearAll);
    }

    var resetEmpty = document.getElementById('discovery-reset-empty');
    if (resetEmpty) {
      resetEmpty.addEventListener('click', clearAll);
    }
  }

  function render() {
    allNotes = extractNotes();
    renderFilters();
  }

  function init(container, filterCallback) {
    containerEl = container;
    onFilterChange = filterCallback || null;
    allNotes = extractNotes();
    render();
  }

  function getState() {
    return {
      moods: state.moods.slice(),
      notes: state.notes.slice(),
      intensity: state.intensity.slice(),
      season: state.season.slice(),
      gender: state.gender.slice()
    };
  }

  function getFilteredProducts() {
    return filterProducts();
  }

  return {
    init: init,
    render: render,
    filterProducts: filterProducts,
    toggleFilter: toggleFilter,
    clearAll: clearAll,
    getState: getState,
    getFilteredProducts: getFilteredProducts,
    getActiveFilterCount: getActiveFilterCount
  };
})();
