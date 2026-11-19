# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/DinishKawaii/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/DinishKawaii/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Coast Cover Studio turns your own photos and a caption into a sunset poster cover in the multi-panel, bold-lettering style of a game cover, exported as a PNG to share; everything runs offline in the browser, photos never leave your computer.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=hpvfdjv3&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

## How to use

1. **Add photos** — pick files, drag them onto the page, or try the two
   built-in samples (Boulevard, Pier).
2. **Pick a layout** — Hero + 2, Split Duo, Tilted Snaps, Nine-Panel Grid,
   Hero + Filmstrip, Triptych, or Full Bleed.
3. **Place each panel** — click a panel, then click a photo to put it there.
   Drag the photo on the cover to move it, scroll over it to zoom, or use
   the zoom / move sliders. “Use in all panels” fills every panel with one photo.
4. **Pick a colour grade** — Sunset, Neon Night, Golden Hour, Vice Teal,
   Noir, Palm Dusk.
5. **Write the words** — main title (Anton), script line (Pacifico),
   tagline, and three title styles. Toggle panel frames, film grain,
   vignette, and the badge ribbon.
6. **Export** — one click per size, or “Export all 3”:
   1080×1080 (square), 1080×1350 (story), 1920×1080 (wide).
   Undo / Redo (Ctrl+Z / Ctrl+Y) and “Surprise me” are there too.

## Screenshots

`?shot=cover` shows the cover alone, `?shot=editor` the full app with a
sample photo loaded. `?photo=boulevard|pier`, `?caption=…`, `?layout=…`,
`?grade=…`, `?subtitle=…`, `?tagline=…`, `?titleStyle=…` pick the scene.
`window.__shotReady` is set once the cover is painted.

## Licence

MIT — see `LICENSE`. Fonts are Anton and Pacifico, both under the
SIL Open Font License 1.1 (licence texts in `app/fonts/`). The two sample
photos in `app/samples/` were made for make.fun with an image model and are
free to use. This app contains no logo, artwork, character or font from any
game — all lettering and layouts are original.
