const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwtUtils');
const { performDirectSearch } = require('./searchService');
const { Mistral } = require('@mistralai/mistralai');
const Search = require('../models/Search');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Auth Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.userId}`);

    socket.on('search', async (data) => {
      const { query } = data;
      if (!query) {
        socket.emit('error', { message: 'Query is required' });
        return;
      }

      console.log(`[SOCKET] Search for "${query}" from ${socket.userId}`);

      try {
        // 1. Tavily Search (blocking for now as it's the context source)
        socket.emit('status', { message: 'Searching web...' });
        const searchData = await performDirectSearch(query);
        const sources = searchData.results || [];
        socket.emit('sources', sources);

        // 2. Mistral Initialization
        const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
        
        const contextText = sources.length > 0
          ? sources.map((s, i) => `[${i + 1}] Title: ${s.title}\nContent: ${s.content}`).join("\n\n")
          : "No web results found.";

        const systemPrompt = `You are a professional AI search assistant. Provide a detailed, comprehensive, and accurate answer based on the provided sources. 
If the user asks for a specific length (e.g., 500 words), try to honor that while remaining grounded in the facts.
Always cite each statement using [1], [2] next to the relevant facts. Use Markdown for clarity and structure.`;
        const userPrompt = `Query: "${query}"\n\nSources:\n${contextText}`;

        // 3. Streaming Chat Completion
        socket.emit('status', { message: 'Generating answer...' });
        
        const responseStream = await client.chat.stream({
          model: "mistral-small-latest",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
        });

        let fullAnswer = '';
        for await (const chunk of responseStream) {
          const content = chunk.data.choices[0].delta.content;
          if (content) {
            fullAnswer += content;
            socket.emit('token', content);
          }
        }

        socket.emit('complete', { 
          fullAnswer, 
          sources 
        });

        // 4. Save to DB
        const newSearchRecord = new Search({
          userId: socket.userId,
          query,
          response: fullAnswer,
          sources: sources.map((s) => ({
            title: s.title || "Web Resource",
            url: s.url || "#",
            snippet: s.snippet || s.content || "",
          })),
        });
        await newSearchRecord.save();

      } catch (err) {
        console.error('[SOCKET ERROR]', err);
        socket.emit('error', { message: 'Search failed', detail: err.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

module.exports = { initSocket };
