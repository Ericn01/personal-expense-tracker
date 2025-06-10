// dashboard.js - Main dashboard functionality (Fixed and Improved)
import { 
    expenseList, 
    initializeBudgetManager, 
    initializeMonthNavigator,
    calculateSpendingStats,
    generateBudgetAlerts,
    formatCurrency,
    formatDate,
    CHART_COLORS
} from './utils/shared.js';

import { handleExpenseImport } from './utils/importer.js';

// Global variables
let budgetManager = null;
let monthNavigator = null;
let spendingChart = null;
let categoryChart = null;
let weeklyChart = null;
let chartsInitialized = false;
let additionalChartsInitialized = false;

// Dashboard state
let dashboardData = {
    expenses: [],
    budgets: {},
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeDashboard();
        updateDashboard();
        setupPeriodicUpdates();
        initializeChartToggle();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showFallbackContent();
    }
});

// In dashboard.js
async function initializeDashboard() {
    budgetManager = initializeBudgetManager();
    monthNavigator = initializeMonthNavigator(updateDashboard);
    
    // Wait for Chart.js before initializing charts
    if (typeof Chart !== 'undefined') {
        requestAnimationFrame(() => {
            initializeCharts();
        });
    } else {
        await waitForChartJS();
        initializeCharts();
    }
}

async function waitForChartJS() {
    return new Promise((resolve) => {
        const checkChart = () => {
            if (typeof Chart !== 'undefined') {
                resolve();
            } else {
                setTimeout(checkChart, 100);
            }
        };
        checkChart();
    });
}

function updateDashboard() {
    try {
        // Get current month/year from navigator
        const currentMonth = monthNavigator ? monthNavigator.getCurrentMonth() : new Date().getMonth();
        const currentYear = monthNavigator ? monthNavigator.getCurrentYear() : new Date().getFullYear();
        
        // Filter expenses for current month
        const monthlyExpenses = expenseList.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                expenseDate.getFullYear() === currentYear;
        });
        
        // Get budgets for current month
        const budgets = budgetManager ? budgetManager.getBudgetsForMonth(currentMonth, currentYear) : {};
        
        // Ensure budget manager is set to current month
        if (budgetManager) {
            budgetManager.setCurrentMonth(currentMonth, currentYear);
        }
        
        // Calculate stats with monthly expenses
        const stats = calculateSpendingStats(monthlyExpenses, budgets);
        
        // Update dashboard data
        dashboardData = {
            expenses: monthlyExpenses,
            budgets: budgets,
            stats: stats,
            currentMonth: currentMonth,
            currentYear: currentYear
        };
        
        // Update all dashboard sections
        updateOverviewCards(stats);
        updateAlerts(stats, budgets);
        updateRecentActivity();
        updateBudgetSummary(stats, budgets);
        
        // Update charts if initialized
        if (chartsInitialized) {
            updateCharts(stats);
        }
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

function updateOverviewCards(stats) {
    // Total Spent
    const totalSpentEl = document.querySelector('.total-spent');
    if (totalSpentEl) {
        totalSpentEl.textContent = formatCurrency(stats.totalSpent);
    }
    
    // Remaining Budget
    const remainingBudgetEl = document.querySelector('.remaining-budget');
    if (remainingBudgetEl) {
        remainingBudgetEl.textContent = formatCurrency(stats.remainingBudget);
    }
    
    // Average Daily Spending
    const avgSpendingEl = document.querySelector('.average-spending');
    if (avgSpendingEl) {
        avgSpendingEl.textContent = formatCurrency(stats.avgDaily);
    }
    
    // Monthly Goal (Total Budget)
    const monthlyGoalEl = document.querySelector('.monthly-goal');
    if (monthlyGoalEl) {
        monthlyGoalEl.textContent = formatCurrency(stats.totalBudget);
    }
    
    // Update trends
    updateTrends(stats);
}

