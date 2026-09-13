import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\2bf91ea1-3f78-4b3a-8194-88e543fab965';

async function testPadding() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--window-size=1280,800'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname === '/', { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 2000));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_08_fixed_padding.png') });
  console.log('Saved screenshot: e2e_08_fixed_padding.png');
  await browser.close();
}

testPadding().catch(console.error);
