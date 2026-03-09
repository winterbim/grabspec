import puppeteer from 'puppeteer-core';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '..', 'screenshots');
const BASE_URL = 'http://localhost:3005';
const CHROME_PATH = '/usr/bin/google-chrome';

const DESKTOP = { width: 1920, height: 1080 };
const MOBILE = { width: 390, height: 844 };

const USER_AGENT_DESKTOP =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const USER_AGENT_MOBILE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const pages = [
  // Desktop screenshots
  { name: 'homepage-desktop', path: '/', viewport: DESKTOP, ua: USER_AGENT_DESKTOP, fullPage: true },
  { name: 'finder-desktop', path: '/finder', viewport: DESKTOP, ua: USER_AGENT_DESKTOP, fullPage: false },
  { name: 'library-desktop', path: '/library', viewport: DESKTOP, ua: USER_AGENT_DESKTOP, fullPage: false },
  { name: 'converter-desktop', path: '/converter', viewport: DESKTOP, ua: USER_AGENT_DESKTOP, fullPage: false },
  { name: 'pricing-desktop', path: '/pricing', viewport: DESKTOP, ua: USER_AGENT_DESKTOP, fullPage: true },

  // Mobile screenshots
  { name: 'homepage-mobile', path: '/', viewport: MOBILE, ua: USER_AGENT_MOBILE, fullPage: true, isMobile: true },
  { name: 'finder-mobile', path: '/finder', viewport: MOBILE, ua: USER_AGENT_MOBILE, fullPage: false, isMobile: true },
];

async function run() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--font-render-hinting=none',
    ],
    defaultViewport: null,
  });

  for (const entry of pages) {
    const page = await browser.newPage();

    await page.setViewport({
      width: entry.viewport.width,
      height: entry.viewport.height,
      deviceScaleFactor: 2, // Retina-quality
      isMobile: !!entry.isMobile,
      hasTouch: !!entry.isMobile,
    });
    await page.setUserAgent(entry.ua);

    const url = `${BASE_URL}${entry.path}`;
    console.log(`Capturing ${entry.name} — ${url}`);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    // Extra settle time for animations / lazy content
    await new Promise((r) => setTimeout(r, 1500));

    const filePath = path.join(OUTPUT_DIR, `${entry.name}.png`);
    await page.screenshot({
      path: filePath,
      fullPage: entry.fullPage,
      type: 'png',
    });
    console.log(`  -> saved ${filePath}`);

    await page.close();
  }

  await browser.close();
  console.log('\nDone! All screenshots saved to', OUTPUT_DIR);
}

run().catch((err) => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
