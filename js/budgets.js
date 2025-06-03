// budgets.js - Budget management functionality
import { 
    expenseList, 
    initializeBudgetManager, 
    initializeMonthNavigator,
    calculateSpendingStats,
    formatCurrency,
    showNotification,
} from './shared.js';

let budgetManager = null;
let monthNavigator = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Budget templates
// Updated BUDGET_TEMPLATES for budgets.js - simplified categories
const BUDGET_TEMPLATES = {
    conservative: {
        name: 'Conservative',
        description: 'Perfect for saving-focused budgets',
        budgets: {
            housing: 1200,
            food: 400,
            transportation: 200,
            health: 150,
            entertainment: 100,
            finances: 100,
            other: 100
        }
    },
    balanced: {
        name: 'Balanced',
        description: 'Healthy mix of spending and saving',
        budgets: {
            housing: 1500,
            food: 600,
            transportation: 300,
            health: 200,
            entertainment: 200,
            finances: 150,
            other: 200
        }
    },
    flexible: {
        name: 'Flexible',
        description: 'Higher limits for lifestyle spending',
        budgets: {
            housing: 1800,
            food: 800,
            transportation: 400,
            health: 250,
            entertainment: 400,
            finances: 200,
            other: 300
        }
    }
};

// Initialize budgets page
document.addEventListener('DOMContentLoaded', () => {
    initializeBudgetsPage();
    setupEventListeners();
    updateBudgetDisplay();
});

function initializeBudgetsPage() {
    // Initialize budget manager
    budgetManager = initializeBudgetManager();
    
    // Initialize month navigator
    monthNavigator = initializeMonthNavigator(updateBudgetDisplay);
    
    // Set current month display
    updateMonthDisplay();
}

function setupEventListeners() {
    // Save budgets button
    const saveBudgetsBtn = document.getElementById('save-budgets-btn');
    if (saveBudgetsBtn) {
        saveBudgetsBtn.addEventListener('click', saveBudgets);
    }
    
    // Reset all button
    const resetAllBtn = document.getElementById('reset-all-btn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', resetAllBudgets);
    }
    
    // Template cards
    document.querySelectorAll('.template-card').forEach(card => {
        const applyBtn = card.querySelector('.btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const template = card.dataset.template;
                showTemplateModal(template);
            });
        }
    });
    
    // Template modal events
    setupTemplateModalEvents();
    
    // Month navigation (if different from shared navigator)
    setupCustomMonthNavigation();
}

function updateBudgetDisplay() {
    updateOverviewCards();
    updateBudgetGrid();
    updateProgressVisualization();
    updateInsights();
    updateLastUpdated();
}

function updateOverviewCards() {
    if (!budgetManager) return;
    
    const budgets = budgetManager.getAllBudgets();
    const stats = calculateSpendingStats(expenseList.expenses, budgets);
    
    // Total budget
    const totalBudgetEl = document.getElementById('total-budget');
    if (totalBudgetEl) {
        totalBudgetEl.textContent = formatCurrency(stats.totalBudget);
    }
    
    // Total spent comparison
    const totalSpentComparisonEl = document.getElementById('total-spent-comparison');
    if (totalSpentComparisonEl) {
        totalSpentComparisonEl.textContent = stats.totalSpent.toFixed(2);
    }
    
    // Remaining budget
    const remainingBudgetEl = document.getElementById('remaining-budget');
    if (remainingBudgetEl) {
        remainingBudgetEl.textContent = formatCurrency(stats.remainingBudget);
    }
    
    // Remaining percentage
    const remainingPercentageEl = document.getElementById('remaining-percentage');
    if (remainingPercentageEl) {
        const percentage = stats.totalBudget > 0 ? 
            (stats.remainingBudget / stats.totalBudget) * 100 : 0;
        remainingPercentageEl.textContent = `${percentage.toFixed(0)}% remaining`;
    }
    
    // Active categories
    const activeCategoriesEl = document.getElementById('active-categories');
    if (activeCategoriesEl) {
        const activeCount = Object.values(budgets).filter(budget => budget > 0).length;
        activeCategoriesEl.textContent = activeCount;
    }
    
    // Update trend indicator
    updateBudgetTrend(stats);
}

