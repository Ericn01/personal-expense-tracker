// reports.js - Financial reports and analytics functionality
import { 
    expenseList, 
    formatCurrency, 
    showNotification, 
    exportToCSV,
    CHART_COLORS 
} from './shared.js';

let currentReportPeriod="weekly"

function initializeReportsPage() {
    // Set default date inputs
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    
    const startInput = document.getElementById('report-start');
    const endInput = document.getElementById('report-end');
    
    if (startInput) startInput.value = startDate.toISOString().split('T')[0];
    if (endInput) endInput.value = endDate.toISOString().split('T')[0];
}

function setupEventListeners() {
    // Generate report button
    const generateBtn = document.getElementById('generate-report');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateReport);
    }
    
    // Quick period buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', handlePeriodChange);
    });
    
    // Chart controls
    const trendTypeSelect = document.getElementById('trend-type');
    if (trendTypeSelect) {
        trendTypeSelect.addEventListener('change', () => updateMonthlyTrendChart());
    }
    
    const categoryPeriodSelect = document.getElementById('category-period');
    if (categoryPeriodSelect) {
        categoryPeriodSelect.addEventListener('change', () => updateCategoryBreakdownChart());
    }
    
    // Chart toggle buttons
    document.querySelectorAll('.chart-toggle').forEach(btn => {
        btn.addEventListener('click', handleChartToggle);
    });
}

function handleGenerateReport() {
    const startDate = document.getElementById('report-start')?.value;
    const endDate = document.getElementById('report-end')?.value;
    
    if (!startDate || !endDate) {
        showNotification('Please select both start and end dates', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showNotification('Start date must be before end date', 'error');
        return;
    }
    
    currentReportPeriod = {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type: 'custom'
    };
    
    generateReport();
    showNotification('Report generated successfully!', 'success');
}

function handlePeriodChange(e) {
    // Remove active class from all buttons
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    e.target.classList.add('active');
    
    const period = e.target.dataset.period;
    setQuickPeriod(period);
    generateReport();
}

function setQuickPeriod(period) {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
        case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case 'quarter':
            startDate.setMonth(endDate.getMonth() - 3);
            break;
        case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            startDate.setFullYear(endDate.getFullYear() - 1);
    }
    
    currentReportPeriod = {
        startDate,
        endDate,
        type: period
    };
    
    // Update date inputs
    const startInput = document.getElementById('report-start');
    const endInput = document.getElementById('report-end');
    
    if (startInput) startInput.value = startDate.toISOString().split('T')[0];
    if (endInput) endInput.value = endDate.toISOString().split('T')[0];
}

function setDefaultPeriod() {
    // Set default to "This Year"
    setQuickPeriod('year');
    
    // Mark year button as active
    const yearBtn = document.querySelector('.period-btn[data-period="year"]');
    if (yearBtn) {
        yearBtn.classList.add('active');
    }
}

function generateReport() {
    const reportData = getReportData();
    
    updateSummaryStatistics(reportData);
    updateDetailedAnalysis(reportData);
    initializeCharts();
    updateAllCharts(reportData);
    updateReportMetadata();
}

function getReportData() {
    const { startDate, endDate } = currentReportPeriod;
    
    // Filter expenses within date range
    const filteredExpenses = expenseList.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    // Calculate basic statistics
    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const transactionCount = filteredExpenses.length;
    
    // Calculate average monthly
    const monthsDiff = getMonthsDifference(startDate, endDate);
    const avgMonthly = monthsDiff > 0 ? totalExpenses / monthsDiff : totalExpenses;
    
    // Get category breakdown
    const categoryTotals = {};
    filteredExpenses.forEach(expense => {
        const category = expense.category;
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });
    
    // Find highest category
    const highestCategory = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)[0];
    
    // Get previous period data for comparison
    const previousPeriodData = getPreviousPeriodData();
    
    return {
        filteredExpenses,
        totalExpenses,
        transactionCount,
        avgMonthly,
        categoryTotals,
        highestCategory,
        previousPeriodData,
        startDate,
        endDate
    };
}

