import { HARDWARE_CATEGORIES, type CustomData, type MenuData, type MenuHardwareItem } from '@/lib/menu/types';

/**
 * Applies an editor submission onto the current menu. Only the editable fields are read
 * from `input`; everything else (feature wording, channel names, …) is kept from `current`.
 * Throws MenuValidationError with a message the editor can show.
 */
export class MenuValidationError extends Error {}

function fail(message: string): never {
  throw new MenuValidationError(message);
}

function obj(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${label} is missing`);
  return value as Record<string, unknown>;
}

function int(value: unknown, label: string, min = 0, max = 1_000_000_000): number {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isInteger(n) || n < min || n > max) {
    fail(`${label} must be a whole number between ${min.toLocaleString()} and ${max.toLocaleString()}`);
  }
  return n;
}

/** Days can be fractional in half-day steps (e.g. 12.5). */
function days(value: unknown, label: string): number {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 1000 || !Number.isInteger(n * 2)) {
    fail(`${label} must be a number of days in steps of 0.5`);
  }
  return n;
}

function text(value: unknown, label: string, { required = true, max = 300 } = {}): string {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string') fail(`${label} must be text`);
  const s = value.trim();
  if (required && !s) fail(`${label} is required`);
  if (s.length > max) fail(`${label} is too long (max ${max} characters)`);
  return s;
}

function bool(value: unknown): boolean {
  return value === true;
}

function imageUrl(value: unknown, label: string): string {
  const s = text(value, label, { max: 1000 });
  if (s.startsWith('/menu-assets/')) return s;
  try {
    if (new URL(s).protocol === 'https:') return s;
  } catch {}
  fail(`${label} must be an uploaded image or an https:// link`);
}

function hardwareItem(value: unknown, i: number): MenuHardwareItem {
  const h = obj(value, `Hardware item ${i + 1}`);
  const name = text(h.name, `Hardware item ${i + 1} name`, { max: 120 });
  const label = `"${name}"`;
  const slug = text(h.slug, `${label} link id`, { max: 60 }).toLowerCase();
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) fail(`${label} link id may only use a–z, 0–9 and dashes`);
  const category = text(h.category, `${label} category`);
  if (!HARDWARE_CATEGORIES.some((c) => c.name === category)) fail(`${label} has an unknown category`);
  return {
    slug,
    category,
    name,
    spec: text(h.spec, `${label} spec`, { required: false, max: 160 }),
    bestFor: text(h.bestFor, `${label} best for`, { required: false, max: 80 }),
    price: int(h.price, `${label} price`, 0),
    image: imageUrl(h.image, `${label} photo`),
    samplePhoto: bool(h.samplePhoto),
    visible: bool(h.visible),
  };
}

function customUpdate(input: unknown, current: CustomData): CustomData {
  const c = obj(input, 'Custom POS');
  const payment = Array.isArray(c.payment) ? c.payment : [];
  if (payment.length !== current.payment.length) fail('Custom POS payment split is invalid');
  const percents = payment.map((p, i) => int(Array.isArray(p) ? p[1] : undefined, `Payment step ${i + 1} percent`, 0, 100));
  if (percents.reduce((a, b) => a + b, 0) !== 100) fail('Custom POS payment percentages must add up to 100');

  const inputCats = Array.isArray(c.cats) ? c.cats : [];
  const inputItems = new Map<string, Record<string, unknown>>();
  for (const cat of inputCats) {
    for (const it of Array.isArray((cat as { items?: unknown }).items) ? (cat as { items: unknown[] }).items : []) {
      const o = obj(it, 'Custom POS feature');
      if (typeof o.id === 'string') inputItems.set(o.id, o);
    }
  }

  return {
    ...current,
    rate: int(c.rate, 'Price per working day', 1),
    round: int(c.round, 'Rounding', 1),
    weeksBase: int(c.weeksBase, 'Base setup weeks', 0, 52),
    daysPerWeek: int(c.daysPerWeek, 'Working days per week', 1, 7),
    payment: current.payment.map(([label], i) => [label, percents[i]]),
    base: { ...current.base, days: days(obj(c.base, 'Base package').days, 'Base package days') },
    cats: current.cats.map((cat) => ({
      ...cat,
      items: cat.items.map((cur) => {
        const it = inputItems.get(cur.id);
        if (!it) return cur;
        const label = `"${cur.name}"`;
        const next = { ...cur, days: days(it.days, `${label} days`), hidden: bool(it.hidden) };
        if (it.price === null || it.price === undefined || it.price === '') delete next.price;
        else next.price = int(it.price, `${label} price`, 0);
        if (cur.option) {
          const o = obj(it.option, `${label} option`);
          next.option = { ...cur.option, price: int(o.price, `${label} option price`, 0), days: days(o.days, `${label} option days`) };
        }
        return next;
      }),
    })),
  };
}

export function validateMenuUpdate(input: unknown, current: MenuData): MenuData {
  const body = obj(input, 'Menu');

  const g = obj(body.general, 'General');
  const website = text(g.website, 'Website', { max: 200 });
  try {
    if (!/^https?:$/.test(new URL(website).protocol)) throw new Error();
  } catch {
    fail('Website must start with https://');
  }
  const email = text(g.email, 'Email', { max: 120 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Email is not valid');

  const p = obj(body.packages, 'Packages');

  const aiInput = Array.isArray(body.aiChannels) ? body.aiChannels : [];
  const aiChannels = current.aiChannels.map((cur) => {
    const raw = aiInput.find((x) => obj(x, 'AI channel').id === cur.id);
    if (!raw) return cur;
    const a = obj(raw, cur.name);
    return {
      ...cur,
      setupFee: int(a.setupFee, `${cur.name} setup fee`, 0),
      wait: text(a.wait, `${cur.name} waiting time`, { max: 40 }),
      monthlyFrom: int(a.monthlyFrom, `${cur.name} monthly price`, 0),
      // the Viber page always shows the Staff-Inbox-only price, so it stays required there
      inboxOnlyFee: cur.inboxOnlyFee === null ? null : int(a.inboxOnlyFee, `${cur.name} Staff Inbox price`, 0),
      visible: bool(a.visible),
    };
  });

  const hwInput = Array.isArray(body.hardware) ? body.hardware : fail('Hardware list is missing');
  if (hwInput.length > 60) fail('Too many hardware items (max 60)');
  const hardware = hwInput.map(hardwareItem);
  const slugs = new Set<string>();
  for (const h of hardware) {
    if (slugs.has(h.slug)) fail(`Two hardware items use the link id "${h.slug}"`);
    slugs.add(h.slug);
  }

  return {
    schemaVersion: 2,
    general: {
      priceDate: text(g.priceDate, 'Price list date', { max: 60 }),
      phone: text(g.phone, 'Phone', { max: 60 }),
      email,
      website,
    },
    packages: {
      commercial: int(p.commercial, 'Commercial price', 0),
      enterprise: int(p.enterprise, 'Enterprise price', 0),
    },
    aiChannels,
    hardware,
    custom: customUpdate(body.custom, current.custom),
  };
}
