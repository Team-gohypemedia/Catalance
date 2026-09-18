import { Router } from "express";
import { startGuestSession, guestChat, getGuestHistory, getGuestAdvice } from "../controllers/guest.controller.js";
import { recordClientActivity } from "../controllers/clientActivity.controller.js";
import { optionalAuth } from "../middlewares/optional-auth.js";

const guestRouter = Router();
guestRouter.use(optionalAuth);

guestRouter.post("/track", recordClientActivity);
guestRouter.post("/start", startGuestSession);
guestRouter.post("/chat", guestChat);
guestRouter.get("/history/:sessionId", getGuestHistory);
guestRouter.post("/advice", getGuestAdvice);

export default guestRouter;

