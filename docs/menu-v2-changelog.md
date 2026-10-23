# Menu v2 Update — Detailed Change Summary

This document summarizes all code, data, template, and UI changes made to implement the **Menu v2 update** ([`docs/menu-v2-update-plan.md`](file:///c:/Users/PC/Desktop/autoshop-dashboard/docs/menu-v2-update-plan.md)).

---

## 1. Template & Asset Generator Script

### [`scripts/generateMenuTemplates.mjs`](file:///c:/Users/PC/Desktop/autoshop-dashboard/scripts/generateMenuTemplates.mjs) *(New File)*
- Created a zero-dependency Node ESM script that reads the 8 static HTML files from `auto-shop-menu/site/` (`index`, `commercial`, `enterprise`, `custom`, `hardware`, `ai-facebook`, `ai-telegram`, `ai-viber`).
- Implements strict `rep(html, file, find, token, expectedCount)` and `repRegion(html, file, startMarker, endMarker, token)` helpers that throw immediately if any expected pattern count or marker is missing.
- Replaces static links (`*.html`), asset paths (`site.css`, `img/`), contact details (`{{phone}}`, `{{email}}`, `{{websiteUrl}}`, `{{websiteLabel}}`), date (`{{priceDate}}`), and per-page dynamic regions (`{{commercialPrice}}`, `{{enterprisePrice}}`, `{{customLakh}}`, `{{aiRows}}`, `{{hwCards}}`, `{{hwGroups}}`, `{{customDataJson}}`, etc.).
- Asserts that no `{{` existed in the source HTML prior to replacement and no `.html` `href` attributes remain afterward.
- Outputs [`src/lib/menu/templates.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/templates.ts) and copies `site.css`, `custom.js`, and `img/*.webp` into `public/menu-assets/` while preserving the legacy `redmi-pad-2.webp` image for backward compatibility.

---

## 2. Data Model & Built-in Defaults

### [`src/lib/menu/types.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/types.ts)
- **[`MenuData`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/types.ts#L77-L84)**: Added `schemaVersion: 2`.
- **[`MenuAiChannel`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/types.ts#L18-L27)**: Removed `setupNote` (notes are now fixed text in the templates).
- **[`MenuHardwareItem`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/types.ts#L29-L39)**: Renamed `variant` to `spec`, removed `points` and `fit`, and added `bestFor` (`<span class="best">`).
- **[`CustomFeature`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/types.ts#L42-L58)**: Added optional `fit?: string[]`, `when?: string[]`, and `note?: string` fields.
- **[`HARDWARE_CATEGORIES`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/types.ts#L86-L90)**: Updated category blurbs (`Tablet`: `Auto Shop ကို ဖွင့်သုံးမယ့် စက်`, `Thermal Printer`: `ဘောင်ချာ ထုတ်စက်`, `Barcode Scanner`: `Barcode ဖတ်စက်`).

### [`src/lib/menu/defaults-v1.json`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/defaults-v1.json) *(New File)*, [`src/lib/menu/defaults.json`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/defaults.json), & [`src/lib/menu/defaults.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/defaults.ts)
- Preserved the original v1 defaults in `defaults-v1.json` and exported `DEFAULT_MENU_V1` from `defaults.ts`.
- Built the new v2 `defaults.json` (`schemaVersion: 2`) from `auto-shop-menu`:
  - **General**: Updated phone number from `09-951207795` to `09-790673433`.
  - **AI Channels**: Ordered as `facebook`, `viber`, `telegram` with updated subtitles (`Facebook Page`, `Auto Shop Sale Inbox`, `Telegram Bot`).
  - **Hardware**: Updated the 8 items from `menu-data.json` (Redmi Pad 2 9.7 Wi-Fi at `690,000` with `redmi-pad-2-97-wifi.webp`; Redmi Pad 2 SIM at `880,000` with `redmi-pad-2-97-4g.webp`; mapped `Printer` → `Thermal Printer` and `Scanner` → `Barcode Scanner`).
  - **Custom POS**: Populated from `window.CUSTOM_DATA` in `site/custom-data.js` (22 features total, `device` removed, updated descriptions and `fit`/`when`/`note` metadata).

---

## 3. Formatting & HTML Rendering

### [`src/lib/menu/format.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/format.ts)
- Added [`monthlyFrom(amount: number)`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/format.ts#L25-L28): Formats whole-lakh values (≥ 100,000 and divisible by 100,000) as `${lakh(n)} သိန်းမှ` (e.g., `၇ သိန်းမှ`) and other amounts as `${kyat(n)} မှ` (e.g., `၉၅,၀၀၀ မှ`).

### [`src/lib/menu/render.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/render.ts)
- Removed obsolete v1 placeholders (`fromPos`, `fromAi`, `fromHw`, `hwPanel`, `payFirst`, `payLast`, `inboxPayFirst`, `inboxPayLast`, and `AI_PAYMENT_SPLIT`).
- Updated `index` rendering to build 3-row AI table entries (`{{aiRows}}`) and compact hardware cards (`{{hwCards}}`) with `<span class="sample">နမူနာပုံ</span>`.
- Updated `hardware` rendering (`{{hwGroups}}`) to group visible items by category and render `<span class="best">{bestFor}</span>` when `bestFor` is non-empty.
- Updated `ai-*` rendering to use `monthlyFrom(c.monthlyFrom)` for `{{monthly}}`.

---

## 4. In-Memory Migration & Database Fallback

### [`src/lib/menu/migrate.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/migrate.ts) *(New File)*
- Implemented [`migrateMenu(saved: unknown): MenuData`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/migrate.ts#L22-L185):
  - Compares every saved number, flag, or short string against `DEFAULT_MENU_V1`: if unchanged from v1 default, upgrades to the new v2 default; if customized by the user, preserves the user's saved value.
  - **Hardware**: Takes new `name`, `spec`, `bestFor`, `category`, and `image` for built-in slugs while applying the default-comparison rule to `price` and `samplePhoto` and keeping `visible`. Preserves user-added items (mapping `variant` → `spec` and `fit` → `bestFor`), and keeps deleted default items deleted.
  - **Custom POS**: Starts from v2 defaults (new texts and 22 features, dropping `device`) while preserving customized `rate`, `round`, `weeksBase`, `daysPerWeek`, `base.days`, payment split percentages, and per-feature `days`, `price`, `option.price`, `option.days`, and `hidden`.
  - Sets `schemaVersion: 2` on the returned object.

### [`src/lib/menu/data.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/data.ts) & [`src/lib/menu/respond.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/respond.ts)
- [`getMenu()`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/data.ts#L25-L64) automatically runs `migrateMenu(doc.data)` in memory when `doc.data.schemaVersion !== 2` and sets `migrated: true`.
- If migration throws during an editor request (`allowMigrationFallback: true`), logs the error and falls back to `DEFAULT_MENU` with `migrated: true`.
- Caches `lastGoodMenu` in memory whenever `getMenu()` or `PUT /api/menu` succeeds.
- In [`menuPageResponse()`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/respond.ts#L17-L32), if `getMenu()` throws (e.g., MongoDB is down), serves `lastGoodMenu` with HTTP `200` (`Cache-Control: no-store`) if available, or returns HTTP `503` if no menu has been loaded yet.

---

## 5. Validation, API & Dashboard Editor UI

### [`src/lib/menu/validate.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/validate.ts) & [`src/app/api/menu/route.ts`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/app/api/menu/route.ts)
- Updated [`hardwareItem()`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/validate.ts#L58-L76) validation to validate `spec` (optional, max 160 chars) and `bestFor` (optional, max 80 chars) instead of `variant`, `points`, and `fit`.
- Removed `setupNote` from AI channel validation and ensured [`validateMenuUpdate()`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/lib/menu/validate.ts#L121-L178) always outputs `schemaVersion: 2`.
- Updated `GET /api/menu` to include `migrated` and `PUT /api/menu` to update `lastGoodMenu` and return `migrated: false`.

### [`src/app/menu-editor/page.tsx`](file:///c:/Users/PC/Desktop/autoshop-dashboard/src/app/menu-editor/page.tsx)
- **Migration Banner**: Displays a yellow warning banner (*"The menu was updated to the new design. Review the prices and press Save."*) when `migrated: true` and enables the **Save changes** button immediately even before manual edits.
- **Hardware Modal**: Replaced `Short description`, `Bullet points`, and `Suits which shops` with **Spec** (`spec`) and **Best for** (`bestFor`, placeholder `ဥပမာ Wi-Fi ရှိတဲ့ ကောင်တာ`). Added `redmi-pad-2-97-wifi.webp` and `redmi-pad-2-97-4g.webp` to `BUILT_IN_IMAGES` while keeping `redmi-pad-2.webp`.
- **AI Order Tab**: Removed the `Setup note` input, displayed `c.subtitle` read-only under the channel title, and updated the monthly price preview to use `monthlyFrom()`.

---

## 6. Documentation

### [`README.md`](file:///c:/Users/PC/Desktop/autoshop-dashboard/README.md)
- Added instructions under **4. Public Price Menu** showing how to regenerate menu templates and assets via `node scripts/generateMenuTemplates.mjs "<path to auto-shop-menu>"` while preserving the file's original byte encoding.
