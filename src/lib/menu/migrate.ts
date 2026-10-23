import { DEFAULT_MENU, DEFAULT_MENU_V1 } from '@/lib/menu/defaults';
import type { MenuAiChannel, MenuData, MenuHardwareItem } from '@/lib/menu/types';

function pick<T>(savedVal: T, oldVal: T, newVal: T): T {
  return savedVal === oldVal ? newVal : savedVal;
}

function asObj(val: unknown, label: string): Record<string, unknown> {
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    throw new Error(`Invalid saved menu: ${label} is missing or not an object`);
  }
  return val as Record<string, unknown>;
}

/**
 * Migrates an already-saved v1 menu document to schemaVersion 2 in memory.
 * For every number, flag or short value:
 * - If the saved value equals DEFAULT_MENU_V1, take the new default (DEFAULT_MENU).
 * - Otherwise keep the saved value.
 */
export function migrateMenu(saved: unknown): MenuData {
  const root = asObj(saved, 'root');
  const sGen = asObj(root.general, 'general');
  const sPkg = asObj(root.packages, 'packages');
  const sCust = asObj(root.custom, 'custom');
  const sBase = asObj(sCust.base, 'custom.base');

  if (!Array.isArray(root.aiChannels)) {
    throw new Error('Invalid saved menu: aiChannels is not an array');
  }
  if (!Array.isArray(root.hardware)) {
    throw new Error('Invalid saved menu: hardware is not an array');
  }
  if (!Array.isArray(sCust.cats)) {
    throw new Error('Invalid saved menu: custom.cats is not an array');
  }

  const v1Gen = DEFAULT_MENU_V1.general;
  const v1Pkg = DEFAULT_MENU_V1.packages;
  const v1Cust = DEFAULT_MENU_V1.custom;
  const v2 = structuredClone(DEFAULT_MENU);

  // 1. general
  const general = {
    priceDate: pick(String(sGen.priceDate ?? ''), v1Gen.priceDate, v2.general.priceDate),
    phone: pick(String(sGen.phone ?? ''), v1Gen.phone, v2.general.phone),
    email: pick(String(sGen.email ?? ''), v1Gen.email, v2.general.email),
    website: pick(String(sGen.website ?? ''), v1Gen.website, v2.general.website),
  };

  // 2. packages
  const packages = {
    commercial: pick(Number(sPkg.commercial), v1Pkg.commercial, v2.packages.commercial),
    enterprise: pick(Number(sPkg.enterprise), v1Pkg.enterprise, v2.packages.enterprise),
  };

  // 3. aiChannels
  const savedChannels = root.aiChannels.map((c) => asObj(c, 'aiChannel'));
  const aiChannels: MenuAiChannel[] = v2.aiChannels.map((newCh) => {
    const savedCh = savedChannels.find((c) => c.id === newCh.id);
    const oldCh = DEFAULT_MENU_V1.aiChannels.find((c) => c.id === newCh.id);
    if (!savedCh || !oldCh) return newCh;
    return {
      id: newCh.id,
      name: newCh.name,
      subtitle: newCh.subtitle,
      setupFee: pick(Number(savedCh.setupFee), oldCh.setupFee, newCh.setupFee),
      wait: pick(String(savedCh.wait ?? ''), oldCh.wait, newCh.wait),
      monthlyFrom: pick(Number(savedCh.monthlyFrom), oldCh.monthlyFrom, newCh.monthlyFrom),
      inboxOnlyFee:
        newCh.inboxOnlyFee === null
          ? null
          : pick(
              savedCh.inboxOnlyFee === null ? null : Number(savedCh.inboxOnlyFee),
              oldCh.inboxOnlyFee,
              newCh.inboxOnlyFee
            ),
      visible: Boolean(savedCh.visible),
    };
  });

  // 4. hardware
  const newHwBySlug = new Map(v2.hardware.map((h) => [h.slug, h]));
  const oldHwBySlug = new Map(DEFAULT_MENU_V1.hardware.map((h) => [h.slug, h]));
  const hardware: MenuHardwareItem[] = [];

  for (const rawH of root.hardware) {
    const sh = asObj(rawH, 'hardware item');
    const slug = String(sh.slug);
    const newH = newHwBySlug.get(slug);
    const oldH = oldHwBySlug.get(slug);

    if (newH) {
      hardware.push({
        slug: newH.slug,
        category: newH.category,
        name: newH.name,
        spec: newH.spec,
        bestFor: newH.bestFor,
        image: newH.image,
        price: oldH ? pick(Number(sh.price), oldH.price, newH.price) : Number(sh.price),
        samplePhoto: oldH
          ? pick(Boolean(sh.samplePhoto), oldH.samplePhoto, newH.samplePhoto)
          : Boolean(sh.samplePhoto),
        visible: Boolean(sh.visible),
      });
    } else if (!oldH) {
      // Item added by the user (slug not in old defaults)
      hardware.push({
        slug,
        category: String(sh.category),
        name: String(sh.name),
        spec: typeof sh.spec === 'string' ? sh.spec : String(sh.variant ?? ''),
        bestFor: typeof sh.bestFor === 'string' ? sh.bestFor : String(sh.fit ?? ''),
        price: Number(sh.price),
        image: String(sh.image),
        samplePhoto: Boolean(sh.samplePhoto),
        visible: Boolean(sh.visible),
      });
    }
  }

  // Append any new default items that weren't in the old defaults at the end
  const seenSlugs = new Set(hardware.map((h) => h.slug));
  for (const newH of v2.hardware) {
    if (!oldHwBySlug.has(newH.slug) && !seenSlugs.has(newH.slug)) {
      hardware.push(structuredClone(newH));
    }
  }

  // 5. custom
  const custom = v2.custom;
  custom.rate = pick(Number(sCust.rate), v1Cust.rate, custom.rate);
  custom.round = pick(Number(sCust.round), v1Cust.round, custom.round);
  custom.weeksBase = pick(Number(sCust.weeksBase), v1Cust.weeksBase, custom.weeksBase);
  custom.daysPerWeek = pick(Number(sCust.daysPerWeek), v1Cust.daysPerWeek, custom.daysPerWeek);
  custom.base.days = pick(Number(sBase.days), v1Cust.base.days, custom.base.days);
  const sPay = Array.isArray(sCust.payment) ? sCust.payment : [];
  custom.payment = custom.payment.map(([label, newPct], i) => {
    const row = sPay[i];
    const savedPct = Array.isArray(row) ? Number(row[1]) : newPct;
    const oldPct = Number(v1Cust.payment[i]?.[1] ?? newPct);
    return [label, pick(savedPct, oldPct, newPct)];
  });

  const oldFeats = new Map<string, Record<string, unknown>>();
  for (const cat of v1Cust.cats) {
    for (const it of cat.items) {
      oldFeats.set(it.id, it as unknown as Record<string, unknown>);
    }
  }

  const savedFeats = new Map<string, Record<string, unknown>>();
  for (const rawCat of sCust.cats) {
    const cat = asObj(rawCat, 'custom category');
    if (Array.isArray(cat.items)) {
      for (const rawIt of cat.items) {
        const it = asObj(rawIt, 'custom feature');
        if (typeof it.id === 'string') {
          savedFeats.set(it.id, it);
        }
      }
    }
  }

  for (const cat of custom.cats) {
    for (const feat of cat.items) {
      const sf = savedFeats.get(feat.id);
      const of = oldFeats.get(feat.id);
      if (!sf || !of) continue;

      feat.days = pick(Number(sf.days), Number(of.days), feat.days);
      const sfPrice = sf.price === undefined || sf.price === null ? undefined : Number(sf.price);
      const ofPrice = of.price === undefined || of.price === null ? undefined : Number(of.price);
      const migratedPrice = pick(sfPrice, ofPrice, feat.price);
      if (migratedPrice === undefined) {
        delete feat.price;
      } else {
        feat.price = migratedPrice;
      }

      if (feat.option && sf.option && of.option) {
        const sfOpt = asObj(sf.option, 'feature option');
        const ofOpt = asObj(of.option, 'old feature option');
        feat.option.price = pick(Number(sfOpt.price), Number(ofOpt.price), feat.option.price);
        feat.option.days = pick(Number(sfOpt.days), Number(ofOpt.days), feat.option.days);
      }

      if (sf.hidden !== undefined) {
        feat.hidden = Boolean(sf.hidden);
      }
    }
  }

  return {
    schemaVersion: 2,
    general,
    packages,
    aiChannels,
    hardware,
    custom,
  };
}
