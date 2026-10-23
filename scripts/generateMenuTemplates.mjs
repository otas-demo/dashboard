import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const menuDir = process.argv[2];
if (!menuDir) {
  console.error('Usage: node scripts/generateMenuTemplates.mjs "<path to auto-shop-menu>"');
  process.exit(1);
}

const siteDir = path.resolve(menuDir, 'site');
if (!fs.existsSync(siteDir)) {
  throw new Error(`Site directory not found: ${siteDir}`);
}

/**
 * Replaces exact string `find` with `token`, asserting it occurs `expectedCount` times.
 */
function rep(html, file, find, token, expectedCount) {
  const parts = html.split(find);
  const actualCount = parts.length - 1;
  if (actualCount !== expectedCount) {
    throw new Error(
      `[${file}] Expected ${expectedCount} occurrence(s) of ${JSON.stringify(find)}, found ${actualCount}`
    );
  }
  return parts.join(token);
}

/**
 * Replaces everything between the end of `startMarker` and the start of `endMarker` with `token`.
 * Throws if `startMarker` is not unique or `endMarker` is missing after `startMarker`.
 */
function repRegion(html, file, startMarker, endMarker, token) {
  const startParts = html.split(startMarker);
  if (startParts.length - 1 !== 1) {
    throw new Error(
      `[${file}] Expected startMarker ${JSON.stringify(startMarker)} to be unique, found ${startParts.length - 1} occurrence(s)`
    );
  }
  const startIdx = html.indexOf(startMarker);
  const contentStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, contentStart);
  if (endIdx === -1) {
    throw new Error(
      `[${file}] endMarker ${JSON.stringify(endMarker)} not found after startMarker ${JSON.stringify(startMarker)}`
    );
  }
  return html.slice(0, contentStart) + token + html.slice(endIdx);
}

const PAGE_KEYS = [
  'index',
  'commercial',
  'enterprise',
  'custom',
  'hardware',
  'ai-facebook',
  'ai-telegram',
  'ai-viber',
];

const templates = {};

