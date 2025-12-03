import { requireAdmin } from "@middleware/admin.middleware";
import { authenticate } from "@middleware/auth.middleware";
import { Router } from "express";
import adminController from "./admin.controller";

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get("/stats", adminController.getDashboardStats);
router.get("/users", adminController.getAllUsers);
router.get("/rooms", adminController.getRoomsList);
router.delete("/rooms/:roomId", adminController.deleteRoom);
router.patch("/rooms/:roomId", adminController.updateRoom);

export default router;
