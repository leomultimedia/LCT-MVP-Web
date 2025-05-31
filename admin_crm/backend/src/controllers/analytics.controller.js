const Lead = require('../models/Lead');
const Campaign = require('../models/Campaign');
const PipelineStage = require('../models/PipelineStage');

// Controller methods for sales analytics
const analyticsController = {
  // Get sales funnel overview metrics
  getSalesOverview: async (req, res) => {
    try {
      // Get lead counts
      const totalLeads = await Lead.countDocuments();
      const newLeads = await Lead.countDocuments({ status: 'new' });
      const qualifiedLeads = await Lead.countDocuments({ status: 'qualified' });
      const wonLeads = await Lead.countDocuments({ status: 'won' });
      const lostLeads = await Lead.countDocuments({ status: 'lost' });
      
      // Get campaign metrics
      const activeCampaigns = await Campaign.countDocuments({ status: 'active' });
      
      // Calculate conversion rates
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
      
      // Return overview metrics
      res.json({
        leadMetrics: {
          total: totalLeads,
          new: newLeads,
          qualified: qualifiedLeads,
          won: wonLeads,
          lost: lostLeads,
          conversionRate: conversionRate.toFixed(2)
        },
        campaignMetrics: {
          active: activeCampaigns
        },
        lastUpdated: Date.now()
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get lead analytics
  getLeadAnalytics: async (req, res) => {
    try {
      // Get leads by source
      const leads = await Lead.find();
      
      // Group leads by source
      const leadsBySource = {};
      leads.forEach(lead => {
        if (!leadsBySource[lead.source]) {
          leadsBySource[lead.source] = 0;
        }
        leadsBySource[lead.source]++;
      });
      
      // Get leads by score range
      const leadScoreRanges = {
        low: await Lead.countDocuments({ score: { $lt: 30 } }),
        medium: await Lead.countDocuments({ score: { $gte: 30, $lt: 70 } }),
        high: await Lead.countDocuments({ score: { $gte: 70 } })
      };
      
      // Get leads needing follow-up
      const leadsNeedingFollowUp = await Lead.findNeedingFollowUp();
      
      res.json({
        leadsBySource,
        leadScoreRanges,
        leadsNeedingFollowUp: leadsNeedingFollowUp.length,
        lastUpdated: Date.now()
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get campaign performance analytics
  getCampaignAnalytics: async (req, res) => {
    try {
      // Get all campaigns
      const campaigns = await Campaign.find();
      
      // Calculate campaign effectiveness
      const campaignPerformance = campaigns.map(campaign => {
        const effectiveness = campaign.calculateEffectiveness();
        return {
          id: campaign._id,
          name: campaign.name,
          status: campaign.status,
          leads: campaign.performanceMetrics.leads || 0,
          conversions: campaign.performanceMetrics.conversions || 0,
          costPerLead: effectiveness.costPerLead.toFixed(2),
          costPerConversion: effectiveness.costPerConversion.toFixed(2),
          roi: effectiveness.roi.toFixed(2),
          conversionRate: effectiveness.conversionRate.toFixed(2)
        };
      });
      
      // Get campaigns needing attention
      const campaignsNeedingAttention = await Campaign.findNeedingAttention();
      
      res.json({
        campaignPerformance,
        campaignsNeedingAttention: campaignsNeedingAttention.length,
        lastUpdated: Date.now()
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get pipeline conversion analytics
  getPipelineAnalytics: async (req, res) => {
    try {
      // Get all pipeline stages
      const stages = await PipelineStage.getOrderedStages();
      
      // Calculate stage metrics
      const pipelineMetrics = [];
      
      for (const stage of stages) {
        const leadsInStage = await Lead.countDocuments({ stageId: stage._id });
        const conversionRate = await stage.calculateConversionRate();
        
        pipelineMetrics.push({
          id: stage._id,
          name: stage.name,
          order: stage.order,
          leadsCount: leadsInStage,
          conversionRate: conversionRate.toFixed(2),
          conversionGoal: stage.conversionGoal,
          averageDaysInStage: stage.averageDaysInStage
        });
      }
      
      res.json({
        pipelineMetrics,
        lastUpdated: Date.now()
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  },

  // Get sales forecast
  getSalesForecast: async (req, res) => {
    try {
      // Get qualified leads
      const qualifiedLeads = await Lead.countDocuments({ status: 'qualified' });
      
      // Get leads in proposal stage
      const proposalLeads = await Lead.countDocuments({ status: 'proposal' });
      
      // Get leads in negotiation stage
      const negotiationLeads = await Lead.countDocuments({ status: 'negotiation' });
      
      // Calculate forecast based on historical conversion rates
      // These would typically come from actual data, using placeholder values here
      const qualifiedToProposalRate = 0.6;
      const proposalToNegotiationRate = 0.7;
      const negotiationToWonRate = 0.8;
      
      const forecastFromQualified = qualifiedLeads * qualifiedToProposalRate * proposalToNegotiationRate * negotiationToWonRate;
      const forecastFromProposal = proposalLeads * proposalToNegotiationRate * negotiationToWonRate;
      const forecastFromNegotiation = negotiationLeads * negotiationToWonRate;
      
      const totalForecast = forecastFromQualified + forecastFromProposal + forecastFromNegotiation;
      
      res.json({
        forecast: {
          fromQualified: Math.round(forecastFromQualified),
          fromProposal: Math.round(forecastFromProposal),
          fromNegotiation: Math.round(forecastFromNegotiation),
          total: Math.round(totalForecast)
        },
        lastUpdated: Date.now()
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
};

module.exports = analyticsController;