function updateBudgetTrend(stats) {
    const trendEl = document.getElementById('budget-trend');
    if (!trendEl) return;
    
    if (stats.totalBudget === 0) {
        trendEl.textContent = '📋';
        return;
    }
    
    const usedPercentage = (stats.totalSpent / stats.totalBudget) * 100;
    
    if (usedPercentage <= 50) {
        trendEl.textContent = '📈';
    } else if (usedPercentage <= 75) {
        trendEl.textContent = '⚠️';
    } else if (usedPercentage <= 100) {
        trendEl.textContent = '🔥';
    } else {
        trendEl.textContent = '🚨';
    }
}

function updateBudgetGrid() {
    if (!budgetManager) return;
    
    const budgetGrid = document.getElementById('budget-grid');
    if (!budgetGrid) return;
    
    budgetGrid.innerHTML = '';
    
    const budgets = budgetManager.getAllBudgets();
    const stats = calculateSpendingStats(expenseList.expenses, budgets);
    
    // Get categories from budget manager
    const categories = budgetManager.categories || {};
    
    Object.entries(categories).forEach(([key, categoryInfo]) => {
        const budgetAmount = budgets[key] || 0;
        const spent = stats.categoryTotals[key] || 0;
        const remaining = Math.max(0, budgetAmount - spent);
        const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
        
        const budgetItem = document.createElement('div');
        budgetItem.className = 'budget-item-card';
        budgetItem.innerHTML = `
            <div class="budget-card-header">
                <div class="category-info">
                    <span class="category-icon">${categoryInfo.icon}</span>
                    <span class="category-name">${categoryInfo.name}</span>
                </div>
                <div class="budget-status ${getStatusClass(percentage)}">
                    ${percentage.toFixed(0)}%
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
                        value="${budgetAmount}"
                        min="0"
                        step="10"
                        data-category="${key}"
                        placeholder="0.00"
                    >
                </div>
            </div>
            
            <div class="budget-progress-section">
                <div class="progress-info">
                    <span class="spent-amount">Spent: ${formatCurrency(spent)}</span>
                    <span class="remaining-amount">Left: ${formatCurrency(remaining)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${getProgressClass(percentage)}" 
                         style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
            </div>
        `;
        
        budgetGrid.appendChild(budgetItem);
    });
    
    // Attach input event listeners
    attachBudgetInputListeners();
}

function getStatusClass(percentage) {
    if (percentage <= 75) return 'status-good';
    if (percentage <= 90) return 'status-warning';
    return 'status-danger';
}

function getProgressClass(percentage) {
    if (percentage <= 75) return 'progress-good';
    if (percentage <= 90) return 'progress-warning';
    return 'progress-danger';
}

function attachBudgetInputListeners() {
    document.querySelectorAll('.budget-input').forEach(input => {
        input.addEventListener('input', handleBudgetInputChange);
        input.addEventListener('blur', handleBudgetInputBlur);
    });
}

function handleBudgetInputChange(e) {
    const category = e.target.dataset.category;
    const value = parseFloat(e.target.value) || 0;
    
    // Update budget manager
    if (budgetManager) {
        budgetManager.setBudget(category, value);
    }
    
    // Update displays immediately for better UX
    updateOverviewCards();
    updateProgressVisualization();
}

function handleBudgetInputBlur(e) {
    // Format the input value
    const value = parseFloat(e.target.value) || 0;
    e.target.value = value;
    
    // Update budget grid to reflect any changes
    setTimeout(() => updateBudgetGrid(), 100);
}

