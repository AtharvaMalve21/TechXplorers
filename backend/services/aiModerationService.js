const Message = require("../models/message.model");
const Room = require("../models/room.model");
const { detectDominance } = require("./dominanceService");
const { generateText } = require("./llmService");

exports.runAIModeration = async (roomId, io) => {
  try {
    const room = await Room.findById(roomId).populate("participants", "name");
    if (!room || room.status !== "active") return;

    const recentMessages = await Message.find({ room: roomId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("sender", "name");

    if (recentMessages.length < 3) return;

    const formattedDiscussion = recentMessages
      .reverse()
      .map((msg, index) => {
        const senderName = msg.sender?.name || "AI";
        return `${index + 1}. ${senderName}: ${msg.content}`;
      })
      .join("\n");

    const dominance = await detectDominance(roomId, room.currentStage);

    let dominanceInstruction = "";

    if (dominance) {
      const dominantUser = room.participants.find(
        (p) => p._id.toString() === dominance.dominantUserId
      );

      dominanceInstruction = `
One participant (${dominantUser?.name}) has contributed ${dominance.percentage.toFixed(
        0
      )}% of recent messages.
Encourage other participants to contribute more.
Do NOT discourage the dominant user harshly.
`;
    }

    const prompt = `
You are an AI discussion facilitator.

Your role:
- Guide reasoning
- Ask probing questions
- Encourage balanced participation
- Identify reasoning gaps
- NEVER give final answers
- NEVER solve the problem directly

Current Stage: ${room.currentStage}

Problem:
${room.problemStatement}

Recent Discussion:
${formattedDiscussion}

${dominanceInstruction}

Respond as a facilitator.
`;

    let aiMessage = await generateText(prompt, 0.7);

    // Guardrail
    const forbiddenPatterns = [
      "the answer is",
      "therefore the answer",
      "final answer",
    ];

    if (
      forbiddenPatterns.some((pattern) =>
        aiMessage.toLowerCase().includes(pattern)
      )
    ) {
      aiMessage =
        "Let's revisit the reasoning together. Can someone clarify the assumptions being made here?";
    }

    const savedMessage = await Message.create({
      room: roomId,
      sender: null,
      content: aiMessage,
      stage: room.currentStage,
      messageType: "ai",
    });

    io.to(roomId).emit("newMessage", savedMessage);

  } catch (error) {
    console.error("AI Moderation Error:", error.message);
  }
};