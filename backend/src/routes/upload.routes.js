import { Router } from "express";
import multer from "multer";
import { uploadImage, uploadChatFile, deleteChatAttachment } from "../controllers/upload.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

const router = Router();

// Avatar upload - images only, 5MB limit
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  },
});

// Chat file upload - any file type, 10MB limit
const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types: images, PDFs, documents, text, archives
    const allowedMimes = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "application/zip",
      "application/x-zip-compressed",
    ];
    
    const isAllowed = allowedMimes.some(mime => 
      file.mimetype.startsWith(mime) || file.mimetype === mime
    );
    
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed. Allowed: images, PDF, Word, text, ZIP"), false);
    }
  },
});

// Avatar upload endpoint
router.post("/", requireAuth, avatarUpload.single("file"), uploadImage);

// Chat file upload endpoint
router.post("/chat", requireAuth, chatUpload.single("file"), uploadChatFile);

// Delete chat attachment endpoint
// Delete chat attachment endpoint
router.delete("/chat/:messageId", requireAuth, deleteChatAttachment);

// Resume upload configuration (PDF, DOC, DOCX) - 5MB limit
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and Word documents are allowed"), false);
    }
  }
});

import { uploadResume } from "../controllers/upload.controller.js";
router.post("/resume", requireAuth, resumeUpload.single("file"), uploadResume);

export const uploadRouter = router;
