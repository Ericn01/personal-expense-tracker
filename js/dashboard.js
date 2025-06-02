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
} from './shared.js';

// Global variables
let budgetManager = null;
let monthNavigator = null;
let spendingChart = null;
let categoryChart = null;
let weeklyChart = null;

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
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        showFallbackContent();
    }
});

async function initializeDashboard() {
    // Initialize managers with error handling
    budgetManager = initializeBudgetManager();
    monthNavigator = initializeMonthNavigator(updateDashboard);
    
    // Wait for DOM to be fully ready
    await new Promise(resolve => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            resolve();
        }
    });
    
    // Initialize charts with delay to ensure containers exist
    setTimeout(() => {
        initializeCharts();
    }, 500);
}

function updateDashboard() {
    try {
        // Get current data
        const budgets = budgetManager ? budgetManager.getAllBudgets() : {};
        const stats = calculateSpendingStats(expenseList.expenses, budgets);
        
        // Update dashboard data
        dashboardData = {
            expenses: expenseList.expenses,
            budgets: budgets,
            stats: stats,
            currentMonth: monthNavigator ? monthNavigator.getCurrentMonth() : new Date().getMonth(),
            currentYear: monthNavigator ? monthNavigator.getCurrentYear() : new Date().getFullYear()
        };
        
        // Update all dashboard sections
        updateOverviewCards(stats);
        updateAlerts(stats, budgets);
        updateRecentActivity();
        updateBudgetSummary(stats, budgets);
        updateCharts(stats);
        
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
    
    // Monthly Goal
    const monthlyGoalEl = document.querySelector('.monthly-goal');
    if (monthlyGoalEl) {
        monthlyGoalEl.textContent = formatCurrency(stats.totalBudget);
    }
    
    // Update trends
    updateTrends(stats);
}

function updateTrends(stats) {
    // Calculate previous month for comparison
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const prevMonthExpenses = expenseList.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= prevMonth && expenseDate <= prevMonthEnd;
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
        const projectedMonthly = stats.avgDaily * 30;
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
    
    const alerts = generateBudgetAlerts(expenseList.expenses, budgets);
    
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
    
    const recentExpenses = expenseList.expenses
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
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
    
    const activeBudgets = Object.entries(budgets).filter(([, budget]) => budget > 0);
    
    if (activeBudgets.length === 0) {
        budgetOverview.innerHTML = `
            <div class="empty-state-small">
                <p>No budgets set yet. <a href="budgets.html">Create your first budget →</a></p>
            </div>
        `;
        return;
    }
    
    activeBudgets.forEach(([category, budget]) => {
        const spent = stats.categoryTotals[category.toLowerCase()] || 0;
        const percentage = Math.min((spent / budget) * 100, 100);
        const remaining = Math.max(budget - spent, 0);
        
        const progressItem = document.createElement('div');
        progressItem.className = 'budget-progress-item';
        progressItem.innerHTML = `
            <div class="progress-header">
                <span class="progress-category">${category}</span>
                <span class="progress-amount">${formatCurrency(spent)} / ${formatCurrency(budget)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${percentage >= 100 ? 'over-budget' : percentage >= 90 ? 'warning' : 'normal'}" 
                     style="width: ${percentage}%"></div>
            </div>
            <div class="progress-footer">
                <span class="progress-percentage">${percentage.toFixed(0)}% used</span>
                <span class="progress-remaining">${formatCurrency(remaining)} remaining</span>
            </div>
        `;
        budgetOverview.appendChild(progressItem);
    });
}

function initializeCharts() {
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded. Charts will not be available.');
        showChartPlaceholders();
        return;
    }
    
    // Initialize charts with proper error handling
    try {
        initializeSpendingTrendChart();
        initializeCategoryChart();
        initializeWeeklyChart();
    } catch (error) {
        console.error('Error initializing charts:', error);
        showChartPlaceholders();
    }
}

function initializeSpendingTrendChart() {
    const spendingCtx = document.getElementById('spendingTrendChart');
    if (!spendingCtx) {
        console.warn('Spending trend chart canvas not found');
        return;
    }
    
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
            maintainAspectRatio: false,
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
    if (!categoryCtx) {
        console.warn('Category chart canvas not found');
        return;
    }
    
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
            maintainAspectRatio: false,
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
    if (!weeklyCtx) {
        console.warn('Weekly chart canvas not found');
        return;
    }
    
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
            maintainAspectRatio: false,
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
    if (typeof Chart === 'undefined') return;
    
    try {
        updateSpendingTrendChart();
        updateCategoryChart(stats);
        updateWeeklyChart();
    } catch (error) {
        console.error('Error updating charts:', error);
    }
}

