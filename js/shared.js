// shared.js - Common functionality across all pages (Simplified)
import { ExpenseList } from "./models/ExpenseList.js";
import { BudgetManager } from "./models/BudgetManager.js";
import { MonthNavigator } from "./models/MonthNavigator.js";

// Global instances - shared across pages
export const expenseList = new ExpenseList();


// Factory functions for managers (only create when needed)
export function initializeBudgetManager() {
    const budgetContainer = document.querySelector('#budget-list') || document.querySelector('#budget-grid');
    if (budgetContainer) {
        return new BudgetManager(budgetContainer);
    }
    return null;
}

export function initializeMonthNavigator(updateCallback = null) {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const display = document.getElementById('current-month-display');
    
    if (prevBtn && nextBtn && display) {
        return new MonthNavigator(expenseList, updateCallback);
    }
    return null;
}

// Utility functions
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

export function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date));
}

export function showNotification(message, type = 'info', duration = 3000) {
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

// Calculate spending statistics
export function calculateSpendingStats(expenses, budgets = {}) {
    // If expenses are already filtered, use them directly
    const filteredExpenses = expenses || [];
    
    // Calculate totals
    const totalSpent = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalBudget = Object.values(budgets).reduce((sum, budget) => sum + budget, 0);
    const remainingBudget = Math.max(0, totalBudget - totalSpent);
    
    // Calculate daily average based on current date
    const now = new Date();
    const currentDay = now.getDate();
    const avgDaily = currentDay > 0 ? totalSpent / currentDay : 0;
    
    // Get category breakdown
    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
        const category = expense.category.toLowerCase();
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    return {
        totalSpent,
        totalBudget,
        remainingBudget,
        avgDaily,
        monthlyExpenses: filteredExpenses,
        categoryTotals,
        transactionCount: filteredExpenses.length
    };
}

// Generate budget alerts
export function generateBudgetAlerts(expenses, budgets) {
    const alerts = [];
    
    // Calculate category totals from the provided expenses
    const categoryTotals = {};
    expenses.forEach(expense => {
        const category = expense.category.toLowerCase();
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    Object.entries(budgets).forEach(([category, budget]) => {
        if (budget > 0) {
            const spent = categoryTotals[category.toLowerCase()] || 0;
            const percentage = (spent / budget) * 100;
            
            if (spent >= budget) {
                alerts.push({
                    type: 'danger',
                    icon: '🛑',
                    message: `You've exceeded your ${category} budget by ${formatCurrency(spent - budget)}!`,
                    category
                });
            } else if (percentage >= 90) {
                alerts.push({
                    type: 'warning',
                    icon: '⚠️',
                    message: `You're approaching your ${category} budget (${Math.round(percentage)}% used)`,
                    category
                });
            } else if (percentage >= 75) {
                alerts.push({
                    type: 'info',
                    icon: 'ℹ️',
                    message: `${category} budget is ${Math.round(percentage)}% used`,
                    category
                });
            }
        }
    });
    
    return alerts;
}

// Export data functionality
export function exportToCSV(data, filename) {
    const headers = ['Date', 'Category', 'Amount', 'Description'];
    const csvContent = [
        headers.join(','),
        ...data.map(expense => [
            expense.date.toISOString().split('T')[0],
            expense.category,
            expense.amount,
            `"${expense.description.replace(/"/g, '""')}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Debounce function for search
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Chart color palette
export const CHART_COLORS = {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0891b2',
    categories: [
        '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ]
};

// Navigation helper
export function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Initialize common functionality
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavItem();
    
    // Initialize date inputs with current date
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const today = new Date().toISOString().split('T')[0];
    dateInputs.forEach(input => {
        if (!input.value && input.id === 'date') {
            input.value = today;
        }
    });
});