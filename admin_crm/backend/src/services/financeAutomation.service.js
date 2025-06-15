// Automation service for finance operations
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const FinancialAccount = require('../models/FinancialAccount');

// Service for automating finance operations
const financeAutomationService = {
  // Process invoice reminders
  processInvoiceReminders: async () => {
    try {
      // Get all overdue invoices
      const overdueInvoices = await Invoice.findOverdueInvoices();
      
      let remindersSent = 0;
      
      // Process each overdue invoice
      for (const invoice of overdueInvoices) {
        // Skip if already marked as paid
        if (invoice.status === 'paid') continue;
        
        // Update status to overdue if not already
        if (invoice.status !== 'overdue') {
          invoice.status = 'overdue';
          await invoice.save();
        }
        
        // In production, this would send a reminder email to the client
        // For zero-cost implementation, we'll just log it
        console.log(`Reminder would be sent for invoice ${invoice.invoiceNumber} to ${invoice.client.email}`);
        remindersSent++;
      }
      
      console.log(`Processed invoice reminders: ${remindersSent} reminders would be sent`);
      return { success: true, remindersSent };
    } catch (error) {
      console.error('Error in invoice reminder automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Process recurring expenses
  processRecurringExpenses: async () => {
    try {
      const today = new Date();
      
      // Get all recurring expenses
      const recurringExpenses = await Expense.find({
        isRecurring: true,
        'recurringDetails.nextDueDate': { $lte: today }
      });
      
      let expensesCreated = 0;
      
      // Process each recurring expense
      for (const expense of recurringExpenses) {
        // Create a new expense based on the recurring one
        const newExpense = new Expense({
          description: expense.description,
          amount: expense.amount,
          date: today,
          category: expense.category,
          paymentMethod: expense.paymentMethod,
          notes: `Auto-generated from recurring expense: ${expense.description}`,
          status: 'pending',
          createdBy: expense.createdBy
        });
        
        await newExpense.save();
        expensesCreated++;
        
        // Update next due date based on frequency
        const nextDueDate = new Date(expense.recurringDetails.nextDueDate);
        
        switch (expense.recurringDetails.frequency) {
          case 'weekly':
            nextDueDate.setDate(nextDueDate.getDate() + 7);
            break;
          case 'monthly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDueDate.setMonth(nextDueDate.getMonth() + 3);
            break;
          case 'yearly':
            nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
            break;
        }
        
        // Check if we've reached the end date
        if (expense.recurringDetails.endDate && nextDueDate > expense.recurringDetails.endDate) {
          // Disable recurring if we've passed the end date
          expense.isRecurring = false;
        } else {
          // Update next due date
          expense.recurringDetails.nextDueDate = nextDueDate;
        }
        
        await expense.save();
      }
      
      console.log(`Processed recurring expenses: ${expensesCreated} expenses created`);
      return { success: true, expensesCreated };
    } catch (error) {
      console.error('Error in recurring expense automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Update budget actuals
  updateBudgetActuals: async () => {
    try {
      // Get all active budgets
      const activeBudgets = await Budget.findActiveBudgets();
      
      let budgetsUpdated = 0;
      
      // Update each budget
      for (const budget of activeBudgets) {
        await budget.updateActualExpenses();
        await budget.save();
        budgetsUpdated++;
      }
      
      console.log(`Updated actual expenses for ${budgetsUpdated} budgets`);
      return { success: true, budgetsUpdated };
    } catch (error) {
      console.error('Error in budget actuals update automation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Generate financial reports
  generateFinancialReports: async () => {
    try {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // Get all invoices for the current month
      const invoices = await Invoice.find({
        issueDate: {
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth
        }
      });
      
      // Get all expenses for the current month
      const expenses = await Expense.find({
        date: {
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth
        },
        status: 'approved'
      });
      
      // Calculate total revenue
      const totalRevenue = invoices.reduce((sum, invoice) => {
        if (invoice.status === 'paid') {
          return sum + invoice.total;
        }
        return sum;
      }, 0);
      
      // Calculate total expenses
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate profit/loss
      const profitLoss = totalRevenue - totalExpenses;
      
      // Group expenses by category
      const expensesByCategory = {};
      expenses.forEach(expense => {
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = 0;
        }
        expensesByCategory[expense.category] += expense.amount;
      });
      
      // Get account balances
      const accounts = await FinancialAccount.find({ isActive: true });
      const accountBalances = accounts.map(account => ({
        name: account.name,
        type: account.type,
        balance: account.currentBalance
      }));
      
      // Generate report
      const report = {
        period: {
          start: firstDayOfMonth,
          end: lastDayOfMonth
        },
        summary: {
          totalRevenue,
          totalExpenses,
          profitLoss
        },
        expensesByCategory,
        accountBalances,
        generatedAt: today
      };
      
      console.log(`Generated financial report for ${firstDayOfMonth.toISOString().split('T')[0]} to ${lastDayOfMonth.toISOString().split('T')[0]}`);
      return { success: true, report };
    } catch (error) {
      console.error('Error in financial report generation:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Run all finance automation processes
  runAllFinanceAutomation: async () => {
    try {
      const results = {
        invoiceReminders: await financeAutomationService.processInvoiceReminders(),
        recurringExpenses: await financeAutomationService.processRecurringExpenses(),
        budgetActuals: await financeAutomationService.updateBudgetActuals(),
        financialReports: await financeAutomationService.generateFinancialReports()
      };
      
      console.log('All finance automation processes completed');
      return { success: true, results };
    } catch (error) {
      console.error('Error running finance automation processes:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = financeAutomationService;