function updateTrends(stats) {
    const { currentMonth, currentYear } = dashboardData;
    
    // Calculate previous month data
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear--;
    }
    
    const prevMonthExpenses = expenseList.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === prevMonth && expenseDate.getFullYear() === prevYear;
    });
    
    const prevMonthTotal = prevMonthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const change = prevMonthTotal > 0 ? ((stats.totalSpent - prevMonthTotal) / prevMonthTotal) * 100 : 0;
    
    // Update spending trend
    const spendingTrendEl = document.getElementById('spending-trend');
    if (spendingTrendEl) {
        const arrow = change > 0 ? '↗️' : change < 0 ? '↘️' : '➡️';
        const sign = change > 0 ? '+' : '';
        spendingTrendEl.textContent = `${arrow} ${sign}${change.toFixed(1)}% from last month`;
        spendingTrendEl.className = `trend ${change > 0 ? 'negative' : 'positive'}`;
    }
    
    // Update budget trend
    const budgetTrendEl = document.getElementById('budget-trend');
    if (budgetTrendEl) {
        const percentage = stats.totalBudget > 0 ? (stats.remainingBudget / stats.totalBudget) * 100 : 0;
        budgetTrendEl.textContent = `🎯 ${percentage.toFixed(0)}% remaining`;
        budgetTrendEl.className = `trend ${percentage > 50 ? 'positive' : percentage > 25 ? 'warning' : 'negative'}`;
    }
    
    // Update daily trend
    const dailyTrendEl = document.getElementById('daily-trend');
    if (dailyTrendEl) {
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const projectedMonthly = stats.avgDaily * daysInMonth;
        const icon = projectedMonthly <= stats.totalBudget ? '😊' : '⚠️';
        dailyTrendEl.textContent = `${icon} ${formatCurrency(projectedMonthly)}/month projected`;
    }
    
    // Update goal progress
    const goalProgressEl = document.getElementById('goal-progress');
    if (goalProgressEl) {
        if (stats.totalBudget > 0) {
            const percentage = (stats.totalSpent / stats.totalBudget) * 100;
            if (percentage <= 75) {
                goalProgressEl.textContent = '🚀 On track';
                goalProgressEl.className = 'trend positive';
            } else if (percentage <= 90) {
                goalProgressEl.textContent = '⚠️ Watch spending';
                goalProgressEl.className = 'trend warning';
            } else {
                goalProgressEl.textContent = '🛑 Over budget';
                goalProgressEl.className = 'trend negative';
            }
        } else {
            goalProgressEl.textContent = '🎯 Set budget first';
            goalProgressEl.className = 'trend';
        }
    }
}

function updateAlerts(stats, budgets) {
    const alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) return;
    
    alertsContainer.innerHTML = '';
    
    const alerts = generateBudgetAlerts(dashboardData.expenses, budgets);
    
    if (alerts.length === 0) {
        const noAlerts = document.createElement('div');
        noAlerts.className = 'alert alert-success';
        noAlerts.innerHTML = `
            <span class="alert-icon">✅</span>
            <span>All spending is within budget limits! Keep up the great work.</span>
        `;
        alertsContainer.appendChild(noAlerts);
    } else {
        alerts.forEach(alert => {
            const alertEl = document.createElement('div');
            alertEl.className = `alert alert-${alert.type}`;
            alertEl.innerHTML = `
                <span class="alert-icon">${alert.icon}</span>
                <span>${alert.message}</span>
            `;
            alertsContainer.appendChild(alertEl);
        });
    }
    
    // Add spending insights
    addSpendingInsights(stats, alertsContainer);
}

function addSpendingInsights(stats, container) {
    const insights = [];
    
    // Generate smart insights
    if (stats.transactionCount > 0) {
        const avgTransaction = stats.totalSpent / stats.transactionCount;
        if (avgTransaction > 100) {
            insights.push({
                type: 'info',
                icon: '💡',
                message: `Your average transaction is ${formatCurrency(avgTransaction)}. Consider splitting larger purchases.`
            });
        }
        
        // Find top category
        const topCategory = Object.entries(stats.categoryTotals)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (topCategory) {
            const [category, amount] = topCategory;
            const percentage = (amount / stats.totalSpent) * 100;
            if (percentage > 40) {
                insights.push({
                    type: 'info',
                    icon: '📊',
                    message: `${category} represents ${percentage.toFixed(0)}% of your spending this month.`
                });
            }
        }
    }
    
    // Add insights to container
    insights.forEach(insight => {
        const insightEl = document.createElement('div');
        insightEl.className = `alert alert-${insight.type}`;
        insightEl.innerHTML = `
            <span class="alert-icon">${insight.icon}</span>
            <span>${insight.message}</span>
        `;
        container.appendChild(insightEl);
    });
}

