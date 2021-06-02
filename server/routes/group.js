import express from "express";
import {
  getAGroup,
  createGroup,
  deleteGroup,
  addGroupMember,
  getJoinedGroups,
  addGroupPendingMember,
  getListMembers,
  deleteMember,
  leaveGroup,
} from "../controllers/group.js";
import auth from "../middleware/auth.js";
import { isOwner } from "../middleware/groupRole.js";
const router = express.Router();

router.get("/:id", auth, getAGroup);
router.get("/list/joinedByMe", auth, getJoinedGroups);
router.get("/:id/members", auth, getListMembers);

router.post("/", auth, createGroup);

router.put("/:id/addMember/:memberId", auth, addGroupMember);
router.put("/:id/addPendingMember/:memberId", auth, addGroupPendingMember);
router.put("/:id/deleteMember/:deletedUserId", auth, isOwner, deleteMember);
router.put("/:id/leaveGroup", auth, leaveGroup);

router.delete("/:id", auth, isOwner, deleteGroup);

export default router;
