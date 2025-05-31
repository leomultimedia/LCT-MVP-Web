// Automation service for sales funnel
const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const PipelineStage = require('../models/PipelineStage');
const EmailTemplate = require('../models/EmailTemplate');

// Service for automating sales funnel processes
const automationService = {
  // Process lead scoring automation
  processLeadScoring: async () => {
    try {
      // Get all leads
      const leads = await Lead.find();
      
      // Update scores for each lead
      for (const lead of leads) {
        lead.score = lead.calculateScore();
        await lead.save();
      }
      
      console.log(`Processed lead scoring for ${leads.length} leads`);
      return { success: true, count: leads.length };
    } catch (error) {
      console.error('Error in lead scoring automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Process pipeline stage automation rules
  processPipelineAutomation: async () => {
    try {
      // Get all active pipeline stages with automation rules
      const stages = await PipelineStage.find({
        isActive: true,
        'automationRules.0': { $exists: true }
      });
      
      let actionsPerformed = 0;
      
      // Process each stage
      for (const stage of stages) {
        // Get leads in this stage
        const leadsInStage = await Lead.find({ stageId: stage._id });
        
        // Process automation rules for each lead
        for (const lead of leadsInStage) {
          for (const rule of stage.automationRules) {
            if (!rule.isActive) continue;
            
            let conditionMet = false;
            
            // Check if condition is met
            switch (rule.condition) {
              case 'days_in_stage':
                // Calculate days in stage
                const daysInStage = Math.floor((Date.now() - lead.lastActivity) / (1000 * 60 * 60 * 24));
                conditionMet = daysInStage >= rule.value;
                break;
                
              case 'activity_count':
                // Check activity count
                conditionMet = lead.activities.length >= rule.value;
                break;
                
              case 'score_threshold':
                // Check lead score
                conditionMet = lead.score >= rule.value;
                break;
                
              case 'custom':
                // Custom conditions would be implemented here
                break;
            }
            
            // If condition is met, perform action
            if (conditionMet) {
              switch (rule.action) {
                case 'move_to_stage':
                  // Move lead to new stage
                  lead.stageId = rule.actionValue;
                  lead.activities.unshift({
                    type: 'note',
                    description: 'Automatically moved to new pipeline stage',
                    date: Date.now(),
                    completed: true
                  });
                  break;
                  
                case 'assign_to_user':
                  // Assign lead to user
                  lead.assignedTo = rule.actionValue;
                  lead.activities.unshift({
                    type: 'note',
                    description: 'Automatically assigned to user',
                    date: Date.now(),
                    completed: true
                  });
                  break;
                  
                case 'send_email':
                  // Send email (would integrate with email service)
                  lead.activities.unshift({
                    type: 'email',
                    description: 'Automated email sent',
                    date: Date.now(),
                    completed: true
                  });
                  break;
                  
                case 'create_task':
                  // Create task
                  lead.activities.unshift({
                    type: 'task',
                    description: rule.actionValue,
                    date: Date.now(),
                    completed: false
                  });
                  break;
                  
                case 'update_score':
                  // Update lead score
                  lead.score = rule.actionValue;
                  break;
              }
              
              // Update last activity
              lead.lastActivity = Date.now();
              await lead.save();
              actionsPerformed++;
            }
          }
        }
      }
      
      console.log(`Processed pipeline automation: ${actionsPerformed} actions performed`);
      return { success: true, actionsPerformed };
    } catch (error) {
      console.error('Error in pipeline automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Process campaign email sequences
  processCampaignEmails: async () => {
    try {
      // Get active campaigns
      const activeCampaigns = await Campaign.find({ status: 'active' });
      
      let emailsSent = 0;
      
      // Process each campaign
      for (const campaign of activeCampaigns) {
        // Get email templates for this campaign
        const templates = await EmailTemplate.find({
          campaignId: campaign._id,
          isActive: true
        }).sort({ sequenceOrder: 1 });
        
        // Skip if no templates
        if (templates.length === 0) continue;
        
        // Get leads for this campaign (simplified logic)
        // In a real implementation, this would use campaign.targetAudience criteria
        const leads = await Lead.find({ status: { $nin: ['won', 'lost'] } });
        
        // Process each lead
        for (const lead of leads) {
          // Find appropriate template based on lead's stage in sequence
          // This is simplified logic - real implementation would be more sophisticated
          const emailsSentToLead = lead.activities.filter(a => 
            a.type === 'email' && a.description.includes('campaign')
          ).length;
          
          // Get next template in sequence
          const templateIndex = Math.min(emailsSentToLead, templates.length - 1);
          const template = templates[templateIndex];
          
          // Check if we should send based on trigger condition
          let shouldSend = false;
          
          switch (template.triggerCondition) {
            case 'immediate':
              shouldSend = emailsSentToLead === 0;
              break;
              
            case 'delay':
              // Check if enough time has passed since last email
              const lastEmailActivity = lead.activities.find(a => a.type === 'email');
              if (lastEmailActivity) {
                const daysSinceLastEmail = Math.floor((Date.now() - lastEmailActivity.date) / (1000 * 60 * 60 * 24));
                shouldSend = daysSinceLastEmail >= (template.triggerValue || 3);
              }
              break;
              
            case 'action':
              // Check if lead has performed specific action
              // Simplified implementation
              break;
              
            case 'stage_change':
              // Check if lead has changed stages
              // Simplified implementation
              break;
              
            case 'score_change':
              // Check if lead score has changed
              // Simplified implementation
              break;
          }
          
          // Send email if conditions are met
          if (shouldSend) {
            // Render email with lead data
            const { subject, body } = template.renderForLead(lead);
            
            // In production, this would send a real email
            console.log(`Would send email to ${lead.email}: ${subject}`);
            
            // Add activity to lead
            lead.activities.unshift({
              type: 'email',
              description: `Campaign email sent: ${subject}`,
              date: Date.now(),
              completed: true
            });
            
            // Update last activity
            lead.lastActivity = Date.now();
            await lead.save();
            emailsSent++;
          }
        }
      }
      
      console.log(`Processed campaign emails: ${emailsSent} emails would be sent`);
      return { success: true, emailsSent };
    } catch (error) {
      console.error('Error in campaign email automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Process follow-up reminders
  processFollowUpReminders: async () => {
    try {
      // Get leads needing follow-up
      const leadsNeedingFollowUp = await Lead.findNeedingFollowUp();
      
      // In production, this would send notifications to assigned users
      console.log(`${leadsNeedingFollowUp.length} leads need follow-up`);
      
      return { success: true, count: leadsNeedingFollowUp.length };
    } catch (error) {
      console.error('Error in follow-up reminder automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Run all automation processes
  runAllAutomation: async () => {
    try {
      const results = {
        leadScoring: await automationService.processLeadScoring(),
        pipelineAutomation: await automationService.processPipelineAutomation(),
        campaignEmails: await automationService.processCampaignEmails(),
        followUpReminders: await automationService.processFollowUpReminders()
      };
      
      console.log('All automation processes completed');
      return { success: true, results };
    } catch (error) {
      console.error('Error running automation processes:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = automationService;
