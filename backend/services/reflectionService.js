const OpenAI = require("openai");
const Message = require("../models/message.model");
const Room = require("../models/room.model");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

exports.generateReflectionSummary = async (roomId, io) => {
    try {
        const room = await Room.findById(roomId);
        if (!room) return;

        const messages = await Message.find({
            room: roomId,
            messageType: "user",
        })
            .sort({ createdAt: 1 })
            .populate("sender", "name");

        if (messages.length < 3) return;

        const discussion = messages
            .map((msg) => `${msg.sender?.name}: ${msg.content}`)
            .join("\n");

        const prompt = `
You are an AI learning facilitator.

Analyze the following collaborative discussion.

Focus on:
- How reasoning evolved
- Strong logical contributions
- Key turning points
- Collaboration quality
- Areas for improvement

Do NOT provide the final answer to the problem.
Focus only on reasoning and collaboration process.

Problem:
${room.problemStatement}

Discussion:
${discussion}
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You are an academic reflection engine. Never provide final answers."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.6,
        });

        let reflection = response.choices[0].message.content;

        const forbiddenPatterns = [
            "the answer is",
            "final answer",
            "therefore the answer",
        ];

        if (
            forbiddenPatterns.some((pattern) =>
                reflection.toLowerCase().includes(pattern)
            )
        ) {
            reflection =
                "The group demonstrated collaborative reasoning. Reflect on how assumptions were evaluated and refined.";
        }

       
        room.finalConsensus = reflection;
        await room.save();

        
        const aiMessage = await Message.create({
            room: roomId,
            sender: null,
            content: reflection,
            stage: "reflection",
            messageType: "ai",
        });

        io.to(roomId).emit("newMessage", aiMessage);

    } catch (error) {
        console.error("Reflection generation error:", error.message);
    }
};