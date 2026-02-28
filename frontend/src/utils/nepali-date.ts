/**
 * Bikram Sambat (BS) ↔ AD Date Conversion Utility (Frontend)
 *
 * Ported from backend's nepali-date.util.ts.
 * Covers BS years 2070–2090 (AD ~2013–2033), sufficient for a school ERP context.
 */

// Days per month for BS years 2070-2090
const BS_CALENDAR: Record<number, number[]> = {
  2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
  2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2072: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2082: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
  2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
};

// We need a reference point. BS 2070/01/01 = AD 2013/04/14
const BS_REF_YEAR = 2070;
const AD_REF = new Date(2013, 3, 14); // April 14, 2013

export interface BsDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-32
}

export const BS_MONTH_NAMES_EN = [
  "Baisakh",
  "Jestha",
  "Asar",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

export const BS_MONTH_NAMES_NP = [
  "बैशाख",
  "जेठ",
  "असार",
  "श्रावण",
  "भदौ",
  "असोज",
  "कार्तिक",
  "मंसिर",
  "पुस",
  "माघ",
  "फाल्गुन",
  "चैत्र",
];

function totalDaysInBsYear(year: number): number {
  const months = BS_CALENDAR[year];
  if (!months) throw new Error(`BS year ${year} out of range (2070-2090)`);
  return months.reduce((s, d) => s + d, 0);
}

export function daysInBsMonth(year: number, month: number): number {
  const months = BS_CALENDAR[year];
  if (!months || month < 1 || month > 12) return 30;
  return months[month - 1];
}

export function adToBs(adDate: Date): BsDate {
  const adTime = new Date(
    adDate.getFullYear(),
    adDate.getMonth(),
    adDate.getDate(),
  ).getTime();
  const refTime = AD_REF.getTime();
  let totalDays = Math.floor((adTime - refTime) / (24 * 60 * 60 * 1000));

  if (totalDays < 0)
    throw new Error("Date before supported range (before BS 2070)");

  let bsYear = BS_REF_YEAR;

  while (totalDays > 0) {
    const diy = totalDaysInBsYear(bsYear);
    if (totalDays >= diy) {
      totalDays -= diy;
      bsYear++;
    } else {
      break;
    }
  }

  const months = BS_CALENDAR[bsYear];
  if (!months) throw new Error(`BS year ${bsYear} out of range`);

  let monthIndex = 0;
  while (monthIndex < 12 && totalDays > 0) {
    if (totalDays >= months[monthIndex]) {
      totalDays -= months[monthIndex];
      monthIndex++;
    } else {
      break;
    }
  }

  return { year: bsYear, month: monthIndex + 1, day: totalDays + 1 };
}

export function bsToAd(bs: BsDate): Date {
  const months = BS_CALENDAR[bs.year];
  if (!months)
    throw new Error(`BS year ${bs.year} out of range (2070-2090)`);

  let totalDays = 0;
  for (let y = BS_REF_YEAR; y < bs.year; y++) {
    totalDays += totalDaysInBsYear(y);
  }
  for (let m = 0; m < bs.month - 1; m++) {
    totalDays += months[m];
  }
  totalDays += bs.day - 1;

  const result = new Date(AD_REF);
  result.setDate(result.getDate() + totalDays);
  return result;
}

export function formatBsDate(bs: BsDate): string {
  const mm = String(bs.month).padStart(2, "0");
  const dd = String(bs.day).padStart(2, "0");
  return `${bs.year}/${mm}/${dd}`;
}

export function parseBsDate(str: string): BsDate | null {
  const parts = str.split("/");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

export function isValidBsDate(bs: BsDate): boolean {
  const months = BS_CALENDAR[bs.year];
  if (!months) return false;
  if (bs.month < 1 || bs.month > 12) return false;
  if (bs.day < 1 || bs.day > months[bs.month - 1]) return false;
  return true;
}

/** Get the first day-of-week (0=Sun) for a given BS year/month */
export function getStartDayOfWeek(year: number, month: number): number {
  const adDate = bsToAd({ year, month, day: 1 });
  return adDate.getDay();
}

export const BS_MIN_YEAR = 2070;
export const BS_MAX_YEAR = 2090;
