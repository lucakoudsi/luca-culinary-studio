// SSRF-abgesicherter Fetch für Server-Requests auf beliebige User-URLs
// (Rezept-Import): nur http/https, DNS-Aufloesung wird gegen private/interne
// IP-Bereiche geprueft (auch bei Redirects, max. 3 Hops), Antwort wird
// gestreamt und bei Ueberschreiten des Limits abgebrochen statt komplett
// in den Speicher geladen.

import dns from 'node:dns/promises';

export class SafeFetchError extends Error {}

function isPrivateIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === '0.0.0.0') return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith('169.254.')) return true; // link-local + Cloud-Metadata (169.254.169.254)
  if (/^f[cd][0-9a-f]{2}:/i.test(ip)) return true; // IPv6 Unique Local (fc00::/7)
  if (/^fe80:/i.test(ip)) return true; // IPv6 link-local
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (hostname === 'localhost') throw new SafeFetchError('Interne Adressen sind nicht erlaubt.');
  let addresses: string[];
  try {
    addresses = (await dns.lookup(hostname, { all: true })).map(a => a.address);
  } catch {
    throw new SafeFetchError('Hostname konnte nicht aufgelöst werden.');
  }
  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    throw new SafeFetchError('Diese Adresse ist nicht erlaubt.');
  }
}

export async function safeFetch(
  rawUrl: string,
  opts: { maxBytes: number; timeoutMs: number },
): Promise<{ buffer: Buffer; contentType: string }> {
  let currentUrl = rawUrl;

  for (let hop = 0; hop < 4; hop++) {
    let parsed: URL;
    try {
      parsed = new URL(currentUrl);
    } catch {
      throw new SafeFetchError('Ungültige URL.');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new SafeFetchError('Nur http/https-URLs sind erlaubt.');
    }
    await assertPublicHost(parsed.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
    let res: Response;
    try {
      res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LucaCulinaryStudio-RecipeImport/1.0)' },
      });
    } catch {
      throw new SafeFetchError('Seite konnte nicht erreicht werden (Timeout oder Netzwerkfehler).');
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new SafeFetchError('Weiterleitung ohne Ziel.');
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    if (!res.ok) throw new SafeFetchError(`Seite antwortete mit Status ${res.status}.`);

    const contentType = res.headers.get('content-type') ?? '';
    const contentLength = res.headers.get('content-length');
    if (contentLength && Number(contentLength) > opts.maxBytes) {
      throw new SafeFetchError('Antwort ist zu groß.');
    }

    const reader = res.body?.getReader();
    if (!reader) {
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.byteLength > opts.maxBytes) throw new SafeFetchError('Antwort ist zu groß.');
      return { buffer, contentType };
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > opts.maxBytes) {
        reader.cancel();
        throw new SafeFetchError('Antwort ist zu groß.');
      }
      chunks.push(value);
    }
    return { buffer: Buffer.concat(chunks), contentType };
  }

  throw new SafeFetchError('Zu viele Weiterleitungen.');
}
