// Fixed scenes for screenshots: ?shot=editor shows the app with sample photos;
// ?shot=cover shows the cover alone. `photo` picks the sample
// (samples/<photo>.jpg), `caption` the title, `layout` / `grade` / `subtitle` /
// `tagline` / `titleStyle` pick the look. window.__shotReady is set once painted.
export async function runShot(shot, query, load) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await load({
    photo: query.get('photo') ?? 'pier',
    caption: query.get('caption') ?? 'Sunset Heist',
    layout: query.get('layout') ?? undefined,
    grade: query.get('grade') ?? undefined,
    subtitle: query.get('subtitle') ?? undefined,
    tagline: query.get('tagline') ?? undefined,
    titleStyle: query.get('titleStyle') ?? undefined,
  });
}
