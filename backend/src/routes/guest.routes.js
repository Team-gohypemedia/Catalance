import { Router } from "express";
import { startGuestSession, guestChat, getGuestHistory } from "../controllers/guest.controller.js";

const guestRouter = Router();

guestRouter.post("/start", startGuestSession);
guestRouter.post("/chat", guestChat);
guestRouter.get("/history/:sessionId", getGuestHistory);

export default guestRouter;
