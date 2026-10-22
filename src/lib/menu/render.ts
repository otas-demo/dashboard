import { MENU_TEMPLATES, type MenuPageKey } from '@/lib/menu/templates';
import { autoPrice, customPriceOfDays, kyat, lakh, mm } from '@/lib/menu/format';
import { HARDWARE_CATEGORIES, type CustomData, type MenuData, type MenuHardwareItem } from '@/lib/menu/types';

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

const CHAT_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12.5h5"/></svg>';
const ARROW_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

// The first and last payment instalments (60% / 40%) used on the AI pages.
const AI_PAYMENT_SPLIT = [60, 40] as const;

function minOf(values: number[]): number | null {
  return values.length ? Math.min(...values) : null;
}

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

function hardwareIndexCard(it: MenuHardwareItem): string {
  return `
      <a class="card-link hw-card" href="/menu/hardware#${esc(it.slug)}">
        <div class="hw-ph"><img src="${esc(it.image)}" alt="${esc(it.name)}" loading="lazy" width="360" height="360"></div>
        <div class="hw-body">
          <span class="hw-cat">${esc(it.category)}</span>
          <span class="hw-name">${esc(it.name)}</span>
          <span class="hw-var">${esc(it.variant)}</span>
          ${it.samplePhoto ? '<span class="rep">ပုံသည် နမူနာပုံ</span>' : ''}
          <span class="hw-price">${kyat(it.price)}<small>ကျပ်</small></span>
        </div>
      </a>`;
}

function hardwareDetailCard(it: MenuHardwareItem): string {
  const points = it.points.map((p) => `<li>${esc(p)}</li>`).join('');
  return `
        <article class="hwd-card" id="${esc(it.slug)}" aria-labelledby="t-${esc(it.slug)}">
          <div class="hw-ph"><img src="${esc(it.image)}" alt="${esc(it.name)}" width="360" height="360" loading="lazy"></div>
          <div class="hwd-body">
            <span class="hw-cat">${esc(it.category)}</span>
            <h3 class="hw-name" id="t-${esc(it.slug)}">${esc(it.name)}</h3>
            <span class="hw-var">${esc(it.variant)}</span>
            ${points ? `<ul>${points}</ul>` : ''}
            ${it.fit ? `<p class="hwd-fit"><b>ကိုက်တဲ့ဆိုင်</b> · ${esc(it.fit)}</p>` : ''}
            ${it.samplePhoto ? '<span class="rep">ပုံသည် နမူနာပုံ ဖြစ်ပါသည်</span>' : ''}
            <span class="hw-price">${kyat(it.price)}<small>ကျပ်</small></span>
          </div>
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

function pageValues(key: MenuPageKey, data: MenuData): Record<string, string> {
  const base = customBasePrice(data.custom);
  switch (key) {
    case 'index': {
      const visibleAi = data.aiChannels.filter((c) => c.visible);
      const visibleHw = data.hardware.filter((h) => h.visible);
      const fromAi = minOf(visibleAi.map((c) => c.setupFee));
      const fromHw = minOf(visibleHw.map((h) => h.price));
      return {
        fromPos: kyat(Math.min(data.packages.commercial, data.packages.enterprise)),
        customLakh: lakh(base),
        fromAi: fromAi === null ? '—' : `${lakh(fromAi)} သိန်း`,
        fromHw: fromHw === null ? '—' : kyat(fromHw),
        commercialPrice: kyat(data.packages.commercial),
        enterprisePrice: kyat(data.packages.enterprise),
        aiCards: visibleAi
          .map(
            (c) => `
      <a class="card-link ch" href="/menu/ai-${c.id}">
        <div class="ch-head"><span class="ic">${CHAT_ICON}</span><div><h3>${esc(c.name)}</h3><p class="ch-sub">${esc(c.subtitle)}</p></div></div>
        <dl class="facts">
          <div><dt>တပ်ဆင်ခ (တစ်ကြိမ်)</dt><dd>${lakh(c.setupFee)} သိန်း${c.setupNote ? `<small>${esc(c.setupNote)}</small>` : ''}</dd></div>
          <div><dt>စောင့်ရမယ့်ကြာချိန်</dt><dd>${esc(c.wait)}</dd></div>
          <div><dt>လစဉ်</dt><dd>${autoPrice(c.monthlyFrom)}မှ<small>+ AI သုံးစွဲခ</small></dd></div>
        </dl>
        <span class="go">ကြာချိန်နဲ့ လိုအပ်တာ ကြည့်ရန် ${ARROW_ICON}</span>
      </a>`
          )
          .join(''),
        hwCards: visibleHw.map(hardwareIndexCard).join(''),
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
        customKyat: kyat(base),
        customWeeks: mm(data.custom.weeksBase),
        payFirstPct: mm(payment[0][1]),
        payLastPct: mm(payment[payment.length - 1][1]),
        customDataJson: json,
      };
    }
    case 'hardware': {
      const groups = hardwareByCategory(data);
      return {
        hwPanel:
          '\n' +
          groups
            .map((g) => `        <div class="panel-row"><span>${esc(g.name)}</span><b>${kyat(minOf(g.items.map((i) => i.price))!)} ကျပ်မှ</b></div>`)
            .join('\n'),
        hwGroups: groups
          .map(
            (g) => `
    <div class="hw-group">
      <div class="hw-group-h"><h3>${esc(g.name)}</h3><p>${esc(g.blurb)}</p></div>
      <div class="hwd">${g.items.map(hardwareDetailCard).join('')}
      </div>
    </div>`
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
        setupKyat: kyat(c.setupFee),
        wait: esc(c.wait),
        monthly: `${autoPrice(c.monthlyFrom)}မှ`,
        payFirst: kyat((c.setupFee * AI_PAYMENT_SPLIT[0]) / 100),
        payLast: kyat((c.setupFee * AI_PAYMENT_SPLIT[1]) / 100),
      };
      if (c.inboxOnlyFee !== null) {
        values.inboxLakh = lakh(c.inboxOnlyFee);
        values.inboxPayFirst = kyat((c.inboxOnlyFee * AI_PAYMENT_SPLIT[0]) / 100);
        values.inboxPayLast = kyat((c.inboxOnlyFee * AI_PAYMENT_SPLIT[1]) / 100);
      }
      return values;
    }
  }
}

/** Full HTML document for one public menu page. */
export function renderMenuPage(key: MenuPageKey, data: MenuData): string {
  const values = { ...commonValues(data), ...pageValues(key, data) };
  return MENU_TEMPLATES[key].replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
    if (!(name in values)) throw new Error(`Menu template "${key}" has no value for {{${name}}}`);
    return values[name];
  });
}

export function isMenuPageKey(value: string): value is MenuPageKey {
  return Object.prototype.hasOwnProperty.call(MENU_TEMPLATES, value);
}
