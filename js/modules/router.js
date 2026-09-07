window.MAELYS = window.MAELYS || {};

window.MAELYS.Router = (function () {
  'use strict';

  const routes = [];
  let currentRoute = null;
  let beforeEach = null;
  let afterEach = null;
  let isTransitioning = false;

  const PATTERNS = [
    { pattern: /^#\/$/, name: 'home' },
    { pattern: /^#\/shop$/, name: 'shop' },
    { pattern: /^#\/product\/([^/]+)$/, name: 'product' },
    { pattern: /^#\/collections$/, name: 'collections' },
    { pattern: /^#\/collections\/([^/]+)$/, name: 'collection' },
    { pattern: /^#\/about$/, name: 'about' },
    { pattern: /^#\/journal$/, name: 'journal' },
    { pattern: /^#\/journal\/([^/]+)$/, name: 'journalArticle' },
    { pattern: /^#\/contact$/, name: 'contact' },
    { pattern: /^#\/faq$/, name: 'faq' },
    { pattern: /^#\/shipping$/, name: 'shipping' },
    { pattern: /^#\/returns$/, name: 'returns' },
    { pattern: /^#\/privacy$/, name: 'privacy' },
    { pattern: /^#\/terms$/, name: 'terms' },
    { pattern: /^#\/cart$/, name: 'cart' },
    { pattern: /^#\/search$/, name: 'search' }
  ];

  function matchRoute(hash) {
    const normalized = hash || '#/';
    for (let i = 0; i < PATTERNS.length; i++) {
      const match = normalized.match(PATTERNS[i].pattern);
      if (match) {
        const params = {};
        const paramNames = (PATTERNS[i].pattern.source.match(/[^/](\([^)]+\))/g) || []);
        const paramKeys = normalized.match(/#\/([^/]+)\//);
        if (match[1]) {
          params.slug = decodeURIComponent(match[1]);
        }
        return { name: PATTERNS[i].name, params: params, hash: normalized };
      }
    }
    return null;
  }

  function setPageMeta(name, params) {
    const baseTitle = 'MA\u00cbl\u00dfs';
    let title = baseTitle;
    let description = 'Luxury fragrances crafted with integrity. Each composition tells a story.';

    const metaMap = {
      home: { title: baseTitle, desc: 'MA\u00cbl\u00dfs \u2014 Luxury fragrances crafted with integrity. Discover compositions of uncommon depth and clarity.' },
      shop: { title: 'Shop \u2014 ' + baseTitle, desc: 'Explore the complete MA\u00cbl\u00dfs collection of luxury fragrances.' },
      product: { title: (params && params.slug ? params.slug.replace(/-/g, ' ').toUpperCase() : 'Fragrance') + ' \u2014 ' + baseTitle, desc: 'Discover this exquisite fragrance from MA\u00cbl\u00dfs.' },
      collections: { title: 'Collections \u2014 ' + baseTitle, desc: 'Explore curated collections of MA\u00cbl\u00dfs fragrances.' },
      collection: { title: 'Collection \u2014 ' + baseTitle, desc: 'A curated collection from MA\u00cbl\u00dfs.' },
      about: { title: 'Our Story \u2014 ' + baseTitle, desc: 'Learn about the house of MA\u00cbl\u00dfs and our philosophy of integrity in perfumery.' },
      journal: { title: 'Journal \u2014 ' + baseTitle, desc: 'Stories, insights, and knowledge from the world of MA\u00cbl\u00dfs fragrances.' },
      journalArticle: { title: 'Journal \u2014 ' + baseTitle, desc: 'Read this article from the MA\u00cbl\u00dfs journal.' },
      contact: { title: 'Contact \u2014 ' + baseTitle, desc: 'Get in touch with the MA\u00cbl\u00dfs team.' },
      faq: { title: 'FAQ \u2014 ' + baseTitle, desc: 'Frequently asked questions about MA\u00cbl\u00dfs fragrances, shipping, and returns.' },
      shipping: { title: 'Shipping \u2014 ' + baseTitle, desc: 'Shipping information for MA\u00cbl\u00dfs orders.' },
      returns: { title: 'Returns \u2014 ' + baseTitle, desc: 'Return and exchange policy for MA\u00cbl\u00dfs products.' },
      privacy: { title: 'Privacy Policy \u2014 ' + baseTitle, desc: 'MA\u00cbl\u00dfs privacy policy and data practices.' },
      terms: { title: 'Terms & Conditions \u2014 ' + baseTitle, desc: 'MA\u00cbl\u00dfs terms and conditions of use.' },
      cart: { title: 'Shopping Bag \u2014 ' + baseTitle, desc: 'Review your shopping bag.' },
      search: { title: 'Search \u2014 ' + baseTitle, desc: 'Search MA\u00cbl\u00dfs fragrances, collections, and articles.' }
    };

    const meta = metaMap[name] || metaMap.home;
    title = meta.title;
    description = meta.desc;

    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', description);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (!ogUrl) {
      ogUrl = document.createElement('meta');
      ogUrl.setAttribute('property', 'og:url');
      document.head.appendChild(ogUrl);
    }
    ogUrl.setAttribute('content', window.location.href);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }

  function scrollToTop(smooth) {
    if (smooth !== false && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }

  function navigate(hash, options) {
    options = options || {};
    if (isTransitioning) return;

    const matched = matchRoute(hash);
    if (!matched) {
      renderNotFound();
      return;
    }

    if (beforeEach) {
      const canProceed = beforeEach(matched, currentRoute);
      if (canProceed === false) return;
    }

    isTransitioning = true;
    const app = document.getElementById('app');
    if (!app) return;

    if (options.replace) {
      window.location.replace(hash);
    } else {
      window.location.hash = hash;
    }

    app.classList.add('page-fade-out');

    setTimeout(function () {
      setRoute(matched);
      setPageMeta(matched.name, matched.params);
      renderRouteContent(matched);

      app.classList.remove('page-fade-out');
      app.classList.add('page-enter');

      scrollToTop(options.scroll !== false);

      if (afterEach) {
        afterEach(matched, currentRoute);
      }

      setTimeout(function () {
        app.classList.remove('page-enter');
        isTransitioning = false;
      }, 750);
    }, 300);
  }

  function setRoute(matched) {
    currentRoute = {
      name: matched.name,
      params: matched.params,
      hash: matched.hash
    };
  }

  function renderRouteContent(matched) {
    if (window.MAELYS.App && window.MAELYS.App.render) {
      window.MAELYS.App.render(matched.name, matched.params);
    }
  }

  function renderNotFound() {
    const app = document.getElementById('app');
    if (!app) return;

    setPageMeta('404', {});
    app.innerHTML = '<div class="page-404" data-reveal><div class="error-code">404</div><h1 class="error-title">Page Not Found</h1><p class="error-desc">The page you are looking for does not exist or has been moved.</p><a href="#/" class="btn btn-primary">Return Home</a></div>';
  }

  function onHashChange() {
    const hash = window.location.hash || '#/';
    const matched = matchRoute(hash);
    if (matched) {
      setRoute(matched);
      setPageMeta(matched.name, matched.params);
      renderRouteContent(matched);
      scrollToTop(false);
    } else {
      renderNotFound();
    }
  }

  function init() {
    window.addEventListener('hashchange', onHashChange);

    const hash = window.location.hash || '#/';
    const matched = matchRoute(hash);
    if (matched) {
      setRoute(matched);
      setPageMeta(matched.name, matched.params);
      renderRouteContent(matched);
    } else {
      renderNotFound();
    }
  }

  function beforeEachHook(fn) {
    beforeEach = fn;
  }

  function afterEachHook(fn) {
    afterEach = fn;
  }

  function getCurrentRoute() {
    return currentRoute ? { name: currentRoute.name, params: currentRoute.params } : null;
  }

  function push(hash) {
    navigate(hash, { replace: false });
  }

  function replace(hash) {
    navigate(hash, { replace: true });
  }

  function back() {
    window.history.back();
  }

  function getPatternRoutes() {
    return PATTERNS.map(function (p) { return { pattern: p.pattern, name: p.name }; });
  }

  return {
    init: init,
    navigate: navigate,
    push: push,
    replace: replace,
    back: back,
    getCurrentRoute: getCurrentRoute,
    beforeEach: beforeEachHook,
    afterEach: afterEachHook,
    getPatternRoutes: getPatternRoutes,
    matchRoute: matchRoute,
    scrollToTop: scrollToTop
  };
})();
