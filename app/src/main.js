// Neon Coast Cover Studio — wires the page: photos, layouts, grades, lettering,
// per-panel crop/position (drag on the preview, wheel to zoom, sliders), undo/redo,
// export at 1080x1080 / 1080x1350 / 1920x1080, and ?shot= scenes for screenshots.
import { drawCover, LAYOUTS, GRADES, TITLE_STYLES, defaultPanels, defaultState } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const state = defaultState();
let photos = [];           // [{img, name}]
let selected = 0;          // selected panel index
let history = [], future = [];
let fontsReady = false;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('60px Pacifico'),
      document.fonts.ready,
    ]);
  } catch { /* fall back to system fonts */ }
  fontsReady = true;
}

function redraw() {
  drawCover(canvas, state, photos);
}

function snapshot() { return JSON.stringify(state); }
function pushHistory() {
  history.push(snapshot());
  if (history.length > 60) history.shift();
  future = [];
  updateUndoButtons();
}
function restore(json) {
  const s = JSON.parse(json);
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, s);
  syncControls();
  redraw();
}
function undo() {
  if (!history.length) return;
  future.push(snapshot());
  restore(history.pop());
  updateUndoButtons();
}
function redo() {
  if (!future.length) return;
  history.push(snapshot());
  restore(future.pop());
  updateUndoButtons();
}
function updateUndoButtons() {
  $('undo').disabled = !history.length;
  $('redo').disabled = !future.length;
}

// ---------- controls ----------
function buildButtons() {
  const layoutEl = $('layouts');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = l.name; b.dataset.id = l.id;
    b.addEventListener('click', () => {
      if (state.layout === l.id) return;
      pushHistory();
      state.layout = l.id;
      state.panels = defaultPanels(l.id, photos.length);
      selected = 0;
      buildPanelChips(); syncControls(); redraw();
    });
    layoutEl.appendChild(b);
  });
  const gradeEl = $('grades');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip grade'; b.dataset.id = g.id;
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(135deg,${g.top.replace(/[\d.]+\)$/, '0.9)')},${g.bottom.replace(/[\d.]+\)$/, '0.9)')})"></span>${g.name}`;
    b.addEventListener('click', () => {
      if (state.grade === g.id) return;
      pushHistory(); state.grade = g.id; syncControls(); redraw();
    });
    gradeEl.appendChild(b);
  });
  const styleEl = $('titleStyles');
  TITLE_STYLES.forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = t.name; b.dataset.id = t.id;
    b.addEventListener('click', () => {
      if (state.titleStyle === t.id) return;
      pushHistory(); state.titleStyle = t.id; syncControls(); redraw();
    });
    styleEl.appendChild(b);
  });
}

function buildPanelChips() {
  const el = $('panels');
  el.innerHTML = '';
  const layout = LAYOUTS.find((l) => l.id === state.layout);
  layout.panels.forEach((_, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip panel-chip'; b.textContent = `Panel ${i + 1}`;
    b.dataset.i = i;
    b.addEventListener('click', () => { selected = i; buildPanelChips(); syncPanelControls(); redraw(); });
    el.appendChild(b);
  });
  syncPanelControls();
}

function buildPhotoList() {
  const el = $('photoList');
  el.innerHTML = '';
  photos.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip photo-chip'; b.textContent = p.name;
    b.title = 'Click to put this photo in the selected panel';
    b.addEventListener('click', () => {
      pushHistory();
      state.panels[selected] = { ...state.panels[selected], photo: i };
      syncPanelControls(); redraw();
    });
    el.appendChild(b);
  });
}

function syncControls() {
  document.querySelectorAll('#layouts .chip').forEach((b) => b.classList.toggle('on', b.dataset.id === state.layout));
  document.querySelectorAll('#grades .chip').forEach((b) => b.classList.toggle('on', b.dataset.id === state.grade));
  document.querySelectorAll('#titleStyles .chip').forEach((b) => b.classList.toggle('on', b.dataset.id === state.titleStyle));
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('tagline').value = state.tagline;
  $('frame').checked = state.frame;
  $('grain').checked = state.grain;
  $('vignette').checked = state.vignette;
  $('badge').checked = state.badge;
  buildPanelChips();
}