function updateRecentActivity() {
    const recentContainer = document.getElementById('recent-expenses');
    if (!recentContainer) return;
    
    // Get all expenses sorted by date, not just monthly
    const recentExpenses = expenseList.expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3); // Retrieve the last three expenses
    
    recentContainer.innerHTML = '';
    
    if (recentExpenses.length === 0) {
        recentContainer.innerHTML = `
            <div class="empty-state-small">
                <p>No recent expenses. <a href="expenses.html">Add your first expense →</a></p>
            </div>
        `;
        return;
    }
    
    recentExpenses.forEach(expense => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <div class="activity-info">
                <span class="category-badge category-${expense.category.toLowerCase()}">${expense.category}</span>
                <span class="activity-description">${expense.description}</span>
            </div>
            <div class="activity-details">
                <span class="activity-amount">${formatCurrency(expense.amount)}</span>
                <span class="activity-date">${formatDate(expense.date)}</span>
            </div>
        `;
        recentContainer.appendChild(item);
    });
}

function updateBudgetSummary(stats, budgets) {
    const budgetOverview = document.getElementById('budget-overview');
    if (!budgetOverview) return;
    
    budgetOverview.innerHTML = '';
    
    const activeBudgets = Object.entries(budgets)
    .filter(([, budget]) => budget > 0)
    .map(([category, budget]) => {
        const spent = stats.categoryTotals[category.toLowerCase()] || 0;
        const percentage = Math.round((spent / budget) * 100, 2);
        return {category, budget, spent, percentage}
    });
    
    if (activeBudgets.length === 0) {
        budgetOverview.innerHTML = `
            <div class="empty-state-small">
                <p>No budgets set for this month. <a href="budgets.html">Create your budget →</a></p>
            </div>
        `;
        return;
    }

    // Sort by percentage used (highest first) and take top 3
    const topBudgets = activeBudgets
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 4);
    
    // Render top 3 budget progress items
    topBudgets.forEach(({ category, budget, spent, percentage }) => {
        const remaining = Math.max(budget - spent, 0);
        const overBudget = (budget - spent) < 0;
        const progressItem = document.createElement('div');
        progressItem.className = 'budget-progress-item';
        progressItem.innerHTML = `
            <div class="progress-header">
                <span class="progress-category">${category}</span>
                <span class="progress-amount">${formatCurrency(spent)} / ${formatCurrency(budget)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'good'}"
                    style="width: ${Math.min(percentage, 100)}%">
                </div>
            </div>
            <div class="progress-footer">
                <span class="progress-percentage ${percentage > 100 ? "font-bold" : ""}"> ${percentage}% used</span>
                <span class="progress-remaining">${overBudget ? `<strong class="text-danger"> 🛑 ${formatCurrency(Math.abs(budget - spent))} over budget </strong>` : `${formatCurrency(remaining)} remaining`} </span>
            </div>
        `;
        budgetOverview.appendChild(progressItem);
    });
}

function initializeCharts() {
    // Check if Chart.js is available and canvases exist
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded. Charts will not be available.');
        showChartPlaceholders();
        return;
    }
    
    const spendingCanvas = document.getElementById('spendingTrendChart');
    
    if (!spendingCanvas) {
        console.warn('Primary chart canvas not found in DOM');
        return;
    }
    
    // Initialize only the primary chart initially
    try {
        initializeSpendingTrendChart();
        chartsInitialized = true;
        
        // Update primary chart with current data
        const stats = calculateSpendingStats(dashboardData.expenses, dashboardData.budgets);
        updateSpendingTrendChart();
        
    } catch (error) {
        console.error('Error initializing primary chart:', error);
        showChartPlaceholders();
    }
}


function initializeSpendingTrendChart() {
    const spendingCtx = document.getElementById('spendingTrendChart');
    if (!spendingCtx) return;
    
    if (spendingChart) {
        spendingChart.destroy();
    }
    
    spendingChart = new Chart(spendingCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Spending',
                data: [],
                borderColor: CHART_COLORS.primary,
                backgroundColor: CHART_COLORS.primary + '20',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: CHART_COLORS.primary,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    callbacks: {
                        label: function(context) {
                            return `Spending: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function initializeCategoryChart() {
    const categoryCtx = document.getElementById('categoryChart');
    if (!categoryCtx) return;
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    categoryChart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: CHART_COLORS.categories,
                borderWidth: 3,
                borderColor: '#ffffff',
                hoverBorderWidth: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initializeWeeklyChart() {
    const weeklyCtx = document.getElementById('weeklyChart');
    if (!weeklyCtx) return;
    
    if (weeklyChart) {
        weeklyChart.destroy();
    }
    
    weeklyChart = new Chart(weeklyCtx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Daily Average',
                data: [],
                backgroundColor: CHART_COLORS.secondary,
                borderRadius: 4,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { 
                    display: false 
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    callbacks: {
                        label: function(context) {
                            return `Average: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function updateCharts(stats) {
    if (!chartsInitialized || typeof Chart === 'undefined') return;
    
    try {
        // Always update the primary chart
        updateSpendingTrendChart();
        
        // Only update additional charts if they're initialized and visible
        if (additionalChartsInitialized) {
            const additionalCharts = document.getElementById('additionalCharts');
            const isExpanded = additionalCharts && additionalCharts.classList.contains('expanded');
            
            if (isExpanded) {
                updateCategoryChart(stats);
                updateWeeklyChart();
            }
        }
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function updateSpendingTrendChart() {
    if (!spendingChart) return;
    
    // Get last 4 months of data
    const monthlyData = [];
    const labels = [];
    const { currentMonth, currentYear } = dashboardData;
    
    for (let i = 3; i >= 0; i--) {
        let month = currentMonth - i;
        let year = currentYear;
        
        if (month < 0) {
            month += 12;
            year--;
        }
        
        const monthExpenses = expenseList.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
        });
        
        const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        monthlyData.push(total);
        
        const date = new Date(year, month);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    }
    
    spendingChart.data.labels = labels;
    spendingChart.data.datasets[0].data = monthlyData;
    spendingChart.update('none');
}

function updateCategoryChart(stats) {
    if (!categoryChart) return;
    
    const categories = Object.entries(stats.categoryTotals)
        .filter(([, amount]) => amount > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
    
    if (categories.length === 0) {
        categoryChart.data.labels = ['No data'];
        categoryChart.data.datasets[0].data = [1];
        categoryChart.data.datasets[0].backgroundColor = ['#e5e7eb'];
    } else {
        categoryChart.data.labels = categories.map(([category]) => category);
        categoryChart.data.datasets[0].data = categories.map(([, amount]) => amount);
        categoryChart.data.datasets[0].backgroundColor = CHART_COLORS.categories.slice(0, categories.length);
    }
    
    categoryChart.update('none');
}

function updateWeeklyChart() {
    if (!weeklyChart) return;
    
    // Calculate average spending by day of week for current month
    const weeklyTotals = new Array(7).fill(0);
    const weeklyCounts = new Array(7).fill(0);
    
    dashboardData.expenses.forEach(expense => {
        const dayOfWeek = new Date(expense.date).getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weeklyTotals[adjustedDay] += expense.amount;
        weeklyCounts[adjustedDay]++;
    });
    
    const weeklyAverages = weeklyTotals.map((total, i) => 
        weeklyCounts[i] > 0 ? total / weeklyCounts[i] : 0
    );
    
    weeklyChart.data.datasets[0].data = weeklyAverages;
    weeklyChart.update('none');
}

function showChartPlaceholders() {
    const chartContainers = ['spendingTrendChart', 'categoryChart', 'weeklyChart'];
    
    chartContainers.forEach(chartId => {
        const container = document.getElementById(chartId);
        if (container) {
            const parent = container.parentElement;
            parent.innerHTML = `
                <div class="chart-placeholder">
                    <div class="placeholder-icon">📊</div>
                    <p>Chart unavailable</p>
                    <small>Chart.js library not loaded</small>
                </div>
            `;
        }
    });
}

function showFallbackContent() {
    const mainContent = document.querySelector('.dashboard-main');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="dashboard-error">
                <h2>⚠️ Dashboard Temporarily Unavailable</h2>
                <p>We're having trouble loading the dashboard. Please try refreshing the page.</p>
                <div class="error-actions">
                    <button onclick="window.location.reload()" class="btn btn-primary">Refresh Page</button>
                    <a href="expenses.html" class="btn btn-secondary">Go to Expenses</a>
                </div>
            </div>
        `;
    }
}

// Add resize function for chart responsiveness
window.resizeCharts = function() {
    setTimeout(() => {
        if (spendingChart) spendingChart.resize();
        if (additionalChartsInitialized) {
            if (categoryChart) categoryChart.resize();
            if (weeklyChart) weeklyChart.resize();
        }
    }, 100);
};


function setupPeriodicUpdates() {
    // Update dashboard every 60 seconds
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            updateDashboard();
        }
    }, 60 * 1000);
    
    // Update on window focus
    window.addEventListener('focus', updateDashboard);
    
    // Update on resize to redraw charts
    window.addEventListener('resize', () => {
        if (typeof resizeCharts === 'function') {
            resizeCharts();
        }
    });
}

// Export functionality
window.exportData = function() {
    import('./utils/shared.js').then(({ exportToCSV }) => {
        exportToCSV(expenseList.expenses, 'financial-data.csv');
    });
};

window.showSettings = function() {
    alert('Settings panel coming soon!');
};

window.initializeAdditionalCharts = function() {
    if (additionalChartsInitialized) return;
    
    const categoryCanvas = document.getElementById('categoryChart');
    const weeklyCanvas = document.getElementById('weeklyChart');
    
    if (!categoryCanvas || !weeklyCanvas) {
        console.warn('Additional chart canvases not found in DOM');
        return;
    }
    
    try {
        initializeCategoryChart();
        initializeWeeklyChart();
        additionalChartsInitialized = true;
        
        // Update additional charts with current data
        const stats = calculateSpendingStats(dashboardData.expenses, dashboardData.budgets);
        updateCategoryChart(stats);
        updateWeeklyChart();
        
    } catch (error) {
        console.error('Error initializing additional charts:', error);
    }
};

// Welcome Modal Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Check if user has any expenses
    const expenses = window.stateManager?.expenseList?.expenses || [];
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    
    // Show welcome modal if no expenses and hasn't been shown before
    if (expenses.length === 0 && !hasSeenWelcome) {
        showWelcomeModal();
    }
});

function showWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) {
        modal.style.display = 'flex';
        
        // Set up event listeners
        setupWelcomeModalListeners();
    }
}

function setupWelcomeModalListeners() {
    // File input handler
    const fileInput = document.getElementById('welcomeFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            handleExpenseImport(event, {
                statusElementId: 'importStatus',  // Note: different ID for welcome modal
                onSuccess: (count) => {
                    // Update dashboard after import
                    if (typeof updateDashboard === 'function') {
                        updateDashboard();
                    }
                    
                    // Close modal after delay
                    setTimeout(() => {
                        closeWelcomeModal();
                    }, 2000);
                }
            });
        });
    }
    
    // Skip button handler
    const skipBtn = document.getElementById('skipWelcome');
    if (skipBtn) {
        skipBtn.addEventListener('click', closeWelcomeModal);
    }
    
    // Close on backdrop click
    const modal = document.getElementById('welcomeModal');
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeWelcomeModal();
        }
    });
}


function closeWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    if (modal) {
        modal.style.display = 'none';
        // Mark as seen
        localStorage.setItem('hasSeenWelcome', 'true');
    }
}

function initializeChartToggle () {
    const toggle = document.getElementById('chartsToggle');
    const additionalCharts = document.getElementById('additionalCharts');
    const expandIcon = toggle.querySelector('.expand-icon');
    const toggleText = toggle.querySelector('span');
    
    let isExpanded = false;

    toggle.addEventListener('click', function() {
        isExpanded = !isExpanded;
        
        if (isExpanded) {
            additionalCharts.classList.remove('collapsed');
            additionalCharts.classList.add('expanded');
            expandIcon.classList.add('rotated');
            toggleText.textContent = 'Show Less Charts';
            
            // Initialize additional charts if they haven't been initialized yet
            // This prevents unnecessary chart rendering when collapsed
            setTimeout(() => {
                if (typeof initializeAdditionalCharts === 'function') {
                    initializeAdditionalCharts();
                }
            }, 300);
        } else {
            additionalCharts.classList.remove('expanded');
            additionalCharts.classList.add('collapsed');
            expandIcon.classList.remove('rotated');
            toggleText.textContent = 'Show More Charts';
        }
    });
}