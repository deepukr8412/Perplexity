const mongoose = require('mongoose');

const searchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  query: {
    type: String,
    required: [true, 'Search query is required'],
    trim: true
  },
  response: {
    type: String,
    required: [true, 'Search response is required']
  },
  sources: [{
    title: String,
    url: String,
    snippet: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
searchSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Search', searchSchema);
