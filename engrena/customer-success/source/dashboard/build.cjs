const fs = require('node:fs');
const path = require('node:path');
const source = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const icons = {
  GRID: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  CLIENTS: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/>',
  ALERT: '<path d="M18 8a6 6 0 0 0-12 0c0 6-3 7-3 8h18c0-1-3-2-3-8M10 20h4"/>',
  REPORT: '<path d="M4 20h16M7 16v-5m5 5V6m5 10V9"/>',
};
const logoPath = path.resolve(__dirname, '../../../site-v1/assets/brand/logo-color.svg');
const svg = `data:image/svg+xml;base64,${fs.readFileSync(logoPath).toString('base64')}`;
let html = source('shell.html')
  .replace('/* CSS */', () => source('style.css'))
  .replace('/* MODEL */', () => source('model.js'))
  .replace('/* APP */', () => source('app.js'))
  .replace('__LOGO__', svg);
for (const [key, drawing] of Object.entries(icons)) {
  html = html.replace(`__${key}__`, `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${drawing}</svg>`);
}
const output = path.resolve(__dirname, '../../output/dashboard');
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'Dashboard Customer Success Engrena.html'), html);
