import { ExpenseList } from "./models/ExpenseList.js";
import { populateCategoryDropdown } from "./utils/categories.js";
import { renderTable } from "./ui/table.js";
import { applyFilters, clearFilters, handleFormSubmit, deleteExpense, modifyExpense } from './utils/eventListeners.js'
import { MonthNavigator } from "./models/MonthNavigator.js";
import { BudgetManager } from "./models/BudgetManager.js";

// Global variables
const expenseList = new ExpenseList();
export let editingId = null; // Export so eventListeners can access it
let monthlyChart = null;
let categoryChart = null;
let budgets = {};
let monthNavigator = new MonthNavigator(expenseList, updateAll);

// Export functions that eventListeners needs to call
export function setEditingId(id) {
    editingId = id;
}

export function getEditingId() {
    return editingId;
}

export function updateAll() {
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

// Grab the HTML category dropdown elements
const newEntryCategoriesDropdown = document.querySelector("#categories");
const tableFilterCategoriesDropdown = document.querySelector("#filter-category");

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Creating an instance of the budget manager
    const budgetContainer = document.querySelector('#budget-list')
    new BudgetManager(budgetContainer) // instantiate the budget manager class

    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    // Populate the dropdowns
    [newEntryCategoriesDropdown, tableFilterCategoriesDropdown].forEach( dropdownElem => populateCategoryDropdown(dropdownElem))
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial render
    updateAll();
});

// Remove the duplicate editExpense and deleteExpense functions from here
// They will be handled in eventListeners.js

function setupEventListeners() {
    // Form submission
    document.querySelector('#new-entry-form').addEventListener('submit', e => handleFormSubmit(e, expenseList, updateAll));

    // Filters
    document.querySelector('#apply-filters').addEventListener('click', e => applyFilters(expenseList, monthNavigator))
    document.querySelector('#clear-filters').addEventListener('click', e => clearFilters(expenseList))
}

function updateSummaryAndAlerts() {
    const month = monthNavigator.getCurrentMonth();
    const year = monthNavigator.getCurrentYear();
    
    // Get expenses for selected month
    const monthlyExpenses = expenseList.getMonthlyExpenses(month, year);
    
    // Calculate totals
    const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const days = new Set(monthlyExpenses.map(exp => exp.date.toISOString().split('T')[0]));
    const avgSpending = days.size > 0 ? totalSpent / days.size : 0;
    
    // Calculate remaining budget
    let totalBudget = 0;
    let remainingBudget = 0;
    Object.entries(budgets).forEach(([category, budget]) => {
        totalBudget += budget;
        const categorySpent = monthlyExpenses
            .filter(e => e.category === category)
            .reduce((sum, e) => sum + e.amount, 0);
        remainingBudget += Math.max(0, budget - categorySpent);
    });
    
    // Update summary cards
    document.querySelector('.total-spent').textContent = `${totalSpent.toFixed(2)}`;
    document.querySelector('.average-spending').textContent = `${avgSpending.toFixed(2)}`;
    document.querySelector('.remaining-budget').textContent = `${remainingBudget.toFixed(2)}`;
    
    // Update alerts
    const alertsContainer = document.getElementById('alerts-container');
    alertsContainer.innerHTML = '';
    
    // Only show alerts for current month
    if (monthNavigator.isCurrentMonth()) {
        Object.entries(budgets).forEach(([category, budget]) => {
            if (budget > 0) {
                const spent = monthlyExpenses
                    .filter(e => e.category === category)
                    .reduce((sum, e) => sum + e.amount, 0);
                
                if (spent >= budget) {
                    const alert = document.createElement('div');
                    alert.className = 'alert alert-danger';
                    alert.innerHTML = `🛑 You have exceeded your ${category} budget by ${(spent - budget).toFixed(2)}!`;
                    alertsContainer.appendChild(alert);
                } else if (spent >= budget * 0.9) {
                    const alert = document.createElement('div');
                    alert.className = 'alert alert-warning';
                    alert.innerHTML = `⚠️ You're approaching your ${category} budget (${Math.round((spent/budget) * 100)}% used)`;
                    alertsContainer.appendChild(alert);
                }
            }
        });
    } else {
        // Show informational message for past months
        const info = document.createElement('div');
        info.className = 'alert alert-info';
        info.style.backgroundColor = '#dbeafe';
        info.style.borderLeftColor = '#2563eb';
        info.style.color = '#1e40af';
        info.innerHTML = `📊 Viewing historical data for ${monthNavigator.monthDisplay.textContent}`;
        alertsContainer.appendChild(info);
    }
}