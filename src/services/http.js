/**
 * Small fetch wrapper that turns every failure into an ApiError with a `kind`
 * the UI can translate into a specific, actionable message.
 *
 * kinds: 'network' | 'timeout' | 'rate-limit' | 'auth' | 'not-found' | 'server' | 'config' | 'aborted'
 */
export class ApiError extends Error {
  constructor(kind, message, { status, provider } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.provider = provider;
  }
}

const DEFAULT_TIMEOUT = 10000;

export async function fetchJson(url, { headers, signal, timeout = DEFAULT_TIMEOUT, provider } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), timeout);
  const onAbort = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', onAbort);

  let res;
  try {
    res = await fetch(url, { headers, signal: controller.signal });
  } catch (err) {
    if (signal?.aborted) throw new ApiError('aborted', 'Request cancelled', { provider });
    if (err?.name === 'TimeoutError' || controller.signal.reason?.name === 'TimeoutError') {
      throw new ApiError('timeout', `${provider} took too long to respond`, { provider });
    }
    throw new ApiError('network', `Could not reach ${provider}`, { provider });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }

  if (!res.ok) {
    const status = res.status;
    if (status === 429) throw new ApiError('rate-limit', `${provider} rate limit reached`, { status, provider });
    if (status === 401 || status === 403) throw new ApiError('auth', `${provider} rejected the API key`, { status, provider });
    if (status === 404) throw new ApiError('not-found', `${provider} has no data for this location`, { status, provider });
    throw new ApiError('server', `${provider} returned an error (${status})`, { status, provider });
  }

  const data = await res.json();
  // Our service worker marks responses it served from cache while offline.
  const cachedAt = res.headers.get('X-WB-Cached-At');
  return { data, cachedAt: cachedAt ? Number(cachedAt) : null };
}
