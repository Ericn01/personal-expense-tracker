// expenses.js - Expense management functionality
import { ExpenseList } from "./models/ExpenseList.js";
import { Expense } from "./models/Expense.js";
import { populateCategoryDropdown } from "./utils/categories.js";
import { 
    formatCurrency, 
    formatDate, 
    showNotification, 
    exportToCSV,
    debounce
} from './utils/shared.js';

// Global variables
const expenseList = new ExpenseList();
let editingId = null;
let currentFilter = null;
let sortOrder = 'date-desc';
let selectedExpenses = new Set();

// Initialize expenses page
document.addEventListener('DOMContentLoaded', () => {
    initializeExpensePage();
    setupEventListeners();
    updateExpensesDisplay();
    updateQuickStats();
});

function initializeExpensePage() {
    // Set today's date as default
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    // Populate category dropdowns
    const categoryDropdowns = [
        document.getElementById('categories'),
        document.getElementById('filter-category')
    ];
    
    categoryDropdowns.forEach(dropdown => {
        if (dropdown) populateCategoryDropdown(dropdown);
    });
    
    // Initialize search debounce
    const searchInput = document.getElementById('expense-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

function setupEventListeners() {
    // Form submission
    const form = document.getElementById('new-entry-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Filter toggle
    const toggleFiltersBtn = document.getElementById('toggle-filters');
    if (toggleFiltersBtn) {
        toggleFiltersBtn.addEventListener('click', toggleFilters);
    }
    
    // Filter controls
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Sort control
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', handleSortChange);
    }
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', handleSelectAll);
    }
    
    // Bulk delete button
    const bulkDeleteBtn = document.getElementById('bulk-delete');
    if (bulkDeleteBtn) {
        bulkDeleteBtn.addEventListener('click', handleBulkDelete);
    }
    
    // Close form button
    const closeFormBtn = document.getElementById('close-form');
    if (closeFormBtn) {
        closeFormBtn.addEventListener('click', resetForm);
    }
    
    // Modal events
    setupModalEvents();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Validate form data
    if (!validateFormData(data)) {
        return;
    }
    
    const expenseData = {
        amount: parseFloat(data.amount),
        description: data.description.trim(),
        category: data.categories.charAt(0).toUpperCase() + data.categories.slice(1),
        date: data.date || new Date().toISOString().split('T')[0],
    };
    
    try {
        if (editingId) {
            // Update existing expense
            expenseList.modifyExpense(editingId, expenseData);
            showNotification('Expense updated successfully!', 'success');
            resetForm();
        } else {
            // Add new expense
            const newExpense = new Expense(...Object.values(expenseData));
            expenseList.addExpense(newExpense);
            showNotification('Expense added successfully!', 'success');
        }
        
        // Reset form and update displays
        e.target.reset();
        document.getElementById('date').valueAsDate = new Date();
        updateExpensesDisplay();
        updateQuickStats();
        
    } catch (error) {
        showNotification('Error saving expense. Please try again.', 'error');
        console.error('Error saving expense:', error);
    }
}

function validateFormData(data) {
    if (!data.amount || parseFloat(data.amount) <= 0) {
        showNotification('Please enter a valid amount greater than 0', 'error');
        return false;
    }
    
    if (!data.categories) {
        showNotification('Please select a category', 'error');
        return false;
    }
    
    if (!data.description || data.description.trim().length < 3) {
        showNotification('Please enter a description (at least 3 characters)', 'error');
        return false;
    }
    
    if (!data.date) {
        showNotification('Please select a date', 'error');
        return false;
    }
    
    return true;
}

function updateExpensesDisplay() {
    let expenses = [...expenseList.expenses];
    
    // Apply current filter
    if (currentFilter) {
        expenses = applyCurrentFilter(expenses);
    }
    
    // Apply sort
    expenses = applySorting(expenses);
    
    // Render table
    renderExpensesTable(expenses);
    
    // Update results count
    updateResultsCount(expenses.length);
    
    // Show/hide empty state
    toggleEmptyState(expenses.length === 0);
}

function applyCurrentFilter(expenses) {
    return expenses.filter(expense => {
        // Search filter
        if (currentFilter?.search) {
            const searchTerm = currentFilter.search.toLowerCase();
            const matchesSearch = 
                expense.description.toLowerCase().includes(searchTerm) ||
                expense.category.toLowerCase().includes(searchTerm);
            if (!matchesSearch) return false;
        }
        
        // Date range filter
        if (currentFilter?.startDate) {
            const expenseDate = new Date(expense.date);
            const startDate = new Date(currentFilter.startDate);
            if (expenseDate < startDate) return false;
        }
        
        if (currentFilter?.endDate) {
            const expenseDate = new Date(expense.date);
            const endDate = new Date(currentFilter.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            if (expenseDate > endDate) return false;
        }
        
        // Category filter
        if (currentFilter?.category && currentFilter.category !== expense.category.toLowerCase()) {
            return false;
        }
        
        // Amount range filter
        if (currentFilter?.minAmount && expense.amount < parseFloat(currentFilter.minAmount)) {
            return false;
        }
        
        if (currentFilter?.maxAmount && expense.amount > parseFloat(currentFilter.maxAmount)) {
            return false;
        }
        
        return true;
    });
}

function applySorting(expenses) {
    switch (sortOrder) {
        case 'date-desc':
            return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        case 'date-asc':
            return expenses.sort((a, b) => new Date(a.date) - new Date(b.date));
        case 'amount-desc':
            return expenses.sort((a, b) => b.amount - a.amount);
        case 'amount-asc':
            return expenses.sort((a, b) => a.amount - b.amount);
        case 'category':
            return expenses.sort((a, b) => a.category.localeCompare(b.category));
        default:
            return expenses;
    }
}

function renderExpensesTable(expenses) {
    const tbody = document.getElementById('expenses-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    expenses.forEach(expense => {
        const row = document.createElement('tr');
        row.className = 'expense-row';
        row.innerHTML = `
            <td>
                <input type="checkbox" class="expense-checkbox" data-id="${expense.id}" 
                       ${selectedExpenses.has(expense.id) ? 'checked' : ''}>
            </td>
            <td class="date-cell">${formatDate(expense.date)}</td>
            <td>
                <span class="category-badge category-${expense.category.toLowerCase()}">${expense.category}</span>
            </td>
            <td class="amount-cell"><strong>${formatCurrency(expense.amount)}</strong></td>
            <td class="description-cell" title="${expense.description}">${expense.description}</td>
            <td class="action-buttons">
                <button class="btn-icon edit edit-btn" data-id="${expense.id}" title="Edit">
                    ✏️
                </button>
                <button class="btn-icon delete delete-btn" data-id="${expense.id}" title="Delete">
                    🗑️
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Attach event listeners to new buttons
    attachTableEventListeners();
}

function attachTableEventListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            editExpense(id);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            showDeleteModal(id);
        });
    });
    
    // Checkboxes
    document.querySelectorAll('.expense-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleExpenseCheckboxChange);
    });
}

function editExpense(id) {
    const expense = expenseList.expenses.find(exp => exp.id === id);
    if (!expense) return;
    
    // Populate form
    document.getElementById('amount').value = expense.amount;
    document.getElementById('categories').value = expense.category.toLowerCase();
    document.getElementById('date').value = new Date(expense.date).toISOString().split('T')[0];
    document.getElementById('description').value = expense.description;
    
    // Update form state
    editingId = id;
    updateFormForEditing(true);
    
    // Scroll to form
    document.querySelector('.expense-form-sidebar').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
    
    // Focus on amount field
    document.getElementById('amount').focus();
}

function updateFormForEditing(isEditing) {
    const submitBtn = document.querySelector('.submit-button .btn-text');
    const formHeading = document.querySelector('.new-expense-heading');
    const closeBtn = document.getElementById('close-form');
    
    if (isEditing) {
        if (submitBtn) submitBtn.textContent = 'Update Expense';
        if (formHeading) formHeading.textContent = '✏️ Edit Expense';
        if (closeBtn) closeBtn.style.display = 'block';
    } else {
        if (submitBtn) submitBtn.textContent = 'Add Expense';
        if (formHeading) formHeading.textContent = '💰 Add New Expense';
        if (closeBtn) closeBtn.style.display = 'none';
    }
}

function resetForm() {
    editingId = null;
    updateFormForEditing(false);
    
    const form = document.getElementById('new-entry-form');
    if (form) {
        form.reset();
        document.getElementById('date').valueAsDate = new Date();
    }
}

function showDeleteModal(id) {
    const modal = document.getElementById('delete-modal');
    const confirmBtn = document.getElementById('confirm-delete');
    
    if (modal && confirmBtn) {
        modal.style.display = 'flex';
        
        // Set up confirm button
        confirmBtn.onclick = () => {
            deleteExpense(id);
            closeModal();
        };
    }
}

function deleteExpense(id) {
    try {
        expenseList.removeExpense(id);
        selectedExpenses.delete(id);
        showNotification('Expense deleted successfully!', 'success');
        updateExpensesDisplay();
        updateQuickStats();
        updateBulkDeleteButton();
    } catch (error) {
        showNotification('Error deleting expense. Please try again.', 'error');
        console.error('Error deleting expense:', error);
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.trim();
    
    if (searchTerm) {
        currentFilter = { ...currentFilter, search: searchTerm };
    } else {
        if (currentFilter) {
            delete currentFilter.search;
            if (Object.keys(currentFilter).length === 0) {
                currentFilter = null;
            }
        }
    }
    
    updateExpensesDisplay();
}

function toggleFilters() {
    const filterPanel = document.getElementById('filter-panel');
    const toggleBtn = document.getElementById('toggle-filters');
    
    if (filterPanel && toggleBtn) {
        const isVisible = filterPanel.style.display !== 'none';
        filterPanel.style.display = isVisible ? 'none' : 'block';
        toggleBtn.querySelector('span').textContent = isVisible ? 'Show Filters' : 'Hide Filters';
    }
}

function applyFilters() {
    const filters = {
        startDate: document.getElementById('start-date')?.value,
        endDate: document.getElementById('end-date')?.value,
        category: document.getElementById('filter-category')?.value,
        minAmount: document.getElementById('min-amount')?.value,
        maxAmount: document.getElementById('max-amount')?.value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    // Merge with current search filter
    currentFilter = currentFilter?.search ? 
        { ...filters, search: currentFilter.search } : 
        Object.keys(filters).length > 0 ? filters : null;
    
    updateExpensesDisplay();
    showNotification('Filters applied!', 'info');
}

function clearFilters() {
    // Clear form inputs
    ['start-date', 'end-date', 'filter-category', 'min-amount', 'max-amount', 'expense-search']
        .forEach(id => {
            const element = document.getElementById(id);
            if (element) element.value = '';
        });
    
    // Clear current filter
    currentFilter = null;
    
    updateExpensesDisplay();
    showNotification('Filters cleared!', 'info');
}

function handleSortChange(e) {
    sortOrder = e.target.value;
    updateExpensesDisplay();
}

function handleSelectAll(e) {
    const checkboxes = document.querySelectorAll('.expense-checkbox');
    const isChecked = e.target.checked;
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = isChecked;
        const id = checkbox.dataset.id;
        if (isChecked) {
            selectedExpenses.add(id);
        } else {
            selectedExpenses.delete(id);
        }
    });
    
    updateBulkDeleteButton();
}

function handleExpenseCheckboxChange(e) {
    const id = e.target.dataset.id;
    const isChecked = e.target.checked;
    
    if (isChecked) {
        selectedExpenses.add(id);
    } else {
        selectedExpenses.delete(id);
    }
    
    // Update select all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    const allCheckboxes = document.querySelectorAll('.expense-checkbox');
    const checkedCount = document.querySelectorAll('.expense-checkbox:checked').length;
    
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = checkedCount === allCheckboxes.length;
        selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
    }
    
    updateBulkDeleteButton();
}

function updateBulkDeleteButton() {
    const bulkDeleteBtn = document.getElementById('bulk-delete');
    if (bulkDeleteBtn) {
        const hasSelected = selectedExpenses.size > 0;
        bulkDeleteBtn.style.display = hasSelected ? 'block' : 'none';
        bulkDeleteBtn.textContent = `🗑️ Delete Selected (${selectedExpenses.size})`;
    }
}

function handleBulkDelete() {
    if (selectedExpenses.size === 0) return;
    
    const count = selectedExpenses.size;
    const confirmMessage = `Are you sure you want to delete ${count} expense${count > 1 ? 's' : ''}? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        try {
            selectedExpenses.forEach(id => {
                expenseList.removeExpense(id);
            });
            
            selectedExpenses.clear();
            showNotification(`Successfully deleted ${count} expense${count > 1 ? 's' : ''}!`, 'success');
            updateExpensesDisplay();
            updateQuickStats();
            updateBulkDeleteButton();
            
            // Reset select all checkbox
            const selectAllCheckbox = document.getElementById('select-all');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
            }
        } catch (error) {
            showNotification('Error deleting expenses. Please try again.', 'error');
            console.error('Error in bulk delete:', error);
        }
    }
}

function updateQuickStats() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Today's spending
    const todaySpending = expenseList.expenses
        .filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= today && expenseDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    // This week's spending
    const weekSpending = expenseList.expenses
        .filter(expense => new Date(expense.date) >= weekStart)
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    // This month's spending
    const monthSpending = expenseList.expenses
        .filter(expense => new Date(expense.date) >= monthStart)
        .reduce((sum, expense) => sum + expense.amount, 0);
    
    // Update display
    const todayEl = document.getElementById('today-spending');
    const weekEl = document.getElementById('week-spending');
    const monthEl = document.getElementById('month-spending');
    
    if (todayEl) todayEl.textContent = formatCurrency(todaySpending);
    if (weekEl) weekEl.textContent = formatCurrency(weekSpending);
    if (monthEl) monthEl.textContent = formatCurrency(monthSpending);
    
    // Update footer stats
    updateFooterStats();
}

