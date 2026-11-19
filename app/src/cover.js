// Neon Coast Cover Studio — cover engine.
// Draws a multi-panel poster-style cover onto any canvas: each panel shows one
// photo (cover-fit, with its own zoom + pan), a colour grade is applied, then
// grain, vignette, a halftone title band and bold Anton lettering finish it.
// Everything is drawn locally with the 2D canvas — no network, no libraries.

export const LAYOUTS = [
  { id: 'hero', name: 'Hero + 2', panels: [
    { x: 0.00, y: 0.00, w: 0.655, h: 0.795 },
    { x: 0.67, y: 0.00, w: 0.33, h: 0.39 },
    { x: 0.67, y: 0.405, w: 0.33, h: 0.39 },
  ] },
  { id: 'duo', name: 'Split Duo', panels: [
    { x: 0.00, y: 0.00, w: 0.492, h: 0.795 },
    { x: 0.508, y: 0.00, w: 0.492, h: 0.795 },
  ] },
  { id: 'tilted', name: 'Tilted Snaps', panels: [
    { x: 0.03, y: 0.02, w: 0.56, h: 0.56, rot: -4, frame: true },
    { x: 0.46, y: 0.06, w: 0.52, h: 0.52, rot: 3, frame: true },
    { x: 0.20, y: 0.44, w: 0.60, h: 0.38, rot: -1.5, frame: true },
  ] },
  { id: 'grid', name: 'Nine-Panel Grid', panels: [
    { x: 0.00, y: 0.00, w: 0.324, h: 0.258 }, { x: 0.338, y: 0.00, w: 0.324, h: 0.258 }, { x: 0.676, y: 0.00, w: 0.324, h: 0.258 },
    { x: 0.00, y: 0.272, w: 0.324, h: 0.258 }, { x: 0.338, y: 0.272, w: 0.324, h: 0.258 }, { x: 0.676, y: 0.272, w: 0.324, h: 0.258 },
    { x: 0.00, y: 0.544, w: 0.324, h: 0.251 }, { x: 0.338, y: 0.544, w: 0.324, h: 0.251 }, { x: 0.676, y: 0.544, w: 0.324, h: 0.251 },
  ] },
  { id: 'strip', name: 'Hero + Filmstrip', panels: [
    { x: 0.00, y: 0.00, w: 1.00, h: 0.50 },
    { x: 0.00, y: 0.515, w: 0.324, h: 0.28 },
    { x: 0.338, y: 0.515, w: 0.324, h: 0.28 },
    { x: 0.676, y: 0.515, w: 0.324, h: 0.28 },
  ] },
  { id: 'triptych', name: 'Triptych', panels: [
    { x: 0.00, y: 0.00, w: 0.324, h: 0.795 },
    { x: 0.338, y: 0.00, w: 0.324, h: 0.795 },
    { x: 0.676, y: 0.00, w: 0.324, h: 0.795 },
  ] },
  { id: 'full', name: 'Full Bleed', panels: [
    { x: 0.00, y: 0.00, w: 1.00, h: 1.00 },
  ] },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', filter: 'saturate(1.3) contrast(1.1) brightness(1.03) sepia(0.22) hue-rotate(-14deg)',
    top: 'rgba(255,120,60,0.30)', bottom: 'rgba(190,25,110,0.38)', accent: '#ff7a3c' },
  { id: 'neon', name: 'Neon Night', filter: 'saturate(1.55) contrast(1.16) brightness(0.98) hue-rotate(8deg)',
    top: 'rgba(255,41,117,0.30)', bottom: 'rgba(20,180,200,0.30)', accent: '#ff2975' },
  { id: 'golden', name: 'Golden Hour', filter: 'saturate(1.25) contrast(1.05) brightness(1.08) sepia(0.45) hue-rotate(-8deg)',
    top: 'rgba(255,190,80,0.28)', bottom: 'rgba(200,110,20,0.30)', accent: '#ffb347' },
  { id: 'teal', name: 'Vice Teal', filter: 'saturate(1.35) contrast(1.1) brightness(1.0) hue-rotate(28deg)',
    top: 'rgba(30,220,200,0.26)', bottom: 'rgba(90,30,160,0.36)', accent: '#1edcc8' },
  { id: 'noir', name: 'Noir', filter: 'grayscale(0.92) contrast(1.28) brightness(1.05)',
    top: 'rgba(255,41,117,0.10)', bottom: 'rgba(0,0,0,0.42)', accent: '#ff2975' },
  { id: 'palm', name: 'Palm Dusk', filter: 'saturate(1.4) contrast(1.08) brightness(1.0) hue-rotate(55deg) sepia(0.12)',
    top: 'rgba(120,255,140,0.18)', bottom: 'rgba(255,90,60,0.32)', accent: '#7dff8c' },
];

