window.MAELYS = window.MAELYS || {};

window.MAELYS.Animations = (function () {
  'use strict';

  var scrollObserver = null;
  var staggerObserver = null;
  var lazyObserver = null;
  var prefersReducedMotion = false;

  function init() {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      revealAllImmediately();
      return;
    }

    initScrollReveal();
    initStaggerReveal();
    initLazyLoading();
    initHeroEntrance();
  }

  function initScrollReveal() {
    if (!('IntersectionObserver' in window)) {
      revealAllImmediately();
      return;
    }

    scrollObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-visible');
          scrollObserver.unobserve(entries[i].target);
        }
      }
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -60px 0px'
    });

    observeReveals();
  }

  function observeReveals() {
    var elements = document.querySelectorAll('[data-reveal]');
    for (var i = 0; i < elements.length; i++) {
      if (scrollObserver) {
        scrollObserver.observe(elements[i]);
      }
    }
  }

  function initStaggerReveal() {
    if (!('IntersectionObserver' in window)) {
      var staggerEls = document.querySelectorAll('.stagger-children');
      for (var i = 0; i < staggerEls.length; i++) {
        staggerEls[i].classList.add('is-visible');
      }
      return;
    }

    staggerObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('is-visible');
          staggerObserver.unobserve(entries[i].target);
        }
      }
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px -40px 0px'
    });

    var staggerEls = document.querySelectorAll('.stagger-children');
    for (var j = 0; j < staggerEls.length; j++) {
      staggerObserver.observe(staggerEls[j]);
    }
  }

  function initLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      var lazyImages = document.querySelectorAll('img[loading="lazy"]');
      for (var i = 0; i < lazyImages.length; i++) {
        lazyImages[i].classList.add('loaded');
      }
      return;
    }

    lazyObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          var img = entries[i].target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          img.addEventListener('load', function () {
            this.classList.add('loaded');
          });
          lazyObserver.unobserve(img);
        }
      }
    }, {
      threshold: 0,
      rootMargin: '200px'
    });

    observeLazyImages();
  }

  function observeLazyImages() {
    var images = document.querySelectorAll('img[loading="lazy"], img[data-src]');
    for (var i = 0; i < images.length; i++) {
      if (lazyObserver) {
        lazyObserver.observe(images[i]);
      }
    }
  }

  function initHeroEntrance() {
    var hero = document.querySelector('.hero');
    if (hero) {
      hero.classList.add('hero-enter');
    }
  }

  function revealAllImmediately() {
    var elements = document.querySelectorAll('[data-reveal], .stagger-children, .reveal, .reveal-fade');
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.add('is-visible');
    }
    var images = document.querySelectorAll('img[loading="lazy"]');
    for (var j = 0; j < images.length; j++) {
      images[j].classList.add('loaded');
    }
  }

  function refresh() {
    if (prefersReducedMotion) {
      revealAllImmediately();
      return;
    }
    observeReveals();
    observeLazyImages();
    initStaggerReveal();
    initHeroEntrance();
  }

  function disconnect() {
    if (scrollObserver) scrollObserver.disconnect();
    if (staggerObserver) staggerObserver.disconnect();
    if (lazyObserver) lazyObserver.disconnect();
  }

  function animatePageTransition(container, callback) {
    if (prefersReducedMotion) {
      if (callback) callback();
      return;
    }

    container.style.opacity = '0';
    container.style.transform = 'translateY(12px)';

    requestAnimationFrame(function () {
      if (callback) callback();
      requestAnimationFrame(function () {
        container.style.transition = 'opacity 0.6s var(--ease-out), transform 0.6s var(--ease-out)';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';

        setTimeout(function () {
          container.style.transition = '';
        }, 700);
      });
    });
  }

  function prefersReduced() {
    return prefersReducedMotion;
  }

  return {
    init: init,
    refresh: refresh,
    disconnect: disconnect,
    observeReveals: observeReveals,
    observeLazyImages: observeLazyImages,
    animatePageTransition: animatePageTransition,
    prefersReduced: prefersReduced
  };
})();
