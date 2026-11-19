// Neon Coast Cover Studio — the hand-in step for this entry.
//
// This file is the entrypoint. It takes the finished cover maker that lives
// in app/ (plain static files: the page, its scripts, its styles, the fonts
// and the two sample photos) together with the screenshots/ pictures that
// show it off, and lays them out in the folder the grader collects —
// /output, or $MAKEFUN_OUTPUT_DIR when that is set, so the same command
// works on a local machine. It also writes dossier.json there, the summary
// the judge reads, using the vendored make.fun library.
//
// The app itself needs nothing from the network: open app/index.html in a
// desktop browser, or run `node serve.ts` and visit http://localhost:8080.
// This script only moves files around and counts them; it never edits the
// app, and it never touches the network.

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// Where this script lives, and where the hand-in goes.
const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps: only the text cap shapes the bytes; the rest
// refuse an entry the scorer would refuse — more than 4 screenshots or one
// over 256 KiB, more than 993 files in app/ or 48 MiB of app files in all,
// or a path under app/ over 1000 bytes.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

// Stop with a readable message instead of a stack trace when something
// the hand-in needs is not there.
function fail(message) {
  console.error(`Neon Coast Cover Studio: ${message}`);
  process.exit(1);
}

// Count every file under a folder, so the summary at the end is honest.
function countFiles(folder) {
  let total = 0;
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    total += entry.isDirectory() ? countFiles(path) : 1;
  }
  return total;
}

const appDir = join(rootDir, 'app');
const shotsDir = join(rootDir, 'screenshots');

if (!existsSync(appDir)) {
  fail(`app/ is missing next to main.ts — nothing to hand in.`);
}

const appFiles = countFiles(appDir);
const hasShots = existsSync(shotsDir);
const shotFiles = hasShots ? countFiles(shotsDir) : 0;

mkdirSync(outputDir, { recursive: true });
cpSync(appDir, join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (hasShots) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(dossierPath, buildDossier(outputDir, dossierCaps));

console.log(
  `Neon Coast Cover Studio: handed in ${appFiles} app file(s)` +
    ` and ${shotFiles} screenshot(s) to ${outputDir}; dossier at ${dossierPath}.`,
);
