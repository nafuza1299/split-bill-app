import { detectRegion } from "./locale";

export interface Currency {
  code: string;
  name: string;
}

const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });

export const currencies: Currency[] = Intl.supportedValuesOf("currency")
  .map((code) => ({ code, name: displayNames.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name));

// There's no built-in Intl API for region -> currency, so this covers the
// regions likely to account for the vast majority of users. Anything else
// falls back to USD, which the currency dropdown can always override.
const REGION_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  NZ: "NZD",
  JP: "JPY",
  CN: "CNY",
  HK: "HKD",
  TW: "TWD",
  IN: "INR",
  ID: "IDR",
  MY: "MYR",
  SG: "SGD",
  TH: "THB",
  PH: "PHP",
  VN: "VND",
  KR: "KRW",
  BR: "BRL",
  MX: "MXN",
  AR: "ARS",
  CL: "CLP",
  ZA: "ZAR",
  NG: "NGN",
  EG: "EGP",
  SA: "SAR",
  AE: "AED",
  IL: "ILS",
  TR: "TRY",
  RU: "RUB",
  CH: "CHF",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  PL: "PLN",
  CZ: "CZK",
  // Eurozone
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  PT: "EUR",
  IE: "EUR",
  FI: "EUR",
  GR: "EUR",
  LU: "EUR",
  SI: "EUR",
  SK: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  CY: "EUR",
  MT: "EUR",
  HR: "EUR",
};

/** Currency for a given ISO 3166-1 region; falls back to USD when unmapped. */
export function currencyForRegion(region: string): string {
  return REGION_CURRENCY[region] ?? "USD";
}

/** Best-guess currency for the current browser's locale; falls back to USD. */
export function defaultCurrency(): string {
  return currencyForRegion(detectRegion());
}
