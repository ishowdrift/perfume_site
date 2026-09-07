window.MAELYS = window.MAELYS || {};

window.MAELYS.UI = (function () {
  'use strict';

  var cursorEl = null;
  var isTouchDevice = false;
  var toastContainer = null;
  var backToTopBtn = null;

  function init() {
    isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    toastContainer = document.querySelector('.toast-container');
    backToTopBtn = document.querySelector('.back-to-top');

    if (!isTouchDevice) initCustomCursor();
    initMobileMenu();
    initHeaderScroll();
    initAccordions();
    initSizeSelectors();
    initQuantitySelectors();
    initBackToTop();
    initNewsletterForms();
  }

  /* ── Custom Cursor ─────────────────────────────────────────────────────── */
  function initCustomCursor() {
    cursorEl = document.querySelector('.custom-cursor');
    if (!cursorEl) return;

    var cursorX = 0, cursorY = 0;
    var targetX = 0, targetY = 0;
    var rafId = null;
    var isHovering = false;

    document.addEventListener('mousemove', function (e) {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!cursorEl.classList.contains('visible')) {
        cursorEl.classList.add('visible');
      }
    });

    document.addEventListener('mouseleave', function () {
      cursorEl.classList.remove('visible');
    });

    document.addEventListener('mouseenter', function () {
      cursorEl.classList.add('visible');
    });

    function updateCursor() {
      cursorX += (targetX - cursorX) * 0.15;
      cursorY += (targetY - cursorY) * 0.15;
      cursorEl.style.left = cursorX + 'px';
      cursorEl.style.top = cursorY + 'px';
      rafId = requestAnimationFrame(updateCursor);
    }
    rafId = requestAnimationFrame(updateCursor);

    var hoverElements = document.querySelectorAll('a, button, [data-cursor-hover], .btn, .card, .tag, .accordion-trigger, .gallery-thumb');
    for (var i = 0; i < hoverElements.length; i++) {
      hoverElements[i].addEventListener('mouseenter', function () {
        cursorEl.classList.add('hovering');
        isHovering = true;
      });
      hoverElements[i].addEventListener('mouseleave', function () {
        cursorEl.classList.remove('hovering');
        isHovering = false;
      });
    }

    document.addEventListener('click', function () {
      if (cursorEl) {
        cursorEl.style.transform = 'translate(-50%, -50%) scale(0.85)';
        setTimeout(function () {
          cursorEl.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 150);
      }
    });
  }

  /* ── Mobile Menu ───────────────────────────────────────────────────────── */
  function initMobileMenu() {
    var menuBtn = document.querySelector('.mobile-menu-toggle') || document.querySelector('[data-mobile-menu-toggle]');
    var overlay = document.querySelector('.mobile-menu-overlay');
    var isOpen = false;

    if (!menuBtn || !overlay) return;

    function openMenu() {
      isOpen = true;
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      menuBtn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      isOpen = false;
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      menuBtn.setAttribute('aria-expanded', 'false');
    }

    menuBtn.addEventListener('click', function () {
      if (isOpen) closeMenu();
      else openMenu();
    });

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeMenu();
    });

    var menuLinks = overlay.querySelectorAll('a');
    for (var i = 0; i < menuLinks.length; i++) {
      menuLinks[i].addEventListener('click', closeMenu);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen) closeMenu();
    });
  }

  /* ── Header Scroll ─────────────────────────────────────────────────────── */
  function initHeaderScroll() {
    var header = document.querySelector('.site-header') || document.querySelector('.header');
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Accordion / FAQ Toggle ────────────────────────────────────────────── */
  function initAccordions() {
    var triggers = document.querySelectorAll('.accordion-trigger');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', toggleAccordion);
    }
  }

  function toggleAccordion(e) {
    var trigger = e.currentTarget;
    var item = trigger.closest('.accordion-item');
    if (!item) return;

    var content = item.querySelector('.accordion-content');
    var isOpen = item.classList.contains('is-open');

    if (isOpen) {
      item.classList.remove('is-open');
      content.style.maxHeight = '0';
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('is-open');
      content.style.maxHeight = content.scrollHeight + 'px';
      trigger.setAttribute('aria-expanded', 'true');
    }
  }

  function initSingleAccordion(triggerSelector, contentSelector) {
    var triggers = document.querySelectorAll(triggerSelector);
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function (e) {
        var panel = this.closest('.accordion-item');
        if (!panel) return;
        var content = panel.querySelector(contentSelector);
        var isOpen = panel.classList.contains('is-open');

        if (isOpen) {
          panel.classList.remove('is-open');
          content.style.maxHeight = '0';
        } else {
          panel.classList.add('is-open');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    }
  }

  /* ── Form Validation ───────────────────────────────────────────────────── */
  function validateForm(formEl) {
    var valid = true;
    var fields = formEl.querySelectorAll('[required]');
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var errorEl = field.parentNode.querySelector('.form-error');
      var value = field.value.trim();

      if (!value) {
        showFieldError(field, errorEl, 'This field is required');
        valid = false;
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        showFieldError(field, errorEl, 'Please enter a valid email address');
        valid = false;
      } else {
        clearFieldError(field, errorEl);
      }
    }
    return valid;
  }

  function showFieldError(field, errorEl, message) {
    field.style.borderColor = 'var(--color-error)';
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    } else {
      var newError = document.createElement('div');
      newError.className = 'form-error';
      newError.textContent = message;
      field.parentNode.appendChild(newError);
    }
  }

  function clearFieldError(field, errorEl) {
    field.style.borderColor = '';
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  /* ── Toast Notifications ───────────────────────────────────────────────── */
  function showToast(message, type, duration) {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      toastContainer.setAttribute('aria-live', 'polite');
      toastContainer.style.cssText = 'position:fixed;bottom:var(--space-xl);left:50%;transform:translateX(-50%);z-index:var(--z-toast);display:flex;flex-direction:column;gap:var(--space-sm);pointer-events:none;';
      document.body.appendChild(toastContainer);
    }

    type = type || 'info';
    duration = duration || 3500;

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', 'status');
    toast.style.cssText = 'pointer-events:auto;padding:var(--space-md) var(--space-xl);font-size:var(--text-sm);color:var(--color-text);background:var(--color-surface-elevated);border:1px solid var(--color-border);display:flex;align-items:center;gap:var(--space-sm);opacity:0;transform:translateY(8px);transition:opacity 0.3s var(--ease-out),transform 0.3s var(--ease-out);';

    if (type === 'success') toast.style.borderColor = 'var(--color-success)';
    else if (type === 'error') toast.style.borderColor = 'var(--color-error)';

    toast.textContent = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  /* ── Size Selector ─────────────────────────────────────────────────────── */
  function initSizeSelectors() {
    var containers = document.querySelectorAll('.product-sizes');
    for (var i = 0; i < containers.length; i++) {
      var buttons = containers[i].querySelectorAll('.product-size-btn');
      for (var j = 0; j < buttons.length; j++) {
        buttons[j].addEventListener('click', handleSizeSelect);
      }
    }
  }

  function handleSizeSelect(e) {
    var btn = e.currentTarget;
    var container = btn.closest('.product-sizes');
    if (!container) return;

    var siblings = container.querySelectorAll('.product-size-btn');
    for (var i = 0; i < siblings.length; i++) {
      siblings[i].classList.remove('active');
    }
    btn.classList.add('active');

    var priceEl = document.querySelector('.product-price');
    if (priceEl && btn.dataset.price) {
      priceEl.textContent = '$' + parseInt(btn.dataset.price, 10).toFixed(2);
    }

    if (typeof window.MAELYS.onSizeChange === 'function') {
      window.MAELYS.onSizeChange(btn.dataset.size || btn.textContent.trim());
    }
  }

  /* ── Quantity Selector ─────────────────────────────────────────────────── */
  function initQuantitySelectors() {
    var selectors = document.querySelectorAll('.quantity-selector');
    for (var i = 0; i < selectors.length; i++) {
      var btns = selectors[i].querySelectorAll('.quantity-btn');
      for (var j = 0; j < btns.length; j++) {
        if (!btns[j].hasAttribute('data-action')) {
          btns[j].addEventListener('click', handleQuantityChange);
        }
      }
    }
  }

  function handleQuantityChange(e) {
    var btn = e.currentTarget;
    var selector = btn.closest('.quantity-selector');
    if (!selector) return;

    var valueEl = selector.querySelector('.quantity-value');
    if (!valueEl) return;

    var current = parseInt(valueEl.textContent, 10) || 1;
    var isPlus = btn.textContent.trim() === '+';

    if (isPlus) {
      current = Math.min(current + 1, 10);
    } else {
      current = Math.max(current - 1, 1);
    }

    valueEl.textContent = current;
  }

  /* ── Image Gallery ─────────────────────────────────────────────────────── */
  function initImageGallery(container) {
    if (!container) return;
    var mainImage = container.querySelector('.gallery-main img');
    var thumbs = container.querySelectorAll('.gallery-thumb');
    var prevBtn = container.querySelector('.gallery-nav-prev');
    var nextBtn = container.querySelector('.gallery-nav-next');
    var currentIndex = 0;

    var images = [];
    for (var i = 0; i < thumbs.length; i++) {
      var img = thumbs[i].querySelector('img');
      if (img) images.push(img.src || img.dataset.src);
    }

    function setActive(index) {
      if (index < 0 || index >= images.length) return;
      currentIndex = index;
      if (mainImage) mainImage.src = images[index];
      for (var j = 0; j < thumbs.length; j++) {
        thumbs[j].classList.toggle('active', j === index);
      }
    }

    for (var k = 0; k < thumbs.length; k++) {
      (function (idx) {
        thumbs[idx].addEventListener('click', function () {
          setActive(idx);
        });
      })(k);
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        setActive(currentIndex > 0 ? currentIndex - 1 : images.length - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        setActive(currentIndex < images.length - 1 ? currentIndex + 1 : 0);
      });
    }
  }

  function openLightbox(imageSrc, alt) {
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay is-open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Image lightbox');
    overlay.style.cssText = 'cursor:zoom-out;';

    overlay.innerHTML = '<div style="max-width:90vw;max-height:90vh;display:flex;align-items:center;justify-content:center;">' +
      '<div style="width:100%;aspect-ratio:3/4;background:var(--color-surface);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:var(--text-5xl);color:var(--color-accent);">' + (alt || 'Image') + '</div>' +
    '</div>';

    overlay.addEventListener('click', function () {
      document.body.removeChild(overlay);
      document.body.style.overflow = '';
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  }

  /* ── Tooltip ───────────────────────────────────────────────────────────── */
  function initTooltips() {
    var els = document.querySelectorAll('[data-tooltip]');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('tooltip');
    }
  }

  /* ── Back to Top ───────────────────────────────────────────────────────── */
  function initBackToTop() {
    if (!backToTopBtn) {
      backToTopBtn = document.querySelector('.back-to-top');
    }
    if (!backToTopBtn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 600) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });

    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── Newsletter Forms ──────────────────────────────────────────────────── */
  function initNewsletterForms() {
    var forms = document.querySelectorAll('.newsletter-form, [data-newsletter-form]');
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', handleNewsletterSubmit);
    }
  }

  function handleNewsletterSubmit(e) {
    e.preventDefault();
    var form = e.currentTarget;
    var emailInput = form.querySelector('input[type="email"]');
    if (!emailInput) return;

    var email = emailInput.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    emailInput.value = '';
    showToast('Thank you for subscribing. Welcome to MA\u00cbl\u00dfs.', 'success');
  }

  /* ── Contact Form ──────────────────────────────────────────────────────── */
  function initContactForm(formEl) {
    if (!formEl) return;

    formEl.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!validateForm(formEl)) return;

      var submitBtn = formEl.querySelector('[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      setTimeout(function () {
        formEl.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        }
        showToast('Your message has been sent. We will respond within 24 hours.', 'success');
      }, 1200);
    });
  }

  /* ── Utility ────────────────────────────────────────────────────────────── */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  return {
    init: init,
    showToast: showToast,
    validateForm: validateForm,
    initAccordions: initAccordions,
    initSizeSelectors: initSizeSelectors,
    initQuantitySelectors: initQuantitySelectors,
    initImageGallery: initImageGallery,
    openLightbox: openLightbox,
    initContactForm: initContactForm,
    initNewsletterForms: initNewsletterForms,
    initBackToTop: initBackToTop,
    initTooltips: initTooltips,
    escapeHtml: escapeHtml
  };
})();
