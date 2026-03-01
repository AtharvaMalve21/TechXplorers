const Message = require("../models/message.model");
const RoomAnalytics = require("../models/RoomAnalytics");
const Room = require("../models/room.model");

exports.updateRoomAnalytics = async (roomId) => {
  try {
    const messages = await Message.find({ room: roomId, messageType: "user" });

    if (messages.length === 0) return;

    const totalMessages = messages.length;

    const userCounts = {};
    let totalReasoning = 0;

    messages.forEach((msg) => {
      const userId = msg.sender.toString();
      userCounts[userId] = (userCounts[userId] || 0) + 1;
      totalReasoning += msg.reasoningScore || 0;
    });

    const maxUserMessages = Math.max(...Object.values(userCounts));

    const participationBalance =
      1 - maxUserMessages / totalMessages;

    const averageReasoning =
      totalReasoning / totalMessages;

    const normalizedReasoning = averageReasoning / 5;

    const stageEngagement = {
      hypothesis: 0,
      discussion: 0,
      challenge: 0,
      consensus: 0,
      reflection: 0,
    };

    messages.forEach((msg) => {
      stageEngagement[msg.stage]++;
    });

    const room = await Room.findById(roomId);

    const stageFactor =
      room.currentStage === "reflection" ? 1 : 0.5;

    const collaborationHealth =
      0.4 * participationBalance +
      0.4 * normalizedReasoning +
      0.2 * stageFactor;

    await RoomAnalytics.findOneAndUpdate(
      { room: roomId },
      {
        participationBalanceIndex: participationBalance,
        collaborationHealthScore: collaborationHealth,
        averageReasoningScore: averageReasoning,
        totalMessages,
        stageEngagement,
      },
      { upsert: true, new: true }
    );

  } catch (error) {
    console.error("Analytics error:", error.message);
  }
};