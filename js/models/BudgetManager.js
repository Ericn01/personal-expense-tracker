import { CATEGORIES } from "../utils/categories.js";

export class BudgetManager {
    constructor(container) {
        // Define categories with metadata
        this.categories = CATEGORIES;
        
        // Initialize properties
        this.monthlyBudgets = {}; // Changed from single budgets object to monthly structure
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.container = container;
        
        // DOM element references with null checks
        this.totalDisplay = document.querySelector('#total-budget');
        this.statusMessage = document.querySelector('#status-message');
        
        if (!this.totalDisplay || !this.statusMessage) {
            console.warn('Required DOM elements not found. Make sure #total-budget and #status-message exist.');
        }
        
        // Bind event handlers
        this.handleInputChange = this.handleInputChange.bind(this);
        this.saveBudgets = this.saveBudgets.bind(this);
        this.resetBudgets = this.resetBudgets.bind(this);
        
        // Initialize
        this.init();
    }
    
    init() {
        this.loadBudgets();
        this.render();
        this.attachEventListeners();
    }
    
    // Generate a key for monthly budgets
    getMonthKey(month = this.currentMonth, year = this.currentYear) {
        return `${year}-${month}`;
    }
    
    // Local storage methods
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to storage:', error);
            return false;
        }
    }
    
    loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Failed to load from storage:', error);
            return defaultValue;
        }
    }
    
    loadBudgets() {
        try {
            // Load monthly budgets structure
            const savedData = this.loadFromStorage('monthlyBudgets');
            
            if (savedData && typeof savedData === 'object') {
                this.monthlyBudgets = { ...savedData };
            } else {
                // Check for legacy single budget format
                const legacyBudgets = this.loadFromStorage('budgets');
                if (legacyBudgets && typeof legacyBudgets === 'object') {
                    // Migrate legacy budgets to new format
                    this.migrateLegacyBudgets(legacyBudgets);
                } else {
                    this.initializeDefaultBudgets();
                }
            }
        } catch (error) {
            console.error('Error loading budgets:', error);
            this.initializeDefaultBudgets();
        }
    }
    
    migrateLegacyBudgets(legacyBudgets) {
        // Convert old single budget to monthly format
        const currentKey = this.getMonthKey();
        this.monthlyBudgets[currentKey] = { ...legacyBudgets };
        this.saveToStorage('monthlyBudgets', this.monthlyBudgets);
        
        // Remove old format
        localStorage.removeItem('budgets');
        
        console.log('Migrated legacy budgets to monthly format');
    }
    
    initializeDefaultBudgets() {
        const currentKey = this.getMonthKey();
        
        // Initialize current month with default values
        this.monthlyBudgets[currentKey] = {
            housing: 1500,
            food: 600,
            transportation: 300,
            health: 200,
            entertainment: 200,
            finances: 100,
            other: 150
        };
    }
    
    // Get budgets for specific month/year
    getBudgetsForMonth(month, year) {
        const monthKey = this.getMonthKey(month, year);
        return this.monthlyBudgets[monthKey] || {};
    }
    
    // Set the current month/year for the budget manager
    setCurrentMonth(month, year) {
        this.currentMonth = month;
        this.currentYear = year;
        this.render();
    }
    
    render() {
        if (!this.container) return; // Safety check
        
        this.container.innerHTML = '';
        let total = 0;
        
        const currentKey = this.getMonthKey();
        const currentBudgets = this.monthlyBudgets[currentKey] || {};
        
        Object.entries(this.categories).forEach(([key, category]) => {
            const budgetAmount = currentBudgets[key] || 0;
            total += budgetAmount;
            
            const budgetItem = this.createBudgetItem(key, category, budgetAmount);
            this.container.appendChild(budgetItem);
        });
        
        this.updateTotal(total);
    }
    
    createBudgetItem(key, category, amount) {
        const item = document.createElement('div');
        item.className = 'budget-item-card';
        
        // Get current month's expenses for this category
        const expenses = this.getExpensesForCategory(key);
        const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = Math.max(0, amount - spent);
        const percentage = amount > 0 ? (spent / amount) * 100 : 0;
        
        item.innerHTML = `
            <div class="budget-card-header">
                <div class="category-info">
                    <div class="category-icon">${category.icon}</div>
                    <div class="category-name">${category.name}</div>
                </div>
                <div class="budget-status ${this.getStatusClass(percentage)}">
                    ${this.getStatusText(percentage, amount)}
                </div>
            </div>
            
            <div class="budget-input-section">
                <label for="budget-${key}">Monthly Budget</label>
                <div class="input-with-currency">
                    <span class="currency-symbol">$</span>
                    <input 
                        type="number" 
                        id="budget-${key}"
                        class="budget-input" 
                        value="${amount}"
                        min="0"
                        step="10"
                        data-category="${key}"
                        placeholder="0.00"
                    >
                </div>
            </div>
            
            <div class="budget-progress-section">
                <div class="progress-info">
                    <span class="spent-amount">Spent: ${this.formatCurrency(spent)}</span>
                    <span class="remaining-amount">Left: ${this.formatCurrency(remaining)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getProgressClass(percentage)}" 
                         style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
            </div>
        `;
        
        return item;
    }
    
    getExpensesForCategory(category) {
        // Import expense list dynamically to avoid circular dependencies
        const expenseList = window.expenseList || { expenses: [] };
        
        return expenseList.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === this.currentMonth &&
                   expenseDate.getFullYear() === this.currentYear &&
                   expense.category.toLowerCase() === category.toLowerCase();
        });
    }
    
    getStatusClass(percentage) {
        if (percentage === 0) return 'badge';
        if (percentage <= 75) return 'badge-good';
        if (percentage <= 90) return 'badge-warning';
        return 'badge-danger';
    }
    
    getStatusText(percentage, amount) {
        if (amount === 0) return 'Not Set';
        if (percentage >= 100) return 'Over Budget';
        if (percentage >= 90) return 'Almost There';
        if (percentage >= 75) return 'Watch It';
        return 'On Track';
    }
    
    getProgressClass(percentage) {
        if (percentage <= 75) return 'good';
        if (percentage <= 90) return 'warning';
        return 'danger';
    }
    
    updateTotal(total) {
        if (this.totalDisplay) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthLabel = `${monthNames[this.currentMonth]} ${this.currentYear}`;
            this.totalDisplay.innerHTML = `
                <span class="total-label">${monthLabel}:</span>
                <span class="total-amount">${this.formatCurrency(total)}</span>
            `;
        }
    }
    
    // Utility function for currency formatting
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    // Notification function
    showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notifications
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, duration);
    }
    
    attachEventListeners() {
        // Input change listeners
        if (this.container) {
            this.container.addEventListener('input', this.handleInputChange);
        }
        
        // Button listeners with null checks
        const saveBtn = document.querySelector('#save-budgets-btn');
        const resetBtn = document.querySelector('#reset-all-btn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', this.saveBudgets);
        } else {
            console.warn('#save-budgets-btn not found');
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', this.resetBudgets);
        } else {
            console.warn('#reset-all-btn not found');
        }
    }
    
    handleInputChange(event) {
        if (event.target.classList.contains('budget-input')) {
            const category = event.target.dataset.category;
            const value = parseFloat(event.target.value) || 0;
            
            // Update budget for current month
            const currentKey = this.getMonthKey();
            if (!this.monthlyBudgets[currentKey]) {
                this.monthlyBudgets[currentKey] = {};
            }
            this.monthlyBudgets[currentKey][category] = value;
            
            // Update displays
            this.updateBudgetDisplay(event.target, value);
            
            // Update total
            const total = this.calculateTotal();
            this.updateTotal(total);
        }
    }
    
    updateBudgetDisplay(input, value) {
        const budgetCard = input.closest('.budget-item-card');
        if (!budgetCard) return;
        
        const category = input.dataset.category;
        const expenses = this.getExpensesForCategory(category);
        const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const remaining = Math.max(0, value - spent);
        const percentage = value > 0 ? (spent / value) * 100 : 0;
        
        // Update status badge
        const statusBadge = budgetCard.querySelector('.budget-status');
        if (statusBadge) {
            statusBadge.className = `budget-status ${this.getStatusClass(percentage)}`;
            statusBadge.textContent = this.getStatusText(percentage, value);
        }
        
        // Update remaining amount
        const remainingAmount = budgetCard.querySelector('.remaining-amount');
        if (remainingAmount) {
            remainingAmount.textContent = `Left: ${this.formatCurrency(remaining)}`;
        }
        
        // Update progress bar
        const progressBar = budgetCard.querySelector('.progress-fill');
        if (progressBar) {
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
            progressBar.className = `progress-fill ${this.getProgressClass(percentage)}`;
        }
    }
    
    calculateTotal() {
        const currentKey = this.getMonthKey();
        const currentBudgets = this.monthlyBudgets[currentKey] || {};
        return Object.values(currentBudgets).reduce((sum, amount) => sum + amount, 0);
    }
    
    saveBudgets() {
        try {
            this.saveToStorage('monthlyBudgets', this.monthlyBudgets);
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
            this.showNotification(
                `Budgets saved for ${monthNames[this.currentMonth]} ${this.currentYear}!`, 
                'success'
            );
        } catch (error) {
            console.error('Error saving budgets:', error);
            this.showNotification('Error saving budgets. Please try again.', 'error');
        }
    }
    
    resetBudgets() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const confirmMsg = `Are you sure you want to reset all budgets for ${monthNames[this.currentMonth]} ${this.currentYear} to $0? This action cannot be undone.`;
        
        if (confirm(confirmMsg)) {
            try {
                const currentKey = this.getMonthKey();
                
                // Reset current month's budgets
                Object.keys(this.categories).forEach(category => {
                    if (!this.monthlyBudgets[currentKey]) {
                        this.monthlyBudgets[currentKey] = {};
                    }
                    this.monthlyBudgets[currentKey][category] = 0;
                });
                
                this.render();
                this.showNotification(
                    `All budgets for ${monthNames[this.currentMonth]} have been reset to $0.`, 
                    'info'
                );
            } catch (error) {
                console.error('Error resetting budgets:', error);
                this.showNotification('Error resetting budgets. Please try again.', 'error');
            }
        }
    }
    
    // Copy budgets from previous month
    copyFromPreviousMonth() {
        let prevMonth = this.currentMonth - 1;
        let prevYear = this.currentYear;
        
        if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
        }
        
        const prevKey = this.getMonthKey(prevMonth, prevYear);
        const currentKey = this.getMonthKey();
        
        if (this.monthlyBudgets[prevKey]) {
            this.monthlyBudgets[currentKey] = { ...this.monthlyBudgets[prevKey] };
            this.render();
            this.showNotification('Copied budgets from previous month!', 'success');
        } else {
            this.showNotification('No previous month budgets found.', 'warning');
        }
    }
    
    // Public API methods
    getBudget(category) {
        const currentKey = this.getMonthKey();
        const currentBudgets = this.monthlyBudgets[currentKey] || {};
        return currentBudgets[category] || 0;
    }
    
    setBudget(category, amount) {
        if (this.categories[category]) {
            const currentKey = this.getMonthKey();
            if (!this.monthlyBudgets[currentKey]) {
                this.monthlyBudgets[currentKey] = {};
            }
            this.monthlyBudgets[currentKey][category] = parseFloat(amount) || 0;
            this.render();
        }
    }
    
    getAllBudgets() {
        const currentKey = this.getMonthKey();
        return { ...(this.monthlyBudgets[currentKey] || {}) };
    }
    
    getTotalBudget() {
        return this.calculateTotal();
    }
}