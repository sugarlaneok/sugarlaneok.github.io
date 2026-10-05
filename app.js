(function () {
  'use strict';

  var CONFIG = window.SUGAR_LANE_CONFIG || {};
  var CONTENT = window.SUGAR_LANE_CONTENT || { photos: {}, blurbs: {}, social: {} };
  var STORE_KEY = 'sugarlane-order-v2';
  var STEPS = [['pickup', 'Pickup'], ['details', 'Your info'], ['pay', 'Pay']];

  var data = null;      // from the server: menu, slots, rules, locations, events...
  var state = loadState();
  var payments = null;  // Square Web Payments SDK
  var payWidgets = [];
  var busy = false;
  var openGroup = null; // product sheet currently open

  var app = document.getElementById('app');

  // ================= state =================

  function freshState() {
    return {
      view: 'shop', step: 'pickup', cart: [], slot: null, date: null, notes: '', quote: null, draftId: newId(),
      customer: { name: '', email: '', phone: '', contactBy: 'Text', location: '', address: '', heard: '', agree: false },
      packs: {}, done: null
    };
  }

  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && s.draftId) return s;
    } catch (e) { /* storage unavailable */ }
    return freshState();
  }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function newId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }

  // ================= server =================

  var INIT_CACHE = 'sugarlane-init-v1';

  function apiGet() {
    if (!CONFIG.API_URL) return window.SLMock.init();
    // Google's script server occasionally hangs or returns a one-off error page,
    // so give each try 12 seconds and retry up to 3 times.
    var load = function () {
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 12000);
      return fetch(CONFIG.API_URL + '?action=init&t=' + Date.now(), ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { return r.json(); })
        .then(function (d) { clearTimeout(timer); return d; }, function (e) { clearTimeout(timer); throw e; });
    };
    var retry = function (n) {
      return load().catch(function (e) {
        if (n <= 1) throw e;
        return new Promise(function (r) { setTimeout(r, 1000); }).then(function () { return retry(n - 1); });
      });
    };
    return retry(3).then(function (d) {
      if (d && d.ok) { try { localStorage.setItem(INIT_CACHE, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* ignore */ } }
      return d;
    });
  }

  /** Last menu we saw (up to 1 day old), so the page can show instantly while the fresh copy loads. */
  function cachedInit() {
    try {
      var c = JSON.parse(localStorage.getItem(INIT_CACHE));
      if (c && c.d && Date.now() - c.t < 86400000) return c.d;
    } catch (e) { /* ignore */ }
    return null;
  }

  function apiPost(body) {
    if (!CONFIG.API_URL) return window.SLMock.post(body);
    return fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids a CORS preflight Apps Script can't answer
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  // ================= helpers =================

  function $(sel, root) { return (root || document).querySelector(sel); }
  function money(cents) { return '$' + (cents / 100).toFixed(cents % 100 ? 2 : 0); }
  function money2(cents) { return '$' + (cents / 100).toFixed(2); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function byId(id) {
    for (var i = 0; i < data.menu.length; i++) if (data.menu[i].id === id) return data.menu[i];
    return null;
  }
  function groupOf(category) { return String(category).split(/\s+[–-]\s+/)[0]; }
  function subOf(category) { var p = String(category).split(/\s+[–-]\s+/); return p[1] || ''; }
  function isDelivery(loc) { return /^delivery/i.test(String(loc || '')); }
  function plural(n, unit) { return unit === 'dozen' ? n + ' dozen' : n + ' ' + unit + (n === 1 ? '' : 's'); }
  function photoFor(group) { var p = CONTENT.photos[group]; return Array.isArray(p) ? p[0] : p; }

  function cartLines() {
    return state.cart.map(function (c, idx) {
      var it = byId(c.id);
      if (!it) return null;
      var picks = (c.picks || []).map(function (p) {
        var ch = (it.choices || []).filter(function (x) { return x.id === p; })[0];
        return ch ? ch.label : '?';
      });
      return { c: c, idx: idx, it: it, label: it.picks ? it.name : it.category + ' – ' + it.name, picks: picks, cents: it.priceCents * c.qty };
    }).filter(Boolean);
  }
  function subtotal() { return cartLines().reduce(function (s, l) { return s + l.cents; }, 0); }
  function cartCount() { return state.cart.reduce(function (s, c) { return s + (c.picks ? 1 : c.qty); }, 0); }
  function apiCart() {
    return state.cart.map(function (c) { return c.picks ? { id: c.id, qty: c.qty, picks: c.picks } : { id: c.id, qty: c.qty }; });
  }
  function selectedDay() {
    if (!state.slot) return null;
    var date = state.slot.split(' ')[0];
    return data.slots.filter(function (d) { return d.date === date; })[0] || null;
  }
  function slotText() {
    var day = selectedDay();
    var t = day && day.times.filter(function (x) { return x.key === state.slot; })[0];
    return day && t ? day.label + ' at ' + t.label : '';
  }

  function lockScroll(on) { document.body.classList.toggle('locked', !!on); }

  // Phone browsers (iOS Chrome/Safari) draw toolbars over the page, so 100vh/inset:0 runs under them.
  // Track the part of the screen that's actually visible and size the overlays to it.
  function fitViewport() {
    var vv = window.visualViewport, root = document.documentElement.style;
    root.setProperty('--vv-h', (vv ? vv.height : window.innerHeight) + 'px');
    root.setProperty('--vv-top', (vv ? vv.offsetTop : 0) + 'px');
    // How far fixed-to-bottom bars would sit under a toolbar: compare the fixed-position box to what's visible.
    if (!fitViewport.probe) {
      fitViewport.probe = document.createElement('div');
      fitViewport.probe.style.cssText = 'position:fixed;top:0;bottom:0;width:0;visibility:hidden;pointer-events:none';
      document.body.appendChild(fitViewport.probe);
    }
    var visibleBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
    var gap = Math.max(0, Math.round(fitViewport.probe.getBoundingClientRect().height - visibleBottom));
    root.setProperty('--vv-gap', gap + 'px');
  }

  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { t.hidden = true; }, 1800);
  }

  // ================= view switching =================

  var PAGES = ['home', 'cookies', 'cake-pops', 'cakes', 'order', 'events', 'about'];
  var PAGE_TITLES = { home: '', cookies: 'Decorated Cookies', 'cake-pops': 'Cake Pops', cakes: 'Custom Cakes', order: 'Order Online', events: 'Pop-up Events', about: 'About', checkout: 'Checkout' };

  function currentRoute() { return location.hash.replace(/^#\/?/, '').split('?')[0] || 'home'; }

  function showView(view) {
    state.view = view;
    save();
    document.getElementById('shop').hidden = view !== 'shop';
    document.getElementById('checkout').hidden = view !== 'checkout';
    if (view === 'shop') { destroyPay(); setCheckoutBar(''); renderShop(); }
    else renderCheckout();
  }

  function showPage(page) {
    document.querySelectorAll('#shop [data-page]').forEach(function (el) { el.hidden = el.getAttribute('data-page') !== page; });
    document.querySelectorAll('#nav [data-nav]').forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-nav') === page); });
  }

  /** Show whatever the address bar says: #/cookies, #/order, #/checkout ... */
  function route() {
    var r = currentRoute();
    document.title = (PAGE_TITLES[r] ? PAGE_TITLES[r] + ' – ' : '') + 'Sugar Lane – Home Bakery in Norman, OK';
    if (r === 'checkout') {
      if (!data) return;
      if (state.cart.length || state.step === 'done') { showView('checkout'); window.scrollTo(0, 0); }
      else location.replace('#/order');
      return;
    }
    if (PAGES.indexOf(r) < 0) r = 'home';
    showPage(r);
    if (data) showView('shop'); else document.getElementById('shop').hidden = false;
    document.getElementById('checkout').hidden = true;
    window.scrollTo(0, 0);
  }

  function goPage(page) {
    var target = page === 'home' ? '#/' : '#/' + page;
    if (location.hash === target || (page === 'home' && !location.hash)) route(); else location.hash = target;
  }

  function startCheckout() {
    closeCart();
    if (!state.cart.length) return;
    state.step = 'pickup';
    save();
    if (location.hash === '#/checkout') route(); else location.hash = '#/checkout';
  }

  function backToShop(anchor) { goPage(anchor || 'order'); }

  window.addEventListener('hashchange', route);

  // ================= SHOP =================

  function renderShop() {
    renderMenu();
    renderEvents();
    renderCartButton();
    var customHref = data.customFormUrl || CONFIG.CUSTOM_FORM_URL ||
      'mailto:' + (data.business.email || 'sugarlaneok@gmail.com') + '?subject=' + encodeURIComponent('Custom order request');
    document.querySelectorAll('.custom-link').forEach(function (a) { a.href = customHref; });
    renderShowcases();
    renderSocial();
  }

  // ----- showcase galleries + lightbox -----

  function renderShowcases() {
    var sc = CONTENT.showcase || {};
    Object.keys(sc).forEach(function (key) {
      var el = document.getElementById('showcase-' + key);
      if (!el || el.childElementCount) return;
      var g = sc[key];
      var hasMore = !!document.querySelector('.more-btn[data-gallery="' + key + '"]');
      var tile = function (p, i) {
        var cls = [hasMore && i >= g.featured ? 'extra' : '', g.lead && i === 0 ? 'lead' : '', p[2] || ''].join(' ').trim();
        return '<button class="' + cls + '" data-gallery="' + key + '" data-i="' + i + '" aria-label="' + esc(p[1]) + '">' +
          '<img src="images/' + esc(p[0]) + '" alt="' + esc(p[1]) + '" loading="lazy"></button>';
      };
      if (g.layout === 'grid') {
        el.classList.add('grid');
        var big = g.big || 0;
        el.innerHTML = (big ? '<div class="big-row" style="grid-template-columns:repeat(' + big + ',1fr)">' + g.photos.slice(0, big).map(tile).join('') + '</div>' : '') +
          '<div class="small-grid">' + g.photos.slice(big).map(function (p, j) { return tile(p, j + big); }).join('') + '</div>';
      } else {
        el.innerHTML = g.photos.map(tile).join('');
      }
      el.onclick = function (e) {
        var b = e.target.closest('button');
        if (b) openLightbox(g.photos.map(function (p) { return { src: 'images/' + p[0], cap: p[1] }; }), Number(b.getAttribute('data-i')));
      };
      var more = document.querySelector('.more-btn[data-gallery="' + key + '"]');
      if (more) {
        more.hidden = g.photos.length <= g.featured;
        more.onclick = function () {
          var open = el.classList.toggle('expanded');
          more.textContent = open ? 'Show fewer' : more.getAttribute('data-label') || more.textContent;
          if (!open) el.scrollIntoView({ block: 'start' });
        };
        more.setAttribute('data-label', more.textContent);
      }
    });
  }

  var lb = { list: [], i: 0 };
  function openLightbox(list, i) {
    lb.list = list; lb.i = i || 0;
    showLightbox();
    document.getElementById('lightbox').hidden = false;
    lockScroll(true);
  }
  function showLightbox() {
    var it = lb.list[lb.i];
    document.getElementById('lbImg').src = it.src;
    document.getElementById('lbImg').alt = it.cap || '';
    document.getElementById('lbCap').textContent = it.cap || '';
    var multi = lb.list.length > 1;
    document.querySelector('.lb-prev').hidden = !multi;
    document.querySelector('.lb-next').hidden = !multi;
  }
  function closeLightbox() {
    document.getElementById('lightbox').hidden = true;
    var sheetOpen = !document.getElementById('productOverlay').hidden || !document.getElementById('cartOverlay').hidden;
    if (!sheetOpen) lockScroll(false);
  }
  function stepLightbox(d) { lb.i = (lb.i + d + lb.list.length) % lb.list.length; showLightbox(); }

  function itemPhotoList(it) {
    var map = CONTENT.itemPhotos || {};
    var list = map[it.category + '|' + it.name] || [];
    return list.map(function (f) { return { src: 'images/' + f, cap: it.name }; });
  }

  function categoryPhotoList(category) {
    var map = CONTENT.itemPhotos || {};
    return (map[category + '|*'] || []).map(function (f) { return { src: 'images/' + f, cap: category }; });
  }

  function groups() {
    var out = [];
    data.menu.forEach(function (it) {
      var g = groupOf(it.category);
      var grp = out.filter(function (x) { return x.name === g; })[0];
      if (!grp) out.push(grp = { name: g, items: [] });
      grp.items.push(it);
    });
    return out;
  }

  function priceLabel(items) {
    var prices = items.map(function (i) { return i.priceCents; });
    var min = Math.min.apply(null, prices);
    var same = prices.every(function (p) { return p === min; });
    var unit = items[0].unit === 'pack' ? '' : ' / ' + items[0].unit;
    return (same ? '' : 'From ') + money(min) + unit;
  }

  function photoHtml(group, cls) {
    var p = CONTENT.photos[group.name];
    if (Array.isArray(p) && p.length > 1) {
      return '<div class="' + cls + ' collage">' + p.slice(0, 3).map(function (src) { return '<img src="' + esc(src) + '" alt="" loading="lazy">'; }).join('') + '</div>';
    }
    if (p) return '<div class="' + cls + '"><img src="' + esc(Array.isArray(p) ? p[0] : p) + '" alt="' + esc(group.name) + '" loading="lazy"></div>';
    return '<div class="' + cls + '"><div class="placeholder"><img src="images/logo-sl.png" alt=""></div></div>';
  }

  function groupCount(group) {
    var ids = group.items.map(function (i) { return i.id; });
    return state.cart.reduce(function (s, c) { return ids.indexOf(c.id) >= 0 ? s + (c.picks ? 1 : c.qty) : s; }, 0);
  }

  function renderMenu() {
    var r = data.rules;
    document.getElementById('menuLead').textContent = 'Order at least ' + r.standardDays + ' days ahead' +
      (r.rushDays < r.standardDays ? ' (rush orders ' + r.rushDays + '–' + (r.standardDays - 1) + ' days out add ' + r.rushPct + '%)' : '') +
      '. Tap a treat to choose flavors. Your card isn\'t charged until ' + data.business.ownerName + ' confirms your order.';
    var grid = document.getElementById('menuGrid');
    grid.innerHTML = groups().map(function (g) {
      var n = groupCount(g);
      var isPack = g.items[0].picks;
      var unitWord = isPack ? (n === 1 ? 'pack' : 'packs') : 'dozen';
      return '<button class="product" data-group="' + esc(g.name) + '">' +
        photoHtml(g, 'product-photo').replace('</div>', (n ? '<span class="in-cart-badge">' + n + ' ' + unitWord + ' in cart</span>' : '') + '</div>') +
        '<div class="product-body"><h3>' + esc(g.name) + '</h3>' +
        '<div class="product-price">' + priceLabel(g.items) + '</div>' +
        '<p class="product-blurb">' + esc(CONTENT.blurbs[g.name] || '') + '</p>' +
        '<span class="btn btn-primary product-cta">' + (isPack ? 'Build a pack' : 'Choose flavors') + '</span></div></button>';
    }).join('');
    grid.onclick = function (e) {
      var b = e.target.closest('.product');
      if (b) openProduct(b.getAttribute('data-group'));
    };
  }

  function renderEvents() {
    var list = document.getElementById('eventList');
    var events = data.events || [];
    if (!events.length) {
      list.innerHTML = '<p class="muted">No pop-ups on the calendar right now. Follow us on social media to hear about the next one!</p>';
      return;
    }
    list.innerHTML = events.map(function (ev) {
      var parts = ev.label.split(' ');
      return '<div class="event"><div class="event-date"><span>' + esc(parts[0]) + '</span><b>' + esc(parts[1]) + '</b></div>' +
        '<div><h3>' + esc(ev.name) + '</h3>' +
        '<p>' + esc([ev.weekday, ev.time].filter(Boolean).join(' · ')) + '</p>' +
        (ev.place ? '<p><b style="color:var(--ink)">' + esc(ev.place) + '</b>' + (ev.address ? '<br><a href="https://maps.google.com/?q=' + encodeURIComponent(ev.address) + '" target="_blank" rel="noopener">' + esc(ev.address) + '</a>' : '') + '</p>' : '') +
        '</div>' + (ev.flyer ? '<img src="' + esc(ev.flyer) + '" alt="' + esc(ev.name) + ' flyer" loading="lazy">' : '<span></span>') + '</div>';
    }).join('');
  }

  function renderSocial() {
    var s = CONTENT.social || {};
    var links = [['instagram', 'IG', 'Instagram'], ['facebook', 'f', 'Facebook'], ['tiktok', 'TT', 'TikTok']]
      .filter(function (x) { return s[x[0]]; })
      .map(function (x) { return '<a href="' + esc(s[x[0]]) + '" target="_blank" rel="noopener" aria-label="' + x[2] + '">' + x[1] + '</a>'; });
    document.getElementById('social').innerHTML = links.join('');
  }

  function renderCartButton() {
    var n = cartCount();
    var badge = document.getElementById('cartCount');
    badge.hidden = !n;
    badge.textContent = n;
    var bar = document.getElementById('floatbar');
    if (n && state.view === 'shop') {
      bar.hidden = false;
      bar.innerHTML = '<button class="btn btn-primary" id="floatCart"><span>View cart · ' + n + '</span><span>' + money2(subtotal()) + '</span></button>';
      $('#floatCart').onclick = openCart;
    } else bar.hidden = true;
  }

  function bumpCart() {
    var b = document.getElementById('cartBtn');
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  }

  // ----- product sheet -----

  function openProduct(groupName) {
    openGroup = groupName;
    renderProduct();
    document.getElementById('productOverlay').hidden = false;
    lockScroll(true);
  }

  function closeProduct() {
    openGroup = null;
    document.getElementById('productOverlay').hidden = true;
    lockScroll(false);
    renderMenu();
    renderCartButton();
  }

  function renderProduct() {
    var g = groups().filter(function (x) { return x.name === openGroup; })[0];
    if (!g) return closeProduct();
    var sheet = document.getElementById('productSheet');
    var cats = [];
    g.items.forEach(function (it) { if (cats.indexOf(it.category) < 0) cats.push(it.category); });
    var html = photoHtml(g, 'sheet-photo').replace('</div>', '<button class="sheet-close" aria-label="Close">×</button></div>') +
      '<div class="sheet-body"><h3 id="productTitle">' + esc(g.name) + '</h3>' +
      '<p class="muted" style="margin:6px 0 0">' + esc(CONTENT.blurbs[g.name] || '') + '</p>';
    cats.forEach(function (cat) {
      var items = g.items.filter(function (i) { return i.category === cat; });
      var first = items[0];
      if (first.picks) {
        items.forEach(function (it) { html += packHtml(it); });
        return;
      }
      var strip = categoryPhotoList(cat);
      if (strip.length) {
        html += '<div class="sheet-strip" data-strip="' + esc(cat) + '">' + strip.map(function (p, i) {
          return '<button data-i="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(p.src) + '" alt="" loading="lazy"></button>';
        }).join('') + '</div>';
      }
      html += '<div class="sheet-sub"><b>' + esc(subOf(cat) || 'Flavors') + '</b><span class="muted small">' + priceLabel(items) +
        (first.minQty > 1 ? ' · min ' + plural(first.minQty, first.unit) + ' per flavor' : '') + '</span></div>';
      items.forEach(function (it) { html += itemHtml(it); });
    });
    html += '</div><div class="sheet-foot"><div class="sum"><b>' + money2(subtotal()) + '</b> <span class="muted small">in cart</span></div>' +
      '<button class="btn btn-ghost" id="keepShopping">Keep shopping</button>' +
      '<button class="btn btn-primary" id="sheetCart"' + (state.cart.length ? '' : ' disabled') + '>View cart</button></div>';
    sheet.innerHTML = html;

    sheet.onclick = function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-photos')) return openLightbox(itemPhotoList(byId(b.getAttribute('data-photos'))), 0);
      var strip = b.closest('[data-strip]');
      if (strip) return openLightbox(categoryPhotoList(strip.getAttribute('data-strip')), Number(b.getAttribute('data-i')));
      var id = b.getAttribute('data-id');
      if (b.classList.contains('sheet-close') || b.id === 'keepShopping') return closeProduct();
      if (b.id === 'sheetCart') { closeProduct(); return openCart(); }
      if (b.classList.contains('add')) changeQty(id, +1);
      else if (b.classList.contains('sub')) changeQty(id, -1);
      else if (b.classList.contains('add-pack')) addPack(id);
      else if (b.classList.contains('remove-line')) { state.cart.splice(Number(b.getAttribute('data-index')), 1); afterCartChange(); renderProduct(); }
    };
    sheet.onchange = function (e) {
      var s = e.target;
      if (s.matches('select[data-pack]')) {
        var pid = s.getAttribute('data-pack');
        state.packs[pid] = state.packs[pid] || [];
        state.packs[pid][Number(s.getAttribute('data-i'))] = s.value;
        save();
      }
    };
  }

  function qtyOf(id) {
    var c = state.cart.filter(function (x) { return x.id === id && !x.picks; })[0];
    return c ? c.qty : 0;
  }

  function stepperHtml(it, q) {
    return '<div class="stepper">' +
      '<button class="sub" data-id="' + it.id + '" aria-label="Remove one ' + esc(it.unit) + ' of ' + esc(it.name) + '"' + (q ? '' : ' disabled') + '>−</button>' +
      '<div class="qty">' + (q ? q + '<small>' + esc(it.unit) + '</small>' : '0') + '</div>' +
      '<button class="add" data-id="' + it.id + '" aria-label="Add one ' + esc(it.unit) + ' of ' + esc(it.name) + '">+</button></div>';
  }

  function itemHtml(it) {
    var q = qtyOf(it.id);
    var photos = itemPhotoList(it);
    var thumb = photos.length
      ? '<button class="item-thumb" data-photos="' + it.id + '" aria-label="See photos of ' + esc(it.name) + '"><img src="' + esc(photos[0].src) + '" alt="" loading="lazy">' +
        (photos.length > 1 ? '<span>' + photos.length + '</span>' : '') + '</button>'
      : '';
    return '<div class="item' + (q ? ' has-qty' : '') + '" id="row-' + it.id + '">' + thumb +
      '<div class="item-info"><div class="item-name">' + esc(it.name) + '</div>' +
      (it.description ? '<div class="item-desc">' + esc(it.description) + '</div>' : '') + '</div>' +
      stepperHtml(it, q) + '</div>';
  }

  function packHtml(it) {
    var picks = state.packs[it.id] || [];
    var html = '<div class="sheet-sub"><b>' + esc(it.name) + '</b><span class="product-price">' + money2(it.priceCents) + '</span></div>' +
      '<p class="muted small" style="margin:8px 0">' + esc(it.description) + '</p>';
    for (var i = 0; i < it.picks; i++) {
      html += '<div class="pick-row"><label for="pk-' + it.id + '-' + i + '">Dozen ' + (i + 1) + '</label>' +
        '<select id="pk-' + it.id + '-' + i + '" data-pack="' + it.id + '" data-i="' + i + '"><option value="">Choose a treat…</option>' +
        it.choices.map(function (ch) {
          return '<option value="' + ch.id + '"' + (picks[i] === ch.id ? ' selected' : '') + '>' + esc(ch.label) + '</option>';
        }).join('') + '</select></div>';
    }
    html += '<div id="packerr-' + it.id + '"></div>' +
      '<button class="btn btn-outline btn-block add-pack" data-id="' + it.id + '">Add ' + esc(it.name) + ' – ' + money2(it.priceCents) + '</button>';
    var inCart = state.cart.map(function (c, idx) { return { c: c, idx: idx }; }).filter(function (x) { return x.c.id === it.id; });
    if (inCart.length) {
      html += '<ul class="muted small" style="padding-left:18px;margin:12px 0 20px">' + inCart.map(function (x) {
        var labels = x.c.picks.map(function (p) {
          var ch = it.choices.filter(function (c) { return c.id === p; })[0];
          return ch ? ch.label : '?';
        });
        return '<li>In cart: ' + esc(labels.join(', ')) + ' <button class="link-btn remove-line" data-index="' + x.idx + '">remove</button></li>';
      }).join('') + '</ul>';
    }
    return html + '<div style="height:12px"></div>';
  }

  function setQty(id, q) {
    var c = state.cart.filter(function (x) { return x.id === id && !x.picks; })[0];
    if (c && q === 0) state.cart.splice(state.cart.indexOf(c), 1);
    else if (c) c.qty = q;
    else if (q) state.cart.push({ id: id, qty: q });
  }

  function changeQty(id, dir) {
    var it = byId(id);
    var q = qtyOf(id);
    var before = q;
    if (dir > 0) q = q === 0 ? it.minQty : Math.min(99, q + 1);
    else q = q <= it.minQty ? 0 : q - 1;
    setQty(id, q);
    afterCartChange();
    if (q > before) bumpCart();
    var row = document.getElementById('row-' + id);
    if (row) {
      var tmp = document.createElement('div');
      tmp.innerHTML = itemHtml(it);
      row.replaceWith(tmp.firstChild);
    }
    var foot = $('.sheet-foot .sum b');
    if (foot) foot.textContent = money2(subtotal());
    var vc = document.getElementById('sheetCart');
    if (vc) vc.disabled = !state.cart.length;
  }

  function addPack(id) {
    var it = byId(id);
    var picks = (state.packs[id] || []).slice(0, it.picks);
    var err = document.getElementById('packerr-' + id);
    if (picks.filter(Boolean).length !== it.picks) {
      err.innerHTML = '<div class="error">Please choose all ' + it.picks + ' treats first.</div>';
      return;
    }
    state.cart.push({ id: id, qty: 1, picks: picks });
    state.packs[id] = [];
    afterCartChange();
    bumpCart();
    toast(it.name + ' added to cart');
    renderProduct();
  }

  function afterCartChange() {
    state.quote = null;
    save();
    renderCartButton();
  }

  // ----- cart drawer -----

  function openCart() {
    renderCart();
    document.getElementById('cartOverlay').hidden = false;
    lockScroll(true);
  }

  function closeCart() {
    document.getElementById('cartOverlay').hidden = true;
    lockScroll(false);
    if (state.view === 'shop') { renderMenu(); renderCartButton(); }
  }

  function renderCart() {
    var lines = cartLines();
    var d = document.getElementById('cartDrawer');
    var html = '<div class="drawer-head"><h3>Your cart</h3><button id="closeCart" aria-label="Close cart">×</button></div><div class="drawer-body">';
    if (!lines.length) {
      html += '<div class="empty"><img src="images/logo-sl.png" alt="" style="width:90px;margin:0 auto 12px;opacity:.6">Your cart is empty.<br><br>' +
        '<button class="btn btn-primary" id="browse">Browse the menu</button></div>';
    } else {
      html += lines.map(function (l) {
        var photo = photoFor(groupOf(l.it.category));
        return '<div class="cart-line">' + (photo ? '<img src="' + esc(photo) + '" alt="">' : '<div class="thumb"></div>') +
          '<div class="info"><div class="name">' + esc(l.it.picks ? l.it.name : l.it.name) + '</div>' +
          '<div class="sub">' + esc(l.it.picks ? l.picks.join(', ') : l.it.category) + '</div>' +
          (l.it.picks ? '<button class="link-btn remove-line" data-index="' + l.idx + '">Remove</button>' : '') + '</div>' +
          '<div class="right"><b>' + money2(l.cents) + '</b>' + (l.it.picks ? '' : stepperHtml(l.it, l.c.qty)) + '</div></div>';
      }).join('');
    }
    html += '</div>';
    if (lines.length) {
      html += '<div class="drawer-foot"><div class="total-row"><span>Subtotal</span><span>' + money2(subtotal()) + '</span></div>' +
        '<p class="muted small" style="margin:0 0 12px">Tax and any rush or delivery fee are added at checkout. You won\'t be charged until ' +
        esc(data.business.ownerName) + ' confirms your order.</p>' +
        '<button class="btn btn-primary btn-block" id="checkoutBtn">Choose pickup time →</button></div>';
    }
    d.innerHTML = html;
    d.onclick = function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.id === 'closeCart') return closeCart();
      if (b.id === 'browse') { closeCart(); return backToShop('order'); }
      if (b.id === 'checkoutBtn') return startCheckout();
      var id = b.getAttribute('data-id');
      if (b.classList.contains('add')) { changeQty(id, +1); renderCart(); }
      else if (b.classList.contains('sub')) { changeQty(id, -1); renderCart(); }
      else if (b.classList.contains('remove-line')) { state.cart.splice(Number(b.getAttribute('data-index')), 1); afterCartChange(); renderCart(); }
    };
  }

  // ================= CHECKOUT =================

  function goStep(step) {
    if (step !== 'pay') destroyPay();
    state.step = step;
    save();
    renderCheckout();
    window.scrollTo(0, 0);
  }

  function renderCheckout() {
    renderCartButton();
    document.getElementById('floatbar').hidden = true;
    renderSteps();
    if (state.step === 'done') return renderDone();
    if (!state.cart.length) return backToShop('order');
    if (state.step === 'pickup') renderPickup();
    else if (state.step === 'details') renderDetails();
    else if (state.step === 'pay') renderPay();
  }

  function renderSteps() {
    var nav = document.getElementById('steps');
    var idx = STEPS.map(function (s) { return s[0]; }).indexOf(state.step);
    nav.hidden = state.step === 'done';
    nav.innerHTML = '<button class="step done" data-step="shop">← Menu</button>' + STEPS.map(function (s, i) {
      var cls = i === idx ? 'active' : (i < idx ? 'done' : '');
      return '<button class="step ' + cls + '" data-step="' + s[0] + '"' + (i < idx ? '' : ' disabled') + '>' + (i + 1) + '. ' + s[1] + '</button>';
    }).join('');
    nav.onclick = function (e) {
      var b = e.target.closest('.step.done');
      if (!b) return;
      var s = b.getAttribute('data-step');
      if (s === 'shop') backToShop('order'); else goStep(s);
    };
  }

  function setCheckoutBar(html) {
    var bar = document.getElementById('checkoutBar');
    if (!html) { if (bar) bar.remove(); return; }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'checkoutBar';
      bar.className = 'checkout-bar';
      document.body.appendChild(bar);
    }
    bar.innerHTML = '<div class="checkout-bar-inner">' + html + '</div>';
  }

  // ----- pickup -----

  function renderPickup() {
    var cust = state.customer;
    if (state.slot && !findSlot(state.slot)) state.slot = null;
    var html = '<h2>When and where?</h2>';
    if (state.slotError) { html += '<div class="error">' + esc(state.slotError) + '</div>'; state.slotError = null; }

    html += '<div class="panel"><div class="field" style="margin-top:0"><span class="label">Pickup location</span><div class="choices">' +
      data.locations.map(function (loc) {
        var sel = cust.location === loc;
        var fee = isDelivery(loc) ? ' <span class="muted">(+' + money2(data.rules.deliveryFeeCents) + ')</span>' : '';
        return '<label class="choice' + (sel ? ' selected' : '') + '"><input type="radio" name="loc" value="' + esc(loc) + '"' + (sel ? ' checked' : '') + '><span>' + esc(loc) + fee + '</span></label>';
      }).join('') + '</div></div>' +
      '<div class="field" id="addrField"' + (isDelivery(cust.location) ? '' : ' hidden') + '>' +
      '<label for="addr">Delivery address</label><input type="text" id="addr" autocomplete="street-address" value="' + esc(cust.address) + '"></div></div>';

    html += '<div class="panel"><div class="field" style="margin-top:0"><span class="label">Pickup day</span>';
    if (!data.slots.length) {
      html += '<p class="muted">There are no open pickup times right now. Please check back soon or contact us.</p>';
    } else {
      html += '<div class="dates" id="dates">' + data.slots.map(function (d) {
        var p = d.label.split(', ');
        var sel = state.date === d.date;
        return '<button class="chip date-chip' + (sel ? ' selected' : '') + '" data-date="' + d.date + '">' +
          '<span class="dow">' + esc(p[0]) + '</span><span class="day">' + esc(p[1]) + '</span>' +
          (d.rush ? '<span class="rush">+' + data.rules.rushPct + '% rush</span>' : '') + '</button>';
      }).join('') + '</div>';
    }
    html += '</div><div class="field" id="timesField"></div></div>';
    app.innerHTML = html;

    app.onchange = function (e) {
      if (e.target.name === 'loc') {
        cust.location = e.target.value;
        state.quote = null;
        save();
        app.querySelectorAll('.choice').forEach(function (c) { c.classList.toggle('selected', c.querySelector('input').checked); });
        $('#addrField').hidden = !isDelivery(cust.location);
        renderPickupBar();
      }
    };
    app.oninput = function (e) {
      if (e.target.id === 'addr') { cust.address = e.target.value; save(); renderPickupBar(); }
    };
    app.onclick = function (e) {
      var d = e.target.closest('.date-chip');
      if (d) {
        state.date = d.getAttribute('data-date');
        if (state.slot && state.slot.indexOf(state.date) !== 0) state.slot = null;
        save();
        app.querySelectorAll('.date-chip').forEach(function (c) { c.classList.toggle('selected', c === d); });
        renderTimes();
        renderPickupBar();
        return;
      }
      var t = e.target.closest('.time-chip');
      if (t) {
        state.slot = t.getAttribute('data-key');
        state.quote = null;
        save();
        app.querySelectorAll('.time-chip').forEach(function (c) { c.classList.toggle('selected', c === t); });
        renderPickupBar();
      }
    };
    if (!state.date && state.slot) state.date = state.slot.split(' ')[0];
    renderTimes();
    renderPickupBar();
    var selDate = $('.date-chip.selected');
    if (selDate) selDate.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  function findSlot(key) {
    for (var i = 0; i < data.slots.length; i++) {
      for (var j = 0; j < data.slots[i].times.length; j++) if (data.slots[i].times[j].key === key) return data.slots[i];
    }
    return null;
  }

  function renderTimes() {
    var f = $('#timesField');
    var day = data.slots.filter(function (d) { return d.date === state.date; })[0];
    if (!day) { f.innerHTML = ''; return; }
    f.innerHTML = '<span class="label">Pickup time on ' + esc(day.label) + '</span>' +
      (day.rush ? '<p class="notice" style="margin:4px 0 10px">This date is less than ' + data.rules.standardDays + ' days away, so a ' + data.rules.rushPct + '% rush fee applies.</p>' : '') +
      '<div class="times">' + day.times.map(function (t) {
        return '<button class="chip time-chip' + (state.slot === t.key ? ' selected' : '') + '" data-key="' + t.key + '">' + esc(t.label) + '</button>';
      }).join('') + '</div>';
  }

  function pickupReady() {
    var c = state.customer;
    return state.slot && c.location && (!isDelivery(c.location) || c.address.trim().length >= 6);
  }

  function renderPickupBar() {
    setCheckoutBar('<div class="sum"><b>' + money2(subtotal()) + '</b><div>' + esc(slotText() || 'Choose a location, day and time') + '</div></div>' +
      '<button class="btn btn-primary" id="next"' + (pickupReady() ? '' : ' disabled') + '>Your info →</button>');
    $('#next').onclick = function () { goStep('details'); };
  }

  // ----- details -----

  function renderDetails() {
    var c = state.customer;
    var html = '<h2>Your info</h2><div class="panel">' +
      field('name', 'Full name', 'text', c.name, 'name') +
      field('email', 'Email', 'email', c.email, 'email', 'Your confirmation goes here.') +
      field('phone', 'Cell phone', 'tel', c.phone, 'tel') +
      '<div class="field"><span class="label">Best way to reach you</span><div class="seg">' +
      ['Text', 'Call', 'Email'].map(function (o) {
        return '<button class="chip seg-chip' + (c.contactBy === o ? ' selected' : '') + '" data-v="' + o + '">' + o + '</button>';
      }).join('') + '</div></div>' +
      '<div class="field"><label for="notes">Anything we should know? <span class="hint">(optional)</span></label>' +
      '<textarea id="notes" placeholder="Colors, theme, the occasion, allergies…">' + esc(state.notes) + '</textarea></div>' +
      field('heard', 'How did you hear about us?', 'text', c.heard, 'off', '', true) +
      '</div>';

    html += '<div class="panel policy"><b style="color:var(--ink)">Before you order</b>' +
      '<p>🕑 ' + esc(data.business.ownerName) + ' reviews every order and will approve or decline it within ' + data.rules.reviewHours + ' hours. ' +
      'We place a hold on your card when you order and only charge it if your order is approved.</p>' +
      (data.cancellationPolicy ? '<p>↩︎ ' + esc(data.cancellationPolicy) + '</p>' : '') +
      (data.allergenNote ? '<p>⚠️ ' + esc(data.allergenNote) + '</p>' : '') +
      '<label class="check" style="color:var(--ink);margin-top:10px"><input type="checkbox" id="agree"' + (c.agree ? ' checked' : '') + '> I\'ve read and agree to these policies.</label></div>';
    app.innerHTML = html;

    app.oninput = function (e) {
      var id = e.target.id;
      if (id === 'notes') state.notes = e.target.value;
      else if (id === 'agree') c.agree = e.target.checked;
      else if (Object.prototype.hasOwnProperty.call(c, id)) c[id] = e.target.value;
      save();
      renderDetailsBar();
    };
    app.onchange = app.oninput;
    app.onclick = function (e) {
      var s = e.target.closest('.seg-chip');
      if (!s) return;
      c.contactBy = s.getAttribute('data-v');
      save();
      app.querySelectorAll('.seg-chip').forEach(function (x) { x.classList.toggle('selected', x === s); });
    };
    renderDetailsBar();
  }

  function field(id, label, type, value, autocomplete, hint, optional) {
    return '<div class="field"><label for="' + id + '">' + esc(label) + (optional ? ' <span class="hint">(optional)</span>' : '') + '</label>' +
      '<input type="' + type + '" id="' + id + '" value="' + esc(value) + '" autocomplete="' + autocomplete + '"' +
      (type === 'tel' ? ' inputmode="tel"' : '') + '>' + (hint ? '<div class="hint muted" style="font-size:13px;margin-top:4px">' + esc(hint) + '</div>' : '') + '</div>';
  }

  function detailsOk() {
    var c = state.customer;
    return c.name.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()) &&
      c.phone.replace(/\D/g, '').length >= 10 && c.agree;
  }

  function renderDetailsBar() {
    var ok = detailsOk();
    setCheckoutBar('<div class="sum"><b>' + money2(subtotal()) + '</b><div>' +
      (ok ? 'Next: review and pay' : 'Add your name, email and phone, and agree to the policies') + '</div></div>' +
      '<button class="btn btn-primary" id="next"' + (ok ? '' : ' disabled') + '>Review →</button>');
    $('#next').onclick = function () { goStep('pay'); };
  }

  // ----- review & pay -----

  function renderPay() {
    setCheckoutBar('');
    app.innerHTML = '<h2>Review &amp; pay</h2><p class="loading">Calculating your total…</p>';
    if (state.quote && state.quote.forSlot === state.slot && state.quote.forLoc === state.customer.location) return renderPayForm();
    apiPost({ action: 'quote', cart: apiCart(), slot: state.slot, customer: { location: state.customer.location } })
      .then(function (res) {
        if (!res.ok) return quoteFailed(res);
        state.quote = { totals: res.totals, rush: res.rush, forSlot: state.slot, forLoc: state.customer.location };
        save();
        renderPayForm();
      })
      .catch(function () {
        app.innerHTML = '<h2>Review &amp; pay</h2><div class="error">We couldn\'t reach the bakery\'s system. Please check your connection and try again.</div>' +
          '<button class="btn btn-ghost" onclick="location.reload()">Try again</button>';
      });
  }

  function quoteFailed(res) {
    if (res.slotTaken) {
      state.slot = null; state.slotError = res.error;
      return refreshData().then(function () { goStep('pickup'); });
    }
    app.innerHTML = '<h2>Review &amp; pay</h2><div class="error">' + esc(res.error || 'Something went wrong.') + '</div>' +
      '<button class="btn btn-ghost" id="backMenu">← Back to menu</button>';
    $('#backMenu').onclick = function () { backToShop('order'); };
  }

  function renderPayForm() {
    var t = state.quote.totals;
    var c = state.customer;
    var html = '<h2>Review &amp; pay</h2><div class="panel">' +
      cartLines().map(function (l) {
        return '<div class="summary-line"><div>' + (l.it.picks ? '' : esc(plural(l.c.qty, l.it.unit)) + ' · ') + esc(l.label) +
          (l.picks.length ? '<div class="sub">' + esc(l.picks.join(', ')) + '</div>' : '') + '</div><div>' + money2(l.cents) + '</div></div>';
      }).join('') +
      '<div class="summary-line summary-total" style="font-size:15px;font-weight:600"><div>Subtotal</div><div>' + money2(t.subtotal) + '</div></div>' +
      (t.rush ? '<div class="summary-line"><div>Rush fee (' + data.rules.rushPct + '%)</div><div>' + money2(t.rush) + '</div></div>' : '') +
      (t.delivery ? '<div class="summary-line"><div>Delivery</div><div>' + money2(t.delivery) + '</div></div>' : '') +
      '<div class="summary-line"><div>Tax</div><div>' + money2(t.tax) + '</div></div>' +
      '<div class="summary-line summary-total"><div>Total</div><div>' + money2(t.total) + '</div></div>' +
      '<p class="muted" style="margin:12px 0 0;font-size:14px">' + esc(slotText()) + ' · ' + esc(c.location) +
      (c.address ? ' – ' + esc(c.address) : '') + '<br>' + esc(c.name) + ' · ' + esc(c.email) + ' · ' + esc(c.phone) + '</p></div>' +
      '<div class="notice">🔒 <b>You won\'t be charged yet.</b> We\'ll place a hold of ' + money2(t.total) + '. ' +
      esc(data.business.ownerName) + ' will approve or decline your order within ' + data.rules.reviewHours + ' hours. You\'re only charged if it\'s approved; otherwise the hold is released.</div>' +
      '<div id="payError"></div>' +
      '<div class="panel"><div class="pay-methods" id="payMethods"><p class="muted" style="margin:0">Loading payment options…</p></div></div>';
    app.innerHTML = html;
    setupPayments().catch(function (err) {
      console.error(err);
      showPayError('Payment options failed to load. Please refresh the page and try again.');
    });
  }

  function showPayError(msg) {
    var el = $('#payError');
    if (el) { el.innerHTML = msg ? '<div class="error">' + esc(msg) + '</div>' : ''; if (msg) el.scrollIntoView({ block: 'center' }); }
  }

  function destroyPay() {
    payWidgets.forEach(function (w) { try { w.destroy(); } catch (e) { /* ignore */ } });
    payWidgets = [];
  }

  function loadSquareSdk() {
    if (window.Square) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = CONFIG.SQUARE_ENV === 'production' ? 'https://web.squarecdn.com/v1/square.js' : 'https://sandbox.web.squarecdn.com/v1/square.js';
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Square failed to load')); };
      document.head.appendChild(s);
    });
  }

  function setupPayments() {
    destroyPay();
    var box = $('#payMethods');
    var amount = (state.quote.totals.total / 100).toFixed(2);

    if (!CONFIG.SQUARE_APP_ID) {
      box.innerHTML = '<p class="muted" style="margin:0 0 8px">Test mode: no real payment is taken.</p>' +
        '<button class="btn btn-primary btn-block" id="mockPay">Place test order</button>';
      $('#mockPay').onclick = function () { submitOrder('mock-token', 'Test'); };
      return Promise.resolve();
    }

    return loadSquareSdk().then(function () {
      payments = payments || window.Square.payments(CONFIG.SQUARE_APP_ID, CONFIG.SQUARE_LOCATION_ID);
      box.innerHTML =
        '<div id="apple-pay-wrap" hidden><div class="apple-pay-button" id="apple-pay-button" role="button" aria-label="Pay with Apple Pay"></div></div>' +
        '<div id="google-pay-button" hidden></div>' +
        '<div id="cash-app-pay" hidden></div>' +
        '<div class="pay-divider" id="orCard" hidden>or pay with card</div>' +
        '<div id="card-container"></div>' +
        '<button class="btn btn-primary btn-block" id="cardPay" disabled>Place order · hold ' + money2(state.quote.totals.total) + '</button>';

      var request = function () {
        return payments.paymentRequest({
          countryCode: 'US', currencyCode: 'USD',
          total: { amount: amount, label: data.business.name + ' (hold – charged when approved)' }
        });
      };
      function walletShown() { $('#orCard').hidden = false; }

      var tasks = [];
      tasks.push(payments.card().then(function (card) {
        payWidgets.push(card);
        return card.attach('#card-container').then(function () {
          var btn = $('#cardPay');
          btn.disabled = false;
          btn.onclick = function () {
            if (busy) return;
            var names = state.customer.name.trim().split(/\s+/);
            tokenizeAndSubmit(function () {
              return card.tokenize({
                amount: amount, currencyCode: 'USD', intent: 'CHARGE', customerInitiated: true, sellerKeyedIn: false,
                billingContact: {
                  givenName: names[0], familyName: names.slice(1).join(' ') || undefined,
                  email: state.customer.email.trim(), phone: state.customer.phone
                }
              });
            }, 'Card');
          };
        });
      }));

      tasks.push(payments.applePay(request()).then(function (applePay) {
        $('#apple-pay-wrap').hidden = false; walletShown();
        $('#apple-pay-button').onclick = function () { tokenizeAndSubmit(function () { return applePay.tokenize(); }, 'Apple Pay'); };
      }).catch(function () { /* not available on this device */ }));

      tasks.push(payments.googlePay(request()).then(function (googlePay) {
        payWidgets.push(googlePay);
        return googlePay.attach('#google-pay-button', { buttonSizeMode: 'fill', buttonType: 'long' }).then(function () {
          $('#google-pay-button').hidden = false; walletShown();
          $('#google-pay-button').onclick = function () { tokenizeAndSubmit(function () { return googlePay.tokenize(); }, 'Google Pay'); };
        });
      }).catch(function () { /* not available */ }));

      tasks.push(payments.cashAppPay(request(), { redirectURL: location.href.split('#')[0] + '#/checkout', referenceId: state.draftId }).then(function (cashApp) {
        payWidgets.push(cashApp);
        cashApp.addEventListener('ontokenization', function (event) {
          var d = event.detail || {};
          if (d.error || !d.tokenResult || d.tokenResult.status !== 'OK') {
            showPayError('Cash App Pay didn\'t finish. Please try again or use another payment method.');
            return;
          }
          submitOrder(d.tokenResult.token, 'Cash App Pay');
        });
        return cashApp.attach('#cash-app-pay', { shape: 'semiround', width: 'full' }).then(function () {
          $('#cash-app-pay').hidden = false; walletShown();
        });
      }).catch(function () { /* not available */ }));

      return Promise.all(tasks);
    });
  }

  function tokenizeAndSubmit(tokenize, method) {
    if (busy) return;
    showPayError('');
    tokenize().then(function (result) {
      if (result.status === 'OK') return submitOrder(result.token, method);
      if (result.status === 'Cancel') return;
      var msg = (result.errors && result.errors[0] && result.errors[0].message) || 'Please check your payment details.';
      showPayError(msg);
    }).catch(function (e) {
      console.error(e);
      showPayError('Payment didn\'t go through. Please try again.');
    });
  }

  function submitOrder(token, method) {
    if (busy) return;
    busy = true;
    var btns = app.querySelectorAll('button');
    btns.forEach(function (b) { b.disabled = true; });
    var placing = document.createElement('p');
    placing.className = 'loading';
    placing.textContent = 'Placing your order…';
    $('#payMethods').appendChild(placing);

    apiPost({
      action: 'placeOrder', draftId: state.draftId, cart: apiCart(), slot: state.slot,
      customer: state.customer, notes: state.notes, token: token,
      quotedTotal: state.quote.totals.total, paymentMethod: method
    }).then(function (res) {
      busy = false;
      if (res.ok) {
        var summary = { orderNo: res.orderNo, total: state.quote.totals.total, email: state.customer.email, when: slotText() };
        destroyPay();
        var keep = state.customer;
        state = freshState();
        state.customer.name = keep.name; state.customer.email = keep.email; state.customer.phone = keep.phone; state.customer.contactBy = keep.contactBy;
        state.view = 'checkout';
        state.step = 'done';
        state.done = summary;
        save();
        renderCheckout();
        window.scrollTo(0, 0);
        return;
      }
      placing.remove();
      btns.forEach(function (b) { b.disabled = false; });
      if (res.slotTaken) { state.slot = null; state.slotError = res.error; return refreshData().then(function () { goStep('pickup'); }); }
      if (res.totals) { state.quote = null; save(); showPayError(res.error); return setTimeout(renderPay, 2500); }
      showPayError(res.error || 'Something went wrong. You have not been charged.');
    }).catch(function () {
      busy = false;
      placing.remove();
      btns.forEach(function (b) { b.disabled = false; });
      showPayError('We couldn\'t reach the bakery\'s system. Check your email before trying again – if you got a confirmation, your order went through.');
    });
  }

  // ----- done -----

  function renderDone() {
    setCheckoutBar('');
    var d = state.done || {};
    app.innerHTML = '<div class="done"><img src="images/logo-badge.png" alt=""><h2>Order received!</h2>' +
      '<p>Order <b>' + esc(d.orderNo) + '</b>' + (d.when ? ' for <b>' + esc(d.when) + '</b>' : '') + '.</p>' +
      '<div class="notice" style="text-align:left">You have <b>not</b> been charged yet. ' + esc(data.business.ownerName) +
      ' will review your order within ' + data.rules.reviewHours + ' hours. We\'ll email <b>' + esc(d.email) +
      '</b> when it\'s approved (that\'s when your card is charged ' + money2(d.total || 0) + ') or if we can\'t make it (the hold is released).</div>' +
      '<button class="btn btn-ghost" id="again">Back to the site</button></div>';
    $('#again').onclick = function () { state.step = 'pickup'; state.done = null; save(); backToShop('home'); };
  }

  // ================= boot =================

  function refreshData() {
    return apiGet().then(function (d) {
      if (!d.ok) throw new Error(d.error || 'Failed to load');
      data = d;
      state.cart = state.cart.filter(function (c) { return byId(c.id); });
    });
  }

  function wireChrome() {
    document.getElementById('cartBtn').onclick = openCart;
    var toggle = document.getElementById('menuToggle');
    var nav = document.getElementById('nav');
    toggle.onclick = function () {
      var open = !nav.classList.contains('open');
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open);
    };
    nav.onclick = function (e) {
      if (!e.target.closest('a')) return;
      nav.classList.remove('open');
    };
    ['productOverlay', 'cartOverlay'].forEach(function (id) {
      document.getElementById(id).addEventListener('click', function (e) {
        if (e.target.id !== id) return;
        if (id === 'productOverlay') closeProduct(); else closeCart();
      });
    });
    var lbEl = document.getElementById('lightbox');
    lbEl.onclick = function (e) {
      if (e.target.closest('.lb-prev')) return stepLightbox(-1);
      if (e.target.closest('.lb-next')) return stepLightbox(1);
      if (e.target.closest('.lb-close') || e.target === lbEl) closeLightbox();
    };
    document.addEventListener('keydown', function (e) {
      if (!lbEl.hidden) {
        if (e.key === 'Escape') closeLightbox();
        else if (e.key === 'ArrowLeft') stepLightbox(-1);
        else if (e.key === 'ArrowRight') stepLightbox(1);
        return;
      }
      if (e.key !== 'Escape') return;
      if (!document.getElementById('productOverlay').hidden) closeProduct();
      else if (!document.getElementById('cartOverlay').hidden) closeCart();
    });
  }

  function boot() {
    wireChrome();
    fitViewport();
    window.addEventListener('resize', fitViewport);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', fitViewport);
      window.visualViewport.addEventListener('scroll', fitViewport);
    }
    // Photos don't depend on the menu, so show them right away.
    renderShowcases();
    document.querySelectorAll('.custom-link').forEach(function (a) {
      a.href = CONFIG.CUSTOM_FORM_URL || 'mailto:sugarlaneok@gmail.com?subject=' + encodeURIComponent('Custom order request');
    });
    var cached = CONFIG.API_URL && cachedInit();
    if (cached) {
      // Show the remembered menu now; swap in the fresh one when it arrives (pickup slots must be current before checkout).
      data = cached;
      state.cart = state.cart.filter(function (c) { return byId(c.id); });
      route();
      refreshData().then(route).catch(function () { /* keep cached */ });
      return;
    }
    var ready = CONFIG.API_URL ? Promise.resolve() : loadMock();
    ready.then(refreshData).then(function () {
      if (state.step === 'pay' && !state.quote) state.step = 'details';
      route();
    }).catch(function (err) {
      console.error(err);
      document.getElementById('menuGrid').innerHTML = '<div class="error">The menu couldn\'t load. Please refresh the page, or email sugarlaneok@gmail.com to order.</div>';
      document.getElementById('menuLead').textContent = '';
    });
  }

  function loadMock() {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'dev-mock.js';
      s.onload = function () { window.SLMock.ready.then(resolve, reject); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  boot();
})();
