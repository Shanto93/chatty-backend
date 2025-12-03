import { Router } from "express";
import multer from "multer";
import usersController from "./users.controller";
import { authenticate } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import { updateProfileSchema, getUserSchema } from "./users.validators";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get("/me", usersController.getProfile);
router.get("/search", usersController.searchUsers);
router.get("/:userId", validate(getUserSchema), usersController.getProfile);
router.patch(
  "/me",
  validate(updateProfileSchema),
  usersController.updateProfile
);
router.post(
  "/me/avatar",
  upload.single("avatar"),
  usersController.uploadAvatar
);

export default router;
