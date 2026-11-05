import { z } from "zod";

/**
 * validate({ body, query, params }) — each optional Zod schema.
 * Parsed values land on req.body (replaced), req.q (query) and req.p (params).
 * Express 5 makes req.query read-only, hence req.q.
 */
export const validate =
  ({ body, query, params } = {}) =>
  (req, _res, next) => {
    try {
      if (body) req.body = body.parse(req.body ?? {});
      req.q = query ? query.parse({ ...(req.query || {}) }) : { ...(req.query || {}) };
      req.p = params ? params.parse({ ...(req.params || {}) }) : { ...(req.params || {}) };
      next();
    } catch (err) {
      next(err);
    }
  };

/** "true" / "false" query strings → boolean */
export const zBool = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0", ""])])
  .transform((v) => v === true || v === "true" || v === "1");

/** Optional trimmed string that treats "" as undefined (handy for query filters). */
export const zQ = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined));

/** Optional enum filter that ignores "" and "all". */
export const zQEnum = (values) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.toLowerCase() !== "all" ? v : undefined))
    .pipe(z.enum(values).optional());
