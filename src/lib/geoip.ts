const ISO2 = /^[A-Z]{2}$/;

/**
 * Looks up the visitor's country from their IP via ipapi.co (free, no key,
 * CORS-enabled). Resolves to null on any failure - offline, blocked, rate
 * limited, slow - so callers can silently keep whatever locale-based guess
 * they already have.
 */
export async function detectRegionByIp(): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const country =
      typeof data === "object" && data !== null && "country" in data
        ? (data as { country: unknown }).country
        : null;
    return typeof country === "string" && ISO2.test(country) ? country : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
