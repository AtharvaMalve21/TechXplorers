const express = require("express");
const {
  sendMessage,
  getRoomMessages,
} = require("../controllers/message.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/:roomId", protect, sendMessage);
router.get("/:roomId", protect, getRoomMessages);

module.exports = router;