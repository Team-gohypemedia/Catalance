import { Router } from "express";
import { httpError } from "../lib/errors.js";
import { requireAuth } from "../lib/auth.js";
import { selfUser } from "../lib/serialize.js";

const router = Router();

// Campus uses Catalance accounts: sign-up, login and passwords are handled by the main Catalance app,
// which hands its token to Campus (see campus/README.md, "Accounts"). The first authed request creates the Campus profile.
router.post(["/api/auth/signup", "/api/auth/login", "/api/auth/forgot-password", "/api/me/password"], () => {
  throw httpError(410, "Campus uses your Catalance account. Sign in, sign up or change your password on Catalance.");
});

router.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: selfUser(req.user) });
});

export default router;
