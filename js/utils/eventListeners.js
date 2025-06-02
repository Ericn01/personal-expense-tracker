import { Expense } from "../models/Expense.js";
import { renderTable } from "../ui/table.js";

// Helper function to get today's date string
function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

// New expense form submission - simplified for backward compatibility
export function handleFormSubmit(e, expenseList, updateAllCallback) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    const expenseData = {
        amount: data.amount === "" ? 0 : parseFloat(data.amount),
        description: data.description,
        category: data.categories.charAt(0).toUpperCase() + data.categories.slice(1),
        date: data.date || getTodayDateString(),
    };
    
    // Check if we have access to editing state from main.js
    let currentEditingId = null;
    if (typeof window.getEditingId === 'function') {
        currentEditingId = window.getEditingId();
    }
    
    if (currentEditingId) {
        // Update existing expense
        expenseList.modifyExpense(currentEditingId, expenseData);
        if (typeof window.setEditingId === 'function') {
            window.setEditingId(null);
        }
        document.querySelector('.submit-button').textContent = 'Add Expense';
        document.querySelector('.new-expense-heading').textContent = 'Add a New Expense';
    } else {
        // Add new expense
        const newExpense = new Expense(...Object.values(expenseData));
        expenseList.addExpense(newExpense);
    }
    
    // Reset form and update display
    e.target.reset();
    const dateInput = document.querySelector('#date');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
    }
    
    // Call the update function to refresh everything
    if (updateAllCallback) {
        updateAllCallback();
    }
}

// Filtering logic - simplified
export function applyFilters(expenseList, monthNavigator) {
    if (!monthNavigator) return;
    
    const { start, end } = monthNavigator.getDateRange();
    const filters = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        category: document.querySelector("#filter-category")?.value || "",
        minAmount: document.querySelector("#min-amount")?.value || null,
        maxAmount: document.querySelector("#max-amount")?.value || null
    };
    
    const customStartDate = document.querySelector("#start-date")?.value;
    const customEndDate = document.querySelector("#end-date")?.value;
    
    if (customStartDate) filters.startDate = customStartDate;
    if (customEndDate) filters.endDate = customEndDate;
    
    const filtered = expenseList.getFiltered(filters);
    renderTable(filtered);
    
    // Re-attach event listeners after filtering
    attachActionListeners(expenseList);
}

// Clear filters - simplified
export function clearFilters(expenseList) {
    const filterInputs = ['#start-date', '#end-date', '#filter-category', '#min-amount', '#max-amount'];
    filterInputs.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) element.value = '';
    });
    
    renderTable(expenseList.expenses);
    attachActionListeners(expenseList);
}

// Simplified action listeners
function attachActionListeners(expenseList) {
    // Remove existing listeners and attach new ones
    document.querySelectorAll(".delete-btn").forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener("click", () => {
            const id = newBtn.dataset.id;
            if (confirm('Are you sure you want to delete this expense?')) {
                expenseList.removeExpense(id);
                renderTable(expenseList.expenses);
                attachActionListeners(expenseList);
            }
        });
    });
    
    document.querySelectorAll(".edit-btn").forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener("click", () => {
            const id = newBtn.dataset.id;
            const expense = expenseList.expenses.find(expense => expense.id === id);
            if (expense) {
                populateFormForEdit(expense);
                document.querySelector('.add-entry')?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Export simplified functions for backward compatibility
export function deleteExpense(expenseList) {
    attachActionListeners(expenseList);
}

export function modifyExpense(expenseList) {
    attachActionListeners(expenseList);
}

// Populate form for editing
function populateFormForEdit(expense) {
    const amountInput = document.querySelector("#amount");
    const categorySelect = document.querySelector("#categories");
    const dateInput = document.querySelector("#date");
    const descriptionInput = document.querySelector("#description");
    
    if (amountInput) amountInput.value = expense.amount;
    if (categorySelect) categorySelect.value = expense.category.toLowerCase();
    if (dateInput) dateInput.value = new Date(expense.date).toISOString().split('T')[0];
    if (descriptionInput) descriptionInput.value = expense.description;
    
    // Update form state
    if (typeof window.setEditingId === 'function') {
        window.setEditingId(expense.id);
    }
    
    const submitButton = document.querySelector(".submit-button");
    const formHeading = document.querySelector(".new-expense-heading");
    
    if (submitButton) submitButton.textContent = "Update Expense";
    if (formHeading) formHeading.textContent = "Edit Expense";
}