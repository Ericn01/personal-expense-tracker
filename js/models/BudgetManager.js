export class BudgetManager {
    constructor(container) {
        // Define categories with metadata
        this.categories = {
            housing: { name: 'Housing', icon: '🏠' },
            food: { name: 'Food & Dining', icon: '🍔' },
            transportation: { name: 'Transportation', icon: '🚗' },
            healthcare: { name: 'Healthcare', icon: '🏥' },
            education: { name: 'Education', icon: '📚' },
            personal: { name: 'Personal Care', icon: '💅' },
            entertainment: { name: 'Entertainment', icon: '🎬' },
            family: { name: 'Family', icon: '👨‍👩‍👧‍👦' },
            finances: { name: 'Financial', icon: '💰' },
            donations: { name: 'Donations', icon: '🎁' },
            business: { name: 'Business', icon: '💼' }
        };
        
        // Initialize properties
        this.budgets = {};
        this.container = container;
        
        // Fixed: Add null checks for DOM elements
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
    
    loadBudgets() {
        try {
            // Attempt to load from storage
            const savedData = this.getFromStorage();
            
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
        
        // Set some example budgets
        this.budgets.housing = 1500;
        this.budgets.food = 600;
        this.budgets.transportation = 300;
        this.budgets.entertainment = 200;
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
        item.className = 'budget-item';
        
        item.innerHTML = `
            <div class="category-info">
                <div class="category-icon category-${key}">${category.icon}</div>
                <div class="category-name">${category.name}</div>
            </div>
            <input 
                type="number" 
                class="budget-input" 
                id="budget-${key}"
                value="${amount}"
                min="0"
                step="10"
                data-category="${key}"
            >
            <div class="budget-display ${this.getAmountClass(amount)}">
                $${amount.toFixed(2)}
            </div>
        `;
        
        return item;
    }
    
    getAmountClass(amount) {
        if (amount === 0) return 'zero';
        if (amount > 1000) return 'high';
        return '';
    }
    
    updateTotal(total) {
        if (this.totalDisplay) {
            this.totalDisplay.textContent = `$${total.toFixed(2)}`;
        }
    }
    
    attachEventListeners() {
        // Input change listeners
        if (this.container) {
            this.container.addEventListener('input', this.handleInputChange);
        }
        
        // Button listeners - Fixed: Add null checks
        const saveBtn = document.querySelector('#save-btn');
        const resetBtn = document.querySelector('#reset-btn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', this.saveBudgets);
        } else {
            console.warn('#save-btn not found');
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', this.resetBudgets);
        } else {
            console.warn('#reset-btn not found');
        }
    }
    
    handleInputChange(event) {
        if (event.target.classList.contains('budget-input')) {
            const category = event.target.dataset.category;
            const value = parseFloat(event.target.value) || 0;
            
            // Update budget
            this.budgets[category] = value;
            
            // Update display
            const display = event.target.nextElementSibling;
            if (display) {
                display.textContent = `$${value.toFixed(2)}`;
                display.className = `budget-display ${this.getAmountClass(value)}`;
            }
            
            // Update total
            const total = this.calculateTotal();
            this.updateTotal(total);
        }
    }
    
    calculateTotal() {
        return Object.values(this.budgets).reduce((sum, amount) => sum + amount, 0);
    }
    
    saveBudgets() {
        try {
            this.saveToStorage(this.budgets);
            this.showStatus('Budgets saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving budgets:', error);
            this.showStatus('Error saving budgets. Please try again.', 'error');
        }
    }
    
    resetBudgets() {
        if (confirm('Are you sure you want to reset all budgets to $0?')) {
            Object.keys(this.categories).forEach(category => {
                this.budgets[category] = 0;
            });
            
            this.render();
            this.showStatus('All budgets have been reset.', 'success');
        }
    }
    
    showStatus(message, type) {
        if (this.statusMessage) {
            this.statusMessage.textContent = message;
            this.statusMessage.className = `status-message ${type} show`;
            
            setTimeout(() => {
                this.statusMessage.classList.remove('show');
            }, 3000);
        }
    }
    
    // Storage methods - Fixed: Use consistent key name
    saveToStorage(data) {
        localStorage.setItem("budgets", JSON.stringify(data)); // Fixed: was "budget"
    }
    
    getFromStorage() {
        const data = localStorage.getItem("budgets"); // Fixed: was "budget"
        return data ? JSON.parse(data) : null;
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