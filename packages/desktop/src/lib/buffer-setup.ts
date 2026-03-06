/**
 * Buffer polyfill setup — MUST be imported before any module that uses Buffer.
 *
 * The @seqrets/crypto package uses Node.js Buffer for base64 encoding.
 * In browser/WebView contexts, Buffer is not available. This module
 * imports the `buffer` npm polyfill and attaches it to globalThis so
 * all downstream code can find it.
 */
import { Buffer } from 'buffer';

if (typeof globalThis.Buffer === 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

if (typeof self !== 'undefined' && typeof (self as any).Buffer === 'undefined') {
  (self as any).Buffer = Buffer;
}

export { Buffer };