for (const key of PAGE_KEYS) {
  const file = `${key}.html`;
  const filePath = path.join(siteDir, file);
  let html = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

  if (html.includes('{{')) {
    throw new Error(`[${file}] Source HTML already contains "{{"`);
  }

  // 2a. Applied to every page
  html = rep(html, file, 'href="site.css"', 'href="/menu-assets/site.css"', 1);
  html = html.replace(/src="img\//g, 'src="/menu-assets/img/');
  html = html.replace(/href="index\.html(#[\w-]+)?"/g, (_, hash) => `href="/menu${hash || ''}"`);
  html = html.replace(/href="([\w-]+)\.html(#[\w-]+)?"/g, (_, name, hash) => `href="/menu/${name}${hash || ''}"`);
  html = rep(html, file, '<span class="sel">09-790673433</span>', '<span class="sel">{{phone}}</span>', 1);
  html = rep(
    html,
    file,
    '<span class="sel">info@otastechsolutions.com</span>',
    '<span class="sel">{{email}}</span>',
    1
  );
  html = rep(
    html,
    file,
    '<a href="https://www.otastechsolutions.com" target="_blank" rel="noopener">www.otastechsolutions.com</a>',
    '<a href="{{websiteUrl}}" target="_blank" rel="noopener">{{websiteLabel}}</a>',
    1
  );
  html = rep(html, file, '၂၀၂၆ အောက်တိုဘာ', '{{priceDate}}', key === 'hardware' ? 2 : 1);

  // 2b. Per page
  if (key === 'index') {
    html = rep(html, file, '<p class="price-row"><b>၈၀,၀၀၀</b>', '<p class="price-row"><b>{{commercialPrice}}</b>', 1);
    html = rep(html, file, '<p class="price-row"><b>၁၄၀,၀၀၀</b>', '<p class="price-row"><b>{{enterprisePrice}}</b>', 1);
    html = rep(
      html,
      file,
      '<p class="price-row"><b>၁၅ သိန်းမှ</b>',
      '<p class="price-row"><b>{{customLakh}} သိန်းမှ</b>',
      1
    );
    html = repRegion(
      html,
      file,
      '<span></span></div>',
      '\n    </div>\n    <p class="ai-foot">',
      '{{aiRows}}'
    );
    html = repRegion(
      html,
      file,
      '<div class="hw">',
      '\n    </div>\n  </section>',
      '{{hwCards}}'
    );
  } else if (key === 'commercial') {
    html = rep(html, file, '၈၀,၀၀၀', '{{price}}', 1);
  } else if (key === 'enterprise') {
    html = rep(html, file, '၁၄၀,၀၀၀', '{{price}}', 1);
  } else if (key === 'custom') {
    html = rep(html, file, '<b>၁၅ သိန်းမှ</b>', '<b>{{customLakh}} သိန်းမှ</b>', 1);
    html = rep(
      html,
      file,
      'အခြေခံမှာ ပါပြီးသား · ၁၅ သိန်း',
      'အခြေခံမှာ ပါပြီးသား · {{customLakh}} သိန်း',
      1
    );
    html = rep(
      html,
      file,
      'တည်ဆောက်ချိန် ၄ ပတ်ခန့်မှ',
      'တည်ဆောက်ချိန် {{customWeeks}} ပတ်ခန့်မှ',
      1
    );
    html = rep(
      html,
      file,
      'ငွေပေးချေ ၆၀% + ၄၀%',
      'ငွေပေးချေ {{payFirstPct}}% + {{payLastPct}}%',
      1
    );
    html = rep(
      html,
      file,
      '<script src="custom-data.js"></script>',
      '<script>window.CUSTOM_DATA = {{customDataJson}};</script>',
      1
    );
    html = rep(
      html,
      file,
      '<script src="custom.js"></script>',
      '<script src="/menu-assets/custom.js"></script>',
      1
    );
  } else if (key === 'ai-facebook' || key === 'ai-telegram') {
    html = rep(html, file, '<b>၁၀ သိန်း</b>', '<b>{{setupLakh}} သိန်း</b>', 1);
    html = rep(html, file, '<b>၁–၂ ပတ်</b>', '<b>{{wait}}</b>', 1);
    html = rep(html, file, 'စတင်ပုံ · ၁–၂ ပတ်', 'စတင်ပုံ · {{wait}}', 1);
    html = rep(html, file, '<b>၉၅,၀၀၀ မှ</b>', '<b>{{monthly}}</b>', 1);
  } else if (key === 'ai-viber') {
    html = rep(html, file, '<b>၂၅ သိန်း</b>', '<b>{{setupLakh}} သိန်း</b>', 1);
    html = rep(
      html,
      file,
      'AI မပါဘဲ Inbox ပဲဆို ၁၈ သိန်း',
      'AI မပါဘဲ Inbox ပဲဆို {{inboxLakh}} သိန်း',
      1
    );
    html = rep(html, file, '<b>၄–၆ ပတ်</b>', '<b>{{wait}}</b>', 1);
    html = rep(html, file, 'စတင်ပုံ · ၄–၆ ပတ်', 'စတင်ပုံ · {{wait}}', 1);
    html = rep(html, file, '<b>၇ သိန်းမှ</b>', '<b>{{monthly}}</b>', 1);
  } else if (key === 'hardware') {
    html = repRegion(
      html,
      file,
      '<section class="sec" aria-label="စက်ပစ္စည်း စာရင်း">',
      '\n    <p class="small-note">',
      '{{hwGroups}}'
    );
  }

  if (/href="[^"]*\.html/.test(html)) {
    throw new Error(`[${file}] Remaining .html href found after replacements`);
  }

  templates[key] = html;
}

// 2c. Write src/lib/menu/templates.ts
const templatesTsPath = path.join(repoRoot, 'src', 'lib', 'menu', 'templates.ts');
const templatesTsContent =
  `// Generated from the original static "Auto Shop Menu" HTML. Edit the markup here;\n` +
  `// values in {{braces}} are filled from the menu data by renderMenuPage().\n` +
  `export const MENU_TEMPLATES = ${JSON.stringify(templates, null, 2)} as const;\n\n` +
  `export type MenuPageKey = keyof typeof MENU_TEMPLATES;\n`;

fs.writeFileSync(templatesTsPath, templatesTsContent, 'utf8');

// Copy site.css and custom.js
const assetsDir = path.join(repoRoot, 'public', 'menu-assets');
const assetsImgDir = path.join(assetsDir, 'img');
fs.mkdirSync(assetsImgDir, { recursive: true });

fs.copyFileSync(path.join(siteDir, 'site.css'), path.join(assetsDir, 'site.css'));
fs.copyFileSync(path.join(siteDir, 'custom.js'), path.join(assetsDir, 'custom.js'));

// Copy all site/img/*.webp -> public/menu-assets/img/ (keeping existing files like redmi-pad-2.webp)
const siteImgDir = path.join(siteDir, 'img');
for (const entry of fs.readdirSync(siteImgDir)) {
  if (entry.endsWith('.webp')) {
    fs.copyFileSync(path.join(siteImgDir, entry), path.join(assetsImgDir, entry));
  }
}

console.log('Successfully generated src/lib/menu/templates.ts and copied menu assets.');
