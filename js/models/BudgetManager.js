import { CATEGORIES } from "../utils/categories.js";
export class BudgetManager {
    constructor(container) {
        // Define categories with metadata (updated for simplified 7-category system)
        this.categories = CATEGORIES;
        
        // Initialize properties
        this.budgets = {};
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
    
    // Local storage methods (integrated from shared.js)
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
            // Attempt to load from storage
            const savedData = this.loadFromStorage('budgets');
            
            if (savedData && typeof savedData === 'object') {
                this.budgets = { ...savedData };
            } else {
                this.initializeDefaultBudgets();
            }
        } catch (error) {
            console.error('Error loading budgets:', error);
            this.initializeDefaultBudgets();
        }
    }
    
    initializeDefaultBudgets() {
        // Initialize all categories with 0
        Object.keys(this.categories).forEach(category => {
            this.budgets[category] = 0;
        });
        
        // Set some example budgets for the simplified 7 categories
        this.budgets.housing = 1500;
        this.budgets.food = 600;
        this.budgets.transportation = 300;
        this.budgets.health = 200;
        this.budgets.entertainment = 200;
        this.budgets.finances = 100;
        this.budgets.other = 150;
    }
    
    render() {
        if (!this.container) return; // Safety check
        
        this.container.innerHTML = '';
        let total = 0;
        
        Object.entries(this.categories).forEach(([key, category]) => {
            const budgetAmount = this.budgets[key] || 0;
            total += budgetAmount;
            
            const budgetItem = this.createBudgetItem(key, category, budgetAmount);
            this.container.appendChild(budgetItem);
        });
        
        this.updateTotal(total);
    }
    
    createBudgetItem(key, category, amount) {
        const item = document.createElement('div');
        item.className = 'budget-item-card';
        
        item.innerHTML = `
            <div class="budget-card-header">
                <div class="category-info">
                    <div class="category-icon">${category.icon}</div>
                    <div class="category-name">${category.name}</div>
                </div>
                <div class="budget-status ${this.getStatusClass(amount)}">
                    ${this.getStatusText(amount)}
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
                    <span class="spent-amount">Spent: $0.00</span>
                    <span class="remaining-amount">Left: $${amount.toFixed(2)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill good" style="width: 0%"></div>
                </div>
            </div>
        `;
        
        return item;
    }
    
    getStatusClass(amount) {
        if (amount === 0) return 'badge';
        if (amount > 1000) return 'badge-good';
        if (amount > 500) return 'badge-warning';
        return 'badge';
    }
    
    getStatusText(amount) {
        if (amount === 0) return 'Not Set';
        if (amount > 1000) return 'High';
        if (amount > 500) return 'Medium';
        return 'Low';
    }
    
    updateTotal(total) {
        if (this.totalDisplay) {
            this.totalDisplay.textContent = this.formatCurrency(total);
        }
    }
    
    // Utility function for currency formatting (integrated from shared.js)
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    // Notification function (integrated from shared.js)
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
            
            // Update budget
            this.budgets[category] = value;
            
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
        
        // Update status badge
        const statusBadge = budgetCard.querySelector('.budget-status');
        if (statusBadge) {
            statusBadge.className = `budget-status ${this.getStatusClass(value)}`;
            statusBadge.textContent = this.getStatusText(value);
        }
        
        // Update remaining amount
        const remainingAmount = budgetCard.querySelector('.remaining-amount');
        if (remainingAmount) {
            remainingAmount.textContent = `Left: ${this.formatCurrency(value)}`;
        }
    }
    
    calculateTotal() {
        return Object.values(this.budgets).reduce((sum, amount) => sum + amount, 0);
    }
    
    saveBudgets() {
        try {
            this.saveToStorage('budgets', this.budgets);
            this.showNotification('Budgets saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving budgets:', error);
            this.showNotification('Error saving budgets. Please try again.', 'error');
        }
    }
    
    resetBudgets() {
        if (confirm('Are you sure you want to reset all budgets to $0? This action cannot be undone.')) {
            try {
                Object.keys(this.categories).forEach(category => {
                    this.budgets[category] = 0;
                });
                
                this.render();
                this.showNotification('All budgets have been reset to $0.', 'info');
            } catch (error) {
                console.error('Error resetting budgets:', error);
                this.showNotification('Error resetting budgets. Please try again.', 'error');
            }
        }
    }
    
    // Public API methods
    getBudget(category) {
        return this.budgets[category] || 0;
    }
    
    setBudget(category, amount) {
        if (this.categories[category]) {
            this.budgets[category] = parseFloat(amount) || 0;
            this.render();
        }
    }
    
    getAllBudgets() {
        return { ...this.budgets };
    }
    
    getTotalBudget() {
        return this.calculateTotal();
    }
}