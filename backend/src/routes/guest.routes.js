import { Router } from "express";
import { startGuestSession, guestChat, getGuestHistory, getGuestAdvice } from "../controllers/guest.controller.js";

const guestRouter = Router();

guestRouter.post("/start", startGuestSession);
guestRouter.post("/chat", guestChat);
guestRouter.get("/history/:sessionId", getGuestHistory);
guestRouter.post("/advice", getGuestAdvice);

export default guestRouter;
