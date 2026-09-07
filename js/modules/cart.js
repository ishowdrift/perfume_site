window.MAELYS = window.MAELYS || {};

window.MAELYS.Cart = (function () {
  'use strict';

  var STORAGE_KEY = 'maelys_cart';
  var drawerEl = null;
  var overlayEl = null;
  var onUpdateCallbacks = [];

  function getCart() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      // storage full or unavailable
    }
    notifyUpdate();
  }

  function notifyUpdate() {
      for (var i = 0; i < onUpdateCallbacks.length; i++) {
        onUpdateCallbacks[i](getCart());
      }
  }

  function onUpdate(fn) {
    if (typeof fn === 'function') {
      onUpdateCallbacks.push(fn);
    }
  }

  function getProduct(slug) {
    var products = window.MAELYS.products || [];
    for (var i = 0; i < products.length; i++) {
      if (products[i].slug === slug) return products[i];
    }
    return null;
  }

  function getSizePrice(product, sizeMl) {
    if (!product || !product.sizes) return 0;
    for (var i = 0; i < product.sizes.length; i++) {
      if (product.sizes[i].ml === parseInt(sizeMl, 10)) return product.sizes[i].price;
    }
    return product.price || 0;
  }

  function addToCart(slug, sizeMl) {
    var product = getProduct(slug);
    if (!product) return false;

    var cart = getCart();
    var found = false;

    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === slug && cart[i].size === parseInt(sizeMl, 10)) {
        cart[i].quantity += 1;
        found = true;
        break;
      }
    }

    if (!found) {
      var price = getSizePrice(product, sizeMl);
      cart.push({
        slug: slug,
        name: product.name,
        collection: product.collection,
        size: parseInt(sizeMl, 10),
        price: price,
        quantity: 1
      });
    }

    saveCart(cart);
    openDrawer();
    return true;
  }

  function removeFromCart(slug, sizeMl) {
    var cart = getCart();
    var updated = [];
    for (var i = 0; i < cart.length; i++) {
      if (!(cart[i].slug === slug && cart[i].size === parseInt(sizeMl, 10))) {
        updated.push(cart[i]);
      }
    }
    saveCart(updated);
    renderDrawerContent();
    return updated;
  }

  function updateQuantity(slug, sizeMl, qty) {
    qty = parseInt(qty, 10);
    if (qty < 1) return removeFromCart(slug, sizeMl);

    var cart = getCart();
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].slug === slug && cart[i].size === parseInt(sizeMl, 10)) {
        cart[i].quantity = qty;
        break;
      }
    }
    saveCart(cart);
    renderDrawerContent();
    return cart;
  }

  function getCartCount() {
    var cart = getCart();
    var count = 0;
    for (var i = 0; i < cart.length; i++) {
      count += cart[i].quantity;
    }
    return count;
  }

  function getCartSubtotal() {
    var cart = getCart();
    var total = 0;
    for (var i = 0; i < cart.length; i++) {
      total += cart[i].price * cart[i].quantity;
    }
    return total;
  }

  function clearCart() {
    saveCart([]);
    renderDrawerContent();
  }

  function formatPrice(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function getItemInitials(name) {
    if (!name) return '?';
    var parts = name.split(' ');
    if (parts.length >= 2) return parts[0].charAt(0) + parts[1].charAt(0);
    return name.charAt(0);
  }

  function renderDrawerContent() {
    if (!drawerEl) return;
    var body = drawerEl.querySelector('.cart-drawer-body') || drawerEl.querySelector('.cart-body');
    if (!body) return;

    var cart = getCart();

    if (cart.length === 0) {
      body.innerHTML = '<div class="cart-empty">' +
        '<svg class="cart-empty-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 12h24l-3 18H15L12 12z"/><circle cx="18" cy="36" r="2"/><circle cx="30" cy="36" r="2"/></svg>' +
        '<p>Your bag is empty</p>' +
        '<a href="#/shop" class="btn btn-secondary" onclick="window.MAELYS.Cart.closeDrawer()">Explore Fragrances</a>' +
        '</div>';
      updateFooter();
      return;
    }

    var html = '';
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var product = getProduct(item.slug);
      var initials = getItemInitials(item.name);

      var imgUrl = (product && product.images && product.images.main) ? product.images.main : '';
      var imgHtml = imgUrl ?
        '<img src="' + imgUrl + '" alt="' + item.name + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy">' :
        '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:var(--text-xl);color:var(--color-accent);background:var(--color-surface);">' + initials + '</div>';

      html += '<div class="cart-item" data-slug="' + item.slug + '" data-size="' + item.size + '">' +
        '<div class="cart-item-image" style="position:relative;overflow:hidden;">' + imgHtml + '</div>' +
        '<div class="cart-item-details">' +
          '<div class="cart-item-name">' + item.name + '</div>' +
          '<div class="cart-item-variant">' + item.size + 'ml \u00b7 ' + (product ? product.type : 'Eau de Parfum') + '</div>' +
          '<div class="cart-item-price">' + formatPrice(item.price) + '</div>' +
          '<div style="display:flex;align-items:center;gap:var(--space-sm);margin-top:var(--space-xs);">' +
            '<div class="quantity-selector">' +
              '<button class="quantity-btn" aria-label="Decrease quantity" data-action="decrease" data-slug="' + item.slug + '" data-size="' + item.size + '">\u2212</button>' +
              '<span class="quantity-value">' + item.quantity + '</span>' +
              '<button class="quantity-btn" aria-label="Increase quantity" data-action="increase" data-slug="' + item.slug + '" data-size="' + item.size + '">+</button>' +
            '</div>' +
            '<button class="cart-item-remove" data-action="remove" data-slug="' + item.slug + '" data-size="' + item.size + '">Remove</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    body.innerHTML = html;
    updateFooter();

    var buttons = body.querySelectorAll('[data-action]');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener('click', handleCartItemAction);
    }
  }

  function handleCartItemAction(e) {
    var btn = e.currentTarget;
    var action = btn.getAttribute('data-action');
    var slug = btn.getAttribute('data-slug');
    var size = parseInt(btn.getAttribute('data-size'), 10);

    if (action === 'remove') {
      removeFromCart(slug, size);
    } else if (action === 'increase') {
      var cart = getCart();
      for (var i = 0; i < cart.length; i++) {
        if (cart[i].slug === slug && cart[i].size === size) {
          updateQuantity(slug, size, cart[i].quantity + 1);
          break;
        }
      }
    } else if (action === 'decrease') {
      var cart2 = getCart();
      for (var i2 = 0; i2 < cart2.length; i2++) {
        if (cart2[i2].slug === slug && cart2[i2].size === size) {
          if (cart2[i2].quantity <= 1) {
            removeFromCart(slug, size);
          } else {
            updateQuantity(slug, size, cart2[i2].quantity - 1);
          }
          break;
        }
      }
    }
  }

  function updateFooter() {
    if (!drawerEl) return;
    var footer = drawerEl.querySelector('.cart-drawer-footer') || drawerEl.querySelector('.cart-footer');
    if (!footer) return;

    var cart = getCart();
    var subtotal = getCartSubtotal();
    var shipping = subtotal >= 100 ? 0 : 12;

    if (cart.length === 0) {
      footer.innerHTML = '';
      return;
    }

    footer.innerHTML =
      '<div class="cart-summary">' +
        '<div class="cart-summary-row"><span>Subtotal</span><span>' + formatPrice(subtotal) + '</span></div>' +
        '<div class="cart-summary-row"><span>Shipping</span><span>' + (shipping === 0 ? 'Complimentary' : formatPrice(shipping)) + '</span></div>' +
        '<div class="cart-summary-row cart-summary-total"><span>Total</span><span>' + formatPrice(subtotal + shipping) + '</span></div>' +
      '</div>' +
      '<button class="btn btn-primary btn-lg" style="width:100%;margin-top:var(--space-lg);" onclick="window.MAELYS.Cart.checkout()">Proceed to Checkout</button>' +
      '<a href="#/cart" class="btn btn-ghost btn-sm" style="width:100%;margin-top:var(--space-sm);" onclick="window.MAELYS.Cart.closeDrawer()">View Full Bag</a>';
  }

  function openDrawer() {
    renderDrawerContent();
    if (drawerEl) drawerEl.classList.add('is-open');
    if (overlayEl) overlayEl.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (drawerEl) drawerEl.classList.remove('is-open');
    if (overlayEl) overlayEl.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function toggleDrawer() {
    if (drawerEl && drawerEl.classList.contains('is-open')) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function updateHeaderCount() {
    var countEls = document.querySelectorAll('.cart-count, .bag-count');
    var count = getCartCount();
    for (var i = 0; i < countEls.length; i++) {
      countEls[i].textContent = count;
      countEls[i].setAttribute('aria-label', count + ' items in bag');
      countEls[i].style.display = count > 0 ? 'flex' : 'none';
    }
  }

  function renderCartPage() {
    var cart = getCart();
    var subtotal = getCartSubtotal();
    var shipping = subtotal >= 100 ? 0 : 12;

    if (cart.length === 0) {
      return '<section class="page-cart page-enter" data-reveal>' +
        '<div class="container" style="padding-top:calc(var(--header-height) + var(--space-4xl));padding-bottom:var(--space-5xl);">' +
          '<div style="text-align:center;max-width:480px;margin:0 auto;">' +
            '<div class="error-code" style="font-size:var(--text-6xl);margin-bottom:var(--space-lg);">0</div>' +
            '<h1 style="margin-bottom:var(--space-md);">Your Bag is Empty</h1>' +
            '<p style="color:var(--color-muted);margin-bottom:var(--space-2xl);">Discover fragrances that speak to who you are.</p>' +
            '<a href="#/shop" class="btn btn-primary btn-lg">Explore the Collection</a>' +
          '</div>' +
        '</div>' +
      '</section>';
    }

    var rows = '';
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      var product = getProduct(item.slug);
      var initials = getItemInitials(item.name);

      rows += '<div class="cart-item" style="padding:var(--space-xl) 0;">' +
        '<div class="cart-item-image" style="width:120px;height:150px;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:var(--text-2xl);color:var(--color-accent);background:var(--color-surface);">' + initials + '</div>' +
        '<div class="cart-item-details" style="flex:1;">' +
          '<div class="cart-item-name" style="font-size:var(--text-xl);">' + item.name + '</div>' +
          '<div class="cart-item-variant">' + item.size + 'ml \u00b7 ' + (product ? product.type : '') + '</div>' +
          '<div class="cart-item-price" style="font-size:var(--text-lg);margin-top:var(--space-sm);">' + formatPrice(item.price) + '</div>' +
          '<div style="display:flex;align-items:center;gap:var(--space-lg);margin-top:var(--space-md);">' +
            '<div class="quantity-selector">' +
              '<button class="quantity-btn cart-qty-btn" data-action="decrease" data-slug="' + item.slug + '" data-size="' + item.size + '" aria-label="Decrease quantity">\u2212</button>' +
              '<span class="quantity-value">' + item.quantity + '</span>' +
              '<button class="quantity-btn cart-qty-btn" data-action="increase" data-slug="' + item.slug + '" data-size="' + item.size + '" aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<button class="cart-item-remove" data-action="remove" data-slug="' + item.slug + '" data-size="' + item.size + '">Remove</button>' +
          '</div>' +
        '</div>' +
        '<div style="font-family:var(--font-display);font-size:var(--text-xl);color:var(--color-text);white-space:nowrap;">' + formatPrice(item.price * item.quantity) + '</div>' +
      '</div>';
    }

    return '<section class="page-cart page-enter" data-reveal>' +
      '<div class="container" style="padding-top:calc(var(--header-height) + var(--space-4xl));padding-bottom:var(--space-5xl);">' +
        '<h1 style="margin-bottom:var(--space-3xl);">Your Bag</h1>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:var(--space-3xl);">' +
          '<div>' + rows + '</div>' +
          '<div style="border-top:1px solid var(--color-border);padding-top:var(--space-xl);">' +
            '<div class="cart-summary" style="max-width:400px;">' +
              '<div class="cart-summary-row"><span>Subtotal</span><span>' + formatPrice(subtotal) + '</span></div>' +
              '<div class="cart-summary-row"><span>Shipping</span><span>' + (shipping === 0 ? 'Complimentary' : formatPrice(shipping)) + '</span></div>' +
              '<div class="cart-summary-row cart-summary-total"><span>Total</span><span>' + formatPrice(subtotal + shipping) + '</span></div>' +
            '</div>' +
            '<button class="btn btn-primary btn-lg" style="width:100%;max-width:400px;margin-top:var(--space-xl);" onclick="window.MAELYS.Cart.checkout()">Proceed to Checkout</button>' +
            '<p style="font-size:var(--text-xs);color:var(--color-muted);margin-top:var(--space-md);max-width:400px;">Taxes calculated at checkout. Complimentary shipping on orders over $100.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function checkout() {
    window.MAELYS.UI.showToast('Checkout is not available in this demo. Thank you for exploring!', 'info');
  }

  function init() {
    drawerEl = document.querySelector('.cart-drawer');
    overlayEl = document.querySelector('.cart-drawer-overlay') || document.querySelector('.cart-overlay');

    if (overlayEl) {
      overlayEl.addEventListener('click', function(e) {
        if (e.target === overlayEl || e.target.classList.contains('cart-backdrop')) {
          closeDrawer();
        }
      });
    }

    var closeBtn = drawerEl ? drawerEl.querySelector('.cart-drawer-close') : null;
    if (!closeBtn && drawerEl) closeBtn = drawerEl.querySelector('.cart-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeDrawer);
    }

    var continueBtn = drawerEl ? drawerEl.querySelector('.cart-continue-btn') : null;
    if (continueBtn) {
      continueBtn.addEventListener('click', closeDrawer);
    }

    var bagToggles = document.querySelectorAll('.bag-toggle, .mobile-bag-toggle, [data-cart-toggle]');
    for (var i = 0; i < bagToggles.length; i++) {
      bagToggles[i].addEventListener('click', function (e) {
        e.preventDefault();
        toggleDrawer();
      });
    }

    updateHeaderCount();
    onUpdate(function () {
      updateHeaderCount();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawerEl && drawerEl.classList.contains('is-open')) {
        closeDrawer();
      }
    });
  }

  return {
    init: init,
    getCart: getCart,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQuantity: updateQuantity,
    getCartCount: getCartCount,
    getCartSubtotal: getCartSubtotal,
    clearCart: clearCart,
    openDrawer: openDrawer,
    closeDrawer: closeDrawer,
    toggleDrawer: toggleDrawer,
    renderCartPage: renderCartPage,
    renderDrawerContent: renderDrawerContent,
    checkout: checkout,
    formatPrice: formatPrice,
    onUpdate: onUpdate
  };
})();
