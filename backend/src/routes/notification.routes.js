import { Router } from "express";
import { requireAuth } from "../middlewares/require-auth.js";
import {
  createMarketplaceRequestNotifications,
  getNotifications,
  markAllAsRead,
  markAsRead,
  markByTypeAsRead,
  updateMarketplaceRequestStatus,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(requireAuth);

router.route("/").get(getNotifications);

router.route("/marketplace-request").post(createMarketplaceRequestNotifications);
router.route("/marketplace-request/:requestId/status").patch(updateMarketplaceRequestStatus);

router.route("/read-all").patch(markAllAsRead);
router.route("/read-by-type").patch(markByTypeAsRead);
router.route("/:id/read").patch(markAsRead);

export default router;
