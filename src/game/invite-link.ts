/**
 * Co-op invite links: the page URL plus ?join=<server address>.
 * The server has a single room, so there is no room code; the address is the whole invite.
 */

export const JOIN_PARAM = 'join';

const MAX_ADDRESS_LENGTH = 260;
const SCHEME = /^(wss?):\/\//i;
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const SHAPE = /^([^:/?#@\s]+)(?::(\d{1,5}))?$/;

/**
 * Accepts only [ws://|wss://]host[:port] and returns it normalised, or null.
 * Paths, queries, credentials, other schemes and odd characters are all refused:
 * the value comes from a link anyone can send, so it is never trusted as typed.
 */
export function sanitizeJoinAddress(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text || text.length > MAX_ADDRESS_LENGTH) return null;

  const scheme = SCHEME.exec(text)?.[1]?.toLowerCase() ?? null;
  const rest = scheme ? text.slice(scheme.length + 3) : text;
  const shape = SHAPE.exec(rest);
  if (!shape) return null;

  const host = shape[1]!.toLowerCase();
  if (host.length > 253 || !host.split('.').every((label) => HOST_LABEL.test(label))) return null;

  const port = shape[2];
  if (port !== undefined) {
    const number = Number(port);
    if (number < 1 || number > 65535) return null;
  }

  const address = port === undefined ? host : `${host}:${Number(port)}`;
  return scheme ? `${scheme}://${address}` : address;
}

/** Reads ?join= from a location search string (e.g. "?join=10.0.0.5:9000"). Null when absent or unsafe. */
export function parseJoinParam(search: string): string | null {
  return sanitizeJoinAddress(new URLSearchParams(search).get(JOIN_PARAM));
}

/** The page URL with ?join=<address>. Other params and any hash are dropped. Null when the address is unusable. */
export function buildInviteLink(pageHref: string, address: string): string | null {
  const clean = sanitizeJoinAddress(address);
  if (!clean) return null;
  let url: URL;
  try {
    url = new URL(pageHref);
  } catch {
    return null;
  }
  url.search = '';
  url.hash = '';
  url.searchParams.set(JOIN_PARAM, clean);
  return url.toString();
}

/** The same page without ?join=, so a refresh does not keep reopening the invite. */
export function withoutJoinParam(pageHref: string): string {
  const url = new URL(pageHref);
  url.searchParams.delete(JOIN_PARAM);
  return url.toString();
}
