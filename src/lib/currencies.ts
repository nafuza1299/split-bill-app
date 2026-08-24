export interface Currency {
  code: string;
  name: string;
}

const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });

export const currencies: Currency[] = Intl.supportedValuesOf("currency")
  .map((code) => ({ code, name: displayNames.of(code) ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name));
