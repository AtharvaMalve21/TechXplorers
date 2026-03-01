const express = require("express");
const RoomAnalytics = require("../models/RoomAnalytics");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:roomId", protect, async (req, res) => {
  const analytics = await RoomAnalytics.findOne({
    room: req.params.roomId,
  });

  if (!analytics) {
    return res.status(404).json({ message: "No analytics yet" });
  }

  res.json(analytics);
});

module.exports = router;