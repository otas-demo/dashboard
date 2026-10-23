# Menu v2 update — implementation spec

Hand this file to the coding agent. It describes every change needed to move the dashboard's public price menu (`/menu`) to the new design in `C:\Users\PC\Desktop\auto-shop-menu\`.

## 0. Ground rules (read first)

1. **Do not change any Burmese wording, prices or features.** Every text and number comes from the new menu folder. The content owner is Thant Sin Oo (OTAS); nothing may be invented or reworded.
2. This repo uses **Next.js 16.4.2**, which differs from older versions. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` (see `AGENTS.md`).
3. **No new npm dependencies.**
4. All Burmese text is Myanmar Unicode. Files must be read and written as UTF-8. On Windows, don't send Burmese text through `curl -d "$VAR"` in Git Bash: it corrupts it. Use Node `fetch` for tests. Also, put test code that contains regexes in `.cjs`/`.mjs` files instead of `node -e '…'`: Git Bash strips backslashes from inline code.
5. Keep the existing patterns: route handlers serve the public menu as full HTML documents (no React for the public pages), and `src/lib/menu/render.ts` fills `{{placeholders}}` in generated templates.
6. Do not commit or push. The work will be reviewed first.

### Paths
| Name | Path |
|---|---|
| Dashboard repo | `C:\Users\PC\Desktop\autoshop-dashboard` |
| New menu (source of truth) | `C:\Users\PC\Desktop\auto-shop-menu` |
| New pages | `auto-shop-menu\site\*.html` (8 pages) |
| New Custom POS data | `auto-shop-menu\site\custom-data.js` (`window.CUSTOM_DATA`) |
| New POS / AI / hardware data | `auto-shop-menu\data\menu-data.json` |
| New guide | `auto-shop-menu\CLAUDE.md` (explains structure and pricing rules) |

### Current dashboard menu code (to modify)
| File | Role |
|---|---|
| `src/lib/menu/templates.ts` | Generated: `MENU_TEMPLATES` = the 8 HTML pages with `{{placeholders}}` |
| `src/lib/menu/defaults.json` / `defaults.ts` | Built-in menu data used until the first save |
| `src/lib/menu/types.ts` | `MenuData` types, `HARDWARE_CATEGORIES` |
| `src/lib/menu/format.ts` | Myanmar number formatting (`mm`, `kyat`, `lakh`, `autoPrice`, `customPriceOfDays`) |
| `src/lib/menu/render.ts` | `renderMenuPage(key, data)`: fills placeholders, builds card HTML |
| `src/lib/menu/validate.ts` | `validateMenuUpdate(input, current)`: merges editor input onto the current menu |
| `src/lib/menu/data.ts` | `getMenu()`: loads the saved document or the defaults |
| `src/lib/menu/respond.ts` | `menuPageResponse(key)`: HTML response for public pages |
| `src/app/menu/route.ts`, `src/app/menu/[page]/route.ts` | Public routes |
| `src/app/api/menu/route.ts` | GET / PUT for the editor |
| `src/app/menu-editor/page.tsx` | The Price Menu editor |
| `public/menu-assets/` | `site.css`, `custom.js`, `img/*.webp` |

---

## 1. What changed in the new menu (summary)

**Data**
- Tablet prices: Redmi Pad 2 Wi-Fi 720,000 → **690,000**; Redmi Pad 2 SIM 920,000 → **880,000**.
- Tablet names, specs and images changed. Each tablet now has its own photo: `redmi-pad-2-97-wifi.webp` and `redmi-pad-2-97-4g.webp`.
- Phone number is now **09-790673433** (was 09-951207795).
- Custom POS: all numbers and rules unchanged. All feature texts were rewritten, new optional fields `fit`, `when` and `note` were added, and feature **`device` was removed**.
- All other prices are unchanged.

**Design**
- New `site.css` (with dark mode) and new `custom.js` (category tabs, collapsible detail panels).
- **Home:**
  - The "from" price summary box is removed.
  - AI Order is a 3-row table showing setup fee and waiting time only.
  - Hardware cards show a spec line and the price; there's no category label.
- **AI pages:**
  - The 3 hero facts each have a short fixed note.
  - The 60/40 payment tables were removed.
  - Monthly price reads "၉၅,၀၀၀ မှ" / "၇ သိန်းမှ".
- **Commercial / Enterprise:** the price appears once (hero only).
- **Hardware page:** no price panel. Each card shows a spec line, a "best for" line (`<span class="best">`) and the price. Group descriptions changed.
- **Footer** (all pages): "ဈေးနှုန်း <date>". The hardware page also mentions the date once in a note.

---

## 2. Template generator — make it a repo script

Create **`scripts/generateMenuTemplates.mjs`** (Node ESM, no dependencies).
- Usage: `node scripts/generateMenuTemplates.mjs "C:\Users\PC\Desktop\auto-shop-menu"`.
- It writes `src/lib/menu/templates.ts` and copies the assets. This makes future redesigns from Thant repeatable.

The script must use a `rep(html, file, find, token, expectedCount)` helper that **throws** if `find` doesn't occur exactly `expectedCount` times. No silent misses. For regions, use `repRegion(html, file, startMarker, endMarker, token)`: it replaces everything between the end of `startMarker` and the start of `endMarker`, and throws if the start marker isn't unique or the end marker is missing.

### 2a. Applied to every page
| Find | Replace with | Count per page |
|---|---|---|
| `href="site.css"` | `href="/menu-assets/site.css"` | 1 |
| `src="img/` | `src="/menu-assets/img/` | any (regex) |
| `href="index.html#x"` / `href="index.html"` | `href="/menu#x"` / `href="/menu"` | any (regex) |
| `href="NAME.html#x"` | `href="/menu/NAME#x"` | any (regex `href="([\w-]+)\.html(#[\w-]+)?"`) |
| `<span class="sel">09-790673433</span>` | `<span class="sel">{{phone}}</span>` | 1 |
| `<span class="sel">info@otastechsolutions.com</span>` | `<span class="sel">{{email}}</span>` | 1 |
| `<a href="https://www.otastechsolutions.com" target="_blank" rel="noopener">www.otastechsolutions.com</a>` | `<a href="{{websiteUrl}}" target="_blank" rel="noopener">{{websiteLabel}}</a>` | 1 |
| `၂၀၂၆ အောက်တိုဘာ` | `{{priceDate}}` | 1 (hardware: **2**) |

Verified: each count above matches the new files exactly.

After all replacements, the script must assert that no `href="…\.html` links remain and no `{{` existed in the source HTML.

### 2b. Per page
**index.html**
| Find | Replace with | Count |
|---|---|---|
| `<p class="price-row"><b>၈၀,၀၀၀</b>` | `<p class="price-row"><b>{{commercialPrice}}</b>` | 1 |
| `<p class="price-row"><b>၁၄၀,၀၀၀</b>` | `<p class="price-row"><b>{{enterprisePrice}}</b>` | 1 |
| `<p class="price-row"><b>၁၅ သိန်းမှ</b>` | `<p class="price-row"><b>{{customLakh}} သိန်းမှ</b>` | 1 |
| region after `<div class="ai-list">`, up to `\n    </div>\n    <p class="ai-foot">`, keeping the `ai-head` row | see note below | 1 |
| region after `<div class="hw">`, up to `\n    </div>\n  </section>` | `{{hwCards}}` | 1 |

For the AI region: keep the first line `<div class="ai-head" aria-hidden="true">…</div>` as it is. Replace only the three `<a class="ai-row">…</a>` blocks with `{{aiRows}}`. The simplest way: use start marker `<span></span></div>` (the end of the ai-head row; check it's unique) and end marker `\n    </div>\n    <p class="ai-foot">`.

**commercial.html**: `၈၀,၀၀၀` → `{{price}}` (count 1).
**enterprise.html**: `၁၄၀,၀၀၀` → `{{price}}` (count 1).

**custom.html**
| Find | Replace with | Count |
|---|---|---|
| `<b>၁၅ သိန်းမှ</b>` | `<b>{{customLakh}} သိန်းမှ</b>` | 1 |
| `အခြေခံမှာ ပါပြီးသား · ၁၅ သိန်း` | `အခြေခံမှာ ပါပြီးသား · {{customLakh}} သိန်း` | 1 |
| `တည်ဆောက်ချိန် ၄ ပတ်ခန့်မှ` | `တည်ဆောက်ချိန် {{customWeeks}} ပတ်ခန့်မှ` | 1 |
| `ငွေပေးချေ ၆၀% + ၄၀%` | `ငွေပေးချေ {{payFirstPct}}% + {{payLastPct}}%` | 1 |
| `<script src="custom-data.js"></script>` | `<script>window.CUSTOM_DATA = {{customDataJson}};</script>` | 1 |
| `<script src="custom.js"></script>` | `<script src="/menu-assets/custom.js"></script>` | 1 |

Leave `USD ၆`, `၁၅%` and `၃ လ` as fixed text.

**ai-facebook.html / ai-telegram.html** (identical structure)
| Find | Replace with | Count |
|---|---|---|
| `<b>၁၀ သိန်း</b>` | `<b>{{setupLakh}} သိန်း</b>` | 1 |
| `<b>၁–၂ ပတ်</b>` | `<b>{{wait}}</b>` | 1 |
| `စတင်ပုံ · ၁–၂ ပတ်` | `စတင်ပုံ · {{wait}}` | 1 |
| `<b>၉၅,၀၀၀ မှ</b>` | `<b>{{monthly}}</b>` | 1 |

The notes (`၆၀% စတင်ချိန် · ၄၀% အပ်နှံချိန်`, `AI ကို ဆိုင်အကြောင်း သင်ချိန်`, `ကျပ် / လ + AI သုံးစွဲခ`) stay as fixed text.

**ai-viber.html**
| Find | Replace with | Count |
|---|---|---|
| `<b>၂၅ သိန်း</b>` | `<b>{{setupLakh}} သိန်း</b>` | 1 |
| `AI မပါဘဲ Inbox ပဲဆို ၁၈ သိန်း` | `AI မပါဘဲ Inbox ပဲဆို {{inboxLakh}} သိန်း` | 1 |
| `<b>၄–၆ ပတ်</b>` | `<b>{{wait}}</b>` | 1 |
| `စတင်ပုံ · ၄–၆ ပတ်` | `စတင်ပုံ · {{wait}}` | 1 |
| `<b>၇ သိန်းမှ</b>` | `<b>{{monthly}}</b>` | 1 |

**hardware.html**: region after `<section class="sec" aria-label="စက်ပစ္စည်း စာရင်း">`, up to `\n    <p class="small-note">` → `{{hwGroups}}` (count 1). The `small-note` paragraph stays and keeps its `{{priceDate}}`.

### 2c. Output
- `src/lib/menu/templates.ts`: same shape as now. Keep the banner comment, `export const MENU_TEMPLATES = {…} as const;` and `export type MenuPageKey = keyof typeof MENU_TEMPLATES;`. Keys stay the same: `index, commercial, enterprise, custom, hardware, ai-facebook, ai-telegram, ai-viber`.
- Copy `site/site.css` → `public/menu-assets/site.css` and `site/custom.js` → `public/menu-assets/custom.js`, both unchanged.
- Copy all `site/img/*.webp` → `public/menu-assets/img/`. **Keep the old `redmi-pad-2.webp`**, because saved menus may still point to it.

---

## 3. Data model changes — `src/lib/menu/types.ts`

```ts
export interface MenuData {
  schemaVersion: 2;            // NEW — used by the migration (section 6)
  general: MenuGeneral;        // unchanged shape
  packages: MenuPackages;      // unchanged shape
  aiChannels: MenuAiChannel[];
  hardware: MenuHardwareItem[];
  custom: CustomData;
}

export interface MenuAiChannel {
  id: AiChannelId;
  name: string;                // fixed (not editable)
  subtitle: string;            // fixed: "Facebook Page" | "Auto Shop Sale Inbox" | "Telegram Bot"
  setupFee: number;
  wait: string;                // e.g. "၁–၂ ပတ်"
  monthlyFrom: number;
  inboxOnlyFee: number | null; // Viber only
  visible: boolean;
  // REMOVED: setupNote (the notes are now fixed text in the templates)
}

export interface MenuHardwareItem {
  slug: string;
  category: string;            // one of HARDWARE_CATEGORIES[].name
  name: string;
  spec: string;                // RENAMED from `variant`
  bestFor: string;             // NEW (short line, <span class="best">)
  price: number;
  image: string;
  samplePhoto: boolean;
  visible: boolean;
  // REMOVED: points, fit
}

export interface CustomFeature {
  // existing fields, plus these optional text arrays/strings from custom-data.js:
  fit?: string[];
  when?: string[];
  note?: string;
}
```

Change the `HARDWARE_CATEGORIES` descriptions to the new text:
- Tablet: `Auto Shop ကို ဖွင့်သုံးမယ့် စက်`
- Thermal Printer: `ဘောင်ချာ ထုတ်စက်`
- Barcode Scanner: `Barcode ဖတ်စက်`

Keep the names `Tablet`, `Thermal Printer`, `Barcode Scanner`. These are the display names on the hardware page. `menu-data.json` uses short names (`Printer`, `Scanner`); map them when building the defaults.

---

## 4. New defaults

1. Rename the current `src/lib/menu/defaults.json` → **`src/lib/menu/defaults-v1.json`** without changing its content. The migration needs it (section 6).
2. Create a new **`src/lib/menu/defaults.json`** (schemaVersion 2), built from the new folder:
   - **`general`:** priceDate `၂၀၂၆ အောက်တိုဘာ`, phone `09-790673433`, email `info@otastechsolutions.com`, website `https://www.otastechsolutions.com`.
   - **`packages`:** commercial `80000`, enterprise `140000` (from `menu-data.json` → `pos_packages`).
   - **`aiChannels`** (order: facebook, viber, telegram, as on the new home page):
     | id | name | subtitle | setupFee | wait | monthlyFrom | inboxOnlyFee |
     |---|---|---|---|---|---|---|
     | facebook | Facebook Messenger | Facebook Page | 1000000 | ၁–၂ ပတ် | 95000 | null |
     | viber | Viber | Auto Shop Sale Inbox | 2500000 | ၄–၆ ပတ် | 700000 | 1800000 |
     | telegram | Telegram | Telegram Bot | 1000000 | ၁–၂ ပတ် | 95000 | null |

     All are `visible: true`. Copy the names and subtitles exactly from `site/index.html`.
   - **`hardware`:** the 8 items from `menu-data.json` → `hardware`, in that order:
     - `slug` = `id`, `spec` = `spec`, `bestFor` = `best_for`, `price` = `price`, `samplePhoto` = `sample_image`, `visible: true`.
     - `image` = `"/menu-assets/" + image`.
     - `category` mapped: `Tablet` → `Tablet`, `Printer` → `Thermal Printer`, `Scanner` → `Barcode Scanner`.
     - Name, spec, best-for, sample flag and image in `menu-data.json` were checked against `site/index.html` and `site/hardware.html`, and all 8 items match. If you find a difference anyway, the HTML wins, because it's what Thant approved visually. Report it.
   - **`custom`:** `window.CUSTOM_DATA` from `site/custom-data.js` (evaluate it with Node), **without** the `version` key. It must still have 22 features; `device` is gone.
3. `defaults.ts` keeps exporting `DEFAULT_MENU` (new). Add `DEFAULT_MENU_V1` from `defaults-v1.json`.

---

## 5. Rendering changes — `src/lib/menu/render.ts`

**Remove**
- The summary-box values `fromPos`, `fromAi`, `fromHw`.
- The hardware `hwPanel`.
- The AI payment table values `payFirst`, `payLast`, `inboxPayFirst`, `inboxPayLast`.
- `AI_PAYMENT_SPLIT` and `CHAT_ICON` usage if they become unused.

**Values per page**

| Page | Placeholder | Value |
|---|---|---|
| all | `priceDate`, `phone`, `email`, `websiteUrl`, `websiteLabel` | as today |
| index | `commercialPrice` | `kyat(packages.commercial)` |
| index | `enterprisePrice` | `kyat(packages.enterprise)` |
| index | `customLakh` | `lakh(base)`, where `base = customPriceOfDays(custom.base.days, custom.rate, custom.round)` |
| index | `aiRows` | one row per **visible** channel (markup below) |
| index | `hwCards` | one card per **visible** hardware item (markup below) |
| commercial | `price` | `kyat(packages.commercial)` |
| enterprise | `price` | `kyat(packages.enterprise)` |
| custom | `customLakh` | `lakh(base)` |
| custom | `customWeeks` | `mm(custom.weeksBase)` |
| custom | `payFirstPct` | `mm(custom.payment[0][1])` |
| custom | `payLastPct` | `mm(custom.payment[last][1])` |
| custom | `customDataJson` | as today (hidden features removed, `hidden` key stripped, `version` = priceDate, `<` escaped as `\u003c`) |
| ai-* | `setupLakh` | `lakh(setupFee)` |
| ai-* | `wait` | `esc(wait)` |
| ai-* | `monthly` | whole lakh (≥ 100,000 and divisible by 100,000) → `` `${lakh(n)} သိန်းမှ` ``, otherwise `` `${kyat(n)} မှ` ``. Expected output: `၉၅,၀၀၀ မှ` and `၇ သိန်းမှ`. Add this as a new helper `monthlyFrom()` in `format.ts`. |
| ai-viber | `inboxLakh` | `lakh(inboxOnlyFee)` |
| hardware | `hwGroups` | groups per category, visible items only, empty groups skipped (markup below) |

**AI row markup** (index; copy the exact SVGs from `site/index.html`; all three rows use the same chat icon and the same arrow):
```html
      <a class="ai-row" href="/menu/ai-{id}">
        <span class="ai-name"><span class="ic">{CHAT_SVG}</span><span><b>{name}</b><small>{subtitle}</small></span></span>
        <span class="ai-val" data-l="တပ်ဆင်ခ">{lakh(setupFee)} သိန်း</span>
        <span class="ai-val" data-l="ကြာချိန်">{wait}</span>
        <span class="ai-go">{ARROW_SVG}</span>
      </a>
```
Each row starts with a newline. The region begins right after the ai-head row.

**Home hardware card:**
```html
      <a class="hw-card" href="/menu/hardware#{slug}">
        <div class="ph">{SAMPLE}<img src="{image}" alt="{name}" width="360" height="360"></div>
        <div class="hw-body"><span class="hw-name">{name}</span><span class="hw-spec">{spec}</span>
          <span class="hw-price">{kyat(price)}<small>ကျပ်</small></span></div>
      </a>
```
`{SAMPLE}` = `<span class="sample">နမူနာပုံ</span>` when `samplePhoto`, otherwise empty.

**Hardware page:** the groups are written on one line, exactly like the source:
```html
<div class="hw-group"><h3>{category}<small>{blurb}</small></h3><div class="hwd">
        <article class="hw-card" id="{slug}">
          <div class="ph">{SAMPLE}<img src="{image}" alt="{name}" width="360" height="360"></div>
          <div class="hw-body"><h4 class="hw-name">{name}</h4><span class="hw-spec">{spec}</span>
            <span class="best">{bestFor}</span>
            <span class="hw-price">{kyat(price)}<small>ကျပ်</small></span></div>
        </article></div></div>
```
Several cards in one group follow each other inside `<div class="hwd">`. Follow the structure of `site/hardware.html`. Whitespace between tags doesn't need to match exactly, because the check in section 10 collapses whitespace, but the tags and their order must match. Omit the `<span class="best">` line when `bestFor` is empty.

**Escaping:** escape every text value from data with the existing `esc()`. Only the prebuilt blocks (`aiRows`, `hwCards`, `hwGroups`, `customDataJson`) are inserted raw.

---

## 6. Migrating an already-saved menu — `src/lib/menu/data.ts`

The live database may contain a saved menu in the **old** shape (no `schemaVersion`). Add `migrateMenu(saved: unknown): MenuData` in a new file **`src/lib/menu/migrate.ts`**, and call it in `getMenu()` whenever `doc.data.schemaVersion !== 2`.

Rule for every number, flag or short value:
- **If the saved value equals the old default (`DEFAULT_MENU_V1`)**, the user never changed it, so take the **new** default.
- **Otherwise keep the saved value.**

| Area | Migration |
|---|---|
| `general` | Apply the rule to `priceDate`, `phone`, `email`, `website`. With the rule, the old phone `09-951207795` becomes `09-790673433`. |
| `packages` | Apply the rule to `commercial` and `enterprise`. |
| `aiChannels` | Start from the new defaults. Per channel id, apply the rule to `setupFee`, `wait`, `monthlyFrom`, `inboxOnlyFee`. Copy `visible` from the saved menu as-is. Drop `setupNote`. |
| `hardware` | **Items whose slug exists in the new defaults:** take `name`, `spec`, `bestFor`, `category` and `image` from the new defaults. Apply the rule to `price` (so the tablets become 690,000 / 880,000 unless edited) and to `samplePhoto`. Copy `visible` as-is. **Items the user added** (slug not in the old defaults): keep them, rename `variant` → `spec`, set `bestFor` = saved `fit`, drop `points`/`fit`. **Default items the user deleted** (slug in the old defaults but missing from the saved list): stay deleted. **Order:** keep the saved order; append new default items that weren't in the old defaults at the end (currently none). |
| `custom` | Start from the new defaults (new texts and fields). Apply the rule to `rate`, `round`, `weeksBase`, `daysPerWeek`, `base.days`, the payment percentages, and per feature id to `price`, `days`, `option.price`, `option.days`. Copy `hidden` as-is. Features no longer in the new defaults (`device`) are dropped. |
| result | `schemaVersion: 2` |

- The migration runs **in memory on read**. It's stored the next time a super admin presses Save.
- `GET /api/menu` must also return `migrated: true` when this happened. The editor then shows a yellow banner: "The menu was updated to the new design. Review the prices and press Save." Save must be enabled even with no edits; treat the migrated state as unsaved.
- If the migration throws, log it and fall back to the new defaults, **but only for the editor GET**. Public pages follow section 7.
- `validateMenuUpdate` must output `schemaVersion: 2`.

---

## 7. Fallback when the database is down — `src/lib/menu/respond.ts` / `data.ts`

- Keep a module-level `lastGoodMenu: MenuData | null`. Set it every time `getMenu()` succeeds.
- In `menuPageResponse`:
  - If `getMenu()` throws and `lastGoodMenu` exists, render with it (status 200, `Cache-Control: no-store`) and log a warning.
  - If there's no `lastGoodMenu`, keep the current 503 "temporarily unavailable" page.
  - **Never fall back to the built-in defaults on public pages.**

---

## 8. Validation — `src/lib/menu/validate.ts`

- **AI channels:** remove `setupNote`. Keep `setupFee`, `wait`, `monthlyFrom`, `inboxOnlyFee` (required for Viber) and `visible` as editable. `name` and `subtitle` come from `current`.
- **Hardware item:**
  - `variant` → `spec` (max 160 characters, optional).
  - Remove `points` and `fit`.
  - Add `bestFor` (optional, max 80 characters).
  - The other rules stay the same: slug format, unique slugs, category from the list, image `/menu-assets/…` or `https://`, max 60 items.
- **Custom:** unchanged, except that features are looked up in `current`, which no longer contains `device`. Keep the `fit`/`when`/`note` texts from `current`; never take them from input.
- Always return `schemaVersion: 2`.

---

## 9. Editor — `src/app/menu-editor/page.tsx`

- **Hardware modal:**
  - Rename the "Short description" label to **Spec** (field `spec`).
  - Remove "Bullet points" and "Suits which shops".
  - Add a text field **Best for** (`bestFor`, placeholder `ဥပမာ Wi-Fi ရှိတဲ့ ကောင်တာ`).
  - Update `EMPTY_ITEM` to match.
  - The list row's second line keeps showing `category · price`.
- **Built-in photo list (`BUILT_IN_IMAGES`):** add `redmi-pad-2-97-wifi.webp` and `redmi-pad-2-97-4g.webp`. Keep `redmi-pad-2.webp`.
- **AI Order tab:**
  - Remove the "Setup note" field.
  - Change the monthly preview to `monthlyFrom()` (shows `၉၅,၀၀၀ မှ` / `၇ သိန်းမှ`).
  - Show the subtitle read-only under the channel name.
- **Packages tab:** unchanged.
- **Custom POS tab:** unchanged (the `device` row disappears by itself).
- **Migration banner** as described in section 6.
- Header text: "Not saved yet — showing the original October 2026 price list" stays.

---

## 10. Tests the agent must run and report

Use a throwaway local MongoDB, not the real one.
1. Run `C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe --dbpath <empty temp dir> --port 27018`.
2. Run `next build`.
3. Start the app with `MONGODB_URI=mongodb://127.0.0.1:27018/menu_v2_test npx next start -p 3200`.
4. Create a test super admin with `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run seed`, with `MONGODB_URI` pointing at the test DB.

**A. Pages match the new design** (nothing saved yet):
- For each of the 8 pages, fetch `http://localhost:3200/menu[/page]` and compare its visible text with the matching file in `auto-shop-menu/site/`.
- How to compare: strip `<head>`, `<script>`, `<style>` and tags, decode `&quot; &amp; &#39;`, and collapse whitespace.
- Expected: **identical text and identical image file names** on all 8 pages, status 200, no `{{` left and no `.html` links left.
- Also compare the injected `window.CUSTOM_DATA` with `custom-data.js`: identical `cats`, `rate`, `round`, `payment`, `base`, and `version` = `၂၀၂၆ အောက်တိုဘာ`.

**B. Visual check** of all 8 pages at 390px and 1280px, in light and dark mode (`prefers-color-scheme: dark`):
- no horizontal scroll at 390px;
- no console errors.

**C. Custom POS flow** (from the new `CLAUDE.md`):
- Pick features in several tabs and confirm the tab badges update.
- Change the quantity of a `qty` item.
- Turn on the Viber option under `online_order`.
- Open a detail panel and confirm it doesn't tick the checkbox.
- Press "Copy ကူးရန်", then "အကုန်ဖြုတ်".

**D. Editing:** log in, open `/menu-editor`, then:
1. Change Enterprise to 150000.
2. Hide Telegram.
3. Add a hardware item with Best for text.
4. Hide the NS 03 item.
5. Give feature `price_levels` a fixed price of 300000.
6. Save.

Then confirm on the public pages:
- Enterprise shows `၁၅၀,၀၀၀` on the home page and the Enterprise page.
- The Telegram row is gone from the home page, but `/menu/ai-telegram` still works.
- The new item appears on the home page and the hardware page with its best-for line.
- NS 03 is gone.
- The calculator uses 300000 for `price_levels`.

**E. Migration:**
1. Write an old-format document straight into the test DB's `menusettings` collection: `{ key: 'main', data: <content of defaults-v1.json> }`, plus these edits:
   - Commercial = 85000.
   - An extra hardware item `{ slug: 'my-scanner', category: 'Barcode Scanner', name: 'My Scanner', variant: 'USB', points: ['x'], fit: 'test fit', price: 100000, image: '/menu-assets/img/yoko-hs25l.webp', samplePhoto: false, visible: true }`.
   - Feature `credit` with `days: 3`.
2. Open the public pages and the editor, and confirm:
   - Commercial = ၈၅,၀၀၀ (kept).
   - The tablets show ၆၉၀,၀၀၀ / ၈၈၀,၀၀၀ (new defaults).
   - The phone shows 09-790673433.
   - My Scanner is shown with spec "USB" and best-for "test fit".
   - The `device` feature is gone.
   - `credit` keeps 3 days.
   - Feature texts are the new texts.
   - The editor shows the migration banner and Save is enabled.
3. After Save, the stored document has `schemaVersion: 2` and the banner is gone.

**F. Fallback:**
1. Open `/menu` once, so it's remembered.
2. Stop mongod.
3. `/menu` still returns 200 with the last prices.
4. Restart the app while mongod is still stopped: `/menu` returns 503.

**G. Access:**
- Signed-out `PUT /api/menu` and `POST /api/menu/upload` return 401.
- A staff user gets 403 on both.

**H. Build:** `npx tsc --noEmit` passes, `npx next build` passes, and `npx eslint src` shows no new kinds of problems.

Stop the test servers and mongod afterwards. Don't touch `.env.local` or the real database.

---

## 11. Docs
In `README.md`, under "Public Price Menu", add how to update the menu design when Thant sends new files:
```
node scripts/generateMenuTemplates.mjs "<path to auto-shop-menu>"
```
Note that new defaults must also be updated in `src/lib/menu/defaults.json`, together with a `schemaVersion` bump and migration rules.

Careful: `README.md` ends with a stray UTF-16 line. Edit it without converting the file's encoding (or report it instead of editing).

---

## 12. Report back

When finished, list:
- every file changed or added;
- the test results for sections A–H, with the actual output;
- any text difference found between `menu-data.json` and the HTML;
- anything you couldn't do or decided differently.

Do not commit.
