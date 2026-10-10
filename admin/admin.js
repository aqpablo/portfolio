/* =========================================================
   Editor del portfolio
   Lee ../content/site.json, permite editarlo con formularios
   y muestra los cambios en vivo. Al terminar se descarga el
   site.json y se reemplaza en el repositorio.
   ========================================================= */
(function () {
  'use strict';

  const DRAFT_KEY = 'portfolio-editor-draft';
  const state = { site: null, original: '', tab: 'hero', openCase: '', open: new Set() };

  // ---------- helpers de datos ----------
  const get = (o, p) => p.reduce((a, k) => (a == null ? a : a[k]), o);
  const set = (o, p, v) => { const last = p[p.length - 1]; get(o, p.slice(0, -1))[last] = v; };
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const key = (p) => p.join('.');

  // ---------- helpers de DOM ----------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach((k) => k != null && k !== false && el.append(k.nodeType ? k : document.createTextNode(k)));
    return el;
  }
  const hint = (html) => { const p = h('p', { class: 'hint' }); p.innerHTML = html; return p; };

  // ---------- cambios ----------
  let timer = null;
  function changed() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state.site)); } catch (e) { /* sin almacenamiento */ }
    updateStatus();
    clearTimeout(timer);
    timer = setTimeout(preview, 200);
  }
  function updateStatus() {
    const dirty = JSON.stringify(state.site) !== state.original;
    const st = document.getElementById('status');
    st.textContent = dirty ? 'Cambios sin descargar' : 'Sin cambios';
    st.classList.toggle('dirty', dirty);
  }
  function preview() {
    const f = document.getElementById('frame');
    if (!f.contentWindow || !state.site) return;
    const open = state.tab === 'cases' ? state.openCase : '';
    f.contentWindow.postMessage({ type: 'portfolio:preview', site: state.site, open }, '*');
  }

  // ---------- campos ----------
  // tipos: text, textarea, lines (lista, uno por línea), paras (párrafos separados por línea en blanco),
  //        select, check, color, code
  function field(label, path, kind = 'text', opts = {}) {
    const v = get(state.site, path);
    const toText = { lines: (a) => (a || []).join('\n'), paras: (a) => (a || []).join('\n\n') }[kind];
    const fromText = {
      lines: (t) => t.split('\n').map((s) => s.trim()).filter(Boolean),
      paras: (t) => t.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
    }[kind];

    if (kind === 'check') {
      const cb = h('input', { type: 'checkbox', checked: !!v, onchange: (e) => { set(state.site, path, e.target.checked); opts.structural ? rerender() : changed(); } });
      return h('label', { class: 'check' }, cb, label);
    }
    if (kind === 'select') {
      const sel = h('select', { onchange: (e) => { set(state.site, path, opts.number ? Number(e.target.value) : e.target.value); opts.structural ? rerender() : changed(); } },
        opts.options.map(([val, txt]) => h('option', { value: val, selected: String(val) === String(v) }, txt)));
      return h('label', { class: 'field' }, h('span', {}, label), sel);
    }
    if (kind === 'color') {
      const txt = h('input', { type: 'text', value: v || '' });
      const pick = h('input', { type: 'color', value: /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000' });
      pick.addEventListener('input', () => { txt.value = pick.value.toUpperCase(); set(state.site, path, txt.value); changed(); });
      txt.addEventListener('input', () => { set(state.site, path, txt.value.trim()); if (/^#[0-9a-f]{6}$/i.test(txt.value.trim())) pick.value = txt.value.trim(); changed(); });
      return h('label', { class: 'field' }, h('span', {}, label), h('div', { class: 'color' }, pick, txt));
    }
    const multi = kind !== 'text';
    const el = multi
      ? h('textarea', { rows: opts.rows || (kind === 'code' ? 8 : kind === 'textarea' ? 3 : 4), class: kind === 'code' ? 'code' : null, spellcheck: kind === 'code' ? 'false' : 'true' })
      : h('input', { type: 'text' });
    el.value = toText ? toText(v) : (v ?? '');
    el.addEventListener('input', () => { set(state.site, path, fromText ? fromText(el.value) : el.value); changed(); });
    return h('label', { class: 'field' }, h('span', {}, label), el, opts.hint ? hint(opts.hint) : null);
  }

  // ---------- listas (agregar, borrar, reordenar) ----------
  function list(path, { label, make, body, tag, addLabel = 'Agregar', open = false }) {
    const arr = get(state.site, path) || [];
    const wrap = h('div', { class: 'list' });
    arr.forEach((item, i) => {
      const p = [...path, i];
      const k = key(p);
      const tools = h('span', { class: 'tools' },
        h('button', { type: 'button', title: 'Subir', 'aria-label': 'Subir', disabled: i === 0, onclick: (e) => { e.preventDefault(); move(path, i, -1); } }, '↑'),
        h('button', { type: 'button', title: 'Bajar', 'aria-label': 'Bajar', disabled: i === arr.length - 1, onclick: (e) => { e.preventDefault(); move(path, i, 1); } }, '↓'),
        h('button', { type: 'button', title: 'Eliminar', 'aria-label': 'Eliminar', class: 'del', onclick: (e) => { e.preventDefault(); if (confirm('¿Eliminar este elemento?')) { arr.splice(i, 1); rerender(); } } }, '✕'));
      const det = h('details', { class: 'item', open: open || state.open.has(k) },
        h('summary', {}, h('span', { class: 'lbl' }, label(item, i) || '(sin título)'), tag ? h('span', { class: 'tag' }, tag(item)) : null, tools),
        h('div', { class: 'inner' }, body(p, item)));
      det.addEventListener('toggle', () => { det.open ? state.open.add(k) : state.open.delete(k); if (path[0] === 'cases' && path.length === 1) { state.openCase = det.open ? item.id : ''; preview(); } });
      wrap.append(det);
    });
    if (make) wrap.append(h('button', { type: 'button', class: 'btn small add', onclick: () => { arr.push(make()); set(state.site, path, arr); state.open.add(key([...path, arr.length - 1])); rerender(); } }, '+ ' + addLabel));
    return wrap;
  }
  function move(path, i, d) {
    const arr = get(state.site, path); const j = i + d;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    const ki = key([...path, i]), kj = key([...path, j]);
    const oi = state.open.has(ki), oj = state.open.has(kj);
    state.open.delete(ki); state.open.delete(kj);
    if (oi) state.open.add(kj); if (oj) state.open.add(ki);
    rerender();
  }
  const group = (title, ...kids) => h('div', { class: 'group' }, title ? h('h3', {}, title) : null, ...kids);
  const pair = (a, b) => h('div', { class: 'grid2' }, a, b);

  // ---------- bloques de los casos ----------
  const BLOCK_TYPES = [
    ['lead', 'Introducción destacada'], ['text', 'Texto'], ['list', 'Lista con viñetas'], ['steps', 'Pasos numerados'],
    ['beforeAfter', 'Antes / después'], ['cards', 'Tarjetas (título + texto)'], ['kpis', 'Números destacados'],
    ['views', 'Filas (título, subtítulo, texto)'], ['stages', 'Etapas en columnas'], ['callout', 'Recuadro destacado'],
    ['gallery', 'Imágenes'], ['diagram', 'Diagrama (SVG)'], ['chips', 'Chips'],
  ];
  const TYPE_NAME = Object.fromEntries(BLOCK_TYPES);
  const pairs = (p, a, b, la, lb) => list(p, { label: (x) => x[a], make: () => ({ [a]: '', [b]: '' }), body: (q) => [field(la, [...q, a]), field(lb, [...q, b], 'textarea')], addLabel: 'Agregar' });

  function blockBody(p, b) {
    const out = [field('Tipo de bloque', [...p, 'type'], 'select', { options: BLOCK_TYPES, structural: true })];
    const intro = () => field('Párrafos antes', [...p, 'intro'], 'paras', { hint: 'Separá los párrafos con una línea en blanco.' });
    const outro = () => field('Párrafos después', [...p, 'outro'], 'paras');
    const title = () => field('Título', [...p, 'title']);
    switch (b.type) {
      case 'lead': out.push(title(), field('Párrafo destacado', [...p, 'lead'], 'textarea', { rows: 4 }), intro()); break;
      case 'text': out.push(title(), intro(), outro()); break;
      case 'list': case 'steps':
        out.push(title(), intro(), field('Elementos', [...p, 'items'], 'lines', { rows: 6, hint: 'Uno por línea.' }), outro()); break;
      case 'chips': out.push(title(), intro(), field('Chips', [...p, 'items'], 'lines', { hint: 'Uno por línea. Empezá con <code>*</code> para destacarlo.' }), field('Nota al pie', [...p, 'note'])); break;
      case 'beforeAfter':
        b.before = b.before || { title: 'Antes', items: [] }; b.after = b.after || { title: 'Después', items: [] };
        out.push(title(), intro(),
          pair(field('Título izquierda', [...p, 'before', 'title']), field('Título derecha', [...p, 'after', 'title'])),
          pair(field('Puntos izquierda', [...p, 'before', 'items'], 'lines', { rows: 6 }), field('Puntos derecha', [...p, 'after', 'items'], 'lines', { rows: 6 })), outro()); break;
      case 'cards': out.push(title(), intro(), pairs([...p, 'items'], 'title', 'text', 'Título', 'Texto'), outro()); break;
      case 'kpis': out.push(title(), intro(), pairs([...p, 'items'], 'value', 'text', 'Número o dato', 'Explicación'), outro()); break;
      case 'callout': out.push(field('Etiqueta', [...p, 'eyebrow']), field('Título', [...p, 'title']), pairs([...p, 'items'], 'title', 'text', 'Título', 'Texto')); break;
      case 'views':
        out.push(title(), intro(), list([...p, 'items'], { label: (x) => x.title, make: () => ({ title: '', subtitle: '', text: '' }),
          body: (q) => [pair(field('Título', [...q, 'title']), field('Subtítulo', [...q, 'subtitle'])), field('Texto', [...q, 'text'], 'textarea')] })); break;
      case 'stages':
        out.push(title(), intro(), list([...p, 'items'], { label: (x) => x.title, make: () => ({ eyebrow: '', title: '', items: [] }),
          body: (q) => [pair(field('Etiqueta', [...q, 'eyebrow']), field('Título', [...q, 'title'])), field('Puntos', [...q, 'items'], 'lines', { rows: 5 })] }), outro()); break;
      case 'gallery':
        out.push(title(), intro(), field('Disposición', [...p, 'columns'], 'select', { options: [[1, 'Una columna'], [2, 'Dos columnas']], number: true }),
          hint('Subí las imágenes a la carpeta <code>img/</code> del repositorio y escribí acá la ruta, por ejemplo <code>img/mi-captura.jpg</code>.'),
          list([...p, 'figures'], { label: (x) => x.caption, make: () => ({ images: [{ src: 'img/', alt: '' }], caption: '' }),
            body: (q) => [field('Epígrafe', [...q, 'caption'], 'textarea'),
              list([...q, 'images'], { label: (x) => x.src, make: () => ({ src: 'img/', alt: '' }), addLabel: 'Agregar imagen',
                body: (r) => [field('Ruta del archivo', [...r, 'src']), field('Descripción (para accesibilidad)', [...r, 'alt'])] })], addLabel: 'Agregar figura' })); break;
      case 'diagram':
        out.push(title(), intro(), field('Epígrafe', [...p, 'caption']), field('Código SVG', [...p, 'svg'], 'code', { hint: 'Avanzado: solo si sabés lo que estás cambiando.' })); break;
    }
    if (b.type !== 'chips') out.push(field('Nota al pie', [...p, 'note']));
    return out;
  }

  // ---------- pestañas ----------
  const TONES = [['tang', 'Tono 1 · naranja'], ['olive', 'Tono 2 · oliva'], ['butter', 'Tono 3 · manteca'], ['sky', 'Tono 4 · celeste']];
  const SECTION_NAMES = { cases: 'Casos de estudio', work: 'Otros trabajos', method: 'Cómo trabajo' };

  const TABS = {
    hero: ['Portada', () => [
      group('Portada',
        field('Título', ['hero', 'title'], 'text', { hint: 'Encerrá una palabra entre <code>*asteriscos*</code> para resaltarla en color.' }),
        field('Bajada', ['hero', 'lede'], 'textarea'),
        field('Quién soy', ['hero', 'who'], 'textarea', { hint: 'Cada línea se muestra en un renglón.' })),
      group('Datos de la página',
        field('Título de la pestaña del navegador', ['meta', 'title']),
        field('Descripción para buscadores', ['meta', 'description'], 'textarea'),
        pair(field('Texto del botón de las tarjetas', ['meta', 'cardCta']), field('Texto del botón Volver', ['meta', 'backLabel']))),
      hint('En cualquier texto podés usar <code>**negrita**</code> y <code>*cursiva*</code>.'),
    ]],
    sections: ['Secciones', () => [
      hint('Ordená las secciones de la página principal y elegí cuáles se muestran. La portada y el pie siempre están.'),
      list(['sections'], {
        label: (s) => SECTION_NAMES[s.id] || s.id, tag: (s) => (s.visible === false ? 'oculta' : 'visible'), make: null,
        body: (p, s) => [field('Mostrar esta sección', [...p, 'visible'], 'check', { structural: true }), field('Título', [...p, 'title']),
          s.id !== 'method' ? field('Etiqueta a la derecha', [...p, 'eyebrow']) : null],
      }),
    ]],
    cases: ['Casos', () => [
      hint('Abrí un caso para editarlo: la vista previa muestra el detalle de ese caso.'),
      list(['cases'], {
        label: (c) => c.title, tag: (c) => (c.visible === false ? 'oculto' : c.id), addLabel: 'Agregar caso',
        make: () => ({ id: 'caso-' + Date.now().toString(36), visible: true, tone: 'tang', kind: '', title: 'Nuevo caso', facts: [{ label: 'Cliente', value: '' }, { label: 'Período', value: '' }, { label: 'Escala', value: '' }], chips: [], tldr: '', detail: { chipGroups: [{ label: '', items: [] }], summary: [{ label: 'Cliente', value: '' }, { label: 'Período', value: '' }, { label: 'Rol', value: '' }], blocks: [{ type: 'lead', title: '', lead: '', intro: [], outro: [] }] } }),
        body: (p, c) => [
          group('Tarjeta en la portada',
            pair(field('Título', [...p, 'title']), field('Etiqueta superior', [...p, 'kind'])),
            pair(field('Color', [...p, 'tone'], 'select', { options: TONES }), field('Identificador (en la URL)', [...p, 'id'], 'text', { hint: 'Sin espacios ni acentos.' })),
            field('Mostrar este caso', [...p, 'visible'], 'check', { structural: true }),
            list([...p, 'facts'], { label: (f) => `${f.label}: ${f.value}`, make: () => ({ label: '', value: '' }), body: (q) => [pair(field('Dato', [...q, 'label']), field('Valor', [...q, 'value']))], addLabel: 'Agregar dato' }),
            field('Chips', [...p, 'chips'], 'lines', { hint: 'Uno por línea. Empezá con <code>*</code> para destacarlo.' }),
            field('Resumen', [...p, 'tldr'], 'textarea')),
          group('Encabezado del caso',
            list([...p, 'detail', 'chipGroups'], { label: (g, i) => g.label || `Grupo de chips ${i + 1}`, make: () => ({ label: '', items: [] }), addLabel: 'Agregar grupo de chips',
              body: (q) => [field('Etiqueta del grupo (opcional)', [...q, 'label']), field('Chips', [...q, 'items'], 'lines', { hint: 'Uno por línea. Empezá con <code>*</code> para destacarlo.' })] })),
          group('Ficha del proyecto',
            list([...p, 'detail', 'summary'], { label: (s) => s.label, make: () => ({ label: '', value: '' }), addLabel: 'Agregar dato',
              body: (q) => [field('Dato', [...q, 'label']), field('Valor', [...q, 'value'], 'textarea')] })),
          group('Contenido del caso',
            list([...p, 'detail', 'blocks'], { label: (b) => b.title || b.eyebrow || (b.lead || '').slice(0, 60), tag: (b) => TYPE_NAME[b.type] || b.type, addLabel: 'Agregar bloque',
              make: () => ({ type: 'text', title: 'Nuevo bloque', intro: [], outro: [] }), body: blockBody })),
        ],
      }),
    ]],
    work: ['Otros trabajos', () => [
      list(['work'], { label: (w) => w.title, addLabel: 'Agregar trabajo',
        make: () => ({ title: 'Nuevo trabajo', paragraphs: [], chips: [] }),
        body: (p) => [field('Título', [...p, 'title']), field('Párrafos', [...p, 'paragraphs'], 'paras', { rows: 6, hint: 'Separá los párrafos con una línea en blanco.' }), field('Chips', [...p, 'chips'], 'lines')] }),
    ]],
    method: ['Cómo trabajo', () => [
      hint('Los números (01, 02…) se ponen solos según el orden.'),
      list(['method'], { label: (s) => s.title, addLabel: 'Agregar paso', make: () => ({ title: '', text: '' }),
        body: (p) => [field('Título', [...p, 'title']), field('Texto', [...p, 'text'], 'textarea')] }),
    ]],
    footer: ['Pie', () => [
      field('Nombre', ['footer', 'name']),
      list(['footer', 'contacts'], { label: (c) => c.text, addLabel: 'Agregar contacto', make: () => ({ text: '', href: '' }),
        body: (p) => [field('Texto', [...p, 'text']), field('Enlace (opcional)', [...p, 'href'], 'text', { hint: 'Ejemplos: <code>mailto:tu@mail.com</code>, <code>https://linkedin.com/in/…</code>, <code>https://wa.me/549…</code>' })] }),
    ]],
    design: ['Diseño', designTab],
  };

  const COLOR_NAMES = {
    ground: 'Fondo de la página', surface: 'Fondo de tarjetas', ink: 'Texto principal', muted: 'Texto secundario', line: 'Bordes', chip: 'Fondo de chips',
    tang: 'Tono 1 · fuerte', 'tang-soft': 'Tono 1 · suave', olive: 'Tono 2 · fuerte', 'olive-soft': 'Tono 2 · suave',
    butter: 'Tono 3 · fuerte', 'butter-soft': 'Tono 3 · suave', sky: 'Tono 4 · fuerte', 'sky-soft': 'Tono 4 · suave',
  };
  const FONT_SUGGESTIONS = ['Schibsted Grotesk', 'Instrument Sans', 'Courier Prime', 'Inter Tight', 'DM Sans', 'Manrope', 'Space Grotesk', 'Work Sans', 'IBM Plex Sans', 'IBM Plex Mono', 'Fraunces', 'Newsreader', 'Bricolage Grotesque', 'Archivo', 'Familjen Grotesk', 'JetBrains Mono', 'DM Mono', 'Source Serif 4'];

  function designTab() {
    const t = state.site.theme;
    const colors = (mode) => Object.keys(t[mode]).map((k) => field(COLOR_NAMES[k] || k, ['theme', mode, k], 'color'));
    const font = (role, label) => group(label,
      field('Fuente de Google Fonts', ['theme', 'fonts', role, 'family'], 'text', { hint: 'El nombre tal como figura en fonts.google.com.' }),
      pair(field('Fuente instalada preferida (opcional)', ['theme', 'fonts', role, 'local']), field('Grosores', ['theme', 'fonts', role, 'weights'], 'text', { hint: 'Ej.: <code>400;600;700</code>' })));
    const dl = h('datalist', { id: 'font-list' }, FONT_SUGGESTIONS.map((f) => h('option', { value: f })));
    const out = [
      group('Colores · tema claro', h('div', { class: 'grid2' }, colors('light'))),
      group('Colores · tema oscuro', hint('Se usa cuando el visitante tiene el sistema en modo oscuro.'), h('div', { class: 'grid2' }, colors('dark'))),
      font('display', 'Tipografía de títulos'), font('body', 'Tipografía de texto'), font('mono', 'Tipografía de etiquetas y chips'), dl,
    ];
    setTimeout(() => document.querySelectorAll('.form input[type=text]').forEach((i) => { if (/Google Fonts/.test(i.closest('.field')?.textContent || '')) i.setAttribute('list', 'font-list'); }));
    return out;
  }

  // ---------- render del panel ----------
  function rerender() {
    const form = document.getElementById('form');
    const scroll = form.scrollTop;
    form.replaceChildren(...TABS[state.tab][1]().flat().filter(Boolean));
    form.scrollTop = scroll;
    changed();
  }
  function renderTabs() {
    const nav = document.getElementById('tabs');
    nav.replaceChildren(...Object.entries(TABS).map(([id, [name]]) =>
      h('button', { role: 'tab', 'aria-selected': String(id === state.tab), onclick: () => { state.tab = id; renderTabs(); document.getElementById('form').scrollTop = 0; rerender(); } }, name)));
  }

  // ---------- archivo ----------
  function download() {
    const blob = new Blob([JSON.stringify(state.site, null, 2) + '\n'], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: 'site.json' });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    state.original = JSON.stringify(state.site);
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* nada */ }
    updateStatus();
    alert('Listo. Reemplazá el archivo content/site.json de tu repositorio por el que acabás de descargar.');
  }

  function start(site) {
    state.site = site;
    renderTabs(); rerender(); updateStatus();
  }

  document.getElementById('download').addEventListener('click', download);
  document.getElementById('reset').addEventListener('click', () => {
    if (!confirm('¿Descartar todos los cambios y volver a la versión publicada?')) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* nada */ }
    state.open.clear(); start(JSON.parse(state.original));
  });
  document.getElementById('open').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then((t) => { try { start(JSON.parse(t)); } catch (err) { alert('Ese archivo no es un site.json válido.'); } });
    e.target.value = '';
  });
  document.getElementById('widths').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-w]'); if (!b) return;
    document.querySelectorAll('#widths button').forEach((x) => x.classList.toggle('on', x === b));
    document.getElementById('frame').style.width = b.dataset.w;
  });
  document.getElementById('frame').addEventListener('load', () => setTimeout(preview, 300));

  fetch('../content/site.json', { cache: 'no-cache' })
    .then((r) => r.json())
    .then((site) => {
      state.original = JSON.stringify(site);
      let draft = null;
      try { draft = localStorage.getItem(DRAFT_KEY); } catch (e) { /* nada */ }
      if (draft && draft !== state.original) {
        const dlg = document.getElementById('draft');
        dlg.addEventListener('close', () => {
          if (dlg.returnValue === 'restore') start(JSON.parse(draft));
          else { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* nada */ } start(site); }
        }, { once: true });
        dlg.showModal();
      } else start(site);
    })
    .catch(() => { document.getElementById('status').textContent = 'No se pudo leer content/site.json (abrilo desde GitHub Pages o un servidor local).'; });
})();
