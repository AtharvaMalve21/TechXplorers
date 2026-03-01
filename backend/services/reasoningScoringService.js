const OpenAI = require("openai");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const dotenv = require("dotenv");

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an objective academic evaluator. You MUST return strictly a JSON object with keys logicalDepth, relevance, and constructiveness."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
        });

        const raw = response.choices[0].message.content.trim();

        let scores;
        try {
            scores = JSON.parse(raw);
        } catch {
            console.error("Invalid JSON from scoring model");
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