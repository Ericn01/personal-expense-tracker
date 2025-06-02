// reports.js - Financial reports and analytics functionality
import { 
    expenseList, 
    formatCurrency, 
    showNotification, 
    exportToCSV,
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

`;


// Initialize reports page
document.addEventListener('DOMContentLoaded', () => {
    initializeReportsPage();
    setupEventListeners();
    setDefaultPeriod();
    generateReport();
});
