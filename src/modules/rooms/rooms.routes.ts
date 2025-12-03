import { Router } from "express";
import roomsController from "./rooms.controller";
import { authenticate } from "@middleware/auth.middleware";
import { validate } from "@middleware/validate.middleware";
import {
  createRoomSchema,
  updateRoomSchema,
  getRoomByIdSchema,
  joinRoomSchema,
  leaveRoomSchema,
  addMemberSchema,
  removeMemberSchema,
  searchRoomsSchema,
} from "./rooms.validators";

const router = Router();

router.use(authenticate);

router.post("/", validate(createRoomSchema), roomsController.createRoom);
router.get("/joined", roomsController.getJoinedRooms);
router.get("/public", roomsController.getPublicRooms); // ← Make sure this exists
router.get("/search", validate(searchRoomsSchema), roomsController.searchRooms);
router.get(
  "/:roomId",
  validate(getRoomByIdSchema),
  roomsController.getRoomById
);
router.patch(
  "/:roomId",
  validate(updateRoomSchema),
  roomsController.updateRoom
);
router.delete(
  "/:roomId",
  validate(getRoomByIdSchema),
  roomsController.deleteRoom
);

// Membership operations
router.post(
  "/:roomId/join",
  validate(joinRoomSchema),
  roomsController.joinRoom
);
router.post(
  "/:roomId/leave",
  validate(leaveRoomSchema),
  roomsController.leaveRoom
);
router.post(
  "/:roomId/members",
  validate(addMemberSchema),
  roomsController.addMember
);
router.delete(
  "/:roomId/members/:memberId",
  validate(removeMemberSchema),
  roomsController.removeMember
);

export default router;
