/**
 * Nepali number and formatting utilities for NEB certificate generation.
 */

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/**
 * Convert an Arabic numeral string/number to Devanagari digits.
 * e.g. 2082 → "२०८२", 3.60 → "३.६०"
 */
export function toNepaliDigits(input: number | string): string {
  return String(input).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)]);
}

/**
 * Format a number as Nepali Rupees: "रु. 1,25,000.00"
 * (Uses Indian/Nepali grouping: last 3, then groups of 2)
 */
export function formatNPR(amount: number): string {
  const [intPart, decPart] = amount.toFixed(2).split('.');
  const formatted = formatNepaliGrouping(intPart);
  return `रु. ${formatted}.${decPart}`;
}

/**
 * Indian/Nepali number grouping (last group of 3, then groups of 2).
 * e.g. 1250000 → "12,50,000"
 */
function formatNepaliGrouping(numStr: string): string {
  if (numStr.length <= 3) return numStr;
  const last3 = numStr.slice(-3);
  let rest = numStr.slice(0, -3);
  const groups: string[] = [];
  while (rest.length > 0) {
    groups.unshift(rest.slice(-2));
    rest = rest.slice(0, -2);
  }
  return groups.join(',') + ',' + last3;
}

/**
 * Format a BS date in the long Nepali format.
 * e.g. "१५ बैशाख २०८२"
 */
export function formatBsDateNepali(year: number, month: number, day: number): string {
  const monthNames = [
    'बैशाख', 'जेठ', 'असार', 'श्रावण', 'भदौ', 'असोज',
    'कार्तिक', 'मंसिर', 'पुस', 'माघ', 'फाल्गुन', 'चैत्र',
  ];
  const monthName = monthNames[month - 1] ?? '';
  return `${toNepaliDigits(day)} ${monthName} ${toNepaliDigits(year)}`;
}

/**
 * Format a BS date in English form for official certificates.
 * e.g. "15 Baisakh 2082"
 */
export function formatBsDateEnglish(year: number, month: number, day: number): string {
  const monthNames = [
    'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Ashwin',
    'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
  ];
  return `${day} ${monthNames[month - 1] ?? ''} ${year}`;
}
