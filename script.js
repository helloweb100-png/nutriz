"use strict";
/* ==========================================================================
   NutriZ — «Micelio Vivo»
   JS vanilla, sin librerías. Un solo bucle rAF publica el scroll a todos los
   módulos. Cada módulo está aislado: si uno falla, los demás siguen y el
   contenido queda visible (los estados ocultos viven bajo la clase .js).
   ========================================================================== */

/* Número de WhatsApp: 10 dígitos, sin +52. Si queda vacío, se ocultan los
   botones de WhatsApp y el envío del formulario. */
const WHATSAPP_NUMERO = "7226297781";

(function () {
  const D = document, H = D.documentElement;
  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(pointer: fine)').matches;
  const esDesk = () => innerWidth >= 1024;

  /** Ejecuta un módulo aislado: un error no tumba al resto de la página. */
  function seguro(nombre, fn) { try { fn(); } catch (e) { console.warn('[NutriZ] módulo', nombre, e); } }

  /** Enlace de WhatsApp con mensaje prellenado. */
  function waLink(texto) {
    return WHATSAPP_NUMERO ? 'https://wa.me/52' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(texto || '') : '';
  }

  /* ----------------------------------------------------------------------
     Estado global del scroll y bucle único
     ---------------------------------------------------------------------- */
  const S = { y: scrollY, vh: innerHeight, vw: innerWidth, vel: 0 };
  const tareas = [];
  let ultY = scrollY, tPrev = performance.now();
  function frame(t) {
    const dt = Math.min(64, Math.max(1, t - tPrev)); tPrev = t;
    S.y = scrollY; S.vh = innerHeight; S.vw = innerWidth;
    S.vel = lerp(S.vel, (S.y - ultY) / dt, .18); ultY = S.y;
    for (let i = 0; i < tareas.length; i++) {
      const f = tareas[i];
      if (f.roto) continue;
      try { f(t, dt); } catch (e) { f.roto = true; console.warn('[NutriZ] tarea', e); }
    }
    requestAnimationFrame(frame);
  }

  /* Posiciones absolutas de contenedores altos (no sticky) */
  const M = {};
  const absPos = el => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; };
  function medir() {
    [['sala', '#sala'], ['proceso', '#proceso'], ['pie', '#pie']].forEach(([k, s]) => { const el = $(s); if (el) M[k] = absPos(el); });
  }

  /* ----------------------------------------------------------------------
     Entradas con IntersectionObserver + respaldo por geometría
     ---------------------------------------------------------------------- */
  const entradas = new Map();
  let ioEntrada = null;
  if ('IntersectionObserver' in window) {
    ioEntrada = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) disparar(e.target); }), { threshold: .1, rootMargin: '0px 0px -6% 0px' });
  }
  function alEntrar(el, cb) { entradas.set(el, cb); if (ioEntrada) ioEntrada.observe(el); }
  function disparar(el) {
    const cb = entradas.get(el); if (!cb) return;
    entradas.delete(el); if (ioEntrada) ioEntrada.unobserve(el);
    try { cb(el); } catch (e) { console.warn('[NutriZ] entrada', e); }
  }
  function geoEntradas() {
    const vh = innerHeight;
    Array.from(entradas.keys()).forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh * .94) disparar(el);
    });
  }
  let geoPend = false;
  function pedirGeo() { if (geoPend) return; geoPend = true; requestAnimationFrame(() => { geoPend = false; geoEntradas(); }); }
  addEventListener('scroll', pedirGeo, { passive: true });
  addEventListener('resize', pedirGeo);
  addEventListener('load', () => setTimeout(geoEntradas, 300));
  setTimeout(geoEntradas, 2000);
  setTimeout(geoEntradas, 3500);
  setTimeout(geoEntradas, 6000);

  /* ----------------------------------------------------------------------
     1. Cargador
     ---------------------------------------------------------------------- */
  seguro('cargador', () => {
    const L = $('#loader');
    const abrirHero = () => H.classList.add('listo');
    if (!L) { abrirHero(); return; }
    const pct = $('[data-pct]', L);
    const DUR = 1350;
    let cerrado = false;
    function cerrar() {
      if (cerrado) return; cerrado = true;
      const restante = 2180 - performance.now();
      if (restante > 640) {
        L.classList.add('abre');
        setTimeout(abrirHero, 280);
        setTimeout(() => L.classList.add('fin'), 640);
      } else {
        L.classList.add('rapido');
        abrirHero();
        setTimeout(() => L.classList.add('fin'), 240);
      }
    }
    function t() {
      const p = clamp(performance.now() / DUR);
      if (pct) pct.textContent = Math.round((1 - Math.pow(1 - p, 2.2)) * 100) + ' %';
      if (p < 1) requestAnimationFrame(t); else setTimeout(cerrar, 60);
    }
    requestAnimationFrame(t);
    setTimeout(cerrar, 1900);
    setTimeout(abrirHero, 3000);
  });

  /* ----------------------------------------------------------------------
     2. WhatsApp: enlaces, botón flotante y burbuja
     ---------------------------------------------------------------------- */
  const hayWA = !!WHATSAPP_NUMERO;
  seguro('whatsapp', () => {
    $$('[data-wa]').forEach(a => {
      if (!hayWA) { a.hidden = true; a.setAttribute('aria-hidden', 'true'); return; }
      a.href = waLink(a.dataset.waMsg || 'Hola NutriZ 👋');
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    const flot = $('#wa-flot');
    if (!hayWA) { if (flot) flot.hidden = true; return; }
    const burb = $('#wa-burbuja');
    if (burb) {
      setTimeout(() => burb.classList.add('show'), 6000);
      setTimeout(() => burb.classList.remove('show'), 12000);
    }
  });

  /* ----------------------------------------------------------------------
     3. Revelados genéricos (.rev, tarjetas, barras)
     ---------------------------------------------------------------------- */
  seguro('revelados', () => {
    $$('.rev, .card').forEach(el => alEntrar(el, e => e.classList.add('in')));
    $$('.barra').forEach((el, i) => {
      const barra = $('.barra-b i', el);
      if (barra) barra.style.transitionDelay = (i * 90) + 'ms';
      alEntrar(el, e => e.classList.add('in'));
    });
  });

  /* ----------------------------------------------------------------------
     4. Encabezado, menú móvil, navegación activa y barra de progreso
     ---------------------------------------------------------------------- */
  seguro('cabecera', () => {
    const burger = $('#burger'), menu = $('#menu');
    function setMenu(abre) {
      if (!menu || !burger) return;
      menu.classList.toggle('abierto', abre);
      menu.setAttribute('aria-hidden', String(!abre));
      burger.setAttribute('aria-expanded', String(abre));
      burger.setAttribute('aria-label', abre ? 'Cerrar menú' : 'Abrir menú');
      H.classList.toggle('bloqueado', abre);
    }
    if (burger) burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
    if (menu) menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu && menu.classList.contains('abierto')) { setMenu(false); burger.focus(); } });
    addEventListener('resize', () => { if (esDesk()) setMenu(false); });

    const barra = $('.progreso i');
    const ids = ['inicio', 'manifiesto', 'cultivos', 'sala', 'proceso', 'nutrillinas', 'nutricion', 'receta', 'galeria', 'distribucion', 'contacto'];
    const secs = ids.map(id => $('#' + id));
    const oscuras = new Set(['sala', 'nutricion', 'distribucion']);
    const navLinks = $$('.nav a'), puntos = $$('.puntos a');
    let actual = '', n = 0;
    tareas.push(() => {
      const max = Math.max(1, D.documentElement.scrollHeight - S.vh);
      if (barra) barra.style.transform = 'scaleX(' + clamp(S.y / max).toFixed(4) + ')';
      H.classList.toggle('scrolled', S.y > 24);
      if ((n++ % 6) !== 0) return;
      let id = ids[0];
      secs.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= S.vh * .45) id = ids[i]; });
      const pie = $('#pie');
      const enPie = pie && pie.getBoundingClientRect().top < S.vh * .5;
      if (id === actual && !enPie) return;
      actual = id;
      navLinks.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + id));
      puntos.forEach(a => { const on = a.dataset.s === id; a.classList.toggle('activo', on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
      H.classList.toggle('on-oscuro', oscuras.has(id) || enPie);
    });
  });

  /* ----------------------------------------------------------------------
     5. Estado en vivo (hora de la Ciudad de México)
     ---------------------------------------------------------------------- */
  seguro('estado', () => {
    const els = $$('[data-estado]');
    if (!els.length) return;
    let fmt;
    try { fmt = new Intl.DateTimeFormat('es-MX', { timeZone: 'America/Mexico_City', hour: 'numeric', hourCycle: 'h23' }); } catch (e) { fmt = null; }
    function act() {
      let h;
      if (fmt) { const p = fmt.formatToParts(new Date()).find(x => x.type === 'hour'); h = parseInt(p ? p.value : '12', 10) % 24; }
      else h = new Date().getHours();
      const abierto = h >= 9 && h < 22;
      els.forEach(el => {
        el.classList.toggle('cerrado', !abierto);
        const t = $('[data-estado-txt]', el);
        if (t) t.textContent = abierto ? 'Abierto ahora · hasta las 10:00 p. m.' : 'Cerrado · abrimos a las 9:00 a. m.';
      });
    }
    act(); setInterval(act, 60000);
  });

  /* ----------------------------------------------------------------------
     6. HERO: crossfade, inclinación 3D y micelio vivo (canvas)
     ---------------------------------------------------------------------- */
  let heroVis = true;
  seguro('hero', () => {
    const hero = $('.hero'); if (!hero) return;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { heroVis = e.isIntersecting; })).observe(hero);

    /* Crossfade de 3 fotos */
    const slides = $$('.slide', hero), etq = $('[data-etq]', hero);
    const nombres = ['FIG. 01 · Setas en caja', 'FIG. 02 · Bolsas de cultivo', 'FIG. 03 · Filas de cultivo'];
    let si = 0;
    if (!reduce && slides.length > 1) {
      setInterval(() => {
        if (!heroVis || D.hidden) return;
        slides[si].classList.remove('activa');
        si = (si + 1) % slides.length;
        slides[si].classList.add('activa');
        if (etq) etq.textContent = nombres[si];
      }, 4500);
    }

    /* Puntero (compartido por tilt y esporas) */
    const ptr = { x: -9999, y: -9999, nx: 0, ny: 0 };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top;
      ptr.nx = (e.clientX / innerWidth - .5) * 2; ptr.ny = (e.clientY / innerHeight - .5) * 2;
    });
    hero.addEventListener('pointerleave', () => { ptr.x = ptr.y = -9999; ptr.nx = ptr.ny = 0; });

    /* Inclinación 3D del arco */
    const tilt = $('.arco-tilt', hero);
    let rx = 0, ry = 0;
    if (tilt && fino && !reduce) {
      tareas.push(() => {
        if (!heroVis) return;
        rx = lerp(rx, -ptr.ny * 6, .08); ry = lerp(ry, ptr.nx * 6, .08);
        tilt.style.transform = 'perspective(1100px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      });
    }

    /* ---- Micelio vivo ---- */
    const cv = $('.hero-canvas', hero);
    if (!cv || !cv.getContext) return;
    const ctx = cv.getContext('2d');
    let W = 0, Hh = 0;
    const COL = [[179, 23, 31, .30], [42, 127, 53, .28], [235, 211, 165, .45]];
    let N = esDesk() ? 70 : 28;
    let hifas = [], esporas = [];

    function medirCanvas() {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const r = hero.getBoundingClientRect();
      W = r.width; Hh = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      N = esDesk() ? 70 : 28;
      if (!esporas.length) crearEsporas();
    }
    function nueva(x, y, ang, prof, max, col) { return { pts: [[x, y]], ang, prof, max, col, fade: 0, done: false, nodos: [0] }; }
    function raiz() {
      let x, y;
      const arc = $('.arco', hero);
      if (arc && Math.random() < .4) {
        const r = arc.getBoundingClientRect(), h = hero.getBoundingClientRect();
        x = r.left - h.left + Math.random() * r.width; y = r.bottom - h.top - 6;
      } else { x = Math.random() * W; y = Hh + 4; }
      hifas.push(nueva(x, y, -Math.PI / 2 + (Math.random() - .5) * 1.3, 0, 55 + Math.floor(Math.random() * 60), COL[Math.floor(Math.random() * 3)]));
    }
    function paso() {
      for (let i = 0; i < hifas.length; i++) {
        const h = hifas[i];
        if (h.done) { h.fade++; continue; }
        const p = h.pts[h.pts.length - 1];
        h.ang += (Math.random() - .5) * .7;
        if (h.prof === 0) h.ang += (-Math.PI / 2 - h.ang) * .03;
        const L = 5 + Math.random() * 3;
        const nx = p[0] + Math.cos(h.ang) * L, ny = p[1] + Math.sin(h.ang) * L;
        h.pts.push([nx, ny]);
        if (h.pts.length >= h.max || ny < -20 || nx < -20 || nx > W + 20) h.done = true;
        else if (h.prof < 3 && h.pts.length > 6 && Math.random() < .045 && hifas.length < N * 1.6) {
          hifas.push(nueva(nx, ny, h.ang + (Math.random() < .5 ? -1 : 1) * (.5 + Math.random() * .6), h.prof + 1, Math.round(h.max * .6), h.col));
          h.nodos.push(h.pts.length - 1);
        }
      }
      hifas = hifas.filter(h => h.fade < 60);
      let vivas = 0;
      for (let i = 0; i < hifas.length; i++) if (hifas[i].prof === 0 && !hifas[i].done) vivas++;
      while (vivas < N * .6) { raiz(); vivas++; }
    }
    function crearEsporas() {
      esporas = [];
      for (let i = 0; i < 36; i++) esporas.push({ x: Math.random() * W, y: Math.random() * Hh, r: 1.5 + Math.random() * 2.6, vy: 8 + Math.random() * 14, f: Math.random() * 6.28, a: 6 + Math.random() * 14, k: Math.floor(Math.random() * 3), bx: 0 });
    }
    const ESPORA_COL = ['232,116,42,.5', '179,23,31,.32', '42,127,53,.4'];
    function dibujar(frac) {
      ctx.clearRect(0, 0, W, Hh);
      ctx.lineWidth = 1; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      for (let i = 0; i < hifas.length; i++) {
        const h = hifas[i], pts = h.pts, n = pts.length;
        if (n < 2) continue;
        const f = (h.done ? Math.max(0, 1 - h.fade / 60) : 1) * Math.min(1, n / 8);
        if (f <= .01) continue;
        const c = h.col, col = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (c[3] * f).toFixed(3) + ')';
        ctx.strokeStyle = col; ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
        for (let j = 1; j < n - 1; j++) ctx.lineTo(pts[j][0], pts[j][1]);
        let ex = pts[n - 1][0], ey = pts[n - 1][1];
        if (!h.done) { const a = pts[n - 2]; ex = lerp(a[0], ex, frac); ey = lerp(a[1], ey, frac); }
        ctx.lineTo(ex, ey); ctx.stroke();
        for (let k = 0; k < h.nodos.length; k++) { const q = pts[h.nodos[k]]; if (q) { ctx.beginPath(); ctx.arc(q[0], q[1], 2, 0, 6.2832); ctx.fill(); } }
        if (!h.done) { ctx.beginPath(); ctx.arc(ex, ey, 2, 0, 6.2832); ctx.fill(); }
      }
      for (let i = 0; i < esporas.length; i++) {
        const s = esporas[i];
        ctx.fillStyle = 'rgba(' + ESPORA_COL[s.k] + ')';
        ctx.beginPath(); ctx.arc(s.x + s.bx, s.y, s.r, 0, 6.2832); ctx.fill();
      }
    }
    medirCanvas();
    addEventListener('resize', () => { medirCanvas(); });

    if (reduce) {            // un cuadro estático
      for (let i = 0; i < 70; i++) paso();
      dibujar(1);
      return;
    }
    for (let i = 0; i < 20; i++) paso();   // arranca con algo ya crecido
    let acc = 0;
    tareas.push((t, dt) => {
      if (!heroVis || D.hidden) return;
      acc += dt;
      while (acc >= 48) { acc -= 48; paso(); }
      const seg = dt / 1000;
      for (let i = 0; i < esporas.length; i++) {
        const s = esporas[i];
        s.y -= s.vy * seg; s.f += seg * .9;
        let bx = Math.sin(s.f) * s.a;
        const dx = s.x + bx - ptr.x, dy = s.y - ptr.y, d = Math.hypot(dx, dy);
        if (d < 110 && d > .1) { s.x += (dx / d) * (110 - d) * .06; s.y += (dy / d) * (110 - d) * .03; }
        s.bx = bx;
        if (s.y < -10) { s.y = Hh + 10; s.x = Math.random() * W; }
        if (s.x < -30) s.x = W + 20; else if (s.x > W + 30) s.x = -20;
      }
      dibujar(acc / 48);
    });
  });

  /* ----------------------------------------------------------------------
     7. Botones magnéticos y cursor «espora» (solo puntero fino)
     ---------------------------------------------------------------------- */
  seguro('puntero', () => {
    if (!fino || reduce) return;
    $$('[data-magnetico]').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .22).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .3).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
    const c = D.createElement('div');
    c.className = 'cursor'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<span>Ver</span>';
    D.body.appendChild(c);
    let tx = -100, ty = -100, x = -100, y = -100;
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY; c.classList.add('on');
      const t = e.target;
      const ver = t.closest && t.closest('[data-cursor="ver"]');
      c.classList.toggle('ver', !!ver);
      c.classList.toggle('hover', !ver && !!(t.closest && t.closest('a,button,summary,label,input,select,textarea')));
    }, { passive: true });
    D.addEventListener('pointerleave', () => c.classList.remove('on'));
    tareas.push(() => { x = lerp(x, tx, .2); y = lerp(y, ty, .2); c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)'; });
  });

  /* ----------------------------------------------------------------------
     8. Marquee: la velocidad del scroll inclina las filas
     ---------------------------------------------------------------------- */
  seguro('marquee', () => {
    const mq = $('#marquee'); if (!mq || reduce) return;
    let sk = 0;
    tareas.push(() => {
      const r = mq.getBoundingClientRect();
      if (r.bottom < -50 || r.top > S.vh + 50) return;
      sk = lerp(sk, clamp(S.vel * 2.6, -8, 8), .12);
      mq.style.setProperty('--skew', sk.toFixed(2));
    });
  });

  /* ----------------------------------------------------------------------
     9. Manifiesto: revelado palabra por palabra + contadores
     ---------------------------------------------------------------------- */
  seguro('manifiesto', () => {
    const txt = $('[data-manif]'); if (!txt) return;
    const walker = D.createTreeWalker(txt, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (walker.nextNode()) nodos.push(walker.currentNode);
    const palabras = [];
    nodos.forEach(n => {
      const frag = D.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(s => {
        if (!s) return;
        if (/^\s+$/.test(s)) frag.appendChild(D.createTextNode(s));
        else { const sp = D.createElement('span'); sp.className = 'w'; sp.textContent = s; frag.appendChild(sp); palabras.push(sp); }
      });
      n.parentNode.replaceChild(frag, n);
    });
    if (reduce) return;
    txt.classList.add('manif-on');
    const n = palabras.length;
    let ultP = -1;
    function act() {
      const r = txt.getBoundingClientRect();
      const p = clamp((S.vh * .82 - r.top) / ((S.vh * .82 - S.vh * .42) + r.height));
      if (Math.abs(p - ultP) < .002) return;
      ultP = p;
      for (let i = 0; i < n; i++) palabras[i].style.setProperty('--w', clamp((p * (n + 5) - i) / 5).toFixed(3));
    }
    act();
    tareas.push(() => { const r = txt.getBoundingClientRect(); if (r.bottom < -100 || r.top > S.vh + 100) return; act(); });
  });

  seguro('contadores', () => {
    const els = $$('[data-cuenta]');
    const finalTxt = el => { const dec = +(el.dataset.dec || 0); return (+el.dataset.cuenta).toFixed(dec); };
    els.forEach(el => {
      if (reduce) { el.textContent = finalTxt(el); return; }
      el.textContent = (0).toFixed(+(el.dataset.dec || 0));
      alEntrar(el, e => {
        const fin = +e.dataset.cuenta, dec = +(e.dataset.dec || 0), dur = fin > 100 ? 2200 : 1600;
        const t0 = performance.now();
        (function paso(t) {
          const p = clamp((t - t0) / dur), v = fin * (1 - Math.pow(1 - p, 3));
          e.textContent = v.toFixed(dec);
          if (p < 1) requestAnimationFrame(paso); else e.textContent = finalTxt(e);
        })(t0);
      });
    });
    setTimeout(() => els.forEach(el => { if (entradas.has(el)) { entradas.delete(el); if (ioEntrada) ioEntrada.unobserve(el); el.textContent = finalTxt(el); } }), 9000);
  });

  /* ----------------------------------------------------------------------
     10. Cultivos: tarjetas apiladas (escala + velo) y tilt 3D de la foto
     ---------------------------------------------------------------------- */
  seguro('cultivos', () => {
    const pila = $('.pila'); if (!pila) return;
    const cards = $$('.card', pila);
    const inners = cards.map(c => $('.card-in', c));
    tareas.push(() => {
      const r = pila.getBoundingClientRect();
      if (r.bottom < -200 || r.top > S.vh + 200) return;
      for (let i = 0; i < cards.length - 1; i++) {
        const rn = cards[i + 1].getBoundingClientRect();
        const pegada = 76 + (i + 1) * 14;
        const p = clamp(1 - (rn.top - pegada) / (S.vh * .7));
        inners[i].style.setProperty('--s', (1 - .06 * p).toFixed(4));
        inners[i].style.setProperty('--o', (.4 * p).toFixed(3));
      }
    });
    if (fino && !reduce) {
      $$('.card-media', pila).forEach(m => {
        m.addEventListener('pointermove', e => {
          const r = m.getBoundingClientRect();
          const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
          m.style.transform = 'perspective(900px) rotateX(' + (-ny * 7).toFixed(2) + 'deg) rotateY(' + (nx * 7).toFixed(2) + 'deg)';
        });
        m.addEventListener('pointerleave', () => { m.style.transform = ''; });
      });
    }
  });

  /* ----------------------------------------------------------------------
     11. Sala de cultivo: la foto se abre a pantalla completa
     ---------------------------------------------------------------------- */
  seguro('sala', () => {
    const pin = $('.sala-pin'); if (!pin) return;
    const txt = $('.sala-txt', pin);
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    let ultima = '';
    function aplicar(p) {
      const ap = ease(clamp(p / .7));
      const c = clamp((p - .6) / .14), t = clamp((p - .76) / .16);
      const key = [ap.toFixed(3), c.toFixed(3), t.toFixed(3)].join();
      if (key === ultima) return; ultima = key;
      pin.style.setProperty('--iy', lerp(18, 0, ap).toFixed(2) + '%');
      pin.style.setProperty('--ix', lerp(16, 0, ap).toFixed(2) + '%');
      pin.style.setProperty('--r', lerp(36, 0, ap).toFixed(1) + 'px');
      pin.style.setProperty('--z', lerp(1.25, 1, ap).toFixed(4));
      pin.style.setProperty('--c', c.toFixed(3));
      pin.style.setProperty('--t', t.toFixed(3));
      if (txt) txt.style.visibility = t > .02 ? 'visible' : 'hidden';
    }
    if (reduce) { aplicar(1); if (txt) txt.style.visibility = 'visible'; return; }
    aplicar(clamp(((M.sala ? S.y - M.sala.top : 0)) / 1));
    tareas.push(() => {
      const m = M.sala; if (!m) return;
      if (S.y < m.top - S.vh || S.y > m.top + m.h) return;
      aplicar(clamp((S.y - m.top) / Math.max(1, m.h - S.vh)));
    });
  });

  /* ----------------------------------------------------------------------
     12. Proceso: línea de vida pegajosa con iris circular
     ---------------------------------------------------------------------- */
  seguro('proceso', () => {
    const pasos = $$('#pasos .paso'), imgs = $$('.vp-img'), barra = $('.proc-barra i');
    const mics = ['.mic-1', '.mic-2', '.mic-3'].map(s => $(s));
    const etq = $('[data-vp-etq]'), lista = $('#pasos');
    let activo = -1;
    function fijarFill() {
      if (!lista || !pasos[activo]) return;
      lista.style.setProperty('--fill', (pasos[activo].offsetTop + 28) + 'px');
    }
    function setActivo(i) {
      if (i === activo) return; activo = i;
      pasos.forEach((p, k) => { p.classList.toggle('activo', k === i); p.classList.toggle('hecho', k < i); });
      if (etq) etq.textContent = 'FIG. 05 · Paso 0' + (i + 1) + ' / 05';
      fijarFill(); setTimeout(fijarFill, 600);
    }
    function aplicar(p) {
      setActivo(Math.min(4, Math.floor(p * 5)));
      imgs.forEach((im, i) => {
        const r = i === 0 ? 1 : clamp((p * 5 - i) / .45);
        im.style.setProperty('--r', (r * 75).toFixed(1) + '%');
      });
      if (barra) barra.parentNode.style.setProperty('--p', p.toFixed(3)), barra.style.setProperty('--p', p.toFixed(3));
      const tramos = [p, clamp((p - .25) / .6), clamp((p - .5) / .5)];
      mics.forEach((m, i) => { if (m) m.style.strokeDashoffset = (1 - tramos[i]).toFixed(3); });
    }
    aplicar(0);
    tareas.push(() => {
      const m = M.proceso; if (!m) return;
      if (S.y < m.top - S.vh || S.y > m.top + m.h) return;
      aplicar(clamp((S.y - m.top) / Math.max(1, m.h - S.vh)));
    });
    addEventListener('resize', () => { setTimeout(fijarFill, 100); });
  });

  /* ----------------------------------------------------------------------
     13. Nutrillinas: anillo 3D (auto-giro, arrastre con inercia, scroll)
     ---------------------------------------------------------------------- */
  seguro('anillo', () => {
    const esc = $('#escena'), ring = $('#anillo'); if (!esc || !ring) return;
    const caras = $$('.cara', ring), dots = $$('[data-dot]'), infos = $$('.info');
    let ang = 0, vel = 0, drag = false, cap = false, lastX = 0, lastT = 0, moved = 0;
    let objetivo = null, pausaHasta = 0, activa = 0, vis = true, lastY = scrollY;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; })).observe(esc);

    function fijarInfo(i) {
      activa = i;
      infos.forEach((el, k) => el.classList.toggle('activa', k === i));
      dots.forEach((d, k) => d.setAttribute('aria-selected', String(k === i)));
    }
    function aplicar() {
      ring.style.setProperty('--a', ang.toFixed(2) + 'deg');
      for (let i = 0; i < caras.length; i++) {
        const cs = Math.cos((ang + i * 90) * Math.PI / 180);
        caras[i].style.setProperty('--o', (.6 + .4 * Math.max(0, cs)).toFixed(2));
      }
      const idx = ((Math.round(-ang / 90) % 4) + 4) % 4;
      if (idx !== activa) fijarInfo(idx);
    }
    function seleccionar(i) {
      i = ((i % 4) + 4) % 4;
      const base = -i * 90, k = Math.round((ang - base) / 360);
      objetivo = base + k * 360; vel = 0; pausaHasta = performance.now() + 4500;
      fijarInfo(i);
    }
    esc.addEventListener('pointerdown', e => { drag = true; cap = false; moved = 0; lastX = e.clientX; lastT = performance.now(); vel = 0; objetivo = null; });
    esc.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      if (!cap && moved > 6) { cap = true; esc.classList.add('arrastra'); try { esc.setPointerCapture(e.pointerId); } catch (_) { } }
      if (cap) { ang += dx * .4; vel = dx * .4; lastT = performance.now(); }
    });
    const fin = e => {
      if (!drag) return; drag = false; esc.classList.remove('arrastra');
      if (!cap && e && e.type === 'pointerup' && e.target.closest) { const c = e.target.closest('.cara'); if (c) seleccionar(caras.indexOf(c)); }
      if (performance.now() - lastT > 90) vel = 0;
      pausaHasta = performance.now() + 3500; cap = false;
    };
    esc.addEventListener('pointerup', fin); esc.addEventListener('pointercancel', fin); esc.addEventListener('pointerleave', fin);
    $$('[data-ring]').forEach(b => b.addEventListener('click', () => seleccionar(activa + (b.dataset.ring === 'next' ? 1 : -1))));
    dots.forEach((d, i) => d.addEventListener('click', () => seleccionar(i)));
    esc.addEventListener('keydown', e => { if (e.key === 'ArrowRight') seleccionar(activa + 1); if (e.key === 'ArrowLeft') seleccionar(activa - 1); });

    aplicar();
    tareas.push((t, dt) => {
      const dy = S.y - lastY; lastY = S.y;
      if (!vis) return;
      const k = dt / 16.67;
      if (drag) { /* el ángulo lo mueve el puntero */ }
      else if (objetivo !== null) {
        ang += (objetivo - ang) * Math.min(1, .1 * k);
        if (Math.abs(objetivo - ang) < .15) { ang = objetivo; objetivo = null; pausaHasta = t + 4500; }
      } else {
        ang += vel * k; vel *= Math.pow(.95, k);
        if (Math.abs(vel) < .03) { vel = 0; if (!reduce && t > pausaHasta) ang -= .12 * k; }
        if (Math.abs(dy) < 300) ang += dy * .05;
      }
      aplicar();
    });
  });

  /* ----------------------------------------------------------------------
     14. Inclinación 3D de elementos con [data-tilt] (tríptico)
     ---------------------------------------------------------------------- */
  seguro('tilt', () => {
    if (!fino || reduce) return;
    $$('[data-tilt]').forEach(el => {
      const max = +el.dataset.tilt || 8, marco = $('.tri-marco', el) || el;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
        marco.style.setProperty('--rx', (-ny * max * 2).toFixed(2) + 'deg');
        marco.style.setProperty('--ry', (nx * max * 2).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => { marco.style.setProperty('--rx', '0deg'); marco.style.setProperty('--ry', '0deg'); });
    });
  });

  /* ----------------------------------------------------------------------
     15. Receta: copa que se llena según el paso activo
     ---------------------------------------------------------------------- */
  seguro('receta', () => {
    const copa = $('#copa'), lista = $('#pasos-r'), card = $('#rec-card'); if (!copa || !lista) return;
    const pasos = $$('li', lista), capas = $$('.capa', copa), txt = $('[data-copa-txt]');
    const niveles = [150, 150, 150, 66, 28, 24];
    const nombres = ['Hierve las setas', 'Agrega el jugo de limón', 'Mezcla los ingredientes', 'Incorpora las setas', 'Sirve y decora'];
    let n = 0, bloqueo = 0;
    function fijar(k) {
      if (k === n) return; n = k;
      pasos.forEach((li, i) => li.classList.toggle('activo', i === k - 1));
      capas.forEach(c => c.classList.toggle('on', +c.dataset.min <= k));
      copa.style.setProperty('--nivel', niveles[k] + 'px');
      copa.dataset.paso = k;
      if (txt) txt.textContent = 'Paso ' + k + ' · ' + nombres[k - 1];
    }
    fijar(1);
    pasos.forEach((li, i) => li.addEventListener('click', () => { bloqueo = performance.now() + 2800; fijar(i + 1); }));
    let c = 0;
    tareas.push(t => {
      if ((c++ % 4) !== 0 || t < bloqueo || !card) return;
      const rc = card.getBoundingClientRect();
      if (rc.bottom < 0 || rc.top > S.vh) return;
      let mejor = 0, dmin = 1e9;
      pasos.forEach((li, i) => { const r = li.getBoundingClientRect(); const d = Math.abs(r.top + r.height / 2 - S.vh * .5); if (d < dmin) { dmin = d; mejor = i; } });
      fijar(mejor + 1);
    });
  });

  /* ----------------------------------------------------------------------
     16. Galería: parallax por tile + visor a pantalla completa
     ---------------------------------------------------------------------- */
  const visor = { abrir: null };
  seguro('visor', () => {
    const dlg = $('#visor'); if (!dlg) return;
    const img = $('#v-img'), cap = $('#v-cap');
    let lista = [], idx = 0, x0 = null;
    function mostrar(i) {
      idx = (i + lista.length) % lista.length;
      const it = lista[idx];
      img.src = it.src; img.alt = it.alt;
      cap.textContent = it.alt + (lista.length > 1 ? ' · ' + (idx + 1) + ' / ' + lista.length : '');
      $$('.v-nav', dlg).forEach(b => { b.hidden = lista.length < 2; });
    }
    function cerrar() {
      if (dlg.close) { if (dlg.open) dlg.close(); } else dlg.removeAttribute('open');
      H.classList.remove('bloqueado');
    }
    visor.abrir = (items, i) => {
      lista = items;
      if (dlg.showModal) { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', '');
      H.classList.add('bloqueado');
      mostrar(i);
      const b = $('.v-cerrar', dlg); if (b) b.focus();
    };
    dlg.addEventListener('close', () => H.classList.remove('bloqueado'));
    dlg.addEventListener('click', e => {
      const b = e.target.closest('[data-v]');
      if (b) { const a = b.dataset.v; if (a === 'cerrar') cerrar(); else mostrar(idx + (a === 'next' ? 1 : -1)); return; }
      if (e.target === dlg || e.target.classList.contains('visor-in')) cerrar();
    });
    dlg.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') mostrar(idx + 1);
      else if (e.key === 'ArrowLeft') mostrar(idx - 1);
      else if (e.key === 'Escape' && !dlg.showModal) cerrar();
      else if (e.key === 'Tab' && !dlg.showModal) {          // foco atrapado si no hay <dialog> nativo
        const f = $$('button', dlg).filter(b => !b.hidden); if (!f.length) return;
        const a = D.activeElement, i = f.indexOf(a);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    dlg.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    dlg.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) mostrar(idx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  });

  seguro('galeria', () => {
    const bento = $('#bento'); if (!bento) return;
    const tiles = $$('.tile', bento);
    const items = tiles.map(t => { const im = $('img', t); return { src: im.currentSrc || im.src, alt: im.alt }; });
    tiles.forEach((t, i) => t.addEventListener('click', () => {
      const im = $('img', t); items[i] = { src: im.currentSrc || im.src, alt: im.alt };
      if (visor.abrir) visor.abrir(items, i);
    }));
    const un = $('[data-visor-uno]');
    if (un) un.addEventListener('click', () => { if (visor.abrir) visor.abrir([{ src: un.dataset.visorUno, alt: un.dataset.alt || 'Etiqueta nutrimental' }], 0); });

    if (reduce) return;
    const ins = tiles.map(t => $('.tile-in', t));
    tareas.push(() => {
      const rb = bento.getBoundingClientRect();
      if (rb.bottom < -100 || rb.top > S.vh + 100) return;
      const amp0 = S.vw < 640 ? 10 : 24;
      for (let i = 0; i < tiles.length; i++) {
        const r = tiles[i].getBoundingClientRect();
        if (r.bottom < -50 || r.top > S.vh + 50) continue;
        const off = clamp((r.top + r.height / 2 - S.vh / 2) / S.vh, -1, 1);
        const amp = amp0 * (.55 + (i % 3) * .3) * (i % 2 ? -1 : 1);
        const esc = 1 + (Math.abs(amp) * 2 + 4) / Math.max(80, r.height);
        ins[i].style.transform = 'translate3d(0,' + (off * amp).toFixed(1) + 'px,0) scale(' + esc.toFixed(3) + ')';
      }
    });
  });

  /* ----------------------------------------------------------------------
     17. Formulario → WhatsApp
     ---------------------------------------------------------------------- */
  seguro('formulario', () => {
    const f = $('#form'); if (!f) return;
    const nombre = $('#f-nombre'), err = $('#err-nombre'), ok = $('#form-ok'), btn = $('#f-enviar');
    if (!hayWA) {
      if (btn) btn.hidden = true;
      if (ok) { ok.hidden = false; ok.textContent = 'Por ahora el envío por WhatsApp no está disponible. Llámanos al 722 629 7781.'; }
      return;
    }
    nombre.addEventListener('input', () => { if (nombre.value.trim()) { nombre.classList.remove('invalido'); err.hidden = true; } });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const nom = nombre.value.trim();
      if (!nom) { nombre.classList.add('invalido'); err.hidden = false; nombre.focus(); return; }
      const prod = $('#f-prod').value || 'sus productos';
      const cant = $('#f-cant').value.trim();
      const msg = $('#f-msg').value.trim();
      const texto = ('Hola NutriZ 👋 Soy ' + nom + '. Me interesa: ' + prod + '.' + (cant ? ' Necesito: ' + cant + '.' : '') + (msg ? ' ' + msg : '') + ' ¡Quedo al pendiente!').replace(/\s+/g, ' ');
      const a = D.createElement('a');
      a.href = waLink(texto); a.target = '_blank'; a.rel = 'noopener noreferrer';
      D.body.appendChild(a); a.click(); a.remove();
      if (ok) ok.hidden = false;
    });
  });

  /* ----------------------------------------------------------------------
     18. Botón flotante: se oculta mientras el formulario está en pantalla
     ---------------------------------------------------------------------- */
  seguro('flotante', () => {
    const flot = $('#wa-flot'), card = $('#form-card'); if (!flot || !card) return;
    let c = 0;
    tareas.push(() => {
      if ((c++ % 8) !== 0) return;
      const r = card.getBoundingClientRect();
      flot.classList.toggle('oculto', r.top < S.vh * .85 && r.bottom > S.vh * .15);
    });
  });

  /* ----------------------------------------------------------------------
     19. Pie: texto gigante con parallax leve
     ---------------------------------------------------------------------- */
  seguro('pie', () => {
    const g = $('.pie-gigante span'); if (!g || reduce) return;
    tareas.push(() => {
      const m = M.pie; if (!m) return;
      if (S.y + S.vh < m.top || S.y > m.top + m.h) return;
      const p = clamp((S.y + S.vh - m.top) / (S.vh + m.h));
      g.style.setProperty('--py', ((1 - p) * -34 + 12).toFixed(1) + 'px');
    });
  });

  /* ----------------------------------------------------------------------
     Arranque
     ---------------------------------------------------------------------- */
  medir();
  addEventListener('load', () => { medir(); setTimeout(medir, 600); setTimeout(medir, 2000); });
  addEventListener('resize', () => { medir(); });
  if (D.fonts && D.fonts.ready) D.fonts.ready.then(medir);
  if ('ResizeObserver' in window) new ResizeObserver(() => medir()).observe(D.body);
  requestAnimationFrame(frame);
})();
