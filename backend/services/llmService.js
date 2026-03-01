const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest",
});

exports.generateText = async (prompt, temperature = 0.7) => {
  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature,
      },
    });

    return result.response.text();
  } catch (error) {
    console.error("Gemini error:", error.message);
    throw error;
  }
};