// budgets.js - Budget management functionality with StateManager
import stateManager from './models/StateManager.js';
import { 
    initializeBudgetManager, 
    initializeMonthNavigator,
    calculateSpendingStats,
    formatCurrency,
    showNotification,
} from './shared.js';

let budgetManager = null;
let monthNavigator = null;

// Budget templates
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
    setupStateListeners();
    updateBudgetDisplay();
});

function initializeBudgetsPage() {
    // Initialize budget manager
    budgetManager = initializeBudgetManager();
    
    // Initialize month navigator
    monthNavigator = initializeMonthNavigator();
    
    // Set current month display
    updateMonthDisplay();
}

function setupStateListeners() {
    // Listen for state changes
    stateManager.on('monthChange', handleMonthChange);
    stateManager.on('expenseUpdate', handleExpenseUpdate);
    stateManager.on('budgetUpdate', handleBudgetUpdate);
}

function handleMonthChange(data) {
    updateMonthDisplay();
    updateBudgetDisplay();
}

function handleExpenseUpdate(data) {
    // Update budget display when expenses change
    updateBudgetDisplay();
}

function handleBudgetUpdate(data) {
    // Update display when budgets change (from other tabs)
    updateBudgetDisplay();
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
    
    // Copy from previous month button
    const copyPrevBtn = document.getElementById('copy-previous-btn');
    if (copyPrevBtn) {
        copyPrevBtn.addEventListener('click', copyFromPreviousMonth);
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
}

function updateBudgetDisplay() {
    updateOverviewCards();
    updateBudgetGrid();
    updateInsights();
    updateLastUpdated();
}

function updateOverviewCards() {
    const state = stateManager.getState();
    const { stats, budgets, monthlyExpenses } = state;
    
    // Total budget
    const totalBudgetEl = document.getElementById('total-budget');
    if (totalBudgetEl) {
        totalBudgetEl.textContent = formatCurrency(stats.totalBudget);
    }
    
    // Total spent comparison
    const totalSpentComparisonEl = document.getElementById('total-spent-comparison');
    if (totalSpentComparisonEl) {
        totalSpentComparisonEl.textContent = formatCurrency(stats.totalSpent);
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
        trendEl.textContent = '📋 Set budgets';
        return;
    }
    
    const usedPercentage = (stats.totalSpent / stats.totalBudget) * 100;
    
    if (usedPercentage <= 50) {
        trendEl.textContent = '📈 Great progress';
    } else if (usedPercentage <= 75) {
        trendEl.textContent = '⚠️ Monitor closely';
    } else if (usedPercentage <= 100) {
        trendEl.textContent = '🔥 Nearly spent';
    } else {
        trendEl.textContent = '🚨 Over budget';
    }
}

function updateBudgetGrid() {
    if (!budgetManager) return;
    
    const budgetGrid = document.getElementById('budget-grid');
    if (!budgetGrid) return;
    
    // Let the budget manager handle its own rendering
    budgetManager.render();
}


function updateInsights() {
    updateRecommendations();
    updateBudgetAlerts();
    updateSpendingTrends();
}

function updateRecommendations() {
    const recommendationsEl = document.getElementById('recommendations');
    if (!recommendationsEl) return;
    
    const state = stateManager.getState();
    const { budgets, stats } = state;
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
    if (!alertsEl) return;
    
    const state = stateManager.getState();
    const { budgets, stats } = state;
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
    
    const state = stateManager.getState();
    const { stats, month, year } = state;
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
        
        // Daily average and projection
        const currentDate = new Date();
        if (currentDate.getMonth() === month && currentDate.getFullYear() === year) {
            // Current month - show projection
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const projectedMonthly = stats.avgDaily * daysInMonth;
            trends.push(`📅 Projected monthly: ${formatCurrency(projectedMonthly)}`);
        } else {
            // Past month - show total
            trends.push(`📊 Month total: ${formatCurrency(stats.totalSpent)}`);
        }
    } else {
        trends.push("📊 Add some expenses to see spending trends!");
    }
    
    trendsEl.innerHTML = trends
        .map(trend => `<div class="insight-item">${trend}</div>`)
        .join('');
}

function saveBudgets() {
    stateManager.saveBudgets();
    updateLastUpdated();
}

function resetAllBudgets() {
    if (!budgetManager) return;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const { month, year } = stateManager.getState();
    const confirmMsg = `Are you sure you want to reset all budgets for ${monthNames[month]} ${year} to $0? This action cannot be undone.`;
    
    if (confirm(confirmMsg)) {
        stateManager.resetBudgets();
    }
}

function copyFromPreviousMonth() {
    if (!budgetManager) return;
    budgetManager.copyFromPreviousMonth();
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
    if (!template) return;
    
    try {
        // Apply template budgets
        Object.entries(template.budgets).forEach(([category, amount]) => {
            stateManager.setBudget(category, amount);
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

function updateMonthDisplay() {
    const monthDisplay = document.getElementById('current-month-display');
    if (monthDisplay) {
        const state = stateManager.getState();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        monthDisplay.textContent = `${monthNames[state.month]} ${state.year}`;
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