// Automation service for ITSM ticketing system
const Ticket = require('../models/Ticket');
const KnowledgeBase = require('../models/KnowledgeBase');

// Service for automating ITSM operations
const ticketAutomationService = {
  // Process SLA monitoring
  processSLAMonitoring: async () => {
    try {
      // Get all open and in-progress tickets
      const activeTickets = await Ticket.find({
        status: { $in: ['open', 'in_progress'] }
      });
      
      let breachedCount = 0;
      
      // Process each ticket
      for (const ticket of activeTickets) {
        // Check if SLA is breached
        const wasBreached = ticket.sla.isBreached;
        const isBreached = ticket.checkSLA();
        
        // If SLA status changed to breached, add a system comment
        if (!wasBreached && isBreached) {
          ticket.comments.push({
            text: 'SLA breach detected',
            isInternal: true,
            createdAt: Date.now()
          });
          
          await ticket.save();
          breachedCount++;
        }
      }
      
      console.log(`Processed SLA monitoring: ${breachedCount} new breaches detected`);
      return { success: true, breachedCount };
    } catch (error) {
      console.error('Error in SLA monitoring automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Process ticket auto-assignment
  processTicketAutoAssignment: async () => {
    try {
      // Get all unassigned open tickets
      const unassignedTickets = await Ticket.find({
        status: 'open',
        assignedTo: { $exists: false }
      });
      
      // In a real implementation, this would use a load balancing algorithm
      // and fetch available agents from the database
      // For this zero-cost implementation, we'll use a simple mock
      const mockAgents = [
        { id: '60d0fe4f5311236168a109ca', specialties: ['technical_issue', 'software'] },
        { id: '60d0fe4f5311236168a109cb', specialties: ['service_request', 'account_access'] },
        { id: '60d0fe4f5311236168a109cc', specialties: ['security', 'network'] }
      ];
      
      let assignedCount = 0;
      
      // Process each ticket
      for (const ticket of unassignedTickets) {
        // Find suitable agent based on ticket category
        const suitableAgents = mockAgents.filter(agent => 
          agent.specialties.includes(ticket.category)
        );
        
        if (suitableAgents.length > 0) {
          // Assign to first suitable agent (in a real system, would use load balancing)
          const agent = suitableAgents[0];
          
          ticket.assignedTo = agent.id;
          ticket.comments.push({
            text: `Ticket automatically assigned to agent ID: ${agent.id}`,
            isInternal: true,
            createdAt: Date.now()
          });
          
          await ticket.save();
          assignedCount++;
        }
      }
      
      console.log(`Processed ticket auto-assignment: ${assignedCount} tickets assigned`);
      return { success: true, assignedCount };
    } catch (error) {
      console.error('Error in ticket auto-assignment automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Process knowledge base suggestions
  processKnowledgeBaseSuggestions: async () => {
    try {
      // Get all open tickets without knowledge base suggestions
      const tickets = await Ticket.find({
        status: 'open',
        'comments': {
          $not: {
            $elemMatch: {
              text: { $regex: 'Knowledge base suggestions:' }
            }
          }
        }
      });
      
      let suggestionsCount = 0;
      
      // Process each ticket
      for (const ticket of tickets) {
        // Search knowledge base for relevant articles
        // In a real implementation, this would use NLP/ML for better matching
        const searchTerms = [
          ticket.subject,
          ticket.category,
          ...ticket.description.split(' ').filter(word => word.length > 5).slice(0, 5)
        ];
        
        // Combine search terms into a regex pattern
        const searchPattern = searchTerms.join('|');
        
        // Find matching articles
        const articles = await KnowledgeBase.find({
          status: 'published',
          $or: [
            { title: { $regex: searchPattern, $options: 'i' } },
            { content: { $regex: searchPattern, $options: 'i' } },
            { tags: { $in: [new RegExp(searchPattern, 'i')] } }
          ]
        }).sort({ viewCount: -1 }).limit(3);
        
        if (articles.length > 0) {
          // Create suggestions comment
          const suggestionText = `Knowledge base suggestions:\n${articles.map((article, index) => 
            `${index + 1}. ${article.title} (ID: ${article._id})`
          ).join('\n')}`;
          
          ticket.comments.push({
            text: suggestionText,
            isInternal: true,
            createdAt: Date.now()
          });
          
          await ticket.save();
          suggestionsCount++;
        }
      }
      
      console.log(`Processed knowledge base suggestions: ${suggestionsCount} tickets updated`);
      return { success: true, suggestionsCount };
    } catch (error) {
      console.error('Error in knowledge base suggestions automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Process ticket status updates
  processTicketStatusUpdates: async () => {
    try {
      // Get all resolved tickets that haven't been updated in 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const resolvedTickets = await Ticket.find({
        status: 'resolved',
        updatedAt: { $lt: threeDaysAgo }
      });
      
      let closedCount = 0;
      
      // Process each ticket
      for (const ticket of resolvedTickets) {
        // Auto-close ticket
        ticket.status = 'closed';
        ticket.comments.push({
          text: 'Ticket automatically closed after 3 days in resolved status',
          isInternal: true,
          createdAt: Date.now()
        });
        
        await ticket.save();
        closedCount++;
      }
      
      console.log(`Processed ticket status updates: ${closedCount} tickets closed`);
      return { success: true, closedCount };
    } catch (error) {
      console.error('Error in ticket status updates automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Run all ITSM automation processes
  runAllITSMAutomation: async () => {
    try {
      const results = {
        slaMonitoring: await ticketAutomationService.processSLAMonitoring(),
        ticketAutoAssignment: await ticketAutomationService.processTicketAutoAssignment(),
        knowledgeBaseSuggestions: await ticketAutomationService.processKnowledgeBaseSuggestions(),
        ticketStatusUpdates: await ticketAutomationService.processTicketStatusUpdates()
      };
      
      console.log('All ITSM automation processes completed');
      return { success: true, results };
    } catch (error) {
      console.error('Error running ITSM automation processes:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = ticketAutomationService;