function syncPanelControls() {
  document.querySelectorAll('#panels .chip').forEach((b) => b.classList.toggle('on', Number(b.dataset.i) === selected));
  const p = state.panels[selected] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
  $('zoom').value = p.zoom;
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
  $('offX').value = p.ox;
  $('offY').value = p.oy;
  $('panelPhoto').textContent = photos[p.photo] ? photos[p.photo].name : '—';
  document.querySelectorAll('#photoList .chip').forEach((b, i) => b.classList.toggle('on', i === p.photo));
}

function setStatus(msg) { $('status').textContent = msg; }

// ---------- export ----------
function exportPNG(w, h, name) {
  return new Promise((resolve) => {
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    drawCover(off, state, photos);
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      resolve();
    }, 'image/png');
  });
}

async function exportAll() {
  setStatus('Exporting 3 sizes…');
  await exportPNG(1080, 1080, 'cover-1080x1080.png');
  await new Promise((r) => setTimeout(r, 350));
  await exportPNG(1080, 1350, 'cover-1080x1350.png');
  await new Promise((r) => setTimeout(r, 350));
  await exportPNG(1920, 1080, 'cover-1920x1080.png');
  setStatus('Saved 3 PNGs: 1080×1080, 1080×1350, 1920×1080.');
}

// ---------- events ----------
function wire() {
  buildButtons(); buildPanelChips();

  $('photo').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    pushHistory();
    for (const f of files) {
      try {
        const img = await loadImage(URL.createObjectURL(f));
        photos.push({ img, name: f.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Photo' });
      } catch { /* skip unreadable file */ }
    }
    buildPhotoList(); syncPanelControls(); redraw();
    setStatus(`${photos.length} photo(s) loaded. Click a panel, then click a photo to place it.`);
    e.target.value = '';
  });

  $('sampleBoulevard').addEventListener('click', async () => {
    if (photos.some((p) => p.name === 'Boulevard')) return;
    const img = await loadImage('samples/boulevard.jpg');
    photos.push({ img, name: 'Boulevard' });
    buildPhotoList(); redraw();
  });
  $('samplePier').addEventListener('click', async () => {
    if (photos.some((p) => p.name === 'Pier')) return;
    const img = await loadImage('samples/pier.jpg');
    photos.push({ img, name: 'Pier' });
    buildPhotoList(); redraw();
  });

  $('title').addEventListener('input', () => { state.title = $('title').value; redraw(); });
  $('subtitle').addEventListener('input', () => { state.subtitle = $('subtitle').value; redraw(); });
  $('tagline').addEventListener('input', () => { state.tagline = $('tagline').value; redraw(); });
  ['title', 'subtitle', 'tagline'].forEach((id) => $(id).addEventListener('change', pushHistory));

  ['frame', 'grain', 'vignette', 'badge'].forEach((id) => {
    $(id).addEventListener('change', () => { pushHistory(); state[id] = $(id).checked; redraw(); });
  });

  $('zoom').addEventListener('input', () => {
    state.panels[selected].zoom = Number($('zoom').value);
    $('zoomVal').textContent = `${Math.round(state.panels[selected].zoom * 100)}%`;
    redraw();
  });
  $('zoom').addEventListener('change', pushHistory);
  $('offX').addEventListener('input', () => { state.panels[selected].ox = Number($('offX').value); redraw(); });
  $('offX').addEventListener('change', pushHistory);
  $('offY').addEventListener('input', () => { state.panels[selected].oy = Number($('offY').value); redraw(); });
  $('offY').addEventListener('change', pushHistory);
  $('resetPanel').addEventListener('click', () => {
    pushHistory();
    state.panels[selected] = { ...state.panels[selected], zoom: 1, ox: 0, oy: 0 };
    syncPanelControls(); redraw();
  });
  $('fillAll').addEventListener('click', () => {
    pushHistory();
    const p = state.panels[selected];
    state.panels = state.panels.map((q) => ({ ...q, photo: p.photo }));
    redraw(); setStatus(`All panels now use “${photos[p.photo]?.name ?? ''}”.`);
  });

  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });

  $('surprise').addEventListener('click', () => {
    pushHistory();
    state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
    state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
    state.titleStyle = TITLE_STYLES[Math.floor(Math.random() * TITLE_STYLES.length)].id;
    state.panels = defaultPanels(state.layout, photos.length);
    selected = 0;
    syncControls(); redraw();
  });

  document.querySelectorAll('[data-preset]').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      const preset = JSON.parse(b.dataset.preset);
      Object.assign(state, preset);
      state.panels = defaultPanels(state.layout, photos.length);
      selected = 0;
      syncControls(); redraw();
    });
  });

  $('exportSquare').addEventListener('click', async () => { await exportPNG(1080, 1080, 'cover-1080x1080.png'); setStatus('Saved cover-1080x1080.png'); });
  $('exportPortrait').addEventListener('click', async () => { await exportPNG(1080, 1350, 'cover-1080x1350.png'); setStatus('Saved cover-1080x1350.png'); });
  $('exportWide').addEventListener('click', async () => { await exportPNG(1920, 1080, 'cover-1920x1080.png'); setStatus('Saved cover-1920x1080.png'); });
  $('exportAll').addEventListener('click', exportAll);

  // Drag on the preview to move the selected panel's photo; wheel to zoom.
  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    const layout = LAYOUTS.find((l) => l.id === state.layout);
    let hit = -1;
    layout.panels.forEach((p, i) => {
      if (fx >= p.x && fx <= p.x + p.w && fy >= p.y && fy <= p.y + p.h) hit = i;
    });
    if (hit >= 0) { selected = hit; syncPanelControls(); }
    dragging = { x: e.clientX, y: e.clientY, ox: state.panels[selected].ox, oy: state.panels[selected].oy, moved: false };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - dragging.x) / rect.width;
    const dy = (e.clientY - dragging.y) / rect.height;
    if (Math.abs(dx) + Math.abs(dy) > 0.002) dragging.moved = true;
    const p = state.panels[selected];
    p.ox = Math.max(-0.6, Math.min(0.6, dragging.ox + dx));
    p.oy = Math.max(-0.6, Math.min(0.6, dragging.oy + dy));
    syncPanelControls(); redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (dragging && dragging.moved) pushHistory();
    dragging = null;
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const p = state.panels[selected];
    p.zoom = Math.max(1, Math.min(3, p.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
    syncPanelControls(); redraw();
  }, { passive: false });

  // Drag & drop photos anywhere on the page.
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = [...(e.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    pushHistory();
    for (const f of files) {
      try { photos.push({ img: await loadImage(URL.createObjectURL(f)), name: f.name.replace(/\.[^.]+$/, '').slice(0, 18) }); } catch { /* skip */ }
    }
    buildPhotoList(); redraw();
  });
}

