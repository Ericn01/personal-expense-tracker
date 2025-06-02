import { ExpenseList } from "./models/ExpenseList.js";
import { populateCategoryDropdown } from "./utils/categories.js";
import { renderTable } from "./ui/table.js";
import { applyFilters, clearFilters, handleFormSubmit, deleteExpense, modifyExpense } from './utils/eventListeners.js'
import { MonthNavigator } from "./models/MonthNavigator.js";
import { BudgetManager } from "./models/BudgetManager.js";

// Global variables
const expenseList = new ExpenseList();
export let editingId = null;
let monthlyChart = null;
let categoryChart = null;
let budgetManager = null;
let monthNavigator = null;

// Export functions that eventListeners needs to call
export function setEditingId(id) {
    editingId = id;
}

export function getEditingId() {
    return editingId;
}

// Make functions available globally for backward compatibility
window.setEditingId = setEditingId;
window.getEditingId = getEditingId;

export function updateAll() {
    if (!monthNavigator) return;
    
    // Get expenses for the selected month
    const { start, end } = monthNavigator.getDateRange();
    const monthlyExpenses = expenseList.getFiltered({
        startDate: start.toISOString(),
        endDate: end.toISOString()
    });
    
    renderTable(monthlyExpenses);
    updateSummaryAndAlerts();
    // Add event listeners for edit/delete buttons after rendering
    deleteExpense(expenseList);
    modifyExpense(expenseList);
    // updateCharts();
}

// Initialize - only run on the original main page (if it exists)
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the original main page by looking for specific elements
    const isDashboardPage = document.querySelector('.dashboard-layout') && 
                            document.querySelector('#new-entry-form');
    
    if (!isDashboardPage) return; // Exit if not on the main dashboard page
    
    // Creating an instance of the budget manager
    const budgetContainer = document.querySelector('#budget-list');
    if (budgetContainer) {
        budgetManager = new BudgetManager(budgetContainer);
    }
    
    // Initialize month navigator with callback
    monthNavigator = new MonthNavigator(expenseList, updateAll);

    // Set today's date as default
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    // Populate the dropdowns
    const newEntryCategoriesDropdown = document.querySelector("#categories");
    const tableFilterCategoriesDropdown = document.querySelector("#filter-category");
    
    [newEntryCategoriesDropdown, tableFilterCategoriesDropdown].forEach(dropdownElem => {
        if (dropdownElem) populateCategoryDropdown(dropdownElem);
    });
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial render
    updateAll();
});

function setupEventListeners() {
    // Form submission
    const form = document.querySelector('#new-entry-form');
    if (form) {
        form.addEventListener('submit', e => handleFormSubmit(e, expenseList, updateAll));
    }

    // Filters
    const applyBtn = document.querySelector('#apply-filters');
    const clearBtn = document.querySelector('#clear-filters');
    
    if (applyBtn) {
        applyBtn.addEventListener('click', e => applyFilters(expenseList, monthNavigator));
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', e => clearFilters(expenseList));
    }
}

function updateSummaryAndAlerts() {
    if (!monthNavigator || !budgetManager) return;
    
    const month = monthNavigator.getCurrentMonth();
    const year = monthNavigator.getCurrentYear();
    
    // Get expenses for selected month
    const monthlyExpenses = expenseList.getMonthlyExpenses(month, year);
    
    // Calculate totals
    const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const days = new Set(monthlyExpenses.map(exp => exp.date.toISOString().split('T')[0]));
    const avgSpending = days.size > 0 ? totalSpent / days.size : 0;
    
    // Get budgets from budget manager
    const budgets = budgetManager.getAllBudgets();
    
    // Calculate remaining budget
    let totalBudget = 0;
    let remainingBudget = 0;
    Object.entries(budgets).forEach(([category, budget]) => {
        totalBudget += budget;
        const categorySpent = monthlyExpenses
            .filter(e => e.category.toLowerCase() === category.toLowerCase())
            .reduce((sum, e) => sum + e.amount, 0);
        remainingBudget += Math.max(0, budget - categorySpent);
    });
    
    // Update summary cards
    const totalSpentEl = document.querySelector('.total-spent');
    const avgSpendingEl = document.querySelector('.average-spending');
    const remainingBudgetEl = document.querySelector('.remaining-budget');
    
    if (totalSpentEl) totalSpentEl.textContent = `${totalSpent.toFixed(2)}`;
    if (avgSpendingEl) avgSpendingEl.textContent = `${avgSpending.toFixed(2)}`;
    if (remainingBudgetEl) remainingBudgetEl.textContent = `${remainingBudget.toFixed(2)}`;
    
    // Update alerts
    const alertsContainer = document.getElementById('alerts-container');
    if (alertsContainer) {
        alertsContainer.innerHTML = '<h4>Alerts</h4>';
        
        // Only show alerts for current month
        if (monthNavigator.isCurrentMonth()) {
            let hasAlerts = false;
            
            Object.entries(budgets).forEach(([category, budget]) => {
                if (budget > 0) {
                    const spent = monthlyExpenses
                        .filter(e => e.category.toLowerCase() === category.toLowerCase())
                        .reduce((sum, e) => sum + e.amount, 0);
                    
                    if (spent >= budget) {
                        const alert = document.createElement('div');
                        alert.className = 'alert alert-danger';
                        alert.innerHTML = `🛑 You have exceeded your ${category} budget by ${(spent - budget).toFixed(2)}!`;
                        alertsContainer.appendChild(alert);
                        hasAlerts = true;
                    } else if (spent >= budget * 0.9) {
                        const alert = document.createElement('div');
                        alert.className = 'alert alert-warning';
                        alert.innerHTML = `⚠️ You're approaching your ${category} budget (${Math.round((spent/budget) * 100)}% used)`;
                        alertsContainer.appendChild(alert);
                        hasAlerts = true;
                    }
                }
            });
            
            if (!hasAlerts) {
                const noAlerts = document.createElement('div');
                noAlerts.className = 'alert alert-success';
                noAlerts.innerHTML = `✅ All spending is within budget limits!`;
                alertsContainer.appendChild(noAlerts);
            }
        } else {
            // Show informational message for past months
            const info = document.createElement('div');
            info.className = 'alert alert-info';
            info.innerHTML = `📊 Viewing historical data for ${monthNavigator.monthDisplay.textContent}`;
            alertsContainer.appendChild(info);
        }
    }
}

// Export the expense list for other modules to use
export { expenseList };