export const TITLE_STYLES = [
  { id: 'sunset', name: 'Sunset gradient' },
  { id: 'white', name: 'White block' },
  { id: 'neon', name: 'Neon outline' },
];

export function defaultPanels(layoutId, photoCount) {
  const layout = LAYOUTS.find((l) => l.id === layoutId) || LAYOUTS[0];
  return layout.panels.map((_, i) => ({
    photo: photoCount ? i % photoCount : 0,
    zoom: 1, ox: 0, oy: 0,
  }));
}

export function defaultState() {
  return {
    layout: 'hero', grade: 'sunset',
    title: 'Sunset Heist', subtitle: 'Neon Coast', tagline: 'A LAUNCH-WEEK STORY',
    titleStyle: 'sunset', frame: true, grain: true, vignette: true, badge: true,
    panels: defaultPanels('hero', 2),
  };
}

let noisePattern = null;
function getNoise(ctx) {
  if (noisePattern) return noisePattern;
  const n = document.createElement('canvas');
  n.width = 160; n.height = 160;
  const nctx = n.getContext('2d');
  const img = nctx.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 155);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
  noisePattern = ctx.createPattern(n, 'repeat');
  return noisePattern;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitLines(ctx, text, maxWidth, startSize, maxHeight) {
  const words = text.split(/\s+/).filter(Boolean);
  let size = startSize;
  while (size > 20) {
    ctx.font = `${size}px Anton, sans-serif`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width <= maxWidth || !line) line = test;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    const tallEnough = lines.length * size * 1.02 <= maxHeight;
    if (lines.length <= 2 && tallEnough && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return { lines, size };
    size -= 4;
  }
  ctx.font = `${size}px Anton, sans-serif`;
  return { lines: [text], size };
}

