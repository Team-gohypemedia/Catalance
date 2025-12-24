import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import { getNotifications, markAllAsRead, markAsRead } from "../controllers/notification.controller.js";

const router = Router();

router.use(requireAuth); // All routes require authentication

router.route("/")
  .get(getNotifications);

router.route("/read-all")
  .patch(markAllAsRead);

router.route("/:id/read")
  .patch(markAsRead);

export default router;
