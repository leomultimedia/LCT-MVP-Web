const mongoose = require('mongoose');

const ContentTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['promotional', 'educational', 'engagement', 'announcement', 'event', 'other'],
    default: 'other'
  },
  platform: {
    type: String,
    enum: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'pinterest', 'all', 'other'],
    default: 'all'
  },
  contentStructure: {
    textTemplate: {
      type: String,
      required: true
    },
    imagePrompts: [{
      type: String,
      trim: true
    }],
    variables: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      defaultValue: {
        type: String,
        trim: true
      }
    }]
  },
  aiPromptTemplate: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
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

// Method to generate content from template
ContentTemplateSchema.methods.generateContent = function(variables = {}) {
  try {
    let content = this.contentStructure.textTemplate;
    
    // Replace variables in template
    for (const variable of this.contentStructure.variables) {
      const value = variables[variable.name] || variable.defaultValue || `[${variable.name}]`;
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      content = content.replace(regex, value);
    }
    
    return {
      text: content,
      imagePrompts: this.contentStructure.imagePrompts
    };
  } catch (error) {
    console.error('Error generating content from template:', error);
    return null;
  }
};

// Method to generate AI prompt
ContentTemplateSchema.methods.generateAIPrompt = function(variables = {}) {
  try {
    if (!this.aiPromptTemplate) {
      return null;
    }
    
    let prompt = this.aiPromptTemplate;
    
    // Replace variables in prompt
    for (const variable of this.contentStructure.variables) {
      const value = variables[variable.name] || variable.defaultValue || `[${variable.name}]`;
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');
      prompt = prompt.replace(regex, value);
    }
    
    return prompt;
  } catch (error) {
    console.error('Error generating AI prompt:', error);
    return null;
  }
};

// Static method to find templates by category
ContentTemplateSchema.statics.findByCategory = function(category) {
  return this.find({ category, isActive: true }).sort({ name: 1 });
};

// Static method to find templates by platform
ContentTemplateSchema.statics.findByPlatform = function(platform) {
  return this.find({ 
    $or: [
      { platform },
      { platform: 'all' }
    ],
    isActive: true 
  }).sort({ name: 1 });
};

// Static method to find templates by tags
ContentTemplateSchema.statics.findByTags = function(tags) {
  return this.find({ 
    tags: { $in: tags },
    isActive: true 
  }).sort({ name: 1 });
};

module.exports = mongoose.model('ContentTemplate', ContentTemplateSchema);