// ---------- start ----------
async function init() {
  wire();
  await ensureFonts();
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    if (shot === 'cover') {
      document.body.classList.add('shot-cover');
      // Size the canvas to the window so the cover keeps the shot's aspect.
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    await runShot(shot, params, async (opts) => {
      if (opts.layout) state.layout = opts.layout;
      if (opts.grade) state.grade = opts.grade;
      if (opts.titleStyle) state.titleStyle = opts.titleStyle;
      if (opts.subtitle !== undefined) state.subtitle = opts.subtitle;
      if (opts.tagline !== undefined) state.tagline = opts.tagline;
      state.title = opts.caption;
      state.panels = defaultPanels(state.layout, 2);
      const img = await loadImage(`samples/${opts.photo}.jpg`);
      const other = await loadImage(`samples/${opts.photo === 'pier' ? 'boulevard' : 'pier'}.jpg`);
      photos = [
        { img, name: opts.photo === 'pier' ? 'Pier' : 'Boulevard' },
        { img: other, name: opts.photo === 'pier' ? 'Boulevard' : 'Pier' },
      ];
      // In shot scenes the hero photo is the requested sample in every panel's
      // first slot; the second sample fills the remaining panels.
      state.panels = state.panels.map((p, i) => ({ ...p, photo: i === 0 ? 0 : 1 }));
      syncControls();
      redraw();
    });
    await ensureFonts();
    redraw();
    requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
    return;
  }
  // Normal use: load both samples so the cover is never empty.
  try {
    const [b, p] = await Promise.all([
      loadImage('samples/boulevard.jpg'),
      loadImage('samples/pier.jpg'),
    ]);
    photos = [{ img: b, name: 'Boulevard' }, { img: p, name: 'Pier' }];
    buildPhotoList();
  } catch { /* samples missing: user can upload */ }
  syncControls();
  redraw();
}

init();