function updateFooterStats() {
    const totalCount = expenseList.expenses.length;
    const totalAmount = expenseList.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const countEl = document.getElementById('total-expenses-count');
    const amountEl = document.getElementById('total-expenses-amount');
    
    if (countEl) countEl.textContent = totalCount.toLocaleString();
    if (amountEl) amountEl.textContent = formatCurrency(totalAmount);
}

function updateResultsCount(count) {
    const resultsEl = document.getElementById('results-count');
    if (resultsEl) {
        const total = expenseList.expenses.length;
        if (count === total) {
            resultsEl.textContent = `Showing ${count} expense${count !== 1 ? 's' : ''}`;
        } else {
            resultsEl.textContent = `Showing ${count} of ${total} expense${total !== 1 ? 's' : ''}`;
        }
    }
}

function toggleEmptyState(isEmpty) {
    const emptyState = document.getElementById('empty-state');
    const tableSection = document.querySelector('.table-section .table-container');
    
    if (emptyState && tableSection) {
        emptyState.style.display = isEmpty ? 'block' : 'none';
        tableSection.style.display = isEmpty ? 'none' : 'block';
    }
}

function setupModalEvents() {
    // Close modal when clicking outside
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Global functions for HTML onclick events
window.closeModal = function() {
    const modal = document.getElementById('delete-modal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.focusForm = function() {
    document.getElementById('amount').focus();
};

window.exportExpenses = function() {
    let expenses = [...expenseList.expenses];
    
    // Apply current filter if any
    if (currentFilter) {
        expenses = applyCurrentFilter(expenses);
    }
    
    if (expenses.length === 0) {
        showNotification('No expenses to export!', 'warning');
        return;
    }
    
    const filename = currentFilter ? 
        'filtered-expenses.csv' : 
        `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    
    exportToCSV(expenses, filename);
    showNotification(`Exported ${expenses.length} expense${expenses.length !== 1 ? 's' : ''} to CSV!`, 'success');
};
