# API Key Setup Guide - IMMEDIATE FIX NEEDED

## Current Issue
The Tavily API key is returning "401 Unauthorized" error, which means the key is invalid or expired.

## Quick Fix Steps

### 1. Get a New Tavily API Key (URGENT)
1. Go to https://tavily.com
2. Click "Sign Up" or "Get Started"
3. Create a free account (1,000 searches/month)
4. Go to your dashboard/API section
5. Copy your API key (it should look like: tvly-xxxxxxxxxxxxxxxxxxxxxxxxxx)
6. Replace the current key in Backend/.env

### 2. Verify Gemini API Key
Your Gemini key looks correct format, but let's ensure it's working:
1. Go to https://aistudio.google.com
2. Check your API key is active
3. Ensure you have API quota available

### 3. Update .env File
```env
TAVILY_API_KEY=tvly-YOUR_ACTUAL_KEY_HERE
GEMINI_API_KEY=AIzaSyAMGlhpA_gH5t97pkX8kaE06dg_ZEl3uQg
```

### 4. Restart Backend
```bash
taskkill /F /IM node.exe
cd Backend
npm start
```

## Testing the Fix
1. Try searching "who is virat kohli"
2. Check backend console for:
   - "Tavily response received" (should NOT show 401 error)
   - "Gemini response received"
   - "Search saved to database"

## Alternative: Free API Keys
If you need free alternatives:
- **Tavily**: https://tavily.com (free tier available)
- **Gemini**: https://aistudio.google.com (free tier available)

## Current Status
❌ Tavily API: 401 Unauthorized (key invalid)
✅ Gemini API: Key format looks correct
✅ Backend: Running and ready
✅ Frontend: Running and ready

The search will work once you update the Tavily API key!
