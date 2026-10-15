// Renders the app icons from the logo paths in src/components/logo.tsx.
// Usage: pnpm icons
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const logo = readFileSync(new URL('../src/components/logo.tsx', import.meta.url), 'utf8');
const pathOf = (name) => logo.match(new RegExp(`${name} =\\s*'([^']+)'`))[1];
const HEAD = pathOf('HEAD_PATH');
const BOLT = pathOf('BOLT_PATH');

const BG = '#0B0F0E';
const ACCENT = '#3DF5A0';

/** The 100×100 logo, scaled to `scale` of the canvas and centred. */
function mark({ scale, color = ACCENT, cutout = BG, glow = false }) {
  const offset = (100 - 100 * scale) / 2;
  return `
    ${glow ? `<circle cx="50" cy="52" r="${62 * scale}" fill="url(#glow)"/>` : ''}
    <g transform="translate(${offset} ${offset + 2 * scale}) scale(${scale})">
      ${
        cutout
          ? `<path d="${HEAD}" fill="${color}" stroke="${color}" stroke-width="4" stroke-linejoin="round"/>
             <path d="${BOLT}" fill="${cutout}" stroke="${cutout}" stroke-width="1.5" stroke-linejoin="round"/>`
          : `<path d="${HEAD} ${BOLT}" fill="${color}" fill-rule="evenodd"/>`
      }
    </g>`;
}

const defs = `
  <defs>
    <radialGradient id="glow">
      <stop offset="0.55" stop-color="${ACCENT}" stop-opacity="0.28"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#14201C"/>
      <stop offset="1" stop-color="${BG}"/>
    </linearGradient>
  </defs>`;

function render(file, size, body, background) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${defs}${
    background ? `<rect width="100" height="100" fill="${background}"/>` : ''
  }${body}</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(new URL(`../assets/images/${file}`, import.meta.url), png);
  console.log(`assets/images/${file}`);
}

render('icon.png', 1024, mark({ scale: 0.68, glow: true }), 'url(#bg)');
// Android adaptive icons crop to the central ~66%, so keep the mark small.
render('android-icon-foreground.png', 1024, mark({ scale: 0.5, glow: true }));
render('android-icon-monochrome.png', 1024, mark({ scale: 0.5, color: '#FFFFFF', cutout: null }));
render('splash-icon.png', 512, mark({ scale: 0.9, cutout: BG }));
render('favicon.png', 96, mark({ scale: 0.86 }), BG);
