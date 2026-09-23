/** Best-guess ISO 3166-1 region for the current browser, with no permission prompt or network call. */
export function detectRegion(): string {
  try {
    return new Intl.Locale(navigator.language).maximize().region ?? "US";
  } catch {
    return "US";
  }
}