function updateProgressVisualization() {
    const progressContainer = document.getElementById('budget-progress-container');
    if (!progressContainer || !budgetManager) return;
    
    progressContainer.innerHTML = '';
    
    const budgets = budgetManager.getAllBudgets();
    const stats = calculateSpendingStats(expenseList.expenses, budgets);
    
    // Only show categories with budgets > 0
    const activeBudgets = Object.entries(budgets).filter(([, budget]) => budget > 0);
    
    if (activeBudgets.length === 0) {
        progressContainer.innerHTML = `
            <div class="empty-progress">
                <p>Set some budgets to see progress visualization!</p>
                <button class="btn btn-primary" onclick="focusFirstBudgetInput()">Set Your First Budget</button>
            </div>
        `;
        return;
    }
    
    activeBudgets.forEach(([category, budget]) => {
        const spent = stats.categoryTotals[category] || 0;
        const percentage = (spent / budget) * 100;
        const remaining = Math.max(0, budget - spent);
        
        const progressItem = document.createElement('div');
        progressItem.className = 'progress-visualization-item';
        progressItem.innerHTML = `
            <div class="progress-header">
                <h4>${category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                <span class="progress-amounts">${formatCurrency(spent)} / ${formatCurrency(budget)}</span>
            </div>
            <div class="progress-bar-large">
                <div class="progress-fill-large ${getProgressClass(percentage)}" 
                     style="width: ${Math.min(percentage, 100)}%">
                    <span class="progress-text">${percentage.toFixed(0)}%</span>
                </div>
            </div>
            <div class="progress-details">
                <span class="remaining-text">${formatCurrency(remaining)} remaining</span>
                <span class="status-text ${getStatusClass(percentage)}">
                    ${getStatusText(percentage)}
                </span>
            </div>
        `;
        
        progressContainer.appendChild(progressItem);
    });
}

function getStatusText(percentage) {
    if (percentage <= 50) return 'On track';
    if (percentage <= 75) return 'Good pace';
    if (percentage <= 90) return 'Watch spending';
    if (percentage <= 100) return 'Almost there';
    return 'Over budget';
}

function updateInsights() {
    updateRecommendations();
    updateBudgetAlerts();
    updateSpendingTrends();
}

function updateRecommendations() {
    const recommendationsEl = document.getElementById('recommendations');
    if (!recommendationsEl || !budgetManager) return;
    
    const budgets = budgetManager.getAllBudgets();
    const stats = calculateSpendingStats(expenseList.expenses, budgets);
    const recommendations = [];
    
    // Generate smart recommendations
    if (stats.totalBudget === 0) {
        recommendations.push("Start by setting budgets for your main expense categories like housing, food, and transportation.");
    } else {
        // Check for unbudgeted categories
        const categoriesWithSpending = Object.keys(stats.categoryTotals);
        const categoriesWithBudgets = Object.keys(budgets).filter(cat => budgets[cat] > 0);
        const unbudgetedCategories = categoriesWithSpending.filter(cat => !categoriesWithBudgets.includes(cat));
        
        if (unbudgetedCategories.length > 0) {
            recommendations.push(`Consider setting budgets for: ${unbudgetedCategories.join(', ')}`);
        }
        
        // Check for very high or low budgets
        Object.entries(budgets).forEach(([category, budget]) => {
            if (budget > 0) {
                const spent = stats.categoryTotals[category] || 0;
                const percentage = (spent / budget) * 100;
                
                if (percentage < 30 && spent > 0) {
                    recommendations.push(`Your ${category} budget might be too high. Consider reallocating funds.`);
                } else if (percentage > 120) {
                    recommendations.push(`Consider increasing your ${category} budget or reducing spending.`);
                }
            }
        });
        
        // Emergency fund recommendation
        if (!budgets.finances || budgets.finances < 200) {
            recommendations.push("Consider setting aside money for emergency savings and financial planning.");
        }
    }
    
    if (recommendations.length === 0) {
        recommendations.push("Great job! Your budgets look well-balanced. Keep monitoring your spending patterns.");
    }
    
    recommendationsEl.innerHTML = recommendations
        .map(rec => `<div class="insight-item">💡 ${rec}</div>`)
        .join('');
}

function updateBudgetAlerts() {
    const alertsEl = document.getElementById('budget-alerts');
    if (!alertsEl || !budgetManager) return;
    
    const budgets = budgetManager.getAllBudgets();
    const stats = calculateSpendingStats(expenseList.expenses, budgets);
    const alerts = [];
    
    Object.entries(budgets).forEach(([category, budget]) => {
        if (budget > 0) {
            const spent = stats.categoryTotals[category] || 0;
            const percentage = (spent / budget) * 100;
            
            if (percentage >= 100) {
                alerts.push(`🚨 ${category} budget exceeded by ${formatCurrency(spent - budget)}`);
            } else if (percentage >= 90) {
                alerts.push(`⚠️ ${category} budget 90% used (${formatCurrency(budget - spent)} left)`);
            } else if (percentage >= 75) {
                alerts.push(`📊 ${category} budget 75% used`);
            }
        }
    });
    
    if (alerts.length === 0) {
        alertsEl.innerHTML = '<div class="insight-item success">✅ No budget alerts. You\'re doing great!</div>';
    } else {
        alertsEl.innerHTML = alerts
            .map(alert => `<div class="insight-item alert">${alert}</div>`)
            .join('');
    }
}

