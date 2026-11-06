/** Removing Google's analytics cookies when a player withdraws. Browsers that refuse the edit just keep them. */

/** The cookie names Google Analytics sets for one measurement id (G-XXXX gives _ga_XXXX). */
export function analyticsCookieNames(measurementId: string): string[] {
  const suffix = measurementId.replace(/^G-/, '');
  return ['_ga', `_ga_${suffix}`, '_gid', '_gat'];
}

/** The host and each parent domain the cookie could have been set on: a.b.com gives a.b.com, b.com. */
export function cookieDomains(hostname: string): string[] {
  const parts = hostname.split('.');
  const parents = parts.slice(1, -1).map((_, index) => parts.slice(index + 1).join('.'));
  return [hostname, ...parents];
}

export interface CookieJar {
  cookie: string;
}

export function clearAnalyticsCookies(jar: CookieJar, hostname: string, measurementId: string): void {
  const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  try {
    for (const name of analyticsCookieNames(measurementId)) {
      jar.cookie = `${name}=; ${expired}`;
      for (const domain of cookieDomains(hostname)) jar.cookie = `${name}=; ${expired}; domain=${domain}`;
    }
  } catch {
    // chemx-allow: best-effort a browser that will not let the page edit its cookies leaves them to expire on their own
  }
}
