require('dotenv').config();
const { performDirectSearch } = require("./services/searchService");

async function testTavily() {
  try {
    console.log("Testing Tavily search...");
    const results = await performDirectSearch("What is the latest score of India vs Australia?");
    console.log("Tavily Results:", JSON.stringify(results.results, null, 2));
  } catch (error) {
    console.error("Tavily Error:", error.message);
  }
}

testTavily();
