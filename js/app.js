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
        const imgs = (f.images || []).map((i) => `<img src="${esc(i.src)}" alt="${esc(i.alt)}" loading="lazy">`).join('');
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

  function bind() {
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && location.hash) close(); });
  window.addEventListener('hashchange', show);

  // ---------- vista previa desde el editor ----------
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'portfolio:preview' && e.data.site) {
      if (e.data.open !== undefined) history.replaceState('', '', location.pathname + location.search + (e.data.open ? '#' + e.data.open : ''));
      render(e.data.site);
    }
  });

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
