const express = require("express");
const {
  createRoom,
  joinRoom,
  getRoom,
  listRooms,
  changeStage,
  updateStatus,
} = require("../controllers/room.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", protect, createRoom);
router.get("/", protect, listRooms);
router.get("/:roomId", protect, getRoom);
router.post("/:roomId/join", protect, joinRoom);
router.patch("/:roomId/stage", protect, changeStage);
router.patch("/:roomId/status", protect, updateStatus);

module.exports = router;