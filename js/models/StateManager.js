// StateManager.js - Centralized state management for the expense tracker
import { ExpenseList } from "./ExpenseList.js";
import { BudgetManager } from "./BudgetManager.js";
import { MonthNavigator } from "./MonthNavigator.js";

class StateManager {
    constructor() {
        // Core data
        this.expenseList = new ExpenseList();
        this.budgetManager = null;
        this.monthNavigator = null;
        
        // Current view state
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        
        // Event listeners
        this.listeners = {
            expenseUpdate: [],
            budgetUpdate: [],
            monthChange: [],
            stateChange: []
        };

        // Bind methods
        this.handleExpenseUpdate = this.handleExpenseUpdate.bind(this);
        this.handleBudgetUpdate = this.handleBudgetUpdate.bind(this);
        this.handleMonthChange = this.handleMonthChange.bind(this);
        
        // Initialize
        this.init();
    }
    
    init() {
        // Set up expense list callback
        this.expenseList.onUpdate = this.handleExpenseUpdate;
        
        // Make state manager globally available
        window.stateManager = this;
        
        // Listen for storage events (cross-tab synchronization)
        window.addEventListener('storage', this.handleStorageChange.bind(this));
    }
    
    // Initialize managers (called from each page)
    initializeBudgetManager(container) {
        if (!this.budgetManager && container) {
            this.budgetManager = new BudgetManager(container);
            // Sync with current month
            this.budgetManager.setCurrentMonth(this.currentMonth, this.currentYear);
        }
        return this.budgetManager;
    }
    
    initializeMonthNavigator() {
        if (!this.monthNavigator) {
            this.monthNavigator = new MonthNavigator(this.expenseList, this.handleMonthChange);
        }
        return this.monthNavigator;
    }
    
    // Event handling
    handleExpenseUpdate() {
        this.emit('expenseUpdate', { 
            expenses: this.expenseList.expenses,
            monthlyExpenses: this.getMonthlyExpenses()
        });
        this.emit('stateChange', this.getState());
    }
    
    handleBudgetUpdate() {
        this.emit('budgetUpdate', { 
            budgets: this.getCurrentBudgets(),
            month: this.currentMonth,
            year: this.currentYear
        });
        this.emit('stateChange', this.getState());
    }
    
    handleMonthChange() {
        if (this.monthNavigator) {
            this.currentMonth = this.monthNavigator.getCurrentMonth();
            this.currentYear = this.monthNavigator.getCurrentYear();
            
            // Sync budget manager
            if (this.budgetManager) {
                this.budgetManager.setCurrentMonth(this.currentMonth, this.currentYear);
            }
            
            this.emit('monthChange', { 
                month: this.currentMonth, 
                year: this.currentYear 
            });
            this.emit('stateChange', this.getState());
        }
    }
    
    handleStorageChange(e) {
        // Sync changes from other tabs
        if (e.key === 'expenses') {
            // Reload expenses
            const expenses = JSON.parse(e.newValue || '[]');
            this.expenseList.expenses = expenses.map(exp => ({
                ...exp,
                date: new Date(exp.date)
            }));
            this.handleExpenseUpdate();
        } else if (e.key === 'monthlyBudgets') {
            // Reload budgets
            if (this.budgetManager) {
                this.budgetManager.loadBudgets();
                this.handleBudgetUpdate();
            }
        }
    }
    
    // Event system
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }
    
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }
    
    // Data access methods
    getMonthlyExpenses() {
        return this.expenseList.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === this.currentMonth && 
                expenseDate.getFullYear() === this.currentYear;
        });
    }
    
    getCurrentBudgets() {
        if (this.budgetManager) {
            return this.budgetManager.getBudgetsForMonth(this.currentMonth, this.currentYear);
        }
        return {};
    }
    
    getState() {
        return {
            month: this.currentMonth,
            year: this.currentYear,
            expenses: this.expenseList.expenses,
            monthlyExpenses: this.getMonthlyExpenses(),
            budgets: this.getCurrentBudgets(),
            stats: this.getMonthlyStats()
        };
    }
    
    getMonthlyStats() {
        const monthlyExpenses = this.getMonthlyExpenses();
        const budgets = this.getCurrentBudgets();
        
        const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalBudget = Object.values(budgets).reduce((sum, budget) => sum + budget, 0);
        const remainingBudget = Math.max(0, totalBudget - totalSpent);
        
        // Calculate daily average
        const currentDay = new Date().getDate();
        const avgDaily = currentDay > 0 ? totalSpent / currentDay : 0;
        
        // Get category breakdown
        const categoryTotals = {};
        monthlyExpenses.forEach(expense => {
            const category = expense.category.toLowerCase();
            categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
        });
        
        return {
            totalSpent,
            totalBudget,
            remainingBudget,
            avgDaily,
            categoryTotals,
            transactionCount: monthlyExpenses.length
        };
    }
    
    // Expense operations
    addExpense(expense) {
        this.expenseList.addExpense(expense);
    }
    
    updateExpense(id, data) {
        this.expenseList.modifyExpense(id, data);
    }
    
    deleteExpense(id) {
        this.expenseList.removeExpense(id);
    }
    
    // Budget operations
    setBudget(category, amount) {
        if (this.budgetManager) {
            this.budgetManager.setBudget(category, amount);
            this.handleBudgetUpdate();
        }
    }
    
    saveBudgets() {
        if (this.budgetManager) {
            this.budgetManager.saveBudgets();
            this.handleBudgetUpdate();
        }
    }
    
    resetBudgets() {
        if (this.budgetManager) {
            this.budgetManager.resetBudgets();
            this.handleBudgetUpdate();
        }
    }
    
    // Month navigation
    setMonth(month, year) {
        this.currentMonth = month;
        this.currentYear = year;
        
        if (this.monthNavigator) {
            // Update month navigator internal state
            this.monthNavigator.selectedMonth = month;
            this.monthNavigator.selectedYear = year;
            this.monthNavigator.updateDisplay();
        }
        
        if (this.budgetManager) {
            this.budgetManager.setCurrentMonth(month, year);
        }
        
        this.handleMonthChange();
    }
    
    navigateMonth(direction) {
        if (this.monthNavigator) {
            this.monthNavigator.navigateMonth(direction);
        }
    }
}

// Create singleton instance
const stateManager = new StateManager();

// Export singleton
export default stateManager;