function updateSpendingTrendChart() {
    if (!spendingChart) return;
    
    // Get last 6 months of data
    const monthlyData = [];
    const labels = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.getMonth();
        const year = date.getFullYear();
        
        const monthExpenses = expenseList.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
        });
        
        const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        monthlyData.push(total);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    }
    
    spendingChart.data.labels = labels;
    spendingChart.data.datasets[0].data = monthlyData;
    spendingChart.update('none'); // Use 'none' for better performance
}

function updateCategoryChart(stats) {
    if (!categoryChart) return;
    
    const categories = Object.entries(stats.categoryTotals)
        .filter(([, amount]) => amount > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Limit to top 5 categories for better readability
    
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
    
    // Calculate average spending by day of week
    const weeklyTotals = new Array(7).fill(0);
    const weeklyCounts = new Array(7).fill(0);
    
    expenseList.expenses.forEach(expense => {
        const dayOfWeek = new Date(expense.date).getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
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

function setupPeriodicUpdates() {
    // Update dashboard every 30 seconds
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            updateDashboard();
        }
    }, 30 * 1000);
    
    // Update on window focus (in case data changed in another tab)
    window.addEventListener('focus', updateDashboard);
    
    // Update on resize to redraw charts
    window.addEventListener('resize', () => {
        setTimeout(() => {
            if (spendingChart) spendingChart.resize();
            if (categoryChart) categoryChart.resize();
            if (weeklyChart) weeklyChart.resize();
        }, 300);
    });
}

// Export functionality
window.exportData = function() {
    import('./shared.js').then(({ exportToCSV }) => {
        exportToCSV(expenseList.expenses, 'financial-data.csv');
    });
};

window.showSettings = function() {
    alert('Settings panel coming soon!');
};

// Enhanced CSS for dashboard improvements
const dashboardStyles = `
.activity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid var(--border-color);
    transition: background-color 0.2s;
}

.activity-item:hover {
    background-color: var(--background);
    margin: 0 -1rem;
    padding: 1rem;
    border-radius: 6px;
}

.activity-item:last-child {
    border-bottom: none;
}

.activity-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
}

.activity-description {
    color: var(--text-primary);
    font-weight: 500;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.activity-details {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
}

.activity-amount {
    font-weight: 600;
    color: var(--text-primary);
}

.activity-date {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.budget-progress-item {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--background);
    border-radius: 8px;
    transition: transform 0.2s;
}

.budget-progress-item:hover {
    transform: translateY(-1px);
}

.progress-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.progress-category {
    font-weight: 600;
    color: var(--text-primary);
    text-transform: capitalize;
}

.progress-amount {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-weight: 500;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background-color: var(--border-color);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.75rem;
}

.progress-fill {
    height: 100%;
    transition: width 0.3s ease;
}

.progress-fill.normal {
    background-color: var(--success-color);
}

.progress-fill.warning {
    background-color: var(--warning-color);
}

.progress-fill.over-budget {
    background-color: var(--danger-color);
}

.progress-footer {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.empty-state-small {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
}

.empty-state-small a {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
}

.empty-state-small a:hover {
    text-decoration: underline;
}

.alert-icon {
    margin-right: 0.75rem;
    font-size: 1.1rem;
}

.trend.negative {
    color: var(--danger-color);
}

.trend.warning {
    color: var(--warning-color);
}

.chart-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: var(--text-secondary);
    background: var(--background);
    border-radius: 8px;
}

.placeholder-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
}

.chart-placeholder p {
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.chart-placeholder small {
    opacity: 0.7;
}

.dashboard-error {
    text-align: center;
    padding: 4rem 2rem;
}

.dashboard-error h2 {
    margin-bottom: 1rem;
    color: var(--text-primary);
}

.dashboard-error p {
    margin-bottom: 2rem;
    color: var(--text-secondary);
}

.error-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.error-actions .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    cursor: pointer;
    border: none;
}

.btn-primary {
    background-color: var(--primary-color);
    color: white;
}

.btn-secondary {
    background-color: var(--border-color);
    color: var(--text-primary);
}

@media (max-width: 768px) {
    .activity-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
    
    .activity-details {
        align-items: flex-start;
        flex-direction: row;
        justify-content: space-between;
        width: 100%;
    }
    
    .progress-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}
`;

// Inject the enhanced styles
const styleElement = document.createElement('style');
styleElement.textContent = dashboardStyles;
document.head.appendChild(styleElement);