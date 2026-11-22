// The Gilded Vault — the hand-in program (Node 22, standard library
// only). It copies game/ and screenshots/ beside this file to the output
// directory and writes the dossier the judge reads, with the vendored
// make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The gate's caps for this bounty. Only text_max_bytes shapes the
// dossier's bytes; the rest refuse an entry the scorer would refuse.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyDir(name) {
  const src = join(here, name);
  if (!existsSync(src)) return false;
  cpSync(src, join(out, name), { recursive: true });
  return true;
}

mkdirSync(out, { recursive: true });
copyDir('game');
mkdirSync(join(out, 'screenshots'), { recursive: true });
const hadShots = copyDir('screenshots');
if (!hadShots) throw new Error('screenshots/: no such directory — take 3 or 4 renders first');

writeFileSync(join(out, 'dossier.json'), buildDossier(out, CAPS));
const dossierBytes = statSync(join(out, 'dossier.json')).size;
console.log(`handed in: game/ + screenshots/ + dossier.json (${dossierBytes} bytes) -> ${out}`);