function getPreviousPeriodData() {
    const { startDate, endDate } = currentReportPeriod;
    const periodLength = endDate - startDate;
    
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate - periodLength);
    
    const prevExpenses = expenseList.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= prevStartDate && expenseDate < prevEndDate;
    });
    
    const prevTotal = prevExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    return {
        totalExpenses: prevTotal,
        transactionCount: prevExpenses.length
    };
}

function getMonthsDifference(startDate, endDate) {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    const dayDiff = endDate.getDate() - startDate.getDate();
    
    let totalMonths = yearDiff * 12 + monthDiff;
    
    // Adjust for partial months
    if (dayDiff > 0) {
        totalMonths += dayDiff / 30; // Approximate
    }
    
    return Math.max(totalMonths, 1); // At least 1 month
}

function updateSummaryStatistics(reportData) {
    const { totalExpenses, avgMonthly, highestCategory, transactionCount, previousPeriodData } = reportData;
    
    // Total expenses
    const totalExpensesEl = document.getElementById('total-expenses');
    if (totalExpensesEl) {
        totalExpensesEl.textContent = formatCurrency(totalExpenses);
    }
    
    // Calculate change from previous period
    const expensesChange = previousPeriodData.totalExpenses > 0 ? 
        ((totalExpenses - previousPeriodData.totalExpenses) / previousPeriodData.totalExpenses) * 100 : 0;
    
    const expensesChangeEl = document.getElementById('expenses-change');
    if (expensesChangeEl) {
        const sign = expensesChange > 0 ? '+' : '';
        expensesChangeEl.textContent = `${sign}${expensesChange.toFixed(1)}% vs previous period`;
        expensesChangeEl.className = `summary-change ${expensesChange > 0 ? 'negative' : 'positive'}`;
    }
    
    // Average monthly
    const avgMonthlyEl = document.getElementById('avg-monthly');
    if (avgMonthlyEl) {
        avgMonthlyEl.textContent = formatCurrency(avgMonthly);
    }
    
    const monthlyChangeEl = document.getElementById('monthly-change');
    if (monthlyChangeEl && previousPeriodData.totalExpenses > 0) {
        const prevAvgMonthly = previousPeriodData.totalExpenses / getMonthsDifference(
            new Date(currentReportPeriod.startDate - (currentReportPeriod.endDate - currentReportPeriod.startDate)),
            currentReportPeriod.startDate
        );
        const monthlyChange = ((avgMonthly - prevAvgMonthly) / prevAvgMonthly) * 100;
        const sign = monthlyChange > 0 ? '+' : '';
        monthlyChangeEl.textContent = `${sign}${monthlyChange.toFixed(1)}% vs last period`;
    }
    
    // Highest category
    const highestCategoryEl = document.getElementById('highest-category');
    const highestAmountEl = document.getElementById('highest-amount');
    
    if (highestCategory && highestCategoryEl && highestAmountEl) {
        highestCategoryEl.textContent = highestCategory[0];
        highestAmountEl.textContent = formatCurrency(highestCategory[1]);
    } else if (highestCategoryEl && highestAmountEl) {
        highestCategoryEl.textContent = 'None';
        highestAmountEl.textContent = '$0.00';
    }
    
    // Transaction count
    const transactionCountEl = document.getElementById('transaction-count');
    if (transactionCountEl) {
        transactionCountEl.textContent = transactionCount.toLocaleString();
    }
    
    const countChangeEl = document.getElementById('count-change');
    if (countChangeEl) {
        countChangeEl.textContent = `transaction${transactionCount !== 1 ? 's' : ''}`;
    }
}

function updateDetailedAnalysis(reportData) {
    updateTopCategoriesTable(reportData);
    updateMonthlyComparison(reportData);
    updateSpendingInsights(reportData);
    updateBudgetPerformance(reportData);
}

