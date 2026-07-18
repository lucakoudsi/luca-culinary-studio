// Weiches Timeout fuer OpenAI-Calls, ein paar Sekunden unter dem jeweiligen
// `maxDuration` der Route. Ohne das killt Vercel die Funktion hart (504,
// FUNCTION_INVOCATION_TIMEOUT) sobald maxDuration erreicht ist -- dann laeuft
// unser eigener catch-Block gar nicht mehr, und der Nutzer sieht nur einen
// nackten Verbindungsabbruch statt einer sauberen Fehlermeldung.
export class UpstreamTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Zeitüberschreitung nach ${timeoutMs}ms`);
    this.name = 'UpstreamTimeoutError';
  }
}

export async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new UpstreamTimeoutError(timeoutMs);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
