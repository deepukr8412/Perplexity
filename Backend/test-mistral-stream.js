require('dotenv').config();
const { Mistral } = require("@mistralai/mistralai");

async function testMistralStream() {
  const apiKey = process.env.MISTRAL_API_KEY;
  const client = new Mistral({ apiKey });

  try {
    const responseStream = await client.chat.stream({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: "Tell me a very short joke." }],
    });

    console.log("Stream started...");
    for await (const chunk of responseStream) {
      console.log("Chunk received:", JSON.stringify(chunk));
      // Try to find the content
      const content = chunk.data?.choices?.[0]?.delta?.content || chunk.choices?.[0]?.delta?.content;
      if (content) process.stdout.write(content);
    }
    console.log("\nStream complete.");
  } catch (error) {
    console.error("Stream error:", error);
  }
}

testMistralStream();
