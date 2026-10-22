// Myanmar number formatting used by the public menu and the editor previews.
// Mirrors the helpers in public/menu-assets/custom.js so both render prices the same way.

const DIGITS = '၀၁၂၃၄၅၆၇၈၉';

export function mm(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => DIGITS[Number(d)]);
}

/** 80000 → "၈၀,၀၀၀" */
export function kyat(amount: number): string {
  return mm(Math.round(amount).toLocaleString('en-US'));
}

/** 1500000 → "၁၅" (lakh = 100,000 kyat, one decimal) */
export function lakh(amount: number): string {
  return mm(Math.round(amount / 10000) / 10);
}

/** Whole lakh amounts read as "၇ သိန်း", anything else as "၉၅,၀၀၀ ကျပ်". */
export function autoPrice(amount: number): string {
  return amount >= 100000 && amount % 100000 === 0 ? `${lakh(amount)} သိန်း` : `${kyat(amount)} ကျပ်`;
}

/** Same rule as custom.js priceOf(): days × rate, rounded to `round`. */
export function customPriceOfDays(days: number, rate: number, round: number): number {
  return Math.round((days * rate) / round) * round;
}
