import { Router } from "express";
import { getImage } from "../controllers/image.controller.js";

const router = Router();

// Route param matches the filename (e.g., /api/images/avatars/uuid.png -> key=uuid.png)
// Wait, my key in upload is avatars/uuid.png.
// So if I use /api/images/:key, key will be "uuid.png" (if using avatars/ prefix inside controller).
// Or I can use key as full path.
// Let's stick to assumptions in controller: `avatars/${key}`.
// So URL should be /api/images/:filename

router.get("/:key", getImage);

export const imageRouter = router;
