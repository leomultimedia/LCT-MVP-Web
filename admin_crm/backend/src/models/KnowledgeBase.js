const mongoose = require('mongoose');

const KnowledgeBaseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'procedural', 'policy', 'faq', 'troubleshooting', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  viewCount: {
    type: Number,
    default: 0
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  unhelpfulCount: {
    type: Number,
    default: 0
  },
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KnowledgeBase'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Method to increment view count
KnowledgeBaseSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Method to mark as helpful
KnowledgeBaseSchema.methods.markAsHelpful = function() {
  this.helpfulCount += 1;
  return this.save();
};

// Method to mark as unhelpful
KnowledgeBaseSchema.methods.markAsUnhelpful = function() {
  this.unhelpfulCount += 1;
  return this.save();
};

// Static method to find by category
KnowledgeBaseSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'published' }).sort({ createdAt: -1 });
};

// Static method to search by keyword
KnowledgeBaseSchema.statics.searchByKeyword = function(keyword) {
  return this.find({
    status: 'published',
    $or: [
      { title: { $regex: keyword, $options: 'i' } },
      { content: { $regex: keyword, $options: 'i' } },
      { tags: { $in: [new RegExp(keyword, 'i')] } }
    ]
  }).sort({ viewCount: -1 });
};

// Static method to find most viewed articles
KnowledgeBaseSchema.statics.findMostViewed = function(limit = 10) {
  return this.find({ status: 'published' }).sort({ viewCount: -1 }).limit(limit);
};

// Static method to find most helpful articles
KnowledgeBaseSchema.statics.findMostHelpful = function(limit = 10) {
  return this.find({ status: 'published' }).sort({ helpfulCount: -1 }).limit(limit);
};

module.exports = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);
