window.MAELYS = window.MAELYS || {};

window.MAELYS.App = (function () {
  'use strict';

  var appEl = null;

  function getProduct(slug) {
    var products = window.MAELYS.products || [];
    for (var i = 0; i < products.length; i++) {
      if (products[i].slug === slug) return products[i];
    }
    return null;
  }

  function getCollection(slug) {
    var collections = window.MAELYS.collections || [];
    for (var i = 0; i < collections.length; i++) {
      if (collections[i].slug === slug) return collections[i];
    }
    return null;
  }

  function getCollectionProducts(collectionSlug) {
    var collection = getCollection(collectionSlug);
    if (!collection) return [];
    var products = [];
    var allProducts = window.MAELYS.products || [];
    for (var i = 0; i < collection.productSlugs.length; i++) {
      for (var j = 0; j < allProducts.length; j++) {
        if (allProducts[j].slug === collection.productSlugs[i]) {
          products.push(allProducts[j]);
          break;
        }
      }
    }
    return products;
  }

  function getJournalArticle(slug) {
    var journal = window.MAELYS.journal || [];
    for (var i = 0; i < journal.length; i++) {
      if (journal[i].slug === slug) return journal[i];
    }
    return null;
  }

  function formatPrice(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function getInitials(name) {
    if (!name) return '?';
    var parts = name.replace(/[^a-zA-Z\u00c0-\u024f\s]/g, '').split(/\s+/);
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    return name.charAt(0).toUpperCase() + (name.charAt(1) || '').toLowerCase();
  }

  function productImageHtml(product, className, style) {
    var initials = getInitials(product.name);
    var defaultStyle = 'width:100%;height:100%;object-fit:cover;display:block;';
    var s = style || defaultStyle;
    var cls = className || '';
    if (product.images && product.images.main) {
      return '<img src="' + product.images.main + '" alt="' + product.name + ' - ' + product.type + '" class="' + cls + '" style="' + s + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
        '<div class="product-image-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem);color:var(--color-accent);background:var(--color-surface);position:absolute;inset:0;">' + initials + '</div>';
    }
    return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem);color:var(--color-accent);background:var(--color-surface);">' + initials + '</div>';
  }

  function productImageThumbHtml(product, label) {
    var initials = getInitials(product.name);
    var urls = {
      'Main': product.images ? product.images.main : '',
      'Alt': product.images ? product.images.alternate : '',
      'Detail': product.images ? product.images.detail : '',
      'Box': product.images ? product.images.packaging : ''
    };
    var url = urls[label] || product.images ? product.images.main : '';
    if (url) {
      return '<img src="' + url + '" alt="' + product.name + ' ' + label + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">' +
        '<div class="product-image-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-family:var(--font-display);font-size:var(--text-sm);color:var(--color-accent);background:var(--color-surface);position:absolute;inset:0;">' + label + '</div>';
    }
    return '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:var(--text-sm);color:var(--color-accent);background:var(--color-surface);">' + label + '</div>';
  }

  function renderStars(rating) {
    var full = Math.floor(rating);
    var html = '<span class="rating" aria-label="' + rating + ' out of 5 stars">';
    for (var i = 0; i < 5; i++) {
      html += '<svg class="rating-star' + (i >= full ? ' empty' : '') + '" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
    html += '</span>';
    return html;
  }

  function addStructuredData(type, data) {
    var existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) existing.remove();

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': type,
      name: 'MA\u00cbl\u00dfs',
      url: window.location.href,
      description: document.querySelector('meta[name="description"]')?.content || '',
      brand: { '@type': 'Brand', name: 'MA\u00cbl\u00dfs' },
      ...data
    });
    document.head.appendChild(script);
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  RENDER FUNCTIONS                                                       */
  /* ════════════════════════════════════════════════════════════════════════ */

  function renderHome() {
    var products = window.MAELYS.products || [];
    var featured = products.filter(function (p) { return p.featured; }).slice(0, 4);
    var collections = window.MAELYS.collections || [];

    var featuredHtml = '';
    for (var i = 0; i < featured.length; i++) {
      var p = featured[i];
      var badges = '';
      if (p.newArrival) badges += '<span class="badge badge-new">New</span> ';
      if (p.limitedEdition) badges += '<span class="badge badge-accent">Limited</span> ';

      featuredHtml += '<article class="card" data-reveal>' +
        '<a href="#/product/' + p.slug + '" class="card-image-wrap" style="position:relative;overflow:hidden;">' +
          '<span style="position:absolute;top:var(--space-md);left:var(--space-md);display:flex;gap:var(--space-2xs);z-index:2;">' + badges + '</span>' +
          productImageHtml(p, '', 'width:100%;height:100%;object-fit:cover;transition:transform 0.6s var(--ease-out);') +
        '</a>' +
        '<div class="card-body">' +
          '<div class="card-category">' + p.collection + '</div>' +
          '<h3 class="card-title"><a href="#/product/' + p.slug + '" style="text-decoration:none;color:inherit;">' + p.name + '</a></h3>' +
          '<p class="card-subtitle">' + p.shortDescription + '</p>' +
          '<div class="card-price">' + formatPrice(p.price) + '</div>' +
        '</div>' +
      '</article>';
    }

    var collectionImages = [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594035910387-fbd1a18e0ce7?w=800&q=80&auto=format&fit=crop'
    ];
    var collectionsHtml = '';
    for (var j = 0; j < collections.length; j++) {
      var c = collections[j];
      var imgUrl = collectionImages[j] || collectionImages[0];
      collectionsHtml += '<article class="card card-collection" data-reveal>' +
        '<a href="#/collections/' + c.slug + '" class="card-image-wrap" style="position:relative;overflow:hidden;aspect-ratio:3/4;">' +
          '<img src="' + imgUrl + '" alt="' + c.name + '" style="width:100%;height:100%;object-fit:cover;transition:transform 0.6s var(--ease-out);" loading="lazy">' +
          '<div class="card-overlay">' +
            '<div class="card-title">' + c.name + '</div>' +
            '<div class="card-desc">' + c.description.substring(0, 100) + '...</div>' +
          '</div>' +
        '</a>' +
      '</article>';
    }

    var ingredients = [
      { name: 'Bergamot', origin: 'Calabria, Italy', desc: 'Hand-peeled rinds cold-pressed to capture the full spectrum of citrus brightness.' },
      { name: 'Oud', origin: 'Laos', desc: 'Sustainably harvested agarwood, aged for depth and complexity beyond compare.' },
      { name: 'Rose', origin: 'Grasse, France', desc: 'Centifolia roses picked at dawn when their essential oils are at their peak.' },
      { name: 'Saffron', origin: 'Khorasan, Iran', desc: 'The world\u2019s most precious spice, hand-harvested from 75,000 crocus flowers per pound.' }
    ];

    var ingredientsHtml = '';
    for (var k = 0; k < ingredients.length; k++) {
      ingredientsHtml += '<div class="ingredient-card" data-reveal>' +
        '<div class="ingredient-icon" style="width:64px;height:64px;margin:0 auto var(--space-lg);color:var(--color-accent);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:var(--text-2xl);border:1px solid var(--color-border);border-radius:var(--radius-full);">' + ingredients[k].name.charAt(0) + '</div>' +
        '<h4 class="ingredient-name">' + ingredients[k].name + '</h4>' +
        '<div class="ingredient-origin">' + ingredients[k].origin + '</div>' +
        '<p class="ingredient-desc">' + ingredients[k].desc + '</p>' +
      '</div>';
    }

    addStructuredData('WebSite', {
      potentialAction: {
        '@type': 'SearchAction',
        target: window.location.origin + '#/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    });

    return '<section class="hero">' +
      '<div class="hero-bg" style="background:linear-gradient(135deg, #1a1714 0%, #0d0c0b 50%, #151311 100%);">' +
        '<img src="https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1920&q=80&auto=format&fit=crop" alt="Premium luxury perfume bottle" style="width:100%;height:100%;object-fit:cover;opacity:0.3;" loading="eager">' +
      '</div>' +
      '<div class="hero-overlay"></div>' +
      '<div class="hero-content">' +
        '<div class="hero-label">Maison de Parfum</div>' +
        '<h1 class="hero-title">The Art of<br>Intentional Fragrance</h1>' +
        '<p class="hero-subtitle">Compositions of uncommon depth and clarity, crafted in New York with ingredients from Grasse, Calabria, and beyond.</p>' +
        '<div class="hero-cta">' +
          '<a href="#/shop" class="btn btn-primary btn-lg">Explore the Collection</a>' +
          '<a href="#/about" class="btn btn-secondary btn-lg">Our Story</a>' +
        '</div>' +
      '</div>' +
      '<div class="hero-scroll">' +
        '<span>Scroll</span>' +
        '<div class="hero-scroll-line"></div>' +
      '</div>' +
    '</section>' +

    '<section class="section-featured">' +
      '<div class="section-header" data-reveal>' +
        '<div class="section-label">The Collection</div>' +
        '<h2 class="section-title">Featured Fragrances</h2>' +
        '<p class="section-desc">Each fragrance is a world in a bottle \u2014 compositions designed to speak clearly to the people they are meant for.</p>' +
      '</div>' +
      '<div class="products-grid stagger-children">' + featuredHtml + '</div>' +
      '<div style="text-align:center;padding-top:var(--space-3xl);" data-reveal>' +
        '<a href="#/shop" class="btn btn-secondary">View All Fragrances</a>' +
      '</div>' +
    '</section>' +



    '<section class="section-story">' +
      '<div class="story-layout">' +
        '<div class="story-image img-hover-scale" data-reveal style="position:relative;overflow:hidden;aspect-ratio:4/5;">' +
          '<img src="https://images.unsplash.com/photo-1592945552960-2bb4f3f6d707?w=800&q=80&auto=format&fit=crop" alt="The craft of perfumery" style="width:100%;height:100%;object-fit:cover;" loading="lazy">' +
        '</div>' +
        '<div class="story-content" data-reveal>' +
          '<div class="section-label">Our Story</div>' +
          '<h2>Integrity Over Marketing</h2>' +
          '<p>MA\u00cbl\u00dfs was founded with a single conviction: that luxury fragrance should be defined by integrity, not marketing. We are a small house. We make a small number of fragrances. Each one takes, on average, eighteen months to complete.</p>' +
          '<p>We do not release new products on a seasonal schedule. We release them when they are ready.</p>' +
          '<a href="#/about" class="btn btn-underline" style="margin-top:var(--space-lg);">Read Our Story</a>' +
        '</div>' +
      '</div>' +
    '</section>' +

    '<section class="section-ingredients">' +
      '<div class="section-header" data-reveal>' +
        '<div class="section-label">Ingredients</div>' +
        '<h2 class="section-title">Sourced with Purpose</h2>' +
        '<p class="section-desc">Every ingredient is chosen for a reason. Every composition is built to be complete.</p>' +
      '</div>' +
      '<div class="ingredients-grid stagger-children">' + ingredientsHtml + '</div>' +
    '</section>' +

    '<section class="section-collections">' +
      '<div class="section-header" data-reveal>' +
        '<div class="section-label">Collections</div>' +
        '<h2 class="section-title">Curated Worlds</h2>' +
        '<p class="section-desc">Four distinct collections, each with its own character and intent.</p>' +
      '</div>' +
      '<div class="collections-grid stagger-children">' + collectionsHtml + '</div>' +
    '</section>' +

    '<section class="section-story" style="background:var(--color-surface);">' +
      '<div style="text-align:center;max-width:640px;margin:0 auto;padding:0 var(--space-xl);" data-reveal>' +
        '<div class="section-label">Newsletter</div>' +
        '<h2 class="section-title">Stay Informed</h2>' +
        '<p class="section-desc" style="margin-bottom:var(--space-2xl);">Receive updates on new releases, journal articles, and exclusive events. We write only when we have something worth saying.</p>' +
        '<form class="newsletter-form" style="display:flex;gap:var(--space-sm);max-width:440px;margin:0 auto;">' +
          '<input type="email" class="form-input" placeholder="Your email address" required aria-label="Email address" style="flex:1;">' +
          '<button type="submit" class="btn btn-primary">Subscribe</button>' +
        '</form>' +
      '</div>' +
    '</section>';
  }

  function renderShop() {
    var products = window.MAELYS.products || [];

    var productCards = '';
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var badges = '';
      if (p.newArrival) badges += '<span class="badge badge-new">New</span> ';
      if (p.limitedEdition) badges += '<span class="badge badge-accent">Limited</span> ';

      productCards += '<article class="card" data-reveal>' +
        '<a href="#/product/' + p.slug + '" class="card-image-wrap" style="position:relative;overflow:hidden;">' +
          '<span style="position:absolute;top:var(--space-md);left:var(--space-md);display:flex;gap:var(--space-2xs);z-index:2;">' + badges + '</span>' +
          productImageHtml(p, '', 'width:100%;height:100%;object-fit:cover;transition:transform 0.6s var(--ease-out);') +
        '</a>' +
        '<div class="card-body">' +
          '<div class="card-category">' + p.collection + '</div>' +
          '<h3 class="card-title"><a href="#/product/' + p.slug + '" style="text-decoration:none;color:inherit;">' + p.name + '</a></h3>' +
          '<p class="card-subtitle">' + p.shortDescription + '</p>' +
          '<div class="card-price">' + formatPrice(p.price) + '</div>' +
        '</div>' +
      '</article>';
    }

    return '<section class="page-shop page-enter">' +
      '<div class="shop-header">' +
        '<div class="container">' +
          '<div class="section-header">' +
            '<div class="section-label">The Collection</div>' +
            '<h1 class="section-title">All Fragrances</h1>' +
            '<p class="section-desc">' + products.length + ' compositions of uncommon depth and clarity.</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="shop-layout">' +
        '<div class="shop-toolbar" data-reveal>' +
          '<span class="shop-toolbar-count">' + products.length + ' products</span>' +
          '<div class="shop-sort">' +
            '<span class="shop-sort-label">Sort by:</span>' +
            '<select class="form-select" style="width:auto;padding:var(--space-xs) var(--space-2xl) var(--space-xs) var(--space-md);" id="shop-sort">' +
              '<option value="featured">Featured</option>' +
              '<option value="price-asc">Price: Low to High</option>' +
              '<option value="price-desc">Price: High to Low</option>' +
              '<option value="name">Name</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<div class="products-grid stagger-children" id="shop-grid">' + productCards + '</div>' +
      '</div>' +
    '</section>';
  }

  function renderProduct(slug) {
    var product = getProduct(slug);
    if (!product) return render404();

    var initials = getInitials(product.name);
    var collection = getCollection(product.slug);

    addStructuredData('Product', {
      name: product.name,
      description: product.description,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency,
        availability: 'https://schema.org/InStock'
      }
    });

    var sizesHtml = '';
    for (var i = 0; i < product.sizes.length; i++) {
      var s = product.sizes[i];
      var isDefault = s.ml === 50;
      sizesHtml += '<button class="product-size-btn' + (isDefault ? ' active' : '') + '" data-size="' + s.ml + '" data-price="' + s.price + '">' + s.ml + 'ml</button>';
    }

    var topNotes = (product.topNotes || []).map(function (n) {
      return '<span class="tag">' + n + '</span>';
    }).join('');
    var heartNotes = (product.heartNotes || []).map(function (n) {
      return '<span class="tag">' + n + '</span>';
    }).join('');
    var baseNotes = (product.baseNotes || []).map(function (n) {
      return '<span class="tag">' + n + '</span>';
    }).join('');

    var story = product.story || {};
    var storyHtml = '';
    if (story.idea) {
      storyHtml += '<div class="divider" style="margin:var(--space-3xl) 0;"><span class="divider-text">The Story</span></div>' +
        '<div style="max-width:640px;margin:0 auto;">' +
          '<blockquote style="font-family:var(--font-display);font-size:var(--text-2xl);color:var(--color-text);line-height:var(--leading-relaxed);margin-bottom:var(--space-2xl);font-style:italic;text-align:center;" data-reveal>\u201c' + story.idea + '\u201d</blockquote>' +
          (story.character ? '<p style="text-align:center;color:var(--color-muted);margin-bottom:var(--space-lg);" data-reveal>' + story.character + '</p>' : '') +
          (story.experience ? '<p style="text-align:center;color:var(--color-muted);" data-reveal>' + story.experience + '</p>' : '') +
        '</div>';
    }

    var relatedProducts = (window.MAELYS.products || []).filter(function (p) {
      return p.slug !== slug && (p.collection === product.collection || p.fragranceFamily === product.fragranceFamily);
    }).slice(0, 4);

    var relatedHtml = '';
    for (var r = 0; r < relatedProducts.length; r++) {
      var rp = relatedProducts[r];
      relatedHtml += '<article class="card" data-reveal>' +
        '<a href="#/product/' + rp.slug + '" class="card-image-wrap" style="position:relative;overflow:hidden;">' +
          productImageHtml(rp, '', 'width:100%;height:100%;object-fit:cover;transition:transform 0.6s var(--ease-out);') +
        '</a>' +
        '<div class="card-body">' +
          '<div class="card-category">' + rp.collection + '</div>' +
          '<h3 class="card-title"><a href="#/product/' + rp.slug + '" style="text-decoration:none;color:inherit;">' + rp.name + '</a></h3>' +
          '<div class="card-price">' + formatPrice(rp.price) + '</div>' +
        '</div>' +
      '</article>';
    }

    var breadcrumbs = '<nav class="breadcrumbs" aria-label="Breadcrumb">' +
      '<a href="#/">Home</a><span class="breadcrumbs-sep">/</span>' +
      '<a href="#/shop">Shop</a><span class="breadcrumbs-sep">/</span>' +
      '<span class="breadcrumbs-current">' + product.name + '</span>' +
    '</nav>';

    return '<section class="page-product page-enter">' +
      '<div class="product-layout">' +
        '<div class="product-gallery" data-reveal>' +
          '<div class="gallery">' +
            '<div class="gallery-main" style="position:relative;overflow:hidden;aspect-ratio:3/4;">' +
              productImageHtml(product, '', 'width:100%;height:100%;object-fit:cover;') +
            '</div>' +
            '<div class="gallery-thumbs">' +
              '<div class="gallery-thumb active" style="position:relative;overflow:hidden;">' + productImageThumbHtml(product, 'Main') + '</div>' +
              '<div class="gallery-thumb" style="position:relative;overflow:hidden;">' + productImageThumbHtml(product, 'Alt') + '</div>' +
              '<div class="gallery-thumb" style="position:relative;overflow:hidden;">' + productImageThumbHtml(product, 'Detail') + '</div>' +
              '<div class="gallery-thumb" style="position:relative;overflow:hidden;">' + productImageThumbHtml(product, 'Box') + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="product-info">' +
          breadcrumbs +
          '<div class="card-category">' + product.collection + '</div>' +
          '<h1>' + product.name + '</h1>' +
          '<div class="product-price">' + formatPrice(product.price) + '</div>' +
          '<p class="product-short-desc">' + product.shortDescription + '</p>' +
          '<div class="product-options">' +
            '<div class="product-option-label">Size</div>' +
            '<div class="product-sizes">' + sizesHtml + '</div>' +
          '</div>' +
          '<div class="product-add-row">' +
            '<button class="btn btn-primary btn-lg" id="product-add-to-cart" data-product-slug="' + product.slug + '">Add to Bag</button>' +
          '</div>' +
          '<div class="product-meta">' +
            '<div class="product-meta-row"><span class="product-meta-label">Fragrance Family</span><span class="product-meta-value">' + product.fragranceFamily + '</span></div>' +
            '<div class="product-meta-row"><span class="product-meta-label">Type</span><span class="product-meta-value">' + product.type + '</span></div>' +
            '<div class="product-meta-row"><span class="product-meta-label">Longevity</span><span class="product-meta-value">' + product.longevity + '</span></div>' +
            '<div class="product-meta-row"><span class="product-meta-label">Projection</span><span class="product-meta-value">' + product.projection + '</span></div>' +
            '<div class="product-meta-row"><span class="product-meta-label">Season</span><span class="product-meta-value">' + product.season + '</span></div>' +
            '<div class="product-meta-row"><span class="product-meta-label">Gender</span><span class="product-meta-value">' + product.gender + '</span></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="container" style="padding-top:var(--space-4xl);padding-bottom:var(--space-2xl);">' +
        '<div class="divider" style="margin-bottom:var(--space-3xl);"><span class="divider-text">The Composition</span></div>' +
        '<p style="max-width:640px;margin:0 auto var(--space-3xl);text-align:center;font-size:var(--text-md);color:var(--color-muted);line-height:var(--leading-relaxed);" data-reveal>' + product.description + '</p>' +
        '<div style="display:grid;grid-template-columns:1fr;gap:var(--space-3xl);max-width:800px;margin:0 auto;" data-reveal>' +
          '<div style="text-align:center;">' +
            '<div class="product-option-label" style="margin-bottom:var(--space-md);">Top Notes</div>' +
            '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--space-xs);">' + topNotes + '</div>' +
          '</div>' +
          '<div style="text-align:center;">' +
            '<div class="product-option-label" style="margin-bottom:var(--space-md);">Heart Notes</div>' +
            '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--space-xs);">' + heartNotes + '</div>' +
          '</div>' +
          '<div style="text-align:center;">' +
            '<div class="product-option-label" style="margin-bottom:var(--space-md);">Base Notes</div>' +
            '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:var(--space-xs);">' + baseNotes + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      storyHtml +
      (relatedHtml ? '<div class="container" style="padding-top:var(--space-4xl);padding-bottom:var(--space-5xl);">' +
        '<div class="divider" style="margin-bottom:var(--space-3xl);"><span class="divider-text">You May Also Like</span></div>' +
        '<div class="products-grid stagger-children">' + relatedHtml + '</div>' +
      '</div>' : '') +
    '</section>';
  }

  function renderCollections() {
    var collections = window.MAELYS.collections || [];
    var collectionImages = [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594035910387-fbd1a18e0ce7?w=800&q=80&auto=format&fit=crop'
    ];

    var cardsHtml = '';
    for (var i = 0; i < collections.length; i++) {
      var c = collections[i];
      var productCount = c.productSlugs.length;
      var imgUrl = collectionImages[i] || collectionImages[0];
      cardsHtml += '<article class="card card-collection" data-reveal>' +
        '<a href="#/collections/' + c.slug + '" class="card-image-wrap" style="position:relative;overflow:hidden;aspect-ratio:3/4;">' +
          '<img src="' + imgUrl + '" alt="' + c.name + '" style="width:100%;height:100%;object-fit:cover;transition:transform 0.6s var(--ease-out);" loading="lazy">' +
          '<div class="card-overlay">' +
            '<div class="card-title">' + c.name + '</div>' +
            '<div class="card-desc">' + productCount + ' fragrance' + (productCount !== 1 ? 's' : '') + '</div>' +
          '</div>' +
        '</a>' +
      '</article>';
    }

    addStructuredData('CollectionPage', {});

    return '<section class="page-collections page-enter" style="padding-top:calc(var(--header-height) + var(--space-4xl));padding-bottom:var(--space-5xl);">' +
      '<div class="container">' +
        '<div class="section-header" data-reveal>' +
          '<div class="section-label">Collections</div>' +
          '<h1 class="section-title">Our Collections</h1>' +
          '<p class="section-desc">Four distinct worlds, each curated with intention.</p>' +
        '</div>' +
      '</div>' +
      '<div class="collections-grid stagger-children">' + cardsHtml + '</div>' +
    '</section>';
  }

  function renderCollection(slug) {
    var collection = getCollection(slug);
    if (!collection) return render404();

    var products = getCollectionProducts(slug);

    var productCards = '';
    for (var i = 0; i < products.length; i++) {
      var p = products[i];
      var badges = '';
      if (p.newArrival) badges += '<span class="badge badge-new">New</span> ';
      if (p.limitedEdition) badges += '<span class="badge badge-accent">Limited</span> ';

      productCards += '<article class="card" data-reveal>' +
        '<a href="#/product/' + p.slug + '" class="card-image-wrap" style="position:relative;overflow:hidden;">' +
          '<span style="position:absolute;top:var(--space-md);left:var(--space-md);display:flex;gap:var(--space-2xs);z-index:2;">' + badges + '</span>' +
          productImageHtml(p, '', 'width:100%;height:100%;object-fit:cover;transition:transform 0.6s var(--ease-out);') +
        '</a>' +
        '<div class="card-body">' +
          '<div class="card-category">' + p.collection + '</div>' +
          '<h3 class="card-title"><a href="#/product/' + p.slug + '" style="text-decoration:none;color:inherit;">' + p.name + '</a></h3>' +
          '<p class="card-subtitle">' + p.shortDescription + '</p>' +
          '<div class="card-price">' + formatPrice(p.price) + '</div>' +
        '</div>' +
      '</article>';
    }

    return '<section class="page-collection page-enter" style="padding-top:calc(var(--header-height) + var(--space-4xl));padding-bottom:var(--space-5xl);">' +
      '<div class="container">' +
        '<nav class="breadcrumbs" aria-label="Breadcrumb" data-reveal>' +
          '<a href="#/">Home</a><span class="breadcrumbs-sep">/</span>' +
          '<a href="#/collections">Collections</a><span class="breadcrumbs-sep">/</span>' +
          '<span class="breadcrumbs-current">' + collection.name + '</span>' +
        '</nav>' +
        '<div class="section-header" data-reveal>' +
          '<div class="section-label">Collection</div>' +
          '<h1 class="section-title">' + collection.name + '</h1>' +
          '<p class="section-desc">' + collection.description + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="products-grid stagger-children" style="max-width:var(--container-max);margin:0 auto;padding:0 var(--space-xl);">' + productCards + '</div>' +
    '</section>';
  }

  function renderAbout() {
    var pageData = (window.MAELYS.pages || {}).about || {};
    var sections = pageData.sections || [];

    addStructuredData('AboutPage', {});

    var sectionsHtml = '';
    for (var i = 0; i < sections.length; i++) {
      sectionsHtml += '<div data-reveal style="max-width:800px;margin:0 auto var(--space-4xl);">' +
        '<h2 style="margin-bottom:var(--space-xl);">' + sections[i].heading + '</h2>' +
        sections[i].content +
      '</div>';
    }

    var values = [
      { icon: '\u2661', title: 'Integrity', desc: 'We say what we mean and mean what we say. No marketing stories we do not live.' },
      { icon: '\u2726', title: 'Craft', desc: 'Every fragrance is composed by hand, with patience. We do not rush what matters.' },
      { icon: '\u2605', title: 'Quality', desc: 'We use the finest ingredients available because they are the finest, not because they photograph well.' },
      { icon: '\u2234', title: 'Intention', desc: 'We make a small number of fragrances, each one designed to be complete.' }
    ];

    var valuesHtml = '';
    for (var v = 0; v < values.length; v++) {
      valuesHtml += '<div class="value-card" data-reveal>' +
        '<div class="value-icon" style="font-size:var(--text-3xl);display:flex;align-items:center;justify-content:center;">' + values[v].icon + '</div>' +
        '<h4 class="value-title">' + values[v].title + '</h4>' +
        '<p class="value-desc">' + values[v].desc + '</p>' +
      '</div>';
    }

    return '<section class="page-about page-enter">' +
      '<div class="about-hero" data-reveal>' +
        '<div class="about-hero-bg" style="background:linear-gradient(135deg, #1a1714 0%, #0d0c0b 50%, #151311 100%);">' +
          '<img src="https://images.unsplash.com/photo-1592945552960-2bb4f3f6d707?w=1920&q=80&auto=format&fit=crop" alt="The House of MAËLYS" style="width:100%;height:100%;object-fit:cover;opacity:0.35;" loading="eager">' +
        '</div>' +
        '<div class="about-hero-overlay"></div>' +
        '<div class="about-hero-content">' +
          '<div class="section-label">The House</div>' +
          '<h1>The House of<br>MA\u00cbl\u00dfs</h1>' +
        '</div>' +
      '</div>' +
      '<div class="about-values">' +
        '<div class="container">' +
          '<div class="section-header" data-reveal>' +
            '<div class="section-label">Our Values</div>' +
            '<h2 class="section-title">What We Stand For</h2>' +
          '</div>' +
          '<div class="values-grid stagger-children">' + valuesHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="padding:var(--space-5xl) 0;">' +
        '<div class="container">' +
          sectionsHtml +
        '</div>' +
      '</div>' +
      '<section class="section-story" style="background:var(--color-surface);">' +
        '<div style="text-align:center;max-width:640px;margin:0 auto;padding:0 var(--space-xl);" data-reveal>' +
          '<div class="section-label">Visit Us</div>' +
          '<h2 class="section-title">Our Studio</h2>' +
          '<p class="section-desc">MA\u00cbl\u00dfs is headquartered in New York City with deep roots in Grasse, France. Our studio is open by appointment for private consultations.</p>' +
          '<div style="margin-top:var(--space-2xl);">' +
            '<p style="color:var(--color-muted);">127 Wooster Street<br>New York, NY 10012<br>United States</p>' +
          '</div>' +
        '</div>' +
      '</section>' +
    '</section>';
  }

  function renderJournal() {
    var articles = window.MAELYS.journal || [];

    addStructuredData('Blog', {});

    var journalImages = [
      'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1592945552960-2bb4f3f6d707?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1594035910387-fbd1a18e0ce7?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800&q=80&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80&auto=format&fit=crop'
    ];
    var cardsHtml = '';
    for (var i = 0; i < articles.length; i++) {
      var a = articles[i];
      var imgUrl = journalImages[i % journalImages.length];
      cardsHtml += '<article class="card card-journal" data-reveal>' +
        '<a href="#/journal/' + a.slug + '" class="card-image-wrap" style="position:relative;overflow:hidden;">' +
          '<img src="' + imgUrl + '" alt="' + a.title + '" style="width:100%;height:100%;object-fit:cover;transition:transform 0.6s var(--ease-out);" loading="lazy">' +
          '<span style="position:absolute;top:var(--space-md);left:var(--space-md);z-index:2;"><span class="badge badge-outline">' + a.category + '</span></span>' +
        '</a>' +
        '<div class="card-body">' +
          '<div class="card-category">' + a.category + '</div>' +
          '<h3 class="card-title"><a href="#/journal/' + a.slug + '" style="text-decoration:none;color:inherit;">' + a.title + '</a></h3>' +
          '<p class="card-subtitle">' + a.excerpt + '</p>' +
          '<div style="display:flex;align-items:center;gap:var(--space-sm);margin-top:var(--space-sm);font-size:var(--text-xs);color:var(--color-muted);">' +
            '<span>' + a.author + '</span>' +
            '<span>\u00b7</span>' +
            '<span>' + a.readTime + '</span>' +
          '</div>' +
        '</div>' +
      '</article>';
    }

    return '<section class="page-journal page-enter" style="padding-top:calc(var(--header-height) + var(--space-4xl));">' +
      '<div class="journal-header" data-reveal>' +
        '<div class="section-label">Journal</div>' +
        '<h1 class="section-title">Stories & Insights</h1>' +
        '<p class="section-desc">Knowledge, craft, and culture from the world of MA\u00cbl\u00dfs.</p>' +
      '</div>' +
      '<div class="journal-grid stagger-children">' + cardsHtml + '</div>' +
    '</section>';
  }

  function renderJournalArticle(slug) {
    var article = getJournalArticle(slug);
    if (!article) return render404();

    addStructuredData('Article', {
      headline: article.title,
      author: { '@type': 'Person', name: article.author },
      datePublished: article.date
    });

    var breadcrumbs = '<nav class="breadcrumbs" aria-label="Breadcrumb">' +
      '<a href="#/">Home</a><span class="breadcrumbs-sep">/</span>' +
      '<a href="#/journal">Journal</a><span class="breadcrumbs-sep">/</span>' +
      '<span class="breadcrumbs-current">' + article.title + '</span>' +
    '</nav>';

    return '<section class="page-journal-article page-enter" style="padding-top:calc(var(--header-height) + var(--space-4xl));padding-bottom:var(--space-5xl);">' +
      '<div class="container container-narrow">' +
        breadcrumbs +
        '<article style="margin-top:var(--space-xl);">' +
          '<header style="text-align:center;margin-bottom:var(--space-3xl);" data-reveal>' +
            '<div class="label" style="margin-bottom:var(--space-md);">' + article.category + '</div>' +
            '<h1 style="max-width:720px;margin:0 auto var(--space-xl);">' + article.title + '</h1>' +
            '<div style="display:flex;align-items:center;justify-content:center;gap:var(--space-sm);font-size:var(--text-sm);color:var(--color-muted);">' +
              '<span>' + article.author + '</span>' +
              '<span>\u00b7</span>' +
              '<time datetime="' + article.date + '">' + new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '</time>' +
              '<span>\u00b7</span>' +
              '<span>' + article.readTime + '</span>' +
            '</div>' +
          '</header>' +
          '<div class="article-featured-image" style="aspect-ratio:16/7;margin-bottom:var(--space-3xl);position:relative;overflow:hidden;" data-reveal>' +
            '<img src="https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=1200&q=80&auto=format&fit=crop" alt="' + article.title + '" style="width:100%;height:100%;object-fit:cover;" loading="lazy">' +
          '</div>' +
          '<div class="article-content" style="max-width:680px;margin:0 auto;font-size:var(--text-md);line-height:var(--leading-relaxed);color:var(--color-text-secondary);" data-reveal>' +
            article.content +
          '</div>' +
        '</article>' +
        '<div class="divider" style="margin:var(--space-4xl) 0;"><span class="divider-text">Continue Reading</span></div>' +
        '<div style="text-align:center;">' +
          '<a href="#/journal" class="btn btn-secondary">Back to Journal</a>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function renderAboutPage() {
    return renderAbout();
  }

  function renderContact() {
    addStructuredData('ContactPage', {});

    return '<section class="page-contact page-enter" style="padding-top:calc(var(--header-height) + var(--space-4xl));padding-bottom:var(--space-5xl);">' +
      '<div class="contact-layout">' +
        '<div class="contact-info" data-reveal>' +
          '<div class="section-label">Contact</div>' +
          '<h2>Get in Touch</h2>' +
          '<p>Whether you have a question about our fragrances, need assistance with an order, or want to schedule a private consultation, we are here to help.</p>' +
          '<div class="contact-detail">' +
            '<div class="contact-detail-label">Email</div>' +
            '<div class="contact-detail-value">care@maelys.com</div>' +
          '</div>' +
          '<div class="contact-detail">' +
            '<div class="contact-detail-label">Phone</div>' +
            '<div class="contact-detail-value">+1 (212) 555-0189</div>' +
          '</div>' +
          '<div class="contact-detail">' +
            '<div class="contact-detail-label">Studio</div>' +
            '<div class="contact-detail-value">127 Wooster Street<br>New York, NY 10012</div>' +
          '</div>' +
          '<div class="contact-detail">' +
            '<div class="contact-detail-label">Hours</div>' +
            '<div class="contact-detail-value">Monday \u2013 Friday: 10 AM \u2013 6 PM EST<br>Saturday: By Appointment</div>' +
          '</div>' +
        '</div>' +
        '<div class="contact-form-wrap" data-reveal>' +
          '<form class="contact-form" id="contact-form">' +
            '<div class="contact-form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg);">' +
              '<div class="form-group">' +
                '<label class="form-label" for="contact-name">Name</label>' +
                '<input type="text" class="form-input" id="contact-name" name="name" required placeholder="Your name">' +
              '</div>' +
              '<div class="form-group">' +
                '<label class="form-label" for="contact-email">Email</label>' +
                '<input type="email" class="form-input" id="contact-email" name="email" required placeholder="Your email">' +
              '</div>' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="contact-subject">Subject</label>' +
              '<input type="text" class="form-input" id="contact-subject" name="subject" placeholder="How can we help?">' +
            '</div>' +
            '<div class="form-group">' +
              '<label class="form-label" for="contact-message">Message</label>' +
              '<textarea class="form-textarea" id="contact-message" name="message" required placeholder="Tell us more..."></textarea>' +
            '</div>' +
            '<button type="submit" class="btn btn-primary btn-lg" style="align-self:flex-start;">Send Message</button>' +
          '</form>' +
        '</div>' +
      '</div>' +
    '</section>';
  }

  function renderFAQ() {
    var pageData = (window.MAELYS.pages || {}).faq || {};
    var items = pageData.items || [];

    addStructuredData('FAQPage', {});

    var accordionHtml = '<div class="accordion">';
    for (var i = 0; i < items.length; i++) {
      accordionHtml += '<div class="accordion-item" data-reveal>' +
        '<button class="accordion-trigger" aria-expanded="false" aria-controls="faq-' + i + '">' +
          '<span class="accordion-trigger-text">' + items[i].question + '</span>' +
          '<svg class="accordion-trigger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>' +
        '</button>' +
        '<div class="accordion-content" id="faq-' + i + '" role="region">' +
          '<div class="accordion-content-inner">' + items[i].answer + '</div>' +
        '</div>' +
      '</div>';
    }
    accordionHtml += '</div>';

    return '<section class="page-faq page-enter">' +
      '<div class="faq-layout">' +
        '<div class="faq-header" data-reveal>' +
          '<div class="section-label">FAQ</div>' +
          '<h1>Frequently Asked Questions</h1>' +
          '<p class="section-desc" style="max-width:480px;margin:var(--space-lg) auto 0;">Everything you need to know about MA\u00cbl\u00dfs fragrances, shipping, and returns.</p>' +
        '</div>' +
        accordionHtml +
      '</div>' +
    '</section>';
  }

  function renderShipping() {
    var pageData = (window.MAELYS.pages || {}).shipping || {};
    return renderPolicyPage(pageData, 'Shipping Information');
  }

  function renderReturns() {
    var pageData = (window.MAELYS.pages || {}).returns || {};
    return renderPolicyPage(pageData, 'Returns & Exchanges');
  }

  function renderPrivacy() {
    var pageData = (window.MAELYS.pages || {}).privacy || {};
    var html = renderPolicyPage(pageData, 'Privacy Policy');
    if (pageData.lastUpdated) {
      html = html.replace('</h1>', '</h1><p class="label" style="margin-bottom:var(--space-3xl);">Last updated: ' + new Date(pageData.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '</p>');
    }
    return html;
  }

  function renderTerms() {
    var pageData = (window.MAELYS.pages || {}).terms || {};
    var html = renderPolicyPage(pageData, 'Terms & Conditions');
    if (pageData.lastUpdated) {
      html = html.replace('</h1>', '</h1><p class="label" style="margin-bottom:var(--space-3xl);">Last updated: ' + new Date(pageData.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '</p>');
    }
    return html;
  }

  function renderPolicyPage(pageData, fallbackTitle) {
    var title = pageData.title || fallbackTitle;
    var sections = pageData.sections || [];

    var sectionsHtml = '';
    for (var i = 0; i < sections.length; i++) {
      sectionsHtml += '<div data-reveal>' +
        '<h2>' + sections[i].heading + '</h2>' +
        sections[i].content +
      '</div>';
    }

    return '<section class="page-policy page-enter">' +
      '<div class="policy-layout">' +
        '<div class="section-label">Legal</div>' +
        '<h1>' + title + '</h1>' +
        sectionsHtml +
      '</div>' +
    '</section>';
  }

  function renderCart() {
    return window.MAELYS.Cart.renderCartPage();
  }

  function renderSearch() {
    return '<section class="page-search page-enter" style="padding-top:calc(var(--header-height) + var(--space-4xl));padding-bottom:var(--space-5xl);">' +
      '<div class="container container-narrow">' +
        '<div class="section-header" data-reveal>' +
          '<div class="section-label">Search</div>' +
          '<h1 class="section-title">Search Our Collection</h1>' +
        '</div>' +
        '<div class="search-input-wrap" style="margin:0 auto;" data-reveal>' +
          '<svg class="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>' +
          '<input type="text" class="search-input" id="page-search-input" placeholder="Search fragrances, ingredients, collections..." aria-label="Search">' +
        '</div>' +
        '<div id="page-search-results" style="margin-top:var(--space-2xl);"></div>' +
      '</div>' +
    '</section>';
  }

  function render404() {
    return '<div class="page-404 page-enter" data-reveal>' +
      '<div class="error-code">404</div>' +
      '<h1 class="error-title">Page Not Found</h1>' +
      '<p class="error-desc">The page you are looking for does not exist or has been moved.</p>' +
      '<div style="display:flex;gap:var(--space-md);justify-content:center;">' +
        '<a href="#/" class="btn btn-primary">Return Home</a>' +
        '<a href="#/shop" class="btn btn-secondary">Explore the Collection</a>' +
      '</div>' +
    '</div>';
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  RENDER DISPATCHER                                                      */
  /* ════════════════════════════════════════════════════════════════════════ */

  function render(name, params) {
    appEl = document.getElementById('app');
    if (!appEl) return;

    var html = '';

    switch (name) {
      case 'home': html = renderHome(); break;
      case 'shop': html = renderShop(); break;
      case 'product': html = renderProduct(params.slug); break;
      case 'collections': html = renderCollections(); break;
      case 'collection': html = renderCollection(params.slug); break;
      case 'about': html = renderAbout(); break;
      case 'journal': html = renderJournal(); break;
      case 'journalArticle': html = renderJournalArticle(params.slug); break;
      case 'contact': html = renderContact(); break;
      case 'faq': html = renderFAQ(); break;
      case 'shipping': html = renderShipping(); break;
      case 'returns': html = renderReturns(); break;
      case 'privacy': html = renderPrivacy(); break;
      case 'terms': html = renderTerms(); break;
      case 'cart': html = renderCart(); break;
      case 'search': html = renderSearch(); break;
      default: html = render404(); break;
    }

    appEl.innerHTML = html;

    bindPageEvents(name, params);

    if (window.MAELYS.Animations) {
      window.MAELYS.Animations.refresh();
    }
    if (window.MAELYS.UI) {
      window.MAELYS.UI.initAccordions();
      window.MAELYS.UI.initSizeSelectors();
      window.MAELYS.UI.initQuantitySelectors();
      window.MAELYS.UI.initBackToTop();
      window.MAELYS.UI.initNewsletterForms();
    }

    if (window.MAELYS.Cart) {
      window.MAELYS.Cart.renderDrawerContent();
    }
  }

  function bindPageEvents(name, params) {
    if (name === 'product' && params && params.slug) {
      var addBtn = document.getElementById('product-add-to-cart');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          var slug = this.getAttribute('data-product-slug');
          var activeSize = document.querySelector('.product-size-btn.active');
          var size = activeSize ? activeSize.getAttribute('data-size') : '50';
          if (window.MAELYS.Cart) {
            window.MAELYS.Cart.addToCart(slug, parseInt(size, 10));
            window.MAELYS.UI.showToast('Added to your bag.', 'success');
          }
        });
      }
    }

    if (name === 'contact') {
      var contactForm = document.getElementById('contact-form');
      if (contactForm && window.MAELYS.UI) {
        window.MAELYS.UI.initContactForm(contactForm);
      }
    }

    if (name === 'shop') {
      var sortSelect = document.getElementById('shop-sort');
      if (sortSelect) {
        sortSelect.addEventListener('change', function () {
          sortShopProducts(this.value);
        });
      }
    }

    if (name === 'search') {
      var searchInput = document.getElementById('page-search-input');
      var searchResults = document.getElementById('page-search-results');
      if (searchInput && searchResults) {
        var searchTimer = null;
        searchInput.addEventListener('input', function () {
          var query = this.value.trim();
          clearTimeout(searchTimer);
          searchTimer = setTimeout(function () {
            if (query.length < 2) {
              searchResults.innerHTML = '';
              return;
            }
            var results = window.MAELYS.Search ? window.MAELYS.Search.searchAll(query) : { products: [], collections: [], articles: [] };
            var total = results.products.length + results.collections.length + results.articles.length;
            if (total === 0) {
              searchResults.innerHTML = '<p style="text-align:center;color:var(--color-muted);padding:var(--space-3xl) 0;">No results found for "' + window.MAELYS.UI.escapeHtml(query) + '"</p>';
              return;
            }
            var html = '';
            if (results.products.length) {
              html += '<div style="margin-bottom:var(--space-2xl);"><div style="font-size:var(--text-xs);letter-spacing:var(--tracking-widest);text-transform:uppercase;color:var(--color-muted);margin-bottom:var(--space-lg);">Fragrances</div>';
              for (var i = 0; i < results.products.length; i++) {
                var p = results.products[i];
                var imgUrl = (p.images && p.images.main) ? p.images.main : '';
                var imgHtml = imgUrl ?
                  '<img src="' + imgUrl + '" alt="' + p.name + '" style="width:48px;height:60px;object-fit:cover;margin-right:var(--space-md);vertical-align:middle;" loading="lazy">' : '';
                html += '<a href="#/product/' + p.slug + '" style="display:flex;align-items:center;padding:var(--space-sm) 0;border-bottom:1px solid var(--color-border);text-decoration:none;color:var(--color-text);">' +
                  imgHtml +
                  '<div><div style="font-family:var(--font-display);font-size:var(--text-lg);">' + p.name + '</div>' +
                  '<div style="font-size:var(--text-xs);color:var(--color-muted);">' + p.collection + ' \u00b7 ' + formatPrice(p.price) + '</div></div>' +
                '</a>';
              }
              html += '</div>';
            }
            searchResults.innerHTML = html;
          }, 200);
        });
        searchInput.focus();
      }
    }

    if (name === 'shop') {
      var sortVal = document.getElementById('shop-sort');
      if (sortVal) sortShopProducts(sortVal.value);
    }
  }

  function sortShopProducts(sortBy) {
    var products = window.MAELYS.products || [];
    var sorted = products.slice();

    switch (sortBy) {
      case 'price-asc': sorted.sort(function (a, b) { return a.price - b.price; }); break;
      case 'price-desc': sorted.sort(function (a, b) { return b.price - a.price; }); break;
      case 'name': sorted.sort(function (a, b) { return a.name.localeCompare(b.name); }); break;
      case 'featured':
      default: sorted.sort(function (a, b) { return (b.featured ? 1 : 0) - (a.featured ? 1 : 0); }); break;
    }

    var gridEl = document.getElementById('shop-grid');
    if (!gridEl) return;

    var html = '';
    for (var i = 0; i < sorted.length; i++) {
      var p = sorted[i];
      var badges = '';
      if (p.newArrival) badges += '<span class="badge badge-new">New</span> ';
      if (p.limitedEdition) badges += '<span class="badge badge-accent">Limited</span> ';

      html += '<article class="card" data-reveal>' +
        '<a href="#/product/' + p.slug + '" class="card-image-wrap" style="position:relative;overflow:hidden;">' +
          '<span style="position:absolute;top:var(--space-md);left:var(--space-md);display:flex;gap:var(--space-2xs);z-index:2;">' + badges + '</span>' +
          productImageHtml(p, '', 'width:100%;height:100%;object-fit:cover;transition:transform 0.6s var(--ease-out);') +
        '</a>' +
        '<div class="card-body">' +
          '<div class="card-category">' + p.collection + '</div>' +
          '<h3 class="card-title"><a href="#/product/' + p.slug + '" style="text-decoration:none;color:inherit;">' + p.name + '</a></h3>' +
          '<p class="card-subtitle">' + p.shortDescription + '</p>' +
          '<div class="card-price">' + formatPrice(p.price) + '</div>' +
        '</div>' +
      '</article>';
    }

    gridEl.innerHTML = html;
    if (window.MAELYS.Animations) window.MAELYS.Animations.refresh();
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  INITIALIZATION                                                         */
  /* ════════════════════════════════════════════════════════════════════════ */

  function init() {
    appEl = document.getElementById('app');
    if (!appEl) return;

    if (window.MAELYS.Router) window.MAELYS.Router.init();
    if (window.MAELYS.Cart) window.MAELYS.Cart.init();
    if (window.MAELYS.Search) window.MAELYS.Search.init();
    if (window.MAELYS.UI) window.MAELYS.UI.init();
    if (window.MAELYS.Animations) window.MAELYS.Animations.init();

    if (window.MAELYS.Cart) {
      window.MAELYS.Cart.onUpdate(function () {
        if (window.MAELYS.Cart) window.MAELYS.Cart.renderDrawerContent();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    init: init,
    render: render,
    renderHome: renderHome,
    renderShop: renderShop,
    renderProduct: renderProduct,
    renderCollections: renderCollections,
    renderCollection: renderCollection,
    renderAbout: renderAbout,
    renderJournal: renderJournal,
    renderJournalArticle: renderJournalArticle,
    renderContact: renderContact,
    renderFAQ: renderFAQ,
    renderShipping: renderShipping,
    renderReturns: renderReturns,
    renderPrivacy: renderPrivacy,
    renderTerms: renderTerms,
    renderCart: renderCart,
    renderSearch: renderSearch,
    render404: render404
  };
})();
