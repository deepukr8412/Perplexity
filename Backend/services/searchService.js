const { tavily } = require("@tavily/core");
require('dotenv').config();

/**
 * Initialize Tavily client strictly once
 */
const getTavilyClient = () => {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error("TAVILY_API_KEY is missing in your .env file.");
  }
  return tavily({ apiKey: process.env.TAVILY_API_KEY });
};

/**
 * Perform a direct search using Tavily
 * No LangChain = Zero SDK Conflicts
 */
const performDirectSearch = async (query) => {
  try {
    console.log(`[TAVILY] Starting search for: "${query}"`);
    const tvly = getTavilyClient();
    const response = await tvly.search(query, {
      searchDepth: "basic",
      maxResults: 6,
      includeAnswer: false, 
    });
    return response;
  } catch (error) {
    console.error('[TAVILY ERROR]', error.message);
    throw error;
  }
};

module.exports = {
  performDirectSearch
};
