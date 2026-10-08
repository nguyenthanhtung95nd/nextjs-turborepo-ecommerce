import { z } from "zod";

const MAX_SEARCH_LENGTH = 100;

// Postgres rejects a NUL byte inside text, so one that reaches a query comes back as a 500
// rather than an empty result — and `?q=%00` is two keystrokes away in any address bar. Every
// control character is dropped for the same reason: none of them can match a name anyway.
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

/**
 * A free-text search term, as it arrives from a URL.
 *
 * Defined once because the API validates with it too: sanitising here means a hostile value is
 * already gone before any caller — admin, storefront or a future one — can hand it to the
 * database.
 */
export const searchTermSchema = z
  .string()
  .transform((value) => value.replace(CONTROL_CHARACTERS, "").trim().slice(0, MAX_SEARCH_LENGTH))
  .catch("");
