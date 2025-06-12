// Automation service for social media operations
const SocialMediaAccount = require('../models/SocialMediaAccount');
const SocialMediaPost = require('../models/SocialMediaPost');
const ContentTemplate = require('../models/ContentTemplate');

// Service for automating social media operations
const socialMediaAutomationService = {
  // Process scheduled posts
  processScheduledPosts: async () => {
    try {
      // Get all scheduled posts that are due
      const scheduledPosts = await SocialMediaPost.findScheduledPosts();
      
      let publishedCount = 0;
      let failedCount = 0;
      
      // Process each post
      for (const post of scheduledPosts) {
        // Check if account is connected
        const account = await SocialMediaAccount.findById(post.account);
        if (!account || account.connectionStatus !== 'connected') {
          post.status = 'failed';
          post.errorDetails = {
            message: `Account ${account ? 'not connected' : 'not found'}`,
            code: 'ACCOUNT_ERROR',
            timestamp: Date.now()
          };
          await post.save();
          failedCount++;
          continue;
        }
        
        // Publish post
        const success = await post.publish();
        
        if (success) {
          publishedCount++;
        } else {
          failedCount++;
        }
      }
      
      console.log(`Processed scheduled posts: ${publishedCount} published, ${failedCount} failed`);
      return { success: true, publishedCount, failedCount };
    } catch (error) {
      console.error('Error in scheduled posts automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Update post analytics
  updatePostAnalytics: async () => {
    try {
      // Get all published posts
      const publishedPosts = await SocialMediaPost.find({ status: 'published' });
      
      let updatedCount = 0;
      
      // Process each post
      for (const post of publishedPosts) {
        // Update analytics
        const success = await post.updateAnalytics();
        
        if (success) {
          updatedCount++;
        }
      }
      
      console.log(`Updated analytics for ${updatedCount} posts`);
      return { success: true, updatedCount };
    } catch (error) {
      console.error('Error in post analytics update automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Check account connections
  checkAccountConnections: async () => {
    try {
      // Get all active accounts
      const accounts = await SocialMediaAccount.find({ isActive: true });
      
      let connectedCount = 0;
      let disconnectedCount = 0;
      
      // Process each account
      for (const account of accounts) {
        // Check connection
        const isConnected = await account.checkConnection();
        
        if (isConnected) {
          connectedCount++;
        } else {
          disconnectedCount++;
        }
      }
      
      console.log(`Checked account connections: ${connectedCount} connected, ${disconnectedCount} disconnected`);
      return { success: true, connectedCount, disconnectedCount };
    } catch (error) {
      console.error('Error in account connection check automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Generate AI content suggestions
  generateContentSuggestions: async () => {
    try {
      // Get all active accounts
      const accounts = await SocialMediaAccount.find({ isActive: true, connectionStatus: 'connected' });
      
      // Get all active templates
      const templates = await ContentTemplate.find({ isActive: true });
      
      if (templates.length === 0) {
        console.log('No active templates found for content suggestions');
        return { success: true, suggestionsCount: 0 };
      }
      
      let suggestionsCount = 0;
      
      // Generate suggestions for each account
      for (const account of accounts) {
        // Find suitable templates for this platform
        const suitableTemplates = templates.filter(template => 
          template.platform === 'all' || template.platform === account.platform
        );
        
        if (suitableTemplates.length === 0) continue;
        
        // Select a random template
        const randomTemplate = suitableTemplates[Math.floor(Math.random() * suitableTemplates.length)];
        
        // Generate content from template
        const content = randomTemplate.generateContent();
        
        if (!content) continue;
        
        // Create a draft post with the generated content
        const post = new SocialMediaPost({
          account: account._id,
          content: {
            text: content.text,
            images: []
          },
          aiGenerated: true,
          aiPrompt: randomTemplate.aiPromptTemplate,
          status: 'draft',
          tags: randomTemplate.tags
        });
        
        await post.save();
        suggestionsCount++;
      }
      
      console.log(`Generated ${suggestionsCount} content suggestions`);
      return { success: true, suggestionsCount };
    } catch (error) {
      console.error('Error in content suggestion automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Run all social media automation processes
  runAllSocialMediaAutomation: async () => {
    try {
      const results = {
        scheduledPosts: await socialMediaAutomationService.processScheduledPosts(),
        postAnalytics: await socialMediaAutomationService.updatePostAnalytics(),
        accountConnections: await socialMediaAutomationService.checkAccountConnections(),
        contentSuggestions: await socialMediaAutomationService.generateContentSuggestions()
      };
      
      console.log('All social media automation processes completed');
      return { success: true, results };
    } catch (error) {
      console.error('Error running social media automation processes:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = socialMediaAutomationService;
