const OpenAI = require("openai");
const Message = require("../models/message.model");
const Room = require("../models/room.model");
const { detectDominance } = require("./dominanceService");
const dotenv = require("dotenv");

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STAGES = [
  "hypothesis",
  "discussion",
  "challenge",
  "consensus",
  "reflection",
];

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

If reasoning is shallow → ask deeper questions.
If logic gaps exist → highlight them.
Respond as a facilitator.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a Socratic AI facilitator. Never provide final answers.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    let aiMessage = response.choices[0].message.content;

    const forbiddenPatterns = [
      "the answer is",
      "therefore the answer",
      "final answer",
    ];

    const lowerCaseResponse = aiMessage.toLowerCase();

    if (forbiddenPatterns.some((pattern) => lowerCaseResponse.includes(pattern))) {
      aiMessage =
        "Let's revisit the reasoning together. Can someone explain the assumptions being made here?";
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