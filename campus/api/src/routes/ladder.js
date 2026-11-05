import { Router } from "express";
import { requireAuth } from "../lib/auth.js";
import { computeLadder } from "../services/ladder.js";
import { requireFlag } from "../lib/settings.js";

const router = Router();
// spec §2 feature flag (F1): the whole area 404s while the flag is off (mounted at root, so scope by path)
router.use("/api/ladder", requireFlag("gigs"));

router.get("/api/ladder", requireAuth, async (req, res) => {
  res.json(await computeLadder(req.user));
});

export default router;