/** Draws the cover for `state` (see defaultState) with `photos` [{img}] onto canvas. */
export function drawCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const layout = LAYOUTS.find((l) => l.id === state.layout) || LAYOUTS[0];
  const grade = GRADES.find((g) => g.id === state.grade) || GRADES[0];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#150822';
  ctx.fillRect(0, 0, W, H);

  // ---- panels ----
  layout.panels.forEach((p, i) => {
    const ps = state.panels[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = photos[ps.photo];
    const px = p.x * W, py = p.y * H, pw = p.w * W, ph = p.h * H;
    if (pw <= 0 || ph <= 0) return;
    ctx.save();
    ctx.translate(px + pw / 2, py + ph / 2);
    if (p.rot) ctx.rotate((p.rot * Math.PI) / 180);
    ctx.translate(-pw / 2, -ph / 2);
    if (p.frame) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = W * 0.02; ctx.shadowOffsetY = W * 0.006;
      ctx.fillStyle = '#fff';
      ctx.fillRect(-W * 0.012, -W * 0.012, pw + W * 0.024, ph + W * 0.024);
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    }
    ctx.beginPath(); ctx.rect(0, 0, pw, ph); ctx.clip();
    ctx.fillStyle = '#241533'; ctx.fillRect(0, 0, pw, ph);
    if (photo && photo.img) {
      const iw = photo.img.naturalWidth || photo.img.width;
      const ih = photo.img.naturalHeight || photo.img.height;
      const scale = Math.max(pw / iw, ph / ih) * (ps.zoom || 1);
      const dw = iw * scale, dh = ih * scale;
      const dx = (pw - dw) / 2 + (ps.ox || 0) * pw;
      const dy = (ph - dh) / 2 + (ps.oy || 0) * ph;
      ctx.filter = grade.filter;
      ctx.drawImage(photo.img, dx, dy, dw, dh);
      ctx.filter = 'none';
      const g = ctx.createLinearGradient(0, 0, 0, ph);
      g.addColorStop(0, grade.top); g.addColorStop(1, grade.bottom);
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = g; ctx.fillRect(0, 0, pw, ph);
      ctx.globalCompositeOperation = 'source-over';
      const g2 = ctx.createLinearGradient(0, 0, pw, ph);
      g2.addColorStop(0, 'rgba(255,255,255,0.05)'); g2.addColorStop(1, 'rgba(0,0,0,0.16)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, pw, ph);
    } else {
      ctx.fillStyle = '#3a1d55';
      ctx.fillRect(0, 0, pw, ph);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `${Math.round(pw * 0.07)}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('ADD A PHOTO', pw / 2, ph / 2);
    }
    ctx.restore();
    if (state.frame && !p.frame) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = Math.max(2, W * 0.004);
      ctx.strokeRect(px, py, pw, ph);
    }
  });

  // ---- grain + vignette ----
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = getNoise(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.vignette) {
    const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  // ---- title band (halftone dots + dark gradient) ----
  const bandY = H * 0.78;
  const band = ctx.createLinearGradient(0, bandY - H * 0.06, 0, H);
  band.addColorStop(0, 'rgba(12,3,22,0)'); band.addColorStop(0.35, 'rgba(12,3,22,0.72)'); band.addColorStop(1, 'rgba(12,3,22,0.94)');
  ctx.fillStyle = band; ctx.fillRect(0, bandY - H * 0.06, W, H - bandY + H * 0.06);
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  const dotGap = Math.max(10, W * 0.016);
  for (let y = bandY + dotGap; y < H; y += dotGap) {
    for (let x = dotGap / 2; x < W; x += dotGap) {
      ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, W * 0.0022), 0, Math.PI * 2); ctx.fill();
    }
  }
  // thin neon rule above the band
  const rule = ctx.createLinearGradient(0, 0, W, 0);
  rule.addColorStop(0, '#ffd319'); rule.addColorStop(0.5, '#ff2975'); rule.addColorStop(1, '#8c1eff');
  ctx.fillStyle = rule; ctx.fillRect(W * 0.04, bandY - H * 0.012, W * 0.92, Math.max(3, H * 0.006));

  // ---- badge ribbon ----
  if (state.badge) {
    const bw = W * 0.30, bh = H * 0.038, bx = W * 0.04, by = H * 0.035;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = W * 0.01; ctx.shadowOffsetY = W * 0.004;
    const bg = ctx.createLinearGradient(bx, by, bx + bw, by);
    bg.addColorStop(0, '#ff2975'); bg.addColorStop(1, '#ff7a3c');
    ctx.fillStyle = bg;
    roundRect(ctx, bx, by, bw, bh, bh / 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(bh * 0.52)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    try { ctx.letterSpacing = `${Math.round(bh * 0.08)}px`; } catch { /* older canvas */ }
    ctx.fillText('★  SUNSET COAST  ★', bx + bw / 2, by + bh / 2 + 1);
    try { ctx.letterSpacing = '0px'; } catch { /* ignore */ }
  }

  // ---- lettering ----
  const cx = W / 2;
  const titleText = (state.title || '').trim().toUpperCase();
  const subText = (state.subtitle || '').trim();
  const tagText = (state.tagline || '').trim().toUpperCase();
  // Title block: script line at 0.815H, title centred at 0.895H (max 0.135H tall),
  // tagline at 0.975H — the three never overlap.
  const titleCenter = H * 0.895;
  if (subText) {
    ctx.save();
    ctx.font = `${Math.round(H * 0.038)}px Pacifico, cursive`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ff5da2';
    ctx.shadowColor = '#ff2975'; ctx.shadowBlur = H * 0.018;
    ctx.fillText(subText, cx, H * 0.815);
    ctx.restore();
  }
  if (titleText) {
    const { lines, size } = fitLines(ctx, titleText, W * 0.92, H * 0.105, H * 0.135);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const grad = ctx.createLinearGradient(0, titleCenter - size * 0.5, W, titleCenter + size * 0.5);
    grad.addColorStop(0, '#ffe259'); grad.addColorStop(0.45, '#ffa751'); grad.addColorStop(1, '#ff2975');
    lines.forEach((line, li) => {
      const y = titleCenter + (lines.length > 1 ? (li - (lines.length - 1) / 2) * size * 1.02 : 0);
      ctx.font = `${size}px Anton, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = size * 0.12; ctx.shadowOffsetY = size * 0.05;
      if (state.titleStyle === 'white') {
        ctx.strokeStyle = '#14041f'; ctx.lineWidth = size * 0.09; ctx.strokeText(line, cx, y);
        ctx.fillStyle = '#ffffff'; ctx.fillText(line, cx, y);
      } else if (state.titleStyle === 'neon') {
        ctx.shadowColor = '#ff2975'; ctx.shadowBlur = size * 0.35;
        ctx.strokeStyle = '#ff5da2'; ctx.lineWidth = size * 0.035; ctx.strokeText(line, cx, y);
        ctx.fillStyle = '#fff0f6'; ctx.fillText(line, cx, y);
      } else {
        ctx.strokeStyle = '#14041f'; ctx.lineWidth = size * 0.08; ctx.strokeText(line, cx, y);
        ctx.fillStyle = grad; ctx.fillText(line, cx, y);
      }
    });
    ctx.restore();
  }
  if (tagText) {
    ctx.save();
    ctx.font = `bold ${Math.round(H * 0.02)}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = `${Math.round(H * 0.004)}px`; } catch { /* ignore */ }
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(tagText, cx, H * 0.975);
    ctx.restore();
  }
}
