import puppeteer from 'puppeteer-core';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\PC\\.gemini\\antigravity\\brain\\2bf91ea1-3f78-4b3a-8194-88e543fab965';

async function testUsers() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--window-size=1280,800'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('  [Browser Error]:', msg.text());
  });

  // Login
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname === '/', { timeout: 10000 });

  // Navigate to /users
  console.log('Navigating to http://localhost:3000/users ...');
  await page.goto('http://localhost:3000/users', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  const pageText = await page.$eval('h1', (el) => el.textContent);
  console.log('Heading:', pageText);
  const rows = await page.$$eval('tbody tr', (els) => els.length);
  console.log('User rows rendered:', rows);

  const usersList = await page.$$eval('tbody tr', (rows) =>
    rows.map((r) => r.innerText.replace(/\n+/g, ' | '))
  );
  usersList.forEach((u) => console.log(' ->', u));

  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'e2e_07_users_page.png') });
  console.log('Saved screenshot: e2e_07_users_page.png');
  await browser.close();
}

testUsers().catch(console.error);