function updateTopCategoriesTable(reportData) {
    const tableBody = document.getElementById('top-categories-table');
    if (!tableBody) return;
    
    const { categoryTotals, totalExpenses, filteredExpenses } = reportData;
    
    tableBody.innerHTML = '';
    
    // Sort categories by amount
    const sortedCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5); // Top 5 categories
    
    sortedCategories.forEach(([category, amount]) => {
        const percentage = (amount / totalExpenses) * 100;
        const transactions = filteredExpenses.filter(exp => exp.category === category).length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="category-badge category-${category.toLowerCase()}">${category}</span>
            </td>
            <td><strong>${formatCurrency(amount)}</strong></td>
            <td>${percentage.toFixed(1)}%</td>
            <td>${transactions}</td>
        `;
        tableBody.appendChild(row);
    });
    
    if (sortedCategories.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center; color: var(--text-secondary);">No data available</td>';
        tableBody.appendChild(row);
    }
}

function updateMonthlyComparison(reportData) {
    const container = document.getElementById('monthly-comparison');
    if (!container) return;
    
    const { filteredExpenses } = reportData;
    
    // Group expenses by month
    const monthlyData = {};
    filteredExpenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { name: monthName, amount: 0, count: 0 };
        }
        monthlyData[monthKey].amount += expense.amount;
        monthlyData[monthKey].count++;
    });
    
    // Sort by date
    const sortedMonths = Object.values(monthlyData)
        .sort((a, b) => a.name.localeCompare(b.name));
    
    container.innerHTML = '';
    
    if (sortedMonths.length === 0) {
        container.innerHTML = '<p>No monthly data available for the selected period.</p>';
        return;
    }
    
    sortedMonths.forEach(month => {
        const monthItem = document.createElement('div');
        monthItem.className = 'comparison-item';
        monthItem.innerHTML = `
            <div class="comparison-month">${month.name}</div>
            <div class="comparison-amount">${formatCurrency(month.amount)}</div>
            <div class="comparison-count">${month.count} transactions</div>
        `;
        container.appendChild(monthItem);
    });
}

function updateSpendingInsights(reportData) {
    const container = document.getElementById('spending-insights');
    if (!container) return;
    
    const { filteredExpenses, totalExpenses, transactionCount, avgMonthly } = reportData;
    const insights = [];
    
    if (transactionCount > 0) {
        const avgTransaction = totalExpenses / transactionCount;
        insights.push(`💰 Average transaction amount: ${formatCurrency(avgTransaction)}`);
        
        // Find spending patterns
        const dayOfWeekSpending = {};
        const timeOfDaySpending = { morning: 0, afternoon: 0, evening: 0, night: 0 };
        
        filteredExpenses.forEach(expense => {
            const date = new Date(expense.date);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
            dayOfWeekSpending[dayName] = (dayOfWeekSpending[dayName] || 0) + expense.amount;
            
            const hour = date.getHours();
            if (hour >= 6 && hour < 12) timeOfDaySpending.morning += expense.amount;
            else if (hour >= 12 && hour < 18) timeOfDaySpending.afternoon += expense.amount;
            else if (hour >= 18 && hour < 22) timeOfDaySpending.evening += expense.amount;
            else timeOfDaySpending.night += expense.amount;
        });
        
        // Find highest spending day
        const highestDay = Object.entries(dayOfWeekSpending)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (highestDay) {
            insights.push(`📅 Highest spending day: ${highestDay[0]} (${formatCurrency(highestDay[1])})`);
        }
        
        // Monthly projection
        const daysInPeriod = (currentReportPeriod.endDate - currentReportPeriod.startDate) / (1000 * 60 * 60 * 24);
        const dailyAvg = totalExpenses / daysInPeriod;
        insights.push(`📈 Daily average: ${formatCurrency(dailyAvg)}`);
        
        // Large transaction analysis
        const largeTransactions = filteredExpenses.filter(exp => exp.amount > avgTransaction * 2);
        if (largeTransactions.length > 0) {
            insights.push(`🔍 ${largeTransactions.length} transaction${largeTransactions.length !== 1 ? 's' : ''} above 2x average`);
        }
    } else {
        insights.push('📊 No spending data available for the selected period.');
    }
    
    container.innerHTML = insights
        .map(insight => `<div class="insight-item">${insight}</div>`)
        .join('');
}

function updateBudgetPerformance(reportData) {
    const container = document.getElementById('budget-performance');
    if (!container) return;
    
    // This would integrate with budget data if available
    // For now, show a simple message
    container.innerHTML = `
        <div class="insight-item">
            📊 Budget performance analysis will be available when budgets are set.
        </div>
        <div class="insight-item">
            💡 <a href="budgets.html">Set up your budgets</a> to see detailed performance metrics.
        </div>
    `;
}

function initializeCharts() {
    // Initialize Chart.js charts
    initializeMonthlyTrendChart();
    initializeCategoryBreakdownChart();
    initializeWeeklyPatternChart();
    initializeBudgetComparisonChart();
}

function initializeMonthlyTrendChart() {
    const ctx = document.getElementById('monthlyTrendChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    if (monthlyTrendChart) {
        monthlyTrendChart.destroy();
    }
    
    monthlyTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Spending',
                data: [],
                borderColor: CHART_COLORS.primary,
                backgroundColor: CHART_COLORS.primary + '20',
                tension: 0.4,
                fill: true
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
                    callbacks: {
                        label: function(context) {
                            return `Spending: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
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


function initializeCategoryBreakdownChart() {
    const ctx = document.getElementById('categoryBreakdownChart');
    if (!ctx) return;
    
    if (categoryBreakdownChart) {
        categoryBreakdownChart.destroy();
    }
    
    categoryBreakdownChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: CHART_COLORS.categories,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function initializeWeeklyPatternChart() {
    const ctx = document.getElementById('weeklyPatternChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    if (weeklyPatternChart) {
        weeklyPatternChart.destroy();
    }
    
    weeklyPatternChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            datasets: [{
                label: 'Average Daily Spending',
                data: [],
                backgroundColor: CHART_COLORS.secondary,
                borderRadius: 4
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
                    callbacks: {
                        label: function(context) {
                            return `Average: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
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

function initializeBudgetComparisonChart() {
    const ctx = document.getElementById('budgetComparisonChart');
    if (!ctx || typeof Chart === 'undefined') return;
    
    if (budgetComparisonChart) {
        budgetComparisonChart.destroy();
    }
    
    budgetComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Budget',
                    data: [],
                    backgroundColor: CHART_COLORS.success + '80',
                    borderColor: CHART_COLORS.success,
                    borderWidth: 2
                },
                {
                    label: 'Actual',
                    data: [],
                    backgroundColor: CHART_COLORS.primary + '80',
                    borderColor: CHART_COLORS.primary,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'top' 
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
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


function updateAllCharts(reportData) {
    updateMonthlyTrendChart(reportData);
    updateCategoryBreakdownChart(reportData);
    updateWeeklyPatternChart(reportData);
    updateBudgetComparisonChart(reportData);
}

function updateMonthlyTrendChart(reportData = null) {
    if (!monthlyTrendChart) return;
    
    const data = reportData || getReportData();
    const { filteredExpenses } = data;
    
    // Group by month
    const monthlyTotals = {};
    filteredExpenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + expense.amount;
    });
    
    // Sort and format
    const sortedMonths = Object.keys(monthlyTotals).sort();
    const labels = sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, monthNum - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
    const values = sortedMonths.map(month => monthlyTotals[month]);
    
    monthlyTrendChart.data.labels = labels;
    monthlyTrendChart.data.datasets[0].data = values;
    monthlyTrendChart.update();
}

function updateCategoryBreakdownChart(reportData = null) {
    if (!categoryBreakdownChart) return;
    
    const data = reportData || getReportData();
    const { categoryTotals } = data;
    
    const sortedCategories = Object.entries(categoryTotals)
        .filter(([, amount]) => amount > 0)
        .sort(([, a], [, b]) => b - a);
    
    const labels = sortedCategories.map(([category]) => category);
    const values = sortedCategories.map(([, amount]) => amount);
    
    categoryBreakdownChart.data.labels = labels;
    categoryBreakdownChart.data.datasets[0].data = values;
    categoryBreakdownChart.update();
}

function updateWeeklyPatternChart(reportData = null) {
    if (!weeklyPatternChart) return;
    
    const data = reportData || getReportData();
    const { filteredExpenses } = data;
    
    // Calculate average spending by day of week
    const weeklyTotals = new Array(7).fill(0);
    const weeklyCounts = new Array(7).fill(0);
    
    filteredExpenses.forEach(expense => {
        const dayOfWeek = new Date(expense.date).getDay();
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
        weeklyTotals[adjustedDay] += expense.amount;
        weeklyCounts[adjustedDay]++;
    });
    
    const weeklyAverages = weeklyTotals.map((total, i) => 
        weeklyCounts[i] > 0 ? total / weeklyCounts[i] : 0
    );
    
    weeklyPatternChart.data.datasets[0].data = weeklyAverages;
    weeklyPatternChart.update();
}

function updateBudgetComparisonChart(reportData = null) {
    if (!budgetComparisonChart) return;
    
    // For now, show placeholder data
    // This would integrate with actual budget data
    budgetComparisonChart.data.labels = ['Housing', 'Food', 'Transport', 'Entertainment'];
    budgetComparisonChart.data.datasets[0].data = [1500, 600, 300, 200]; // Budget
    budgetComparisonChart.data.datasets[1].data = [1400, 650, 280, 250]; // Actual
    budgetComparisonChart.update();
}

function handleChartToggle(e) {
    const chartType = e.target.dataset.chart;
    // Add chart toggle functionality here
    showNotification('Chart toggle functionality coming soon!', 'info');
}

function updateReportMetadata() {
    const reportGeneratedEl = document.getElementById('report-generated');
    const dataPointsEl = document.getElementById('data-points');
    
    if (reportGeneratedEl) {
        reportGeneratedEl.textContent = new Date().toLocaleString();
    }
    
    if (dataPointsEl) {
        const { filteredExpenses } = getReportData();
        dataPointsEl.textContent = filteredExpenses.length.toLocaleString();
    }
}

// Export functions
window.exportReport = function(format) {
    const reportData = getReportData();
    
    switch (format) {
        case 'csv':
            exportToCSV(reportData.filteredExpenses, `financial-report-${currentReportPeriod.type}.csv`);
            showNotification('Report exported as CSV!', 'success');
            break;
        case 'pdf':
            showNotification('PDF export coming soon!', 'info');
            break;
        case 'excel':
            showNotification('Excel export coming soon!', 'info');
            break;
        default:
            showNotification('Export format not supported', 'error');
    }
};

window.shareReport = function() {
    if (navigator.share) {
        navigator.share({
            title: 'Financial Report',
            text: 'Check out my financial report',
            url: window.location.href
        });
    } else {
        // Fallback: copy URL to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            showNotification('Report URL copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Unable to share report', 'error');
        });
    }
};

// Additional CSS for reports page
const reportStyles = `
.summary-change {
    font-size: 0.9rem;
    font-weight: 500;
}

.summary-change.positive {
    color: var(--success-color);
}

.summary-change.negative {
    color: var(--danger-color);
}

.comparison-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--border-color);
}

.comparison-item:last-child {
    border-bottom: none;
}

.comparison-month {
    font-weight: 600;
    color: var(--text-primary);
}

.comparison-amount {
    font-weight: 700;
    color: var(--primary-color);
}

.comparison-count {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.insight-item {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    background-color: var(--background);
    border-radius: 6px;
    border-left: 3px solid var(--primary-color);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.chart-controls select {
    padding: 0.375rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    background-color: var(--surface);
    font-size: 0.875rem;
}

.chart-controls .chart-info {
    font-size: 0.875rem;
    color: var(--text-secondary);
}

.chart-toggle {
    background: none;
    border: 1px solid var(--border-color);
    padding: 0.375rem 0.75rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    color: var(--text-primary);
    transition: all 0.2s;
}

.chart-toggle:hover {
    background-color: var(--background);
    border-color: var(--primary-color);
}

.chart-container {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
    height: 400px;
}

.chart-container.large {
    grid-column: span 2;
    height: 500px;
}

.export-options {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.export-btn {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    background: var(--surface);
    border: 2px solid var(--border-color);
    border-radius: 8px;
    text-decoration: none;
    color: var(--text-primary);
    transition: all 0.2s;
    cursor: pointer;
    font-weight: 500;
}

.export-btn:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
}

.export-icon {
    font-size: 1.25rem;
}

.period-btn {
    padding: 0.5rem 1rem;
    background: var(--surface);
    border: 2px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    font-weight: 500;
    color: var(--text-primary);
    transition: all 0.2s;
}

.period-btn:hover {
    border-color: var(--primary-color);
    background-color: var(--background);
}

.period-btn.active {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
}

.date-inputs {
    display: flex;
    gap: 1rem;
    align-items: end;
    flex-wrap: wrap;
}

.date-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.date-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
}

.date-group input {
    padding: 0.625rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 0.875rem;
}

.quick-periods {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 1rem;
}

.reports-layout {
    max-width: 1500px;
    margin: 2rem auto;
    padding: 0 2rem;
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.report-controls {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

.date-range-selector h2 {
    margin-bottom: 1rem;
    color: var(--text-primary);
}

.report-summary {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.summary-card {
    background: var(--background);
    border-radius: 8px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.summary-icon {
    font-size: 2.5rem;
    opacity: 0.8;
}

.summary-details h3 {
    font-size: 0.9rem;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.summary-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    display: block;
    margin-bottom: 0.25rem;
}

.summary-change {
    font-size: 0.8rem;
    color: var(--text-secondary);
}

.charts-section {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

.charts-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
    grid-template-rows: auto auto;
}

.analysis-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.analysis-card {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

.analysis-card h3 {
    margin-bottom: 1rem;
    color: var(--text-primary);
    font-size: 1.125rem;
}

.table-container.small {
    max-height: 300px;
    overflow-y: auto;
}

.analysis-table {
    width: 100%;
    border-collapse: collapse;
}

.analysis-table th,
.analysis-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.analysis-table th {
    background-color: var(--background);
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.export-section {
    background: var(--surface);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: var(--shadow);
}

.export-section h2 {
    margin-bottom: 1.5rem;
    color: var(--text-primary);
}

@media (max-width: 1024px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }
    
    .chart-container.large {
        grid-column: span 1;
    }
    
    .date-inputs {
        flex-direction: column;
        align-items: stretch;
    }
    
    .quick-periods {
        justify-content: center;
    }
}

@media (max-width: 768px) {
    .reports-layout {
        padding: 0 1rem;
    }
    
    .summary-grid {
        grid-template-columns: 1fr;
    }
    
    .analysis-grid {
        grid-template-columns: 1fr;
    }
    
    .export-options {
        grid-template-columns: 1fr;
    }
    
    .summary-card {
        flex-direction: column;
        text-align: center;
    }
    
    .chart-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
}
`;


// Initialize reports page
document.addEventListener('DOMContentLoaded', () => {
    initializeReportsPage();
    setupEventListeners();
    setDefaultPeriod();
    generateReport();
});
