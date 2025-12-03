import { Router } from "express";
import messagesController from "./messages.controller";
import { authenticate } from "@middleware/auth.middleware";
import { upload } from "@middleware/upload.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post("/upload", upload.single("file"), (req, res, next) =>
  messagesController.uploadAttachment(req, res, next)
);

router.post("/", (req, res, next) =>
  messagesController.sendMessage(req, res, next)
);
router.get("/:roomId", (req, res, next) =>
  messagesController.getMessages(req, res, next)
);
router.patch("/:messageId", (req, res, next) =>
  messagesController.updateMessage(req, res, next)
);
router.delete("/:messageId", (req, res, next) =>
  messagesController.deleteMessage(req, res, next)
);

export default router;
