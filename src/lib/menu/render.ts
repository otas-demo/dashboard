import { MENU_TEMPLATES, type MenuPageKey } from '@/lib/menu/templates';
import { customPriceOfDays, kyat, lakh, mm, monthlyFrom } from '@/lib/menu/format';
import { HARDWARE_CATEGORIES, type CustomData, type MenuData, type MenuHardwareItem } from '@/lib/menu/types';

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const CHAT_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12.5h5"/></svg>';
const ARROW_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function customBasePrice(custom: CustomData): number {
  return customPriceOfDays(custom.base.days, custom.rate, custom.round);
}

/** Calculator data for custom.js: hidden features and empty categories are left out. */
function publicCustomData(custom: CustomData, priceDate: string) {
  const cats = custom.cats
    .map((c) => ({
      ...c,
      items: c.items
        .filter((it) => !it.hidden)
        .map((it) => {
          const copy = { ...it };
          delete copy.hidden;
          return copy;
        }),
    }))
    .filter((c) => c.items.length > 0);
  return { version: priceDate, ...custom, cats };
}

/** Where generated links and built-in images point. */
export interface RenderOptions {
  linkBase: string; // '/menu' on the dashboard, '' on the standalone menu site
  assetBase: string; // replaces '/menu-assets/' at the start of built-in image paths
}

const DASHBOARD_RENDER: RenderOptions = { linkBase: '/menu', assetBase: '/menu-assets/' };

function imageSrc(src: string, o: RenderOptions): string {
  return src.startsWith('/menu-assets/') ? o.assetBase + src.slice('/menu-assets/'.length) : src;
}

function hardwareIndexCard(it: MenuHardwareItem, o: RenderOptions): string {
  const sample = it.samplePhoto ? '<span class="sample">နမူနာပုံ</span>' : '';
  return `
      <a class="hw-card" href="${o.linkBase}/hardware#${esc(it.slug)}">
        <div class="ph">${sample}<img src="${esc(imageSrc(it.image, o))}" alt="${esc(it.name)}" width="360" height="360"></div>
        <div class="hw-body"><span class="hw-name">${esc(it.name)}</span><span class="hw-spec">${esc(it.spec)}</span>
          <span class="hw-price">${kyat(it.price)}<small>ကျပ်</small></span></div>
      </a>`;
}

function hardwareDetailCard(it: MenuHardwareItem, o: RenderOptions): string {
  const sample = it.samplePhoto ? '<span class="sample">နမူနာပုံ</span>' : '';
  const best = it.bestFor ? `\n            <span class="best">${esc(it.bestFor)}</span>` : '';
  return `
        <article class="hw-card" id="${esc(it.slug)}">
          <div class="ph">${sample}<img src="${esc(imageSrc(it.image, o))}" alt="${esc(it.name)}" width="360" height="360"></div>
          <div class="hw-body"><h4 class="hw-name">${esc(it.name)}</h4><span class="hw-spec">${esc(it.spec)}</span>${best}
            <span class="hw-price">${kyat(it.price)}<small>ကျပ်</small></span></div>
        </article>`;
}

function hardwareByCategory(data: MenuData) {
  const visible = data.hardware.filter((h) => h.visible);
  return HARDWARE_CATEGORIES.map((cat) => ({ ...cat, items: visible.filter((h) => h.category === cat.name) })).filter(
    (g) => g.items.length > 0
  );
}

/** Values shared by every page (footer contacts and the price-list date). */
function commonValues(data: MenuData): Record<string, string> {
  return {
    priceDate: esc(data.general.priceDate),
    phone: esc(data.general.phone),
    email: esc(data.general.email),
    websiteUrl: esc(data.general.website),
    websiteLabel: esc(data.general.website.replace(/^https?:\/\//, '').replace(/\/$/, '')),
  };
}

function pageValues(key: MenuPageKey, data: MenuData, o: RenderOptions): Record<string, string> {
  const base = customBasePrice(data.custom);
  switch (key) {
    case 'index': {
      const visibleAi = data.aiChannels.filter((c) => c.visible);
      const visibleHw = data.hardware.filter((h) => h.visible);
      return {
        commercialPrice: kyat(data.packages.commercial),
        enterprisePrice: kyat(data.packages.enterprise),
        customLakh: lakh(base),
        aiRows: visibleAi
          .map(
            (c) => `
      <a class="ai-row" href="${o.linkBase}/ai-${c.id}">
        <span class="ai-name"><span class="ic">${CHAT_ICON}</span><span><b>${esc(c.name)}</b><small>${esc(c.subtitle)}</small></span></span>
        <span class="ai-val" data-l="တပ်ဆင်ခ">${lakh(c.setupFee)} သိန်း</span>
        <span class="ai-val" data-l="ကြာချိန်">${esc(c.wait)}</span>
        <span class="ai-go">${ARROW_ICON}</span>
      </a>`
          )
          .join(''),
        hwCards: visibleHw.map((h) => hardwareIndexCard(h, o)).join(''),
      };
    }
    case 'commercial':
      return { price: kyat(data.packages.commercial) };
    case 'enterprise':
      return { price: kyat(data.packages.enterprise) };
    case 'custom': {
      const payment = data.custom.payment;
      // JSON inside <script>: escape "<" so text can never close the tag
      const json = JSON.stringify(publicCustomData(data.custom, data.general.priceDate)).replace(/</g, '\\u003c');
      return {
        customLakh: lakh(base),
        customWeeks: mm(data.custom.weeksBase),
        payFirstPct: mm(payment[0][1]),
        payLastPct: mm(payment[payment.length - 1][1]),
        customDataJson: json,
      };
    }
    case 'hardware': {
      const groups = hardwareByCategory(data);
      return {
        hwGroups: groups
          .map(
            (g) =>
              `<div class="hw-group"><h3>${esc(g.name)}<small>${esc(g.blurb)}</small></h3><div class="hwd">${g.items.map((h) => hardwareDetailCard(h, o)).join('')}</div></div>`
          )
          .join(''),
      };
    }
    case 'ai-facebook':
    case 'ai-telegram':
    case 'ai-viber': {
      const c = data.aiChannels.find((ch) => `ai-${ch.id}` === key)!;
      const values: Record<string, string> = {
        setupLakh: lakh(c.setupFee),
        wait: esc(c.wait),
        monthly: monthlyFrom(c.monthlyFrom),
      };
      if (c.inboxOnlyFee !== null) {
        values.inboxLakh = lakh(c.inboxOnlyFee);
      }
      return values;
    }
  }
}

/**
 * The filled-in values for one page, keyed like the template placeholders.
 * Text is already HTML-escaped; aiRows / hwCards / hwGroups are HTML blocks;
 * customDataJson is the calculator data as JSON.
 */
export function menuPageValues(key: MenuPageKey, data: MenuData, o: RenderOptions = DASHBOARD_RENDER): Record<string, string> {
  return { ...commonValues(data), ...pageValues(key, data, o) };
}

/** Full HTML document for one public menu page. */
export function renderMenuPage(key: MenuPageKey, data: MenuData): string {
  const values = menuPageValues(key, data);
  return MENU_TEMPLATES[key].replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    if (!(name in values)) throw new Error(`Menu template "${key}" has no value for {{${name}}}`);
    return values[name];
  });
}

export function isMenuPageKey(value: string): value is MenuPageKey {
  return Object.prototype.hasOwnProperty.call(MENU_TEMPLATES, value);
}
