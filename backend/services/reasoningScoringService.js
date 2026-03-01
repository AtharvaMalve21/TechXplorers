const Message = require("../models/message.model");
const User = require("../models/user.model");
const { generateText } = require("./llmService");

exports.scoreMessage = async (messageId, io) => {
  try {
    const message = await Message.findById(messageId).populate("sender");
    if (!message || message.messageType !== "user") return;

    const prompt = `
Evaluate the following student contribution.

Score from 1 to 5 (only numbers):
- Logical Depth
- Relevance
- Constructiveness

Return strictly in JSON format:
{
  "logicalDepth": number,
  "relevance": number,
  "constructiveness": number
}

Contribution:
"${message.content}"
`;

    let raw = await generateText(prompt, 0.2);

    // Gemini sometimes wraps JSON in ```json blocks
    raw = raw.replace(/```json|```/g, "").trim();

    let scores;
    try {
      scores = JSON.parse(raw);
    } catch {
      console.error("Invalid JSON from Gemini scoring:", raw);
      return;
    }

    const { logicalDepth, relevance, constructiveness } = scores;

    const weightedScore =
      0.4 * logicalDepth +
      0.3 * relevance +
      0.3 * constructiveness;

    message.logicalDepth = logicalDepth;
    message.relevanceScore = relevance;
    message.constructivenessScore = constructiveness;
    message.reasoningScore = weightedScore;

    await message.save();

    await User.findByIdAndUpdate(message.sender._id, {
      $inc: { totalContributionScore: weightedScore },
    });

    io.to(message.room.toString()).emit("messageScoreUpdated", {
      messageId: message._id,
      logicalDepth,
      relevance,
      constructiveness,
      weightedScore,
    });

  } catch (error) {
    console.error("Reasoning scoring error:", error.message);
  }
};