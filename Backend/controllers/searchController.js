const Search = require("../models/Search");
const { performDirectSearch } = require("../services/searchService");
const { Mistral } = require("@mistralai/mistralai");

/**
 * Unified Search Controller
 * Migrated to Mistral AI for better stability
 */
const performSearch = async (req, res) => {
  const { query } = req.body;
  const userId = req.user._id;

  if (!query) {
    return res.status(400).json({ success: false, message: "Search query is required" });
  }

  // Debug Start
  console.log("\n--- [BACKEND] NEW SEARCH (MISTRAL AI) ---");
  console.log(`[DEBUG] Query: "${query}"`);
  console.log("------------------------------------------\n");

  try {
    // 1. Tavily Search
    console.log("[DEBUG] Fetching search sources from Tavily...");
    const searchData = await performDirectSearch(query);
    const sources = searchData.results || [];
    console.log(`[DEBUG] Tavily successful: ${sources.length} sources found.`);

    // 2. Initialize Mistral AI
    if (!process.env.MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY is missing in environment variables.");
    }
    const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

    // 3. Prepare Prompt
    const contextText = sources.length > 0
      ? sources.map((s, i) => `[${i + 1}] Title: ${s.title}\nContent: ${s.content}`).join("\n\n")
      : "No web results found.";

    const systemPrompt = `You are a professional AI search assistant. Provide a detailed, comprehensive, and accurate answer based on the provided sources. 
If the user asks for a specific length (e.g., 500 words), try to honor that while remaining grounded in the facts.
Always cite each statement using [1], [2] next to the relevant facts. Use Markdown for clarity and structure.`;

    const userPrompt = `Query: "${query}"\n\nSources:\n${contextText}`;

    console.log("[DEBUG] Requesting Mistral generation...");
    
    // 4. Mistral Chat Completion
    const chatResponse = await client.chat.complete({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
    });

    // 5. Extraction
    if (!chatResponse.choices || chatResponse.choices.length === 0) {
      throw new Error("Mistral AI returned an empty response.");
    }

    const aiAnswer = chatResponse.choices[0].message.content;
    console.log("[DEBUG] Mistral generation complete.");

    // 6. DB Archiving (Fire and forget - don't block the user)
    const newSearchRecord = new Search({
      userId,
      query,
      response: aiAnswer,
      sources: sources.map((s) => ({
        title: s.title || "Web Resource",
        url: s.url || "#",
        snippet: s.snippet || s.content || "",
      })),
    });

    newSearchRecord.save().catch(err => {
      console.error("[ARCHIVE ERROR] Failed to save search to DB:", err.message);
    });

    // 7. Final Response (Immediate)
    res.status(200).json({
      success: true,
      data: {
        query,
        response: aiAnswer,
        sources: sources,
      },
    });

  } catch (err) {
    console.error("\n!!! MISTRAL BACKEND ERROR !!!");
    console.error(`- Message: ${err.message}`);
    console.error(`- Stack: ${err.stack}`);
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n");

    let status = 500;
    let fallbackMsg = "AI Search Engine encountered an error.";

    if (err.message.includes("401") || err.message.includes("API key")) {
      status = 401;
      fallbackMsg = "Invalid Mistral API Key configuration.";
    }

    res.status(status).json({
      success: false,
      message: fallbackMsg,
      error_detail: err.message
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const searches = await Search.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
    const total = await Search.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        searches,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("History error:", error);
    res.status(500).json({ success: false, message: "Error loading history" });
  }
};

const getSearchById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const searchItem = await Search.findOne({ _id: id, userId });
    if (!searchItem) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: { search: searchItem } });
  } catch (error) {
    console.error("Fetch by ID error:", error);
    res.status(500).json({ success: false, message: "Error loading search details" });
  }
};

module.exports = {
  search: performSearch,
  getHistory,
  getSearchById,
};