function updateSpendingTrends() {
    const trendsEl = document.getElementById('spending-trends');
    if (!trendsEl) return;
    
    const stats = calculateSpendingStats(expenseList.expenses);
    const trends = [];
    
    if (stats.transactionCount > 0) {
        const avgTransaction = stats.totalSpent / stats.transactionCount;
        trends.push(`📈 Average transaction: ${formatCurrency(avgTransaction)}`);
        
        // Find top category
        const topCategory = Object.entries(stats.categoryTotals)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (topCategory) {
            const [category, amount] = topCategory;
            const percentage = (amount / stats.totalSpent) * 100;
            trends.push(`🏆 Top category: ${category} (${percentage.toFixed(0)}%)`);
        }
        
        // Daily average
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dailyAvg = stats.totalSpent / now.getDate();
        const projectedMonthly = dailyAvg * daysInMonth;
        trends.push(`📅 Projected monthly: ${formatCurrency(projectedMonthly)}`);
    } else {
        trends.push("📊 Add some expenses to see spending trends!");
    }
    
    trendsEl.innerHTML = trends
        .map(trend => `<div class="insight-item">${trend}</div>`)
        .join('');
}

function saveBudgets() {
    if (!budgetManager) return;
    
    try {
        budgetManager.saveBudgets();
        showNotification('Budgets saved successfully!', 'success');
        updateLastUpdated();
    } catch (error) {
        showNotification('Error saving budgets. Please try again.', 'error');
        console.error('Error saving budgets:', error);
    }
}

function resetAllBudgets() {
    if (!budgetManager) return;
    
    if (confirm('Are you sure you want to reset all budgets to $0? This action cannot be undone.')) {
        try {
            budgetManager.resetBudgets();
            updateBudgetDisplay();
            showNotification('All budgets have been reset to $0.', 'info');
        } catch (error) {
            showNotification('Error resetting budgets. Please try again.', 'error');
            console.error('Error resetting budgets:', error);
        }
    }
}

function showTemplateModal(templateKey) {
    const template = BUDGET_TEMPLATES[templateKey];
    if (!template) return;
    
    const modal = document.getElementById('template-modal');
    const confirmBtn = document.getElementById('confirm-template');
    
    if (modal && confirmBtn) {
        // Update modal content
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            const title = modalContent.querySelector('h3');
            const description = modalContent.querySelector('p');
            if (title) title.textContent = `Apply ${template.name} Budget Template`;
            if (description) description.textContent = `This will replace your current budget settings with the ${template.name.toLowerCase()} template. Are you sure you want to continue?`;
        }
        
        modal.style.display = 'flex';
        
        // Set up confirm button
        confirmBtn.onclick = () => {
            applyTemplate(templateKey);
            closeTemplateModal();
        };
    }
}

function applyTemplate(templateKey) {
    const template = BUDGET_TEMPLATES[templateKey];
    if (!template || !budgetManager) return;
    
    try {
        // Apply template budgets
        Object.entries(template.budgets).forEach(([category, amount]) => {
            budgetManager.setBudget(category, amount);
        });
        
        // Update display
        updateBudgetDisplay();
        showNotification(`${template.name} template applied successfully!`, 'success');
    } catch (error) {
        showNotification('Error applying template. Please try again.', 'error');
        console.error('Error applying template:', error);
    }
}

function setupTemplateModalEvents() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeTemplateModal();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTemplateModal();
        }
    });
}

function setupCustomMonthNavigation() {
    // This would handle month navigation specific to budgets
    // For now, we'll use the shared month navigator
}

function updateMonthDisplay() {
    const monthDisplay = document.getElementById('current-month-display');
    if (monthDisplay) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        monthDisplay.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
}

function updateLastUpdated() {
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) {
        lastUpdatedEl.textContent = new Date().toLocaleString();
    }
}

// Global functions for HTML onclick events
window.closeTemplateModal = function() {
    const modal = document.getElementById('template-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.focusFirstBudgetInput = function() {
    const firstInput = document.querySelector('.budget-input');
    if (firstInput) {
        firstInput.focus();
        firstInput.select();
    }
};