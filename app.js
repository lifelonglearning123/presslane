/* Presslane site: the demos. Plain JS, no dependencies. */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';
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

  /* ---------- Hero: the job travels the lane; widgets appear as it passes their stage ---------- */
  (function hero() {
    const rail = $('#heroRail'), job = $('#heroJob'), label = $('#heroLabel');
    if (!rail) return;
    const segs = $$('i', rail);
    const widgets = $$('.hero-stage .widget');
    const names = ['Quote', 'Artwork', 'Production', 'Pick & pack', 'Dispatch', 'Delivered'];
    function setStage(n) {
      segs.forEach((s, i) => { s.classList.toggle('done', i < n - 1); s.classList.toggle('now', i === n - 1); });
      const segW = rail.clientWidth / 6;
      job.style.left = Math.max(0, (n - 1) * segW + segW - 26 - 4) + 'px';
      label.textContent = names[n - 1];
      widgets.forEach((w) => w.classList.toggle('in', Number(w.dataset.stage) <= n));
    }
    if (reduce) { setStage(4); return; }
    let n = 1; setStage(1);
    function step() {
      n = n >= 6 ? 1 : n + 1;
      setStage(n);
      setTimeout(step, n === 6 ? 5200 : n === 1 ? 900 : 1300);
    }
    setTimeout(step, 900);
    window.addEventListener('resize', () => setStage(n));
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
    const k = $('#laneMsgKicker'), h = $('#laneMsgHead'), b = $('#laneMsgBody'), f = $('#laneMsgFoot');
    const playBtn = $('#lanePlay');
    let cur = 1, timer = null, playing = true, started = false;
    function show(n) {
      cur = n;
      tiles.forEach((t) => t.setAttribute('aria-pressed', String(Number(t.dataset.stage) === n)));
      imgs.forEach((im) => { im.hidden = Number(im.dataset.stage) !== n; });
      const m = msgs[n]; k.textContent = m.k; h.textContent = m.h; b.textContent = m.b; f.innerHTML = m.f;
    }
    function schedule() { clearTimeout(timer); if (playing && !reduce) timer = setTimeout(() => { show(cur >= 6 ? 1 : cur + 1); schedule(); }, 3800); }
    tiles.forEach((t) => t.addEventListener('click', () => { show(Number(t.dataset.stage)); playing = false; playBtn.setAttribute('aria-pressed', 'false'); playBtn.textContent = 'Play'; clearTimeout(timer); }));
    playBtn.addEventListener('click', () => { playing = !playing; playBtn.setAttribute('aria-pressed', String(playing)); playBtn.textContent = playing ? 'Pause' : 'Play'; if (playing) { show(cur >= 6 ? 1 : cur + 1); schedule(); } else clearTimeout(timer); });
    show(1);
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
      }
    };
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

    function render() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const g = svgEl('g', {}); garment(g); svg.appendChild(g);
      const P = pos(); const w = logoWidth();
      const lg = svgEl('g', { transform: `translate(${P.cx + state.dx} ${P.cy + state.dy})`, id: 'logoG', style: 'cursor:grab' });
      lg.appendChild(logoNode(w, state.colour));
      svg.appendChild(lg);
      // proof line + readouts
      $('#sizeReadout').textContent = mm();
      $('#colourName').textContent = state.colourName;
      const price = { hoodie: '£1,142.40', polo: '£684.00', cap: '£486.00', card: '£58.80' }[state.product];
      const qty = state.product === 'card' ? '500 pcs' : '48 pcs';
      $('#proofText').textContent = `Proof · PL-04821 · ${products[state.product].label}, ${state.colourName} · ${state.position} · ${mm()} · ${qty} · ${price} inc. VAT`;
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
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => { state.logo = { type: 'image', src: reader.result, aspect: img.naturalWidth / img.naturalHeight || 1 }; $$('#logoPicks .logo-pick').forEach((c) => c.setAttribute('aria-pressed', 'false')); render(); };
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

    const proofLine = $('#proofLine');
    $('#approveBtn').addEventListener('click', () => { proofLine.classList.add('done'); });
    ['#productChips', '#swatches', '#logoPicks', '#positionChips', '#logoSize'].forEach((s) => { const el = $(s); if (el) el.addEventListener('click', () => proofLine.classList.remove('done')); });
    $('#logoSize').addEventListener('input', () => proofLine.classList.remove('done'));

    buildPositions(); render();
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
      if (viaClick) { rTime.textContent = 'now'; rHead.textContent = 'Quote accepted. Chasing stopped.'; rBody.textContent = step ? `Sam accepted from the quote link after ${step} follow-up${step > 1 ? 's' : ''}. The remaining messages were never sent.` : 'Sam accepted from the quote link before any follow-up was needed.'; }
      else { rTime.textContent = '+3 d'; rHead.textContent = 'Quote accepted after the 2nd follow-up.'; rBody.textContent = 'Sam replied yes on WhatsApp. Chasing stopped. Messages 3 and 4 were never sent. Artwork proof went out the same afternoon.'; }
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

  /* ---------- Phone: transcript types itself out ---------- */
  (function phone() {
    const box = $('#call'); if (!box) return;
    const lines = $('#callLines'), timer = $('#callTimer'), foot = $('#callFoot');
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
      const els = script.map((l) => {
        const row = document.createElement('div'); row.className = 'line' + (l.who === 'Shop' ? ' shop' : '');
        const who = document.createElement('span'); who.className = 'who'; who.textContent = l.who === 'Shop' ? 'Northside' : 'Sam';
        const p = document.createElement('p'); row.appendChild(who); row.appendChild(p); lines.appendChild(row); return { row, p, l };
      });
      let i = 0;
      function next() {
        if (id !== running) return;
        if (i >= els.length) { box.classList.remove('speaking'); clearInterval(tick); foot.textContent = 'Call 1 min 48 s · Logged to PL-04821 · Note added: bottle green requote · Dan notified'; timer.textContent = '01:48'; return; }
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
