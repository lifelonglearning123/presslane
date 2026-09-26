/* Presslane site: the demos. Plain JS, no dependencies. */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';
  const isPromo = () => document.documentElement.dataset.audience === 'promo';
  const onAudience = (cb) => document.addEventListener('pl:audience', cb);
  const svgEl = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  /* Play a demo once when it scrolls into view. */
  function onVisible(el, cb, threshold) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { io.disconnect(); cb(); } });
    }, { threshold: threshold || 0.35 });
    io.observe(el);
  }

  /* ---------- Mobile menu ---------- */
  (function menu() {
    const nav = $('.nav'), btn = $('#navToggle'); if (!btn) return;
    const set = (open) => { nav.classList.toggle('open', open); btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close' : 'Menu'; };
    btn.addEventListener('click', () => set(!nav.classList.contains('open')));
    $$('#navLinks a').forEach((a) => a.addEventListener('click', () => set(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { set(false); btn.focus(); } });
  })();

  /* ---------- Barcodes: Code 128-style bars from a string (visual, deterministic) ---------- */
  function drawBars(svg) {
    const code = svg.dataset.code || 'PL04821';
    const vb = svg.getAttribute('viewBox').split(' ').map(Number);
    const W = vb[2], H = vb[3];
    const widths = [];
    // start pattern
    widths.push(2, 1, 1, 2, 3, 2);
    for (let i = 0; i < code.length; i++) {
      let c = code.charCodeAt(i) * (i + 7);
      for (let k = 0; k < 6; k++) { widths.push((c % 3) + 1); c = Math.floor(c / 3) + 5; }
    }
    widths.push(2, 3, 3, 1, 1, 1, 2); // stop
    const units = widths.reduce((a, b) => a + b, 0);
    const quiet = W * 0.04;
    const u = (W - quiet * 2) / units;
    let x = quiet;
    widths.forEach((w, i) => {
      if (i % 2 === 0) svg.appendChild(svgEl('rect', { x: x.toFixed(2), y: 0, width: (w * u).toFixed(2), height: H, fill: '#000' }));
      x += w * u;
    });
  }
  $$('svg.bars').forEach(drawBars);

  /* ---------- Hero: the network. A ring travels bubble to bubble and the caption names each part. ---------- */
  (function hero() {
    const net = $('#net'); if (!net) return;
    const nodes = $$('#netNodes .node'), ring = $('#netRing'), cap = $('#netTip'), video = $('#netVideo');
    let cur = -1, timer = null, held = false, visible = true;
    function show(i) {
      cur = i;
      const n = nodes[i];
      nodes.forEach((el, j) => el.classList.toggle('on', j === i));
      ['--x', '--y', '--r'].forEach((v) => ring.style.setProperty(v, n.style.getPropertyValue(v)));
      ring.classList.add('on');
      cap.classList.add('fade');
      setTimeout(() => {
        cap.innerHTML = '<strong>' + $('button', n).lastChild.textContent + '.</strong> ' + $('.tip', n).textContent;
        cap.classList.remove('fade');
      }, reduce ? 0 : 220);
    }
    function schedule() {
      clearTimeout(timer); timer = null;
      if (reduce || held || !visible || document.hidden) return;
      timer = setTimeout(() => { show((cur + 1) % nodes.length); schedule(); }, 3400);
    }
    nodes.forEach((n, i) => {
      const b = $('button', n);
      b.addEventListener('mouseenter', () => { held = true; show(i); schedule(); });
      b.addEventListener('focus', () => { held = true; show(i); schedule(); });
      b.addEventListener('click', () => { held = true; show(i); schedule(); });
    });
    $('#netNodes').addEventListener('mouseleave', () => { held = false; schedule(); });
    $('#netNodes').addEventListener('focusout', (e) => { if (!net.contains(e.relatedTarget)) { held = false; schedule(); } });
    if (reduce && video) { video.removeAttribute('autoplay'); video.pause(); }
    show(0);
    if ('IntersectionObserver' in window) new IntersectionObserver((en) => {
      visible = en[0].isIntersecting;
      if (video && !reduce) { if (visible) video.play().catch(() => {}); else video.pause(); }
      schedule();
    }, { threshold: 0.15 }).observe(net);
    document.addEventListener('visibilitychange', schedule);
    schedule();
  })();

  /* ---------- Audience: printers or promotional merchandise. Swaps copy marked data-promo. ---------- */
  (function audience() {
    const swaps = $$('[data-promo]');
    const printHTML = new Map(swaps.map((el) => [el, el.innerHTML]));
    const choices = $$('.choose[data-audience]');
    function set(a) {
      document.documentElement.dataset.audience = a;
      swaps.forEach((el) => { el.innerHTML = a === 'promo' ? el.dataset.promo : printHTML.get(el); });
      choices.forEach((c) => c.setAttribute('aria-current', String(c.dataset.audience === a)));
      try { localStorage.setItem('presslane-audience', a); } catch (e) {}
      document.dispatchEvent(new CustomEvent('pl:audience', { detail: a }));
    }
    choices.forEach((c) => c.addEventListener('click', () => set(c.dataset.audience)));
    let start = new URLSearchParams(location.search).get('for');
    if (start !== 'promo' && start !== 'print') { try { start = localStorage.getItem('presslane-audience'); } catch (e) { start = null; } }
    if (start === 'promo' || start === 'print') set(start);
  })();

  /* ---------- Film: poster and a single play control, native controls once playing ---------- */
  (function film() {
    const v = $('#promoVideo'), btn = $('#promoPlay'), fig = $('#promo'); if (!v || !btn) return;
    btn.addEventListener('click', () => { v.controls = true; fig.classList.add('playing'); v.play().catch(() => { fig.classList.remove('playing'); }); });
    v.addEventListener('ended', () => { fig.classList.remove('playing'); v.controls = false; btn.querySelector('span:last-child').textContent = 'Play again'; });
    v.addEventListener('pause', () => { if (!v.ended && v.currentTime > 0) { fig.classList.remove('playing'); btn.querySelector('span:last-child').textContent = 'Resume'; } });
  })();

  /* ---------- The lane: pick a stage, see the customer page and the message ---------- */
  (function lane() {
    const tiles = $$('#laneTiles .tile'); if (!tiles.length) return;
    const imgs = $$('.tracker .shot img');
    const msgs = {
      1: { k: 'Status · Fri 15 Aug, 10:42', h: 'Thanks, we have your order.', b: 'Proof coming today. We’ll message you when it’s ready to approve.', f: '<strong>Sent by</strong> the order confirmation. Nobody typed it.' },
      2: { k: 'Status · Fri 15 Aug, 15:30', h: 'Your proof is ready.', b: 'Approve it and we start printing: shop.link/PSE-0211703', f: '<strong>Sent when</strong> the artwork bench scanned the runsheet. One ask, one button.' },
      3: { k: 'Status · Sat 16 Aug, 10:42', h: 'Proof approved.', b: 'Your 400 bucket hats are booked on the machines for Monday. We’ll message when they start.', f: '<strong>Triggered by</strong> the customer’s click. Runsheet printed at the bench.' },
      4: { k: 'Status · Mon 18 Aug, 14:32', h: 'Your bucket hats are being printed.', b: 'We’ll message when they’re packed, and again with the tracking number.', f: '<strong>Sent when</strong> the press scanned the sheet. The floor updated the system.' },
      5: { k: 'Status · Thu 21 Aug, 16:05', h: 'On its way.', b: 'Track it: JD0002234567GB. Expected Friday.', f: '<strong>Tracking number</strong> came from the courier label. No copy and paste.' },
      6: { k: 'Status · Fri 22 Aug, 11:20', h: 'Delivered.', b: 'Same again next time is one click: shop.link/PSE-0211703', f: '<strong>Reorder link</strong> carries the approved artwork, so the next job skips the proof round.' }
    };
    const promoMsgs = {
      1: msgs[1],
      2: { k: 'Status · Fri 15 Aug, 15:30', h: 'Your artwork proof is ready.', b: 'Approve it and we’ll book it into production: shop.link/PSE-0211703', f: '<strong>Sent when</strong> the visual was attached to the order. One ask, one button.' },
      3: { k: 'Status · Sat 16 Aug, 10:42', h: 'Artwork approved.', b: 'Your 400 bucket hats are booked into production. We’ll message when they start.', f: '<strong>Triggered by</strong> the client’s click. The order goes to production, in-house or at your supplier.' },
      4: { k: 'Status · Mon 18 Aug, 14:32', h: 'Your bucket hats are in production.', b: 'We’ll message again with the tracking number when they ship.', f: '<strong>Sent when</strong> production was marked as started, by your team or the supplier.' },
      5: { k: 'Status · Thu 21 Aug, 16:05', h: 'On its way.', b: 'Track it: JD0002234567GB. Expected Friday.', f: '<strong>Tracking number</strong> from the supplier, passed straight to the client.' },
      6: msgs[6]
    };
    const k = $('#laneMsgKicker'), h = $('#laneMsgHead'), b = $('#laneMsgBody'), f = $('#laneMsgFoot');
    const playBtn = $('#lanePlay');
    let cur = 1, timer = null, playing = true, started = false;
    function show(n) {
      cur = n;
      tiles.forEach((t) => t.setAttribute('aria-pressed', String(Number(t.dataset.stage) === n)));
      imgs.forEach((im) => { im.hidden = Number(im.dataset.stage) !== n; });
      const m = (isPromo() ? promoMsgs : msgs)[n]; k.textContent = m.k; h.textContent = m.h; b.textContent = m.b; f.innerHTML = m.f;
    }
    let hover = false, loops = 0;
    function stop() { playing = false; playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = 'Play'; clearTimeout(timer); }
    function schedule() {
      clearTimeout(timer); if (!playing || reduce) return;
      timer = setTimeout(() => {
        if (hover) { schedule(); return; }
        if (cur >= 6) { loops++; if (loops >= 1) { stop(); return; } }
        show(cur >= 6 ? 1 : cur + 1); schedule();
      }, 3800);
    }
    const area = $('#lane');
    area.addEventListener('mouseenter', () => { hover = true; }); area.addEventListener('mouseleave', () => { hover = false; });
    area.addEventListener('focusin', () => { hover = true; }); area.addEventListener('focusout', () => { hover = false; });
    tiles.forEach((t) => t.addEventListener('click', () => { show(Number(t.dataset.stage)); stop(); }));
    playBtn.addEventListener('click', () => { playing = !playing; loops = 0; playBtn.setAttribute('aria-pressed', String(playing)); playBtn.textContent = playing ? 'Pause' : 'Play'; if (playing) { hover = false; show(cur >= 6 ? 1 : cur + 1); schedule(); } else clearTimeout(timer); });
    show(1);
    onAudience(() => show(cur));
    if (reduce) { playing = false; playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = 'Play'; }
    onVisible($('#lane'), () => { if (!started) { started = true; schedule(); } }, 0.3);
  })();

  /* ---------- Mock-up: logo on the product ---------- */
  const mock = (function mockup() {
    const svg = $('#mockupSvg'); if (!svg) return null; svg.setAttribute('viewBox', '0 0 800 620');
    const canvas = $('#mockupCanvas');
    // Positions: centre (cx, cy), base logo width in viewBox units, base width in mm, drag bounds.
    // Photos sit at x 140, y 10, 519 × 600 in the 800 × 620 canvas (585 × 676 source, scale 0.8876).
    const PH = { x: 157.5, y: 30, w: 485, h: 560 };
    const products = {
      hoodie: {
        label: 'Hoodie', sku: 'AWDis JH001 hoodie', method: 'Embroidery',
        photo: { src: 'assets/hoodie.webp', grey: 'assets/hoodie-grey.webp' }, natural: { hex: '#4F5D73', name: 'Airforce blue' },
        positions: {
          'Left chest': { cx: 460, cy: 279, w: 80, mm: 90, bounds: [417, 237, 534, 334] },
          'Centre': { cx: 399, cy: 331, w: 177, mm: 240, bounds: [290, 255, 509, 390] },
          'Sleeve': { cx: 576, cy: 265, w: 50, mm: 70, bounds: [542, 228, 611, 328] }
        }
      },
      polo: {
        label: 'Polo', sku: 'Kustom Kit KK403 polo', method: 'Embroidery',
        photo: { src: 'assets/polo.webp', grey: 'assets/polo-grey.webp' }, natural: { hex: '#A8C3E4', name: 'Sky blue' },
        positions: {
          'Left chest': { cx: 464, cy: 241, w: 77, mm: 90, bounds: [423, 204, 533, 303] },
          'Centre': { cx: 399, cy: 338, w: 164, mm: 220, bounds: [297, 265, 501, 443] },
          'Sleeve': { cx: 572, cy: 207, w: 47, mm: 60, bounds: [536, 181, 607, 254] }
        }
      },
      cap: {
        label: 'Cap', sku: 'Beechfield B653 cap', method: 'Embroidery',
        photo: { src: 'assets/cap.webp', grey: 'assets/cap-grey.webp' }, natural: { hex: '#E9E1CC', name: 'Stone' },
        positions: {
          'Front': { cx: 431, cy: 279, w: 118, mm: 110, bounds: [336, 228, 521, 328] },
          'Side': { cx: 283, cy: 304, w: 62, mm: 55, bounds: [244, 265, 335, 347] }
        }
      },
      card: {
        label: 'Business card', sku: '85 × 55 mm, 400gsm silk', method: 'Print', natural: { hex: '#F4F2EC', name: 'White' },
        positions: {
          'Top left': { cx: 300, cy: 255, w: 130, mm: 28, bounds: [220, 200, 420, 320] },
          'Centre': { cx: 400, cy: 300, w: 170, mm: 36, bounds: [240, 210, 560, 400] }
        }
      },
      // Promotional merchandise: studio shots cut out on the same 585 × 676 canvas as the garments.
      tote: {
        label: 'Tote bag', sku: 'Natural 5oz cotton tote', method: 'Screen print',
        photo: { src: 'assets/tote.webp', grey: 'assets/tote-grey.webp' }, natural: { hex: '#E7DCC6', name: 'Natural' },
        positions: { 'Front': { cx: 400, cy: 425, w: 150, mm: 230, bounds: [292, 300, 508, 540] } }
      },
      mug: {
        label: 'Travel mug', sku: 'Stainless steel travel mug', method: 'Print',
        photo: { src: 'assets/mug.webp', grey: 'assets/mug-grey.webp' }, natural: { hex: '#F4F4F2', name: 'White' },
        positions: { 'Front': { cx: 384, cy: 330, w: 100, mm: 50, bounds: [305, 126, 462, 539] } }
      },
      pen: {
        label: 'Pen', sku: 'Push-button ballpen', method: 'Pad print',
        photo: { src: 'assets/pen.webp', grey: 'assets/pen-grey.webp' }, natural: { hex: '#F5F5F5', name: 'White' },
        positions: { 'Barrel': { cx: 352, cy: 311, w: 62, mm: 40, bounds: [272, 298, 434, 326] } }
      },
      bottle: {
        label: 'Bottle', sku: 'Aluminium sports bottle', method: 'Print',
        photo: { src: 'assets/bottle.webp', grey: 'assets/bottle-grey.webp' }, natural: { hex: '#F2F2F2', name: 'White' },
        positions: { 'Front': { cx: 400, cy: 380, w: 95, mm: 50, bounds: [325, 200, 475, 540] } }
      }
    };
    const PROMO = ['tote', 'mug', 'pen', 'bottle'];
    const state = { product: 'hoodie', position: 'Left chest', colour: '#4F5D73', colourName: 'Airforce blue', logo: { type: 'symbol', id: 'logo-okafor', aspect: 2.2 }, size: 100, dx: 0, dy: 0 };

    const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
    const seam = 'rgba(32,30,29,0.28)';
    const setHref = (el, v) => { el.setAttribute('href', v); el.setAttributeNS(XLINK, 'xlink:href', v); };

    function garment(g) {
      const c = state.colour, p = state.product, P = products[p];
      const add = (tag, attrs) => g.appendChild(svgEl(tag, attrs));
      if (P.photo) {
        const asShot = c === P.natural.hex;
        const im = svgEl('image', { x: PH.x, y: PH.y, width: PH.w, height: PH.h, preserveAspectRatio: 'xMidYMid meet' });
        setHref(im, asShot ? P.photo.src : P.photo.grey); g.appendChild(im);
        if (!asShot) {
          // Tint: flood the chosen colour, clip it to the garment's own alpha, multiply over the light greyscale photo.
          const defs = svgEl('defs', {});
          const f = svgEl('filter', { id: 'garmentTint', x: '0', y: '0', width: '1', height: '1', 'color-interpolation-filters': 'sRGB' });
          f.appendChild(svgEl('feFlood', { 'flood-color': c, result: 'col' }));
          f.appendChild(svgEl('feComposite', { in: 'col', in2: 'SourceGraphic', operator: 'in', result: 'colClipped' }));
          f.appendChild(svgEl('feBlend', { in: 'colClipped', in2: 'SourceGraphic', mode: 'multiply' }));
          defs.appendChild(f); g.insertBefore(defs, im);
          im.setAttribute('filter', 'url(#garmentTint)');
        }
        return;
      }
      // Business card: drawn, the paper takes the colour.
      add('rect', { x: 100, y: 120, width: 600, height: 400, fill: 'rgba(32,30,29,0.06)' });
      add('rect', { x: 200, y: 172, width: 400, height: 259, fill: c, stroke: seam, 'stroke-width': 1 });
      const ink = lum(c) > 0.5 ? '#201E1D' : '#F3F2F2';
      const t = (x, y, s, w, txt) => { const e = svgEl('text', { x, y, 'font-family': 'Archivo, sans-serif', 'font-size': s, 'font-weight': w, fill: ink }); e.textContent = txt; g.appendChild(e); };
      t(232, 372, 14, 800, 'Sam Okafor');
      t(232, 392, 11, 400, 'Director');
      const m = svgEl('text', { x: 568, y: 392, 'font-family': 'IBM Plex Mono, monospace', 'font-size': 10, fill: ink, 'text-anchor': 'end' }); m.textContent = '07700 900123'; g.appendChild(m);
    }

    function logoNode(w, forColour) {
      const h = w / state.logo.aspect;
      const col = lum(forColour) > 0.5 ? '#201E1D' : '#F3F2F2';
      if (state.logo.type === 'symbol') {
        const u = svgEl('use', { x: -w / 2, y: -h / 2, width: w, height: h });
        u.setAttribute('href', '#' + state.logo.id); u.setAttributeNS(XLINK, 'xlink:href', '#' + state.logo.id);
        u.setAttribute('color', col); u.setAttribute('fill', col);
        return u;
      }
      const im = svgEl('image', { x: -w / 2, y: -h / 2, width: w, height: h, preserveAspectRatio: 'xMidYMid meet' });
      im.setAttribute('href', state.logo.src); im.setAttributeNS(XLINK, 'xlink:href', state.logo.src);
      return im;
    }

    function pos() { return products[state.product].positions[state.position]; }
    function logoWidth() { return pos().w * state.size / 100; }
    function mm() { const w = pos().mm * state.size / 100; return `${Math.round(w)} × ${Math.round(w / state.logo.aspect)} mm`; }

    let hadFocus = false;
    function render() {
      hadFocus = document.activeElement && document.activeElement.id === 'logoG';
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const g = svgEl('g', {}); garment(g); svg.appendChild(g);
      const P = pos(); const w = logoWidth();
      const logoName = state.logo.type === 'symbol' ? { 'logo-okafor': 'Okafor Roofing', 'logo-hartley': 'Hartley Plumbing', 'logo-willink': 'school crest' }[state.logo.id] : 'uploaded';
      const desc = `${logoName} logo, ${state.colourName.toLowerCase()} ${products[state.product].label.toLowerCase()}, ${state.position.toLowerCase()}, ${mm()}`;
      const lg = svgEl('g', { transform: `translate(${P.cx + state.dx} ${P.cy + state.dy})`, id: 'logoG', style: 'cursor:grab', tabindex: '0', role: 'img', 'aria-label': desc + '. Use the arrow keys to move it.' });
      const hh = w / state.logo.aspect;
      lg.appendChild(svgEl('rect', { class: 'logo-focus', x: -w / 2 - 6, y: -hh / 2 - 6, width: w + 12, height: hh + 12, fill: 'none', stroke: 'none', 'stroke-width': 2 }));
      lg.appendChild(logoNode(w, state.colour));
      svg.appendChild(lg);
      if (hadFocus) lg.focus({ preventScroll: true });
      svg.setAttribute('aria-label', desc);
      const st = $('#mockStatus'); if (st) st.textContent = desc;
      const rng = $('#logoSize'); if (rng) rng.setAttribute('aria-valuetext', mm());
      // proof line + readouts
      $('#sizeReadout').textContent = mm();
      $('#colourName').textContent = state.colourName;
      const price = { hoodie: '£1,142.40', polo: '£684.00', cap: '£486.00', card: '£58.80', tote: '£774.00', mug: '£1,038.00', pen: '£390.00', bottle: '£894.00' }[state.product];
      const qty = ({ card: 500, tote: 250, pen: 500, mug: 100, bottle: 100 }[state.product] || 48) + ' pcs';
      $('#proofText').textContent = `${isPromo() ? 'Visual' : 'Proof'} · PL-04821 · ${products[state.product].label}, ${state.colourName} · ${state.position} · ${mm()} · ${qty} · ${price} inc. VAT`;
      // runsheet mirrors the proof
      const rsJob = $('#rsJobLine'), rsDeco = $('#rsDecoLine'), rsSize = $('#rsSize');
      if (rsJob) {
        rsJob.textContent = `${qty.replace(' pcs', '')} × ${products[state.product].sku}, ${state.colourName}`;
        rsDeco.textContent = `${products[state.product].method}, ${state.position.toLowerCase()}, 1 colour`;
        rsSize.textContent = mm(); const st = rsSize.previousSibling; if (st && st.nodeType === 3) st.textContent = products[state.product].method === 'Embroidery' ? '8,000 st · ' : '1 colour · ';
        const place = $('#rsPlacement'); place.textContent = '';
        const clone = svg.cloneNode(true); clone.removeAttribute('id'); clone.setAttribute('aria-hidden', 'true'); place.appendChild(clone);
        const lp = $('#rsLogo'); lp.textContent = '';
        const ls = svgEl('svg', { viewBox: '-70 -40 140 80', 'aria-hidden': 'true' }); ls.appendChild(logoNode(124, '#FFFFFF')); lp.appendChild(ls);
      }
    }

    function buildPositions() {
      const wrap = $('#positionChips'); wrap.textContent = '';
      Object.keys(products[state.product].positions).forEach((name) => {
        const b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.textContent = name; b.dataset.position = name;
        b.setAttribute('aria-pressed', String(name === state.position));
        b.addEventListener('click', () => { state.position = name; state.dx = 0; state.dy = 0; $$('#positionChips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b))); render(); });
        wrap.appendChild(b);
      });
    }

    const asShotBtn = $('#asShot');
    function pickNatural() {
      const P = products[state.product];
      state.colour = P.natural.hex; state.colourName = P.natural.name;
      $$('#swatches .swatch').forEach((c) => c.setAttribute('aria-pressed', 'false'));
      asShotBtn.setAttribute('aria-pressed', 'true');
    }
    $$('#productChips .chip').forEach((b) => b.addEventListener('click', () => {
      state.product = b.dataset.product; state.position = Object.keys(products[state.product].positions)[0]; state.dx = 0; state.dy = 0;
      $$('#productChips .chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      asShotBtn.hidden = !products[state.product].photo;
      pickNatural(); buildPositions(); render();
    }));
    asShotBtn.addEventListener('click', () => { pickNatural(); render(); });
    $$('#swatches .swatch').forEach((b) => b.addEventListener('click', () => {
      state.colour = b.dataset.colour; state.colourName = b.dataset.name;
      $$('#swatches .swatch').forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      asShotBtn.setAttribute('aria-pressed', 'false'); render();
    }));
    $$('#logoPicks .logo-pick').forEach((b) => b.addEventListener('click', () => {
      state.logo = { type: 'symbol', id: b.dataset.logo, aspect: 2.2 };
      $$('#logoPicks .logo-pick').forEach((c) => c.setAttribute('aria-pressed', String(c === b))); render();
    }));
    $('#logoUpload').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      const status = $('#uploadStatus');
      if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) { status.textContent = `${file.name} is not a PNG, JPG, SVG or WebP. Choose an image file.`; return; }
      if (file.size > 8 * 1024 * 1024) { status.textContent = `${file.name} is over 8 MB. Choose a smaller file.`; return; }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => { state.logo = { type: 'image', src: reader.result, aspect: img.naturalWidth / img.naturalHeight || 1 }; $$('#logoPicks .logo-pick').forEach((c) => c.setAttribute('aria-pressed', 'false')); status.textContent = `${file.name} is on the product. It stays in your browser and is not uploaded anywhere.`; render(); };
        img.onerror = () => { status.textContent = `${file.name} could not be read. Try another image.`; };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    $('#logoSize').addEventListener('input', (e) => { state.size = Number(e.target.value); render(); });

    // Drag the logo inside the print area.
    let drag = null;
    const toVB = (ev) => { const r = svg.getBoundingClientRect(); return { x: (ev.clientX - r.left) * 800 / r.width, y: (ev.clientY - r.top) * 620 / r.height }; };
    canvas.addEventListener('pointerdown', (ev) => {
      const t = ev.target.closest && ev.target.closest('#logoG'); if (!t) return;
      const p = toVB(ev); drag = { x: p.x - state.dx, y: p.y - state.dy }; canvas.setPointerCapture(ev.pointerId); ev.preventDefault();
    });
    canvas.addEventListener('pointermove', (ev) => {
      if (!drag) return; const p = toVB(ev); const P = pos(); const w = logoWidth(), h = w / state.logo.aspect;
      let dx = p.x - drag.x, dy = p.y - drag.y;
      const [x0, y0, x1, y1] = P.bounds;
      dx = Math.max(x0 + w / 2 - P.cx, Math.min(x1 - w / 2 - P.cx, dx));
      dy = Math.max(y0 + h / 2 - P.cy, Math.min(y1 - h / 2 - P.cy, dy));
      state.dx = dx; state.dy = dy; render();
    });
    const end = () => { drag = null; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    // Keyboard: arrow keys nudge the logo inside the print area (Shift for bigger steps).
    canvas.addEventListener('keydown', (ev) => {
      if (!ev.target.closest || !ev.target.closest('#logoG')) return;
      const stepPx = ev.shiftKey ? 20 : 4; let dx = state.dx, dy = state.dy;
      if (ev.key === 'ArrowLeft') dx -= stepPx; else if (ev.key === 'ArrowRight') dx += stepPx; else if (ev.key === 'ArrowUp') dy -= stepPx; else if (ev.key === 'ArrowDown') dy += stepPx; else return;
      ev.preventDefault();
      const P = pos(); const w = logoWidth(), h = w / state.logo.aspect; const [x0, y0, x1, y1] = P.bounds;
      state.dx = Math.max(x0 + w / 2 - P.cx, Math.min(x1 - w / 2 - P.cx, dx));
      state.dy = Math.max(y0 + h / 2 - P.cy, Math.min(y1 - h / 2 - P.cy, dy));
      render();
    });

    const proofLine = $('#proofLine');
    $('#approveBtn').addEventListener('click', () => { proofLine.classList.add('done'); });
    ['#productChips', '#swatches', '#logoPicks', '#positionChips', '#logoSize'].forEach((s) => { const el = $(s); if (el) el.addEventListener('click', () => proofLine.classList.remove('done')); });
    $('#logoSize').addEventListener('input', () => proofLine.classList.remove('done'));

    // Printers see garments; distributors see promo products. Switch when the audience changes.
    function syncAudience() {
      if (isPromo() === PROMO.includes(state.product)) { render(); return; }
      const b = $(`#productChips [data-product="${isPromo() ? 'tote' : 'hoodie'}"]`); if (b) b.click();
    }
    onAudience(syncAudience);
    buildPositions(); render(); syncAudience();
    return { render };
  })();

  /* ---------- Quote chase: messages go out until the customer says yes or no ---------- */
  (function chase() {
    const box = $('#chase'); if (!box) return;
    const rows = $$('.chase-row', box);
    const accept = $('#quoteAccept');
    const rTime = $('#chaseResultTime'), rHead = $('#chaseResultHead'), rBody = $('#chaseResultBody');
    let timers = [], done = false;
    function reset() {
      timers.forEach(clearTimeout); timers = []; done = false;
      rows.forEach((r) => r.classList.remove('in'));
      accept.disabled = false; accept.textContent = 'Accept quote';
    }
    function finish(step, viaClick) {
      done = true; timers.forEach(clearTimeout);
      rows.forEach((r) => { if (Number(r.dataset.step) > step && !r.classList.contains('result')) r.classList.remove('in'); });
      if (viaClick) { rTime.textContent = 'now'; rHead.textContent = isPromo() ? 'Accepted. Chasing stopped.' : 'Quote accepted. Chasing stopped.'; rBody.textContent = step ? `Sam accepted from the quote link after ${step} follow-up${step > 1 ? 's' : ''}. The remaining messages were never sent.` : 'Sam accepted from the quote link before any follow-up was needed.'; }
      else { rTime.textContent = isPromo() ? '+4 d' : '+3 d'; rHead.textContent = isPromo() ? 'Accepted after the 2nd follow-up.' : 'Quote accepted after the 2nd follow-up.'; rBody.textContent = isPromo() ? 'Sam replied yes on WhatsApp. Chasing stopped. Messages 3 and 4 were never sent. Order confirmed the same afternoon.' : 'Sam replied yes on WhatsApp. Chasing stopped. Messages 3 and 4 were never sent. Artwork proof went out the same afternoon.'; }
      rows[rows.length - 1].classList.add('in');
      accept.disabled = true; accept.textContent = 'Accepted';
    }
    function play() {
      reset();
      const gap = reduce ? 0 : 1500;
      rows.slice(0, 2).forEach((r, i) => timers.push(setTimeout(() => r.classList.add('in'), 400 + i * gap)));
      timers.push(setTimeout(() => { if (!done) finish(2, false); }, 400 + 2 * gap + 300));
    }
    accept.addEventListener('click', () => { const sent = rows.filter((r) => r.classList.contains('in') && !r.classList.contains('result')).length; finish(sent, true); });
    $('#chaseReplay').addEventListener('click', play);
    onVisible(box, play, 0.3);
  })();

  /* ---------- CRM: the pipeline board; pick a card to open that client's record ---------- */
  (function crm() {
    const cols = $('#crmCols'), rec = $('#crmRecord'), total = $('#crmTotal'); if (!cols) return;
    const DATA = {
      print: {
        stages: ['Enquiry', 'Quote sent', 'Proof sent', 'Won'],
        cards: [
          { stage: 0, client: 'harbour', job: 'Staff polos, embroidered', value: 920 },
          { stage: 0, client: 'leeds', job: 'Training tops, 60 players', value: 1640 },
          { stage: 1, client: 'okafor', job: 'Bottle green hoodies', value: 1142 },
          { stage: 2, client: 'hartley', job: 'Van door signs, pair', value: 860 },
          { stage: 3, client: 'okafor', job: 'Navy hoodies, 48', value: 1142 }
        ],
        clients: {
          okafor: { name: 'Okafor Roofing Ltd', who: 'Sam Okafor · Director', owner: 'Dan', since: 'Customer since 2023', stats: ['£4,380 lifetime', '5 orders', 'Last order 18 Sep'],
            remind: { when: '6 Jan', text: 'Okafor reordered workwear in the second week of January the last two years. Dan to get in touch.' },
            timeline: [
              ['22 Sep', 'Call', 'Asked for the same hoodies in bottle green. Quote sent, chasing started.'],
              ['18 Sep', 'Order', 'PL-04821 · 48 navy hoodies · Dispatched, tracking sent.'],
              ['04 Sep', 'Quote', 'Accepted on WhatsApp after the 2nd follow-up.'],
              ['12 Jan', 'Order', '30 hi-vis vests, left chest print.']
            ] },
          harbour: { name: 'Harbour Dental Group', who: 'Priya Shah · Practice manager', owner: 'Dan', since: 'New enquiry', stats: ['£0 lifetime', '0 orders', 'Enquired 24 Sep'],
            remind: { when: '27 Sep', text: 'No reply to the first follow-up yet. The WhatsApp nudge goes out on Friday.' },
            timeline: [
              ['25 Sep', 'Email', 'Follow-up 1 sent: price breaks at 25 and 50.'],
              ['24 Sep', 'Enquiry', 'Staff polos with the practice logo, 3 sites. Mock-up sent.']
            ] },
          leeds: { name: 'Leeds Rugby Club', who: 'Tom Brennan · Kit secretary', owner: 'Mia', since: 'Customer since 2021', stats: ['£7,960 lifetime', '9 orders', 'Last order 2 Aug'],
            remind: { when: '1 Jul', text: 'New season kit is ordered every July. Reminder already set for next year.' },
            timeline: [
              ['23 Sep', 'Enquiry', 'Training tops for the new juniors. Mock-up sent the same day.'],
              ['02 Aug', 'Order', '120 match shirts, numbers and sponsor.'],
              ['14 Jul', 'Call', 'Confirmed sponsor artwork for the season.']
            ] },
          hartley: { name: 'Hartley Plumbing', who: 'Jo Hartley · Owner', owner: 'Dan', since: 'Customer since 2024', stats: ['£1,210 lifetime', '2 orders', 'Last order 3 Mar'],
            remind: { when: '3 Mar', text: 'Business cards run out about once a year. Reorder nudge set.' },
            timeline: [
              ['20 Sep', 'Proof', 'Van door signs sent for approval.'],
              ['19 Sep', 'Enquiry', 'Signs for the new van.'],
              ['03 Mar', 'Order', '500 business cards.']
            ] }
        }
      },
      promo: {
        stages: ['Enquiry', 'Visuals sent', 'Quote sent', 'Won'],
        cards: [
          { stage: 0, client: 'harbour', job: 'Branded water bottles', value: 1200 },
          { stage: 0, client: 'techweek', job: 'Lanyards and badges, 800', value: 640 },
          { stage: 1, client: 'okafor', job: 'Travel mugs to match', value: 1038 },
          { stage: 2, client: 'kirk', job: 'Christmas gift sets, 120', value: 3450 },
          { stage: 3, client: 'okafor', job: 'Tote bags, 250', value: 774 }
        ],
        clients: {
          okafor: { name: 'Okafor Roofing Ltd', who: 'Sam Okafor · Director', owner: 'Dan', since: 'Client since 2023', stats: ['£6,420 lifetime', '7 orders', 'Last order 18 Sep'],
            remind: { when: '21 Oct', text: 'Okafor ordered Christmas gifts on 18 Nov last year. Dan to send ideas before they start looking.' },
            timeline: [
              ['22 Sep', 'Call', 'Asked for travel mugs to match. New enquiry logged, chasing started.'],
              ['18 Sep', 'Order', 'PL-04821 · 250 tote bags · Dispatched, supplier tracking sent.'],
              ['04 Sep', 'Quote', 'Accepted on WhatsApp after the 2nd follow-up.'],
              ['03 Sep', 'Enquiry', 'Tote bags for the Leeds trade show. Visuals sent in 1 hour.']
            ] },
          harbour: { name: 'Harbour Dental Group', who: 'Priya Shah · Practice manager', owner: 'Dan', since: 'New enquiry', stats: ['£0 lifetime', '0 orders', 'Enquired 24 Sep'],
            remind: { when: '27 Sep', text: 'No reply to the first follow-up yet. The WhatsApp nudge goes out on Friday.' },
            timeline: [
              ['25 Sep', 'Email', 'Follow-up 1 sent: bottles priced at 100 and 250.'],
              ['24 Sep', 'Enquiry', 'Water bottles for a patient campaign, 3 sites. Visuals sent the same morning.']
            ] },
          techweek: { name: 'Leeds Tech Week', who: 'Amir Khan · Events lead', owner: 'Mia', since: 'Client since 2022', stats: ['£5,180 lifetime', '4 orders', 'Last order 12 Oct 2025'],
            remind: { when: '1 Aug', text: 'The event runs every October. Ideas go out in August, before the budget is spent.' },
            timeline: [
              ['23 Sep', 'Enquiry', 'Lanyards and name badges for 800 delegates.'],
              ['12 Oct 2025', 'Order', '800 lanyards, 600 tote bags, speaker gifts.'],
              ['04 Aug 2025', 'Email', 'Reminder: event ideas sent. Enquiry came back in 2 days.']
            ] },
          kirk: { name: 'Kirk & Rowe Solicitors', who: 'Helen Rowe · Partner', owner: 'Dan', since: 'Client since 2024', stats: ['£3,990 lifetime', '3 orders', 'Last order 20 Nov 2025'],
            remind: { when: '10 Oct', text: 'Quote expires in 14 days. Christmas gifts need confirming by mid-October to arrive in time.' },
            timeline: [
              ['26 Sep', 'Quote', 'Gift sets for 120 clients, 3 options at £22, £29 and £36 a head.'],
              ['24 Sep', 'Visuals', 'Notebook, pen and bottle set, logo on all three.'],
              ['20 Nov 2025', 'Order', '100 Christmas gift sets.']
            ] }
        }
      }
    };
    const money = (n) => '£' + n.toLocaleString('en-GB');
    let current = null;
    function data() { return DATA[isPromo() ? 'promo' : 'print']; }
    function openClient(id, btn) {
      const D = data(), c = D.clients[id]; current = id;
      $$('.crm-card', cols).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.client === id && (!btn || b === btn))));
      rec.innerHTML = '';
      const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
      const head = el('div', 'crm-rec-head');
      head.appendChild(el('p', 'kicker', c.since + ' · Account: ' + c.owner));
      head.appendChild(el('h3', 'h3', c.name));
      head.appendChild(el('p', 'small muted', c.who));
      rec.appendChild(head);
      const stats = el('div', 'crm-stats'); c.stats.forEach((s) => stats.appendChild(el('span', 'mono', s))); rec.appendChild(stats);
      const rm = el('div', 'crm-remind');
      rm.appendChild(el('span', 'mono', 'Reminder · ' + c.remind.when)); rm.appendChild(el('p', null, c.remind.text));
      rec.appendChild(rm);
      const tl = el('ol', 'crm-timeline');
      c.timeline.forEach(([d, kind, txt]) => { const li = el('li'); li.appendChild(el('span', 'mono d', d)); li.appendChild(el('span', 'k', kind)); li.appendChild(el('p', null, txt)); tl.appendChild(li); });
      rec.appendChild(tl);
    }
    function draw() {
      const D = data(); cols.innerHTML = '';
      let sum = 0;
      D.stages.forEach((st, i) => {
        const cards = D.cards.filter((c) => c.stage === i);
        const col = document.createElement('div'); col.className = 'crm-col';
        const h = document.createElement('p'); h.className = 'crm-col-h';
        const v = cards.reduce((a, c) => a + c.value, 0); if (i < 3) sum += v;
        h.innerHTML = '<span>' + st + '</span><span class="mono">' + money(v) + '</span>';
        col.appendChild(h);
        cards.forEach((c) => {
          const b = document.createElement('button'); b.type = 'button'; b.className = 'crm-card'; b.dataset.client = c.client;
          b.setAttribute('aria-pressed', 'false');
          b.innerHTML = '<strong></strong><span class="j"></span><span class="mono v"></span>';
          b.querySelector('strong').textContent = D.clients[c.client].name;
          b.querySelector('.j').textContent = c.job; b.querySelector('.v').textContent = money(c.value);
          b.addEventListener('click', () => openClient(c.client, b));
          col.appendChild(b);
        });
        cols.appendChild(col);
      });
      total.textContent = 'Open ' + money(sum);
      const first = $$('.crm-card', cols).find((b) => b.dataset.client === 'okafor');
      openClient('okafor', first);
    }
    onAudience(draw);
    draw();
  })();

  /* ---------- Phone: transcript types itself out ---------- */
  (function phone() {
    const box = $('#call'); if (!box) return;
    const lines = $('#callLines'), timer = $('#callTimer'), foot = $('#callFoot');
    const promoScript = [
      { who: 'Shop', text: 'Northside Promotions. I can check an order or find a product for you. What’s your order number, or what are you looking for?' },
      { who: 'Caller', text: 'Hi, it’s Sam Okafor. Ringing about our tote bags for the trade show, I don’t have the order number.' },
      { who: 'Shop', text: 'Found it. PL-0-4-8-2-1, 250 natural tote bags, one colour print. They’re in production with the supplier and due to ship on Thursday. Want me to text you the tracking number when it comes through?' },
      { who: 'Caller', text: 'Yes please. Could we get some travel mugs to match?' },
      { who: 'Shop', text: 'I’ll log that as a new enquiry, and Dan will send visuals and prices for travel mugs today. Anything else?' },
      { who: 'Caller', text: 'No, that’s everything. Thanks.' }
    ];
    const script = [
      { who: 'Shop', text: 'Northside Print. I can check an order or stock for you. What’s your order number, or what are you looking for?' },
      { who: 'Caller', text: 'Hi, it’s Sam Okafor. Ringing about my hoodies, I don’t have the number on me.' },
      { who: 'Shop', text: 'Found it. PL-0-4-8-2-1, 48 navy hoodies, left chest. They’re being embroidered now and should be packed tomorrow. Want me to text you when they ship?' },
      { who: 'Caller', text: 'Yes please. Could I get the same again in bottle green?' },
      { who: 'Shop', text: 'Bottle green JH001 is in stock in all your sizes. I’ll note it on your order and Dan will send a quote today. Anything else?' },
      { who: 'Caller', text: 'No, that’s everything. Thanks.' }
    ];
    let running = 0, tick = null;
    function fmt(s) { return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
    function play() {
      const id = ++running; clearInterval(tick);
      lines.textContent = ''; foot.textContent = 'Answered on the first ring'; box.classList.remove('speaking');
      let secs = 0; timer.textContent = fmt(0);
      if (!reduce) tick = setInterval(() => { secs++; timer.textContent = fmt(secs); }, 1000);
      const lines_ = isPromo() ? promoScript : script;
      const els = lines_.map((l) => {
        const row = document.createElement('div'); row.className = 'line' + (l.who === 'Shop' ? ' shop' : '');
        const who = document.createElement('span'); who.className = 'who'; who.textContent = l.who === 'Shop' ? 'Northside' : 'Sam';
        const p = document.createElement('p'); row.appendChild(who); row.appendChild(p); lines.appendChild(row); return { row, p, l };
      });
      let i = 0;
      function next() {
        if (id !== running) return;
        if (i >= els.length) { box.classList.remove('speaking'); clearInterval(tick); foot.textContent = isPromo() ? 'Call 1 min 42 s · Logged to PL-04821 · New enquiry: travel mugs · Chasing started · Dan notified' : 'Call 1 min 48 s · Logged to PL-04821 · Note added: bottle green requote · Dan notified'; timer.textContent = '01:48'; return; }
        const { row, p, l } = els[i]; row.classList.add('in');
        if (reduce) { p.textContent = l.text; i++; next(); return; }
        box.classList.toggle('speaking', l.who === 'Shop');
        let c = 0; p.classList.add('caret');
        const t = setInterval(() => {
          if (id !== running) { clearInterval(t); return; }
          c += 2; p.textContent = l.text.slice(0, c);
          if (c >= l.text.length) { clearInterval(t); p.classList.remove('caret'); i++; setTimeout(next, 650); }
        }, 22);
      }
      setTimeout(next, reduce ? 0 : 500);
    }
    $('#callReplay').addEventListener('click', play);
    onVisible(box, play, 0.3);
  })();

  /* ---------- The floor: scan the runsheet, the job moves, the customer is told ---------- */
  (function floor() {
    const sheet = $('#runsheet'); if (!sheet) return;
    const btn = $('#scanBtn'), hint = $('#scanHint'), log = $('#floorLog'), sms = $('#floorSms'), smsText = $('#floorSmsText');
    const ticks = $$('#rsTicks .tick');
    const steps = [
      { bench: 'Artwork', t: '09:12', log: 'Scanned at Artwork. Logo digitised, proof sent to Sam.', sms: 'Your proof is ready. Approve it and we start embroidering: northside.link/PL-04821', next: 'Scan at Embroidery 2' },
      { bench: 'Embroidery 2', t: '14:32', log: 'Scanned at Embroidery 2. In production. Customer messaged.', sms: 'Your hoodies are being embroidered. We’ll message when they’re packed.', next: 'Scan at Packing' },
      { bench: 'Packing', t: '16:40', log: 'Scanned at Packing. 2 boxes. Courier booked for tomorrow.', sms: 'Packed and ready. Courier collects tomorrow; tracking number to follow.', next: 'Start again' }
    ];
    let n = 0, busy = false;
    btn.addEventListener('click', () => {
      if (busy) return;
      if (n >= steps.length) {
        n = 0; ticks.forEach((t) => t.classList.remove('done')); sms.hidden = true;
        $$('li', log).slice(1).forEach((li) => li.remove()); btn.textContent = 'Scan at Artwork'; hint.textContent = 'Each scan moves the job one stage.'; return;
      }
      const s = steps[n]; busy = true;
      sheet.classList.add('scanning'); hint.textContent = 'Scanning…';
      setTimeout(() => {
        sheet.classList.remove('scanning');
        ticks[n].classList.add('done');
        const li = document.createElement('li'); li.className = 'new';
        li.innerHTML = `<span class="t">${s.t}</span><span>${s.log}</span>`;
        log.insertBefore(li, log.firstChild);
        smsText.textContent = s.sms; sms.hidden = false;
        n++; btn.textContent = s.next; hint.textContent = n < steps.length ? 'Same code at the same bench twice does nothing.' : 'Three scans, three messages, nothing typed.';
        busy = false;
      }, reduce ? 0 : 950);
    });
  })();
})();
