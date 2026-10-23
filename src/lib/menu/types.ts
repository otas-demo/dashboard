// Shape of the public price menu data, stored as one MenuSettings document.
// All money values are whole kyat.

export interface MenuGeneral {
  priceDate: string; // shown as "ဈေးနှုန်း <priceDate>"
  phone: string;
  email: string;
  website: string; // full https:// URL
}

export interface MenuPackages {
  commercial: number; // per month
  enterprise: number; // per month
}

export type AiChannelId = 'facebook' | 'viber' | 'telegram';

export interface MenuAiChannel {
  id: AiChannelId;
  name: string;
  subtitle: string;
  setupFee: number;
  wait: string; // e.g. "၁–၂ ပတ်"
  monthlyFrom: number;
  inboxOnlyFee: number | null; // Viber only: Staff Inbox without AI
  visible: boolean; // listed on the menu index
}

export interface MenuHardwareItem {
  slug: string;
  category: string; // one of HARDWARE_CATEGORIES[].name
  name: string;
  spec: string;
  bestFor: string; // short line, <span class="best">
  price: number;
  image: string; // /menu-assets/... or an https:// R2 URL
  samplePhoto: boolean; // shows "နမူနာပုံ"
  visible: boolean;
}

// Custom POS calculator data, consumed as-is by public/menu-assets/custom.js
export interface CustomFeature {
  id: string;
  name: string;
  price?: number; // fixed price; when absent, price = days × rate (rounded)
  days: number;
  desc: string;
  points?: string[];
  eg?: string;
  monthly?: string;
  fit?: string[];
  when?: string[];
  note?: string;
  option?: { label: string; short: string; price: number; days: number; monthly?: string };
  qty?: { max: number; per: string };
  quote?: boolean;
  hidden?: boolean; // dashboard-only: leave out of the public calculator
}

export interface CustomCategory {
  id: string;
  name: string;
  blurb: string;
  items: CustomFeature[];
}

export interface CustomData {
  rate: number; // kyat per working day
  round: number; // prices round to this many kyat
  weeksBase: number;
  daysPerWeek: number;
  payment: [string, number][]; // [label, percent]
  base: { id: string; name: string; days: number; desc: string; modules: [string, string][]; setup: string[] };
  cats: CustomCategory[];
}

export interface MenuData {
  schemaVersion: 2;
  general: MenuGeneral;
  packages: MenuPackages;
  aiChannels: MenuAiChannel[];
  hardware: MenuHardwareItem[];
  custom: CustomData;
}

export const HARDWARE_CATEGORIES = [
  { name: 'Tablet', blurb: 'Auto Shop ကို ဖွင့်သုံးမယ့် စက်' },
  { name: 'Thermal Printer', blurb: 'ဘောင်ချာ ထုတ်စက်' },
  { name: 'Barcode Scanner', blurb: 'Barcode ဖတ်စက်' },
] as const;
