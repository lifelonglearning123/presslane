/* Presslane site. Plain JavaScript plus GSAP for the stage and the entrances.
   Everything here is optional: the page reads in full without it. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVGNS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';
  const svgEl = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Agency: picked by the address the site is on, or ?agency=<key> for testing (kept for this tab only) ---------- */
  const agency = (function () {
    const list = window.PRESSLANE_AGENCIES || {};
    const valid = (k) => typeof k === 'string' && /^[a-z0-9-]{1,40}$/.test(k) && Object.prototype.hasOwnProperty.call(list, k);
    const host = location.hostname.toLowerCase();
    let key = null;
    for (const k in list) { if (list[k] && String(list[k].domain || '').toLowerCase() === host) key = k; }
    if (!key) {
      const q = new URLSearchParams(location.search).get('agency');
      if (valid(q)) { key = q; try { sessionStorage.setItem('presslane-agency', key); } catch (e) { /* storage off */ } }
      else { try { const s = sessionStorage.getItem('presslane-agency'); if (valid(s)) key = s; } catch (e) { key = null; } }
    }
    const a = key ? list[key] : null;
    const book = a && /^https:\/\//.test(a.book) ? a.book : null;
    $$('.js-book').forEach((el) => { if (book) { el.href = book; el.target = '_blank'; el.rel = 'noopener'; el.hidden = false; } else { el.hidden = true; } });
    $$('.js-agency').forEach((el) => { el.hidden = !a; });
    $$('.js-noagency').forEach((el) => { el.hidden = !!a; });
    document.documentElement.dataset.agency = a ? key : '';
    return { key, data: a };
  })();

  /* ---------- Your logo: one choice, drawn into every slot on the stage ---------- */
  const logo = (function () {
    const slots = $$('.logo-slot');
    if (!slots.length) return null;
    const state = { type: 'symbol', id: 'logo-okafor', aspect: 2.2, src: null };
    const light = '#F3F2F2', dark = '#151515';
    function draw() {
      slots.forEach((g) => {
        while (g.firstChild) g.removeChild(g.firstChild);
        const w = Number(g.dataset.w), maxH = Number(g.dataset.h);
        let h = w / state.aspect, ww = w;
        if (h > maxH) { h = maxH; ww = h * state.aspect; }
        const col = g.classList.contains('dark') ? dark : light;
        if (state.type === 'symbol') {
          const u = svgEl('use', { x: -ww / 2, y: -h / 2, width: ww, height: h, color: col, fill: col });
          u.setAttribute('href', '#' + state.id); u.setAttributeNS(XLINK, 'xlink:href', '#' + state.id);
          g.appendChild(u);
        } else {
          const im = svgEl('image', { x: -ww / 2, y: -h / 2, width: ww, height: h, preserveAspectRatio: 'xMidYMid meet' });
          im.setAttribute('href', state.src); im.setAttributeNS(XLINK, 'xlink:href', state.src);
          g.appendChild(im);
        }
      });
    }
    const picks = $$('.logo-pick');
    picks.forEach((b) => b.addEventListener('click', () => {
      state.type = 'symbol'; state.id = b.dataset.logo; state.aspect = 2.2; state.src = null;
      picks.forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
      $('#logoStatus').textContent = 'It stays in your browser.';
      draw();
    }));
    const input = $('#logoUpload'), status = $('#logoStatus');
    if (input) input.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0]; if (!file) return;
      if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) { status.textContent = 'Choose a PNG, JPG, SVG or WebP.'; return; }
      if (file.size > 8 * 1024 * 1024) { status.textContent = 'That file is over 8 MB. Choose a smaller one.'; return; }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          state.type = 'image'; state.src = reader.result; state.aspect = (img.naturalWidth / img.naturalHeight) || 1;
          picks.forEach((c) => c.setAttribute('aria-pressed', 'false'));
          status.textContent = 'Your logo is on the job. It stays in your browser.';
          draw();
        };
        img.onerror = () => { status.textContent = 'That image could not be read. Try another.'; };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    draw();
    return { draw };
  })();

  /* ---------- The barcode on the job sheet ---------- */
  (function barcode() {
    const g = $('#barcode'); if (!g) return;
    const code = 'PL04821'; let x = 0;
    for (let i = 0; i < code.length * 6; i++) {
      const w = [2, 3, 1.5, 3, 2, 1.5][(i * 7 + code.charCodeAt(i % code.length)) % 6];
      if (i % 2 === 0) g.appendChild(svgEl('rect', { x, y: 0, width: w, height: 72, fill: '#151515' }));
      x += w + (i % 2 === 0 ? 1.5 : 2.5);
    }
  })();

  /* ---------- The stage: one job, shown as it moves ---------- */
  const stage = (function () {
    const root = $('#stage'); if (!root) return null;
    const layers = {}; $$('.layer', root).forEach((l) => { layers[l.dataset.layer] = l; });
    const videos = $$('video', root);
    const stamps = $$('.stamp', root);
    let current = 'hoodie';

    function video(layer, on) {
      const v = layer.querySelector('video'); if (!v) return;
      if (!on) { v.pause(); return; }
      if (!v.getAttribute('src')) { v.src = v.dataset.src; v.load(); }
      if (!reduce) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    }
    function showStamps(name) {
      stamps.forEach((s) => {
        const on = s.dataset.stamp === name;
        if (hasGsap && !reduce) {
          if (on) gsap.fromTo(s, { autoAlpha: 0, scale: 1.3, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out', delay: 0.25, overwrite: 'auto' });
          else gsap.to(s, { autoAlpha: 0, duration: 0.2, overwrite: 'auto' });
        } else { s.style.visibility = on ? 'visible' : 'hidden'; s.style.opacity = on ? '1' : '0'; }
      });
    }
    // The hoodie layer serves three states: plain, with the quote stamp, with the approved stamp.
    const layerFor = (name) => (name === 'quote' || name === 'approve') ? 'hoodie' : name;

    function show(name) {
      if (!layers[layerFor(name)] || name === current) return;
      const from = layers[layerFor(current)], to = layers[layerFor(name)];
      current = name; root.dataset.state = name;
      if (from !== to) {
        Object.keys(layers).forEach((k) => { if (layers[k] !== to) video(layers[k], false); });
        video(to, true);
        if (hasGsap && !reduce) {
          gsap.to(from, { autoAlpha: 0, duration: 0.45, ease: 'power2.out', overwrite: 'auto' });
          gsap.fromTo(to, { autoAlpha: 0, scale: 1.04, transformOrigin: '50% 50%' }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: 'power3.out', overwrite: 'auto' });
        } else {
          from.classList.remove('is-on'); from.style.cssText = '';
          to.classList.add('is-on'); to.style.cssText = '';
        }
      }
      showStamps(name);
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) videos.forEach((v) => v.pause()); else video(layers[layerFor(current)], true); });
    return { show };
  })();

  /* ---------- Their words, your quote ---------- */
  (function ask() {
    const text = $('#askText'); if (!text) return;
    const PRODUCTS = [
      { key: 'hoodie', words: /hood(?:ie|ies|y|ys)|sweat(?:shirt|shirts)|jumper/i, name: 'AWDis JH001 hoodie', base: 26.40, img: '/assets/hoodie.webp', deco: 'left chest logo, embroidered' },
      { key: 'polo', words: /\bpolos?\b/i, name: 'Kustom Kit KK403 polo', base: 14.20, img: '/assets/polo.webp', deco: 'left chest logo, embroidered' },
      { key: 'tee', words: /t[- ]?shirts?|\btees?\b|tshirts?/i, name: 'Gildan heavy cotton t-shirt', base: 9.60, img: null, deco: 'front print, one colour' },
      { key: 'cap', words: /\bcaps?\b|\bhats?\b/i, name: 'Beechfield B653 cap', base: 11.90, img: '/assets/cap.webp', deco: 'front logo, embroidered' },
      { key: 'mug', words: /\bmugs?\b/i, name: 'Stainless travel mug', base: 8.40, img: '/assets/mug.webp', deco: 'wrap print, one colour' },
      { key: 'bottle', words: /\bbottles?\b/i, name: 'Aluminium sports bottle', base: 7.90, img: '/assets/bottle.webp', deco: 'front print, one colour' },
      { key: 'pen', words: /\bpens?\b/i, name: 'Push-button ballpen', base: 0.85, img: '/assets/pen.webp', deco: 'barrel print, one colour' }
    ];
    const COLOURS = [
      ['airforce blue', '#4F5D73'], ['royal blue', '#2a4a9a'], ['sky blue', '#A8C3E4'], ['bottle green', '#1E4D3B'], ['heather grey', '#8E8E8E'],
      ['navy', '#1F2A44'], ['black', '#232323'], ['white', '#F4F2EC'], ['grey', '#8E8E8E'], ['gray', '#8E8E8E'], ['green', '#1E4D3B'],
      ['red', '#9A1F1F'], ['blue', '#4F5D73'], ['orange', '#D2691E'], ['yellow', '#E1C340'], ['pink', '#D98AA8'], ['purple', '#5A3C78'], ['stone', '#E9E1CC']
    ];
    const BREAKS = [[250, 0.25, '250+'], [100, 0.20, '100+'], [50, 0.15, '50+'], [25, 0.10, '25+'], [10, 0.05, '10+']];
    const money = (n) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    const thumb = $('#qThumb');
    let last = { product: PRODUCTS[0], colour: COLOURS[5] };

    function parse() {
      const t = text.value;
      const qm = t.match(/\b(\d{1,4})\b/); let qty = qm ? Number(qm[1]) : 1;
      if (qty < 1) qty = 1; if (qty > 9999) qty = 9999;
      const product = PRODUCTS.find((p) => p.words.test(t)) || last.product;
      const colour = COLOURS.find((c) => new RegExp('\\b' + c[0] + '\\b', 'i').test(t)) || last.colour;
      last = { product, colour };
      const band = BREAKS.find((b) => qty >= b[0]);
      const each = Math.round(product.base * (1 - (band ? band[1] : 0)) * 100) / 100;
      const total = Math.round(each * qty * 100) / 100;
      const dm = t.match(/\bby (?:the )?(\d{1,2})(?:st|nd|rd|th)?\b/i) || t.match(/\bby (monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|friday)\b/i);
      const when = dm ? 'Delivery by ' + (isNaN(dm[1]) ? cap(dm[1].toLowerCase()) : 'the ' + dm[1] + ({ 1: 'st', 2: 'nd', 3: 'rd', 21: 'st', 22: 'nd', 23: 'rd', 31: 'st' }[Number(dm[1])] || 'th')) : 'Delivery in 7 to 10 days';

      $('#qName').textContent = qty + ' × ' + product.name;
      $('#qSub').innerHTML = '';
      const sw = document.createElement('i'); sw.className = 'swatch'; sw.style.background = colour[1];
      $('#qSub').appendChild(sw); $('#qSub').appendChild(document.createTextNode(cap(colour[0]) + ' · ' + product.deco));
      $('#qEach').textContent = money(each) + ' each';
      $('#qBreak').textContent = band ? qty + ' is in the ' + band[2] + ' price band. ' + Math.round(band[1] * 100) + '% off.' : 'Order 10 or more and the price per item drops.';
      $('#qTotal').textContent = money(total) + ' + VAT';
      $('#qWhen').textContent = when;
      thumb.innerHTML = '';
      if (product.img) { const im = document.createElement('img'); im.src = product.img; im.alt = ''; im.width = 56; im.height = 56; thumb.appendChild(im); }
    }
    text.addEventListener('input', parse);
    parse();
  })();

  /* ---------- Films: pick a row, the player plays it ---------- */
  const films = (function () {
    const video = $('#filmVideo'); if (!video) return null;
    const player = video.closest('.player'), now = $('#filmNow');
    const FILMS = {
      storefront: { title: 'Storefront', file: 'storefront-setup', len: '0:48' },
      clubshops: { title: 'Club shops', file: 'club-shop-setup', len: '1:14' },
      quotes: { title: 'Quotes', file: 'client-quotes', len: '1:42' },
      customers: { title: 'Customer accounts', file: 'customer-trading', len: '0:46' },
      pipeline: { title: 'Order pipeline', file: 'order-pipeline', len: '1:07' },
      voice: { title: 'Phone answering', file: 'voice-ai', len: '1:27' }
    };
    const rows = $$('.frow');
    // Root-absolute, so the same script serves the main page and pages a folder down. Resolved in full,
    // so it compares with video.src however the page wrote its own.
    const url = (f, ext) => new URL('/assets/system/' + f.file + ext, location.href).href;
    const caption = (f) => f.title + ' · ' + f.len + ' · recorded in Presslane, with captions';

    // A fresh track element each time: changing a live track's src leaves the old cues behind in some browsers.
    // Captions stay on or off as the viewer left them: a track marked default is switched back on when the
    // film loads, so it is only marked default while they are on.
    function setTrack(f) {
      const old = video.querySelector('track');
      const showing = old ? old.track.mode === 'showing' : true;
      const t = document.createElement('track');
      t.id = 'filmTrack'; t.kind = 'captions'; t.srclang = 'en'; t.label = 'English'; t.default = showing; t.src = url(f, '.vtt');
      if (old) old.replaceWith(t); else video.appendChild(t);
      t.track.mode = showing ? 'showing' : 'disabled';
    }
    function select(id, play) {
      const f = FILMS[id]; if (!f) return;
      rows.forEach((r) => r.setAttribute('aria-pressed', String(r.dataset.film === id)));
      now.textContent = caption(f);
      // Load when it is a different film, or the same one after a failed load. Picking the film that is already
      // in the player leaves it be, so a pick never restarts what is playing.
      if (video.src !== url(f, '.mp4') || video.error) {
        video.pause();
        video.poster = url(f, '-poster.webp');
        setTrack(f);
        video.src = url(f, '.mp4');
        video.load();
      }
      if (play) { const p = video.play(); if (p && p.catch) p.catch(() => {}); }
    }
    // On a phone the player sits above the list, so a pick further down would play out of sight.
    function reveal() {
      const top = player.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.6) player.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    }
    video.addEventListener('error', () => { now.textContent = 'That film did not load. Pick it again to try once more.'; });
    rows.forEach((r) => r.addEventListener('click', () => { select(r.dataset.film, true); reveal(); }));
    // The "Watch" links in the box: the link itself brings the page to the player.
    $$('[data-film].val').forEach((a) => a.addEventListener('click', () => select(a.dataset.film, true)));
    return { select };
  })();

  /* ---------- Talk to us ---------- */
  (function contact() {
    const form = $('#contactForm'); if (!form) return;
    const email = $('#cEmail'), more = $('#cMore'), next = $('#cNext'), name = $('#cName');
    const ok = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const say = (msg, said) => { next.textContent = msg; next.classList.toggle('said', !!said); };
    const reveal = () => { if (more.hidden) { more.hidden = false; } };
    email.addEventListener('input', () => { if (ok(email.value.trim())) reveal(); });
    let busy = false;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!ok(email.value.trim())) { say('Please check your email address.', true); email.focus(); return; }
      if (more.hidden) { reveal(); name.focus(); return; }
      if (!name.value.trim()) { say('Please add your name.', true); name.focus(); return; }
      if (busy) return; busy = true;
      say('Sending…', true);
      const suppliers = form.elements.suppliers ? form.elements.suppliers.value : '';
      const body = { agency: agency.key, name: name.value, email: email.value, phone: $('#cPhone').value, message: $('#cMessage').value, suppliers, page: form.dataset.page || '', website: form.elements.website.value };
      try {
        const r = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await r.json().catch(() => ({}));
        if (r.ok) { say('Thanks. We have your details and will be in touch within one working day.', true); form.reset(); more.hidden = true; }
        else { say(data.error || 'Sorry, that did not send. Please try again in a minute.', true); }
      } catch (err) { say('Sorry, that did not send. Please try again in a minute.', true); }
      busy = false;
    });
  })();

  /* ---------- Motion: the stage follows the reading, and each section arrives in its own way ---------- */
  if (hasGsap && stage) {
    const mm = gsap.matchMedia();
    mm.add({ wide: '(min-width: 900px)', narrow: '(max-width: 899px)', motion: '(prefers-reduced-motion: no-preference)', still: '(prefers-reduced-motion: reduce)' }, (ctx) => {
      const { motion, wide } = ctx.conditions;

      // On a phone, on an agency address, the one action stays within reach once the hero has gone,
      // and steps aside while the form itself is on screen.
      const callbar = $('.callbar');
      if (!wide && callbar && agency.data) {
        document.body.classList.add('has-callbar');
        const setBar = (on) => callbar.classList.toggle('is-on', on);
        ScrollTrigger.create({ trigger: '.hero', start: 'bottom 70%', onEnter: () => setBar(true), onLeaveBack: () => setBar(false) });
        // Off while the dark "their words" field and the form are on screen, so it never sits on their titles.
        ScrollTrigger.create({ trigger: '.ask', start: 'top 90%', end: 'bottom 60%', onToggle: (self) => setBar(!self.isActive) });
        ScrollTrigger.create({ trigger: '.talk', start: 'top 80%', end: 'bottom bottom', onEnter: () => setBar(false), onLeaveBack: () => setBar(true) });
      }

      if (wide) {
        // The stage: whichever paragraph is in the middle of the screen decides what the stage shows.
        $$('[data-stage]').forEach((el) => {
          ScrollTrigger.create({
            trigger: el, start: 'top 58%', end: 'bottom 42%',
            onToggle: (self) => { if (self.isActive) stage.show(el.dataset.stage); }
          });
        });
      } else {
        // On a phone the steps carry their own clips; each plays only while it is on screen.
        stage.show('hoodie');
        $$('.m-pic video').forEach((v) => {
          ScrollTrigger.create({
            trigger: v, start: 'top 80%', end: 'bottom 20%',
            onToggle: (self) => {
              if (self.isActive) { if (!v.getAttribute('src')) { v.src = v.dataset.src; v.load(); } if (motion) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } }
              else v.pause();
            }
          });
        });
      }

      if (!motion) return;

      gsap.defaults({ ease: 'power3.out', duration: 0.9 });
      const once = (trigger, start) => ({ trigger, start: start || 'top 82%', toggleActions: 'play none none none', once: true });

      // Signature: the hoodie settles into the stage on load.
      gsap.from('#stageSvg', { scale: 1.06, autoAlpha: 0, duration: 1.3, transformOrigin: '50% 50%', delay: 0.15 });
      gsap.from('.stage-bar > *', { y: 12, autoAlpha: 0, stagger: 0.06, duration: 0.6, delay: 0.7 });

      // The gaps: one line at a time.
      gsap.from('.gaps .col p', { y: 16, autoAlpha: 0, stagger: 0.12, duration: 0.7, scrollTrigger: once('.gaps') });

      // One job: the heading, then each step's words, then its evidence.
      gsap.from('.job h2', { y: 20, autoAlpha: 0, scrollTrigger: once('.job h2') });
      $$('.step').forEach((step) => {
        const tl = gsap.timeline({ scrollTrigger: once(step, 'top 80%') });
        tl.from(step.querySelector('p'), { y: 22, autoAlpha: 0, duration: 0.8 })
          .from(step.querySelectorAll('.evidence > *'), { y: 18, autoAlpha: 0, duration: 0.7 }, '-=0.45');
        const cards = step.querySelectorAll('.ui-card');
        if (cards.length) tl.from(cards, { y: 10, autoAlpha: 0, stagger: 0.09, duration: 0.5 }, '-=0.4');
      });

      // The box: the sheet prints out from the top, then its rows.
      const sheet = $('.sheet');
      if (sheet) {
        const tl = gsap.timeline({ scrollTrigger: once(sheet, 'top 78%') });
        tl.from(sheet, { yPercent: 6, autoAlpha: 0, duration: 0.9 })
          .from(sheet.querySelectorAll('h2, .group h3, .item, .foot-line'), { y: 12, autoAlpha: 0, stagger: 0.05, duration: 0.5 }, '-=0.4');
      }

      // Their words, your quote.
      gsap.from('.ask-in > *:not(.ask-title)', { y: 18, autoAlpha: 0, stagger: 0.1, scrollTrigger: once('.ask', 'top 70%') });
      gsap.from('.quote-card', { y: 24, autoAlpha: 0, scale: 0.98, transformOrigin: '50% 100%', duration: 1, scrollTrigger: once('.ask-out', 'top 70%') });
      gsap.from('.ask-title span', { y: 30, autoAlpha: 0, stagger: 0.12, duration: 0.9, scrollTrigger: once('.ask', 'top 40%') });

      // Price: the heading and the picture, then every row.
      gsap.from('.price-head > *', { y: 18, autoAlpha: 0, stagger: 0.12, scrollTrigger: once('.price') });
      gsap.from('.price-list .pgroup', { y: 20, autoAlpha: 0, stagger: 0.15, scrollTrigger: once('.price-list') });
      gsap.from('.pitem', { y: 10, autoAlpha: 0, stagger: 0.08, duration: 0.6, scrollTrigger: once('.price-list', 'top 75%') });

      // Films: the player opens, the list arrives row by row.
      gsap.from('.player', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power2.inOut', scrollTrigger: once('.films', 'top 75%') });
      gsap.from('.film-list h2', { y: 18, autoAlpha: 0, scrollTrigger: once('.film-list') });
      gsap.from('.frow', { x: -14, autoAlpha: 0, stagger: 0.07, duration: 0.6, scrollTrigger: once('#filmRows', 'top 80%') });

      // Who: the row slides in from the right.
      gsap.from('.who .head > *', { y: 16, autoAlpha: 0, stagger: 0.1, scrollTrigger: once('.who') });
      gsap.from('.row figure', { x: 40, autoAlpha: 0, stagger: 0.08, duration: 0.8, scrollTrigger: once('.row', 'top 85%') });

      // Your questions: the picture settles, then each question in turn.
      gsap.from('.faq-pic > *', { y: 16, autoAlpha: 0, stagger: 0.12, scrollTrigger: once('.faq', 'top 75%') });
      gsap.from('.faq-list h2, .faq .qa', { y: 14, autoAlpha: 0, stagger: 0.09, duration: 0.6, scrollTrigger: once('.faq-list', 'top 80%') });

      // Talk to us: the prompt, then the field.
      gsap.from('.talk .prompt span', { y: 16, autoAlpha: 0, stagger: 0.12, scrollTrigger: once('.talk', 'top 75%') });
      gsap.from('.talk .ask-form, .talk .no-agency, .talk .weeks', { y: 18, autoAlpha: 0, stagger: 0.12, scrollTrigger: once('.talk', 'top 70%') });

      return () => {};
    });

    // Fonts and lazy pictures change the layout; recalculate once they are in.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  } else if (hasGsap) {
    // A page without the stage (the eTrader comparison): each block arrives once as it comes into view.
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.defaults({ ease: 'power3.out', duration: 0.8 });
      $$('[data-reveal]').forEach((el) => {
        const parts = el.matches('[data-reveal="parts"]') ? Array.from(el.children) : [el];
        gsap.from(parts, { y: 18, autoAlpha: 0, stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none', once: true } });
      });
      gsap.from('.frow', { x: -14, autoAlpha: 0, stagger: 0.07, duration: 0.6, scrollTrigger: { trigger: '#filmRows', start: 'top 80%', once: true } });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
