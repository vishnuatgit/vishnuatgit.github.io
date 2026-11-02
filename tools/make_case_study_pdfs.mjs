// Makes the case studies' Download PDF files: pdf/<name>-case-study.pdf.
// Run from the repository root after changing a case study:
//   npm install --no-save playwright     (once; it drives your installed Google Chrome)
//   node tools/make_case_study_pdfs.mjs
// It serves the site on a free local port, opens each case study in Chrome with the print
// styles ("Print and PDF" in projects.css), waits for every image and font, and saves an A4 PDF.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const STUDIES = ['archlens', 'deepbell', 'supplytrace'];
const TYPES = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '');
  if (path === '' || path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await mkdir(join(ROOT, 'pdf'), { recursive: true });
for (const name of STUDIES) {
  await page.goto(`${base}projects/${name}.html`, { waitUntil: 'networkidle' });
  await page.evaluate(async name => {
    // Links in the PDF point at the live site, not at this local server.
    const live = `https://vishnuatgit.github.io/projects/${name}.html`;
    document.querySelectorAll('a[href]').forEach(a => { a.href = new URL(a.getAttribute('href'), live).href; });
    document.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
    await Promise.all([...document.images].map(img => img.complete ? null : new Promise(done => { img.onload = img.onerror = done; })));
    await document.fonts.ready;
  }, name);
  await page.emulateMedia({ media: 'print' });
  const file = join(ROOT, 'pdf', `${name}-case-study.pdf`);
  await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true, outline: true, tagged: true });
  console.log('wrote', file);
}
await browser.close();
server.close();
