/* =========================================================
   Portfolio · arma la página a partir de content/site.json
   No hace falta tocar este archivo para cambiar textos o
   colores: usá el editor en /admin.
   ========================================================= */
(function () {
  'use strict';

  // ---------- utilidades de texto ----------
  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // **negrita**, *énfasis* y saltos de línea
  const md = (s) => esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br>');

  const paras = (arr, cls) => (arr || []).filter(Boolean)
    .map((t) => `<p${cls ? ` class="${cls}"` : ''}>${md(t)}</p>`).join('');

  // un chip que empieza con * se destaca
  const chip = (t) => t.startsWith('*')
    ? `<span class="chip hot">${md(t.slice(1).trim())}</span>`
    : `<span class="chip">${md(t)}</span>`;
  const chips = (arr) => (arr && arr.length) ? `<div class="chips">${arr.map(chip).join('')}</div>` : '';

  // ---------- tema ----------
  function stack(f, generic) {
    const list = [];
    if (f.local) list.push(`"${f.local}"`);
    if (f.family) list.push(`"${f.family}"`);
    list.push(generic);
    return list.join(',');
  }

  function applyTheme(theme) {
    const t = theme || {};
    const f = t.fonts || {};
    const vars = (o) => Object.entries(o || {}).map(([k, v]) => `--${k}:${v};`).join('');
    const fontVars =
      `--display:${stack(f.display || {}, 'ui-sans-serif,system-ui,sans-serif')};` +
      `--body:${stack(f.body || {}, 'ui-sans-serif,system-ui,sans-serif')};` +
      `--mono:${stack(f.mono || {}, 'ui-monospace,monospace')};`;
    const css =
      `:root{${vars(t.light)}${fontVars}}` +
      `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){${vars(t.dark)}}}` +
      `:root[data-theme="dark"]{${vars(t.dark)}}`;
    let tag = document.getElementById('theme-vars');
    if (!tag) { tag = document.createElement('style'); tag.id = 'theme-vars'; document.head.appendChild(tag); }
    tag.textContent = css;

    const fams = ['display', 'body', 'mono']
      .map((k) => f[k]).filter((x) => x && x.family)
      .map((x) => `family=${encodeURIComponent(x.family).replace(/%20/g, '+')}${x.weights ? `:wght@${x.weights}` : ''}`);
    let link = document.getElementById('theme-fonts');
    if (!link) { link = document.createElement('link'); link.id = 'theme-fonts'; link.rel = 'stylesheet'; document.head.appendChild(link); }
    const href = fams.length ? `https://fonts.googleapis.com/css2?${fams.join('&')}&display=swap` : '';
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
  }

  // ---------- bloques del detalle ----------
  const head = (b) => (b.title ? `<h2>${md(b.title)}</h2>` : '') + paras(b.intro);
  const tail = (b) => paras(b.outro) + (b.caption ? `<p class="cap">${md(b.caption)}</p>` : '') + (b.note ? `<p class="note">${md(b.note)}</p>` : '');

  const BLOCKS = {
    lead: (b) => `<section>${b.title ? `<h2>${md(b.title)}</h2>` : ''}<p class="lead">${md(b.lead)}</p>${paras(b.intro)}${tail(b)}</section>`,
    text: (b) => `<section>${head(b)}${tail(b)}</section>`,
    list: (b) => `<section>${head(b)}<ul class="list">${(b.items || []).map((i) => `<li>${md(i)}</li>`).join('')}</ul>${tail(b)}</section>`,
    steps: (b) => `<section>${head(b)}<ol class="steps2">${(b.items || []).map((i) => `<li>${md(i)}</li>`).join('')}</ol>${tail(b)}</section>`,
    chips: (b) => `<section>${head(b)}${chips(b.items)}${tail(b)}</section>`,
    beforeAfter: (b) => {
      const side = (s, cls) => `<div class="${cls}"><h3>${md(s.title)}</h3><ul>${(s.items || []).map((i) => `<li>${md(i)}</li>`).join('')}</ul></div>`;
      return `<section>${head(b)}<div class="ba">${side(b.before || {}, 'before')}${side(b.after || {}, 'after')}</div>${tail(b)}</section>`;
    },
    diagram: (b) => `<section>${head(b)}<div class="diagram">${b.svg || ''}</div>${tail(b)}</section>`,
    gallery: (b) => {
      const fig = (f) => {
        const imgs = (f.images || []).map((i) => `<button type="button" class="zoom" data-caption="${esc(f.caption)}" aria-label="Ampliar imagen${i.alt ? ': ' + esc(i.alt) : ''}"><img src="${esc(i.src)}" alt="${esc(i.alt)}" loading="lazy"></button>`).join('');
        const body = (f.images || []).length > 1 ? `<div class="phones">${imgs}</div>` : imgs;
        return `<figure>${body}${f.caption ? `<figcaption>${md(f.caption)}</figcaption>` : ''}</figure>`;
      };
      return `<section>${head(b)}<div class="gallery${b.columns === 2 ? ' two' : ''}">${(b.figures || []).map(fig).join('')}</div>${tail(b)}</section>`;
    },
    cards: (b) => `<section>${head(b)}<div class="roles">${(b.items || []).map((i) => `<div><b>${md(i.title)}</b><span>${md(i.text)}</span></div>`).join('')}</div>${tail(b)}</section>`,
    kpis: (b) => `<section>${head(b)}<div class="kpis">${(b.items || []).map((i) => `<div class="kpi"><strong>${md(i.value)}</strong><span>${md(i.text)}</span></div>`).join('')}</div>${tail(b)}</section>`,
    views: (b) => `<section>${head(b)}<div class="views">${(b.items || []).map((i) => `<div class="view"><b>${md(i.title)}<small>${md(i.subtitle)}</small></b><span>${md(i.text)}</span></div>`).join('')}</div>${tail(b)}</section>`,
    stages: (b) => `<section>${head(b)}<div class="stages">${(b.items || []).map((i) => `<div class="stage"><span class="eyebrow">${md(i.eyebrow)}</span><h3>${md(i.title)}</h3><ul>${(i.items || []).map((x) => `<li>${md(x)}</li>`).join('')}</ul></div>`).join('')}</div>${tail(b)}</section>`,
    callout: (b) => `<section class="big">${b.eyebrow ? `<span class="eyebrow">${md(b.eyebrow)}</span>` : ''}<h3>${md(b.title)}</h3><div class="tiles">${(b.items || []).map((i) => `<div class="tile"><b>${md(i.title)}</b><span>${md(i.text)}</span></div>`).join('')}</div></section>`,
  };

  // ---------- secciones de la home ----------
  function renderCases(site, sec) {
    const cards = site.cases.filter((c) => c.visible !== false).map((c) => `
      <button class="card" data-tone="${esc(c.tone)}" data-case="${esc(c.id)}" aria-label="Ver caso ${esc(c.title)}">
        <div class="band"><span class="kind">${md(c.kind)}</span><h3>${md(c.title)}</h3></div>
        <div class="body">
          <dl class="facts">${(c.facts || []).map((f) => `<div><dt>${md(f.label)}</dt><dd>${md(f.value)}</dd></div>`).join('')}</dl>
          ${chips(c.chips)}
          <p class="tldr">${md(c.tldr)}</p>
          <div class="go">${md(site.meta.cardCta || 'Ver caso completo')} <span>→</span></div>
        </div>
      </button>`).join('');
    return `<div class="sec-head"><h2>${md(sec.title)}</h2>${sec.eyebrow ? `<span class="eyebrow">${md(sec.eyebrow)}</span>` : ''}</div><div class="grid">${cards}</div>`;
  }

  function renderWork(site, sec) {
    const items = (site.work || []).map((w) => `<article><h3>${md(w.title)}</h3>${paras(w.paragraphs)}${chips(w.chips)}</article>`).join('');
    return `<div class="sec-head"><h2>${md(sec.title)}</h2>${sec.eyebrow ? `<span class="eyebrow">${md(sec.eyebrow)}</span>` : ''}</div><div class="work">${items}</div>`;
  }

  function renderMethod(site, sec) {
    const steps = (site.method || []).map((s, i) => `<div><b><small>${String(i + 1).padStart(2, '0')}</small>${md(s.title)}</b><span>${md(s.text)}</span></div>`).join('');
    return `<section class="method"><h2>${md(sec.title)}</h2><div class="steps">${steps}</div></section>`;
  }

  const SECTIONS = { cases: renderCases, work: renderWork, method: renderMethod };

  function renderDetail(site, c) {
    const d = c.detail || {};
    const groups = (d.chipGroups || []).map((g) => g.label
      ? `<div class="chiprow"><span class="eyebrow">${md(g.label)}</span>${chips(g.items)}</div>`
      : chips(g.items)).join('');
    const summary = (d.summary || []).map((s) => `<div><dt>${md(s.label)}</dt><dd>${md(s.value)}</dd></div>`).join('');
    const blocks = (d.blocks || []).map((b) => (BLOCKS[b.type] || BLOCKS.text)(b)).join('');
    return `
      <article class="detail" id="${esc(c.id)}" data-tone="${esc(c.tone)}" hidden aria-label="Caso ${esc(c.title)}">
        <div class="wrap">
          <header class="d-hero">
            <span class="kind">${md(c.kind)}</span>
            <div class="d-top"><button class="back" data-close>${md(site.meta.backLabel || '← Volver')}</button><h1>${md(c.title)}</h1></div>
            ${groups}
          </header>
          <div class="d-layout">
            ${summary ? `<aside class="aside"><dl>${summary}</dl></aside>` : ''}
            <div class="content">${blocks}</div>
          </div>
        </div>
      </article>`;
  }

  function render(site) {
    applyTheme(site.theme);
    document.title = site.meta.title || document.title;

    const h = site.hero || {};
    const home = (site.sections || []).filter((s) => s.visible !== false && SECTIONS[s.id])
      .map((s) => SECTIONS[s.id](site, s)).join('');
    const contacts = (site.footer.contacts || []).map((c) => {
      const todo = /a completar/i.test(c.text) ? ' class="todo"' : '';
      return c.href ? `<a href="${esc(c.href)}"${todo}>${md(c.text)}</a>` : `<span${todo}>${md(c.text)}</span>`;
    }).join('');

    document.getElementById('app').innerHTML = `
      <div class="wrap" id="home">
        <header class="cover">
          <h1>${md(h.title)}</h1>
          <div class="side"><p class="lede">${md(h.lede)}</p><p class="who">${md(h.who)}</p></div>
        </header>
        ${home}
      </div>
      <footer class="bar"><div class="wrap"><span class="name">${md(site.footer.name)}</span><div class="contact">${contacts}</div></div></footer>
      ${site.cases.filter((c) => c.visible !== false).map((c) => renderDetail(site, c)).join('')}`;
    bind();
  }

  // ---------- navegación entre home y casos ----------
  let lastCard = null;
  function show() {
    const id = decodeURIComponent(location.hash.slice(1));
    const views = [...document.querySelectorAll('.detail')];
    views.forEach((v) => {
      const on = v.id === id;
      v.hidden = !on;
      if (on) { v.scrollTop = 0; v.classList.remove('compact'); v.querySelector('[data-close]').focus({ preventScroll: true }); }
    });
    document.body.style.overflow = views.some((v) => !v.hidden) ? 'hidden' : '';
    if (!id && lastCard) lastCard.focus({ preventScroll: true });
  }
  const close = () => { history.pushState('', document.title, location.pathname + location.search); show(); };

  // En galerías de dos columnas, cada figura toma un ancho proporcional a su imagen,
  // así todas quedan a la misma altura (sin una gigante y otra diminuta).
  function sizeGalleries() {
    document.querySelectorAll('.gallery.two figure').forEach((fig) => {
      const imgs = [...fig.querySelectorAll('img')];
      const apply = () => {
        const ratio = imgs.reduce((t, i) => t + (i.naturalWidth && i.naturalHeight ? i.naturalWidth / i.naturalHeight : 1), 0);
        fig.style.flexGrow = ratio.toFixed(3);
      };
      imgs.forEach((i) => { if (!i.complete) i.addEventListener('load', apply, { once: true }); });
      apply();
    });
  }

  // ---------- visor de imágenes ----------
  let lbList = [], lbIndex = 0;
  function lightbox() {
    let dlg = document.getElementById('lightbox');
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.id = 'lightbox';
    dlg.setAttribute('aria-label', 'Imagen ampliada');
    dlg.innerHTML = `
      <div class="lb-inner">
        <div class="lb-stage"><img alt=""></div>
        <p class="lb-cap"></p>
      </div>
      <button type="button" class="lb-btn lb-close" aria-label="Cerrar">✕</button>
      <button type="button" class="lb-btn lb-prev" aria-label="Imagen anterior">‹</button>
      <button type="button" class="lb-btn lb-next" aria-label="Imagen siguiente">›</button>`;
    document.body.appendChild(dlg);
    dlg.querySelector('.lb-close').addEventListener('click', () => dlg.close());
    dlg.querySelector('.lb-prev').addEventListener('click', () => showLb(lbIndex - 1));
    dlg.querySelector('.lb-next').addEventListener('click', () => showLb(lbIndex + 1));
    // clic en el fondo cierra
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.classList.contains('lb-inner') || e.target.classList.contains('lb-stage')) dlg.close(); });
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); showLb(lbIndex - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); showLb(lbIndex + 1); }
    });
    return dlg;
  }
  function showLb(i) {
    const dlg = lightbox();
    lbIndex = (i + lbList.length) % lbList.length;
    const btn = lbList[lbIndex];
    const src = btn.querySelector('img');
    const img = dlg.querySelector('.lb-stage img');
    const tall = src.naturalWidth && src.naturalHeight / src.naturalWidth > 1.6;
    dlg.querySelector('.lb-stage').classList.toggle('tall', !!tall);
    dlg.querySelector('.lb-stage').scrollTop = 0;
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    dlg.querySelector('.lb-cap').textContent = btn.dataset.caption || '';
    const many = lbList.length > 1;
    dlg.querySelector('.lb-prev').hidden = !many;
    dlg.querySelector('.lb-next').hidden = !many;
  }
  function openLb(btn) {
    lbList = [...btn.closest('.detail').querySelectorAll('.gallery .zoom')];
    const dlg = lightbox();
    showLb(lbList.indexOf(btn));
    if (!dlg.open) dlg.showModal();
  }

  function bind() {
    sizeGalleries();
    document.querySelectorAll('.gallery .zoom').forEach((b) => b.addEventListener('click', () => openLb(b)));
    document.querySelectorAll('.card[data-case]').forEach((c) => c.addEventListener('click', () => { lastCard = c; location.hash = c.dataset.case; }));
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', close));
    document.querySelectorAll('.detail').forEach((v) => {
      let compact = false;
      v.addEventListener('scroll', () => {
        const y = v.scrollTop;
        if (!compact && y > 140) { compact = true; v.classList.add('compact'); }
        else if (compact && y < 60) { compact = false; v.classList.remove('compact'); }
      }, { passive: true });
    });
    show();
  }
  document.addEventListener('keydown', (e) => { const lb = document.getElementById('lightbox'); if (e.key === 'Escape' && location.hash && !(lb && lb.open)) close(); });
  window.addEventListener('hashchange', show);

  // ---------- vista previa desde el editor ----------
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'portfolio:preview' && e.data.site) {
      if (e.data.open !== undefined) history.replaceState('', '', location.pathname + location.search + (e.data.open ? '#' + e.data.open : ''));
      render(e.data.site);
    }
  });

  // ---------- tema claro / oscuro ----------
  const THEME_KEY = 'portfolio-theme';
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const current = () => document.documentElement.dataset.theme || (mq.matches ? 'dark' : 'light');
  const ICONS = {
    // se muestra el ícono del tema al que se va a pasar
    dark: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M21 14.5A8.5 8.5 0 0 1 9.5 3a.75.75 0 0 0-.9-.9A10 10 0 1 0 21.9 15.4a.75.75 0 0 0-.9-.9Z"/></svg>',
    light: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>',
  };
  function paintToggle() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    const next = current() === 'dark' ? 'light' : 'dark';
    btn.innerHTML = ICONS[next];
    btn.setAttribute('aria-label', next === 'dark' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
    btn.title = btn.getAttribute('aria-label');
  }
  function themeToggle() {
    let btn = document.getElementById('theme-toggle');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'theme-toggle'; btn.type = 'button'; btn.className = 'theme-toggle';
      btn.addEventListener('click', () => {
        const next = current() === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* sin almacenamiento */ }
        paintToggle();
      });
      document.body.appendChild(btn);
    }
    paintToggle();
  }
  try { const saved = localStorage.getItem(THEME_KEY); if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved; } catch (e) { /* nada */ }
  mq.addEventListener('change', paintToggle);
  themeToggle();

  // ---------- arranque ----------
  if (window.__SITE__) { render(window.__SITE__); return; }
  fetch('content/site.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch(() => {
      document.getElementById('app').innerHTML =
        '<div class="wrap" style="padding-block:64px"><h1>No se pudo cargar el contenido</h1>' +
        '<p>Si abriste el archivo con doble clic, el navegador bloquea la lectura de <code>content/site.json</code>. ' +
        'Publicalo en GitHub Pages o abrí la carpeta con un servidor local (ver README).</p></div>';
    });
})();
