const Message = require("../models/message.model");

exports.detectDominance = async (roomId, currentStage) => {
  try {
    const recentMessages = await Message.find({
      room: roomId,
      stage: currentStage,
      messageType: "user",
    })
      .sort({ createdAt: -1 })
      .limit(10);

    if (recentMessages.length < 5) {
      return null;
    }

    const counts = {};
    let total = recentMessages.length;

    recentMessages.forEach((msg) => {
      const userId = msg.sender.toString();
      counts[userId] = (counts[userId] || 0) + 1;
    });

    let dominantUserId = null;
    let maxCount = 0;

    for (let userId in counts) {
      if (counts[userId] > maxCount) {
        maxCount = counts[userId];
        dominantUserId = userId;
      }
    }

    const percentage = (maxCount / total) * 100;

    if (percentage > 60) {
      return {
        dominantUserId,
        percentage,
      };
    }

    return null;
  } catch (error) {
    console.error("Dominance detection error:", error.message);
    return null;
  }
};