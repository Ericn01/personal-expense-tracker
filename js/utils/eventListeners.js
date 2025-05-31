import { Expense } from "../models/Expense.js";
import { renderTable } from "../ui/table.js";
import { getEditingId, setEditingId } from "../main.js";

// Helper function to get today's date string
function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

// New expense form submission
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
    
    const currentEditingId = getEditingId();
    
    if (currentEditingId) {
        // Update existing expense
        expenseList.modifyExpense(currentEditingId, expenseData);
        setEditingId(null);
        document.querySelector('.submit-button').textContent = 'Add Expense';
        document.querySelector('.new-expense-heading').textContent = 'Add a New Expense';
    } else {
        // Add new expense
        const newExpense = new Expense(...Object.values(expenseData));
        expenseList.addExpense(newExpense);
    }
    
    // Reset form and update display
    e.target.reset();
    document.querySelector('#date').valueAsDate = new Date();
    
    // Call the update function to refresh everything
    if (updateAllCallback) {
        updateAllCallback();
    }
}

// Filtering logic
export function applyFilters(expenseList, monthNavigator) {
    const { start, end } = monthNavigator.getDateRange();
    const filters = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        category: document.querySelector("#filter-category").value,
        minAmount: document.querySelector("#min-amount").value || null,
        maxAmount: document.querySelector("#max-amount").value || null
    };
    
    const customStartDate = document.querySelector("#start-date").value;
    const customEndDate = document.querySelector("#end-date").value;
    
    if (customStartDate) filters.startDate = customStartDate;
    if (customEndDate) filters.endDate = customEndDate;
    
    const filtered = expenseList.getFiltered(filters);
    renderTable(filtered);
    
    // Re-attach event listeners after filtering
    deleteExpense(expenseList);
    modifyExpense(expenseList);
}

// Clear filters
export function clearFilters(expenseList) {
    document.querySelector('#start-date').value = '';
    document.querySelector('#end-date').value = '';
    document.querySelector('#filter-category').value = '';
    document.querySelector('#min-amount').value = '';
    document.querySelector('#max-amount').value = '';
    
    renderTable(expenseList.expenses);
    
    // Re-attach event listeners after clearing filters
    deleteExpense(expenseList);
    modifyExpense(expenseList);
}

// Delete expense functionality
export function deleteExpense(expenseList) {
    // Remove existing listeners to prevent duplicates
    document.querySelectorAll(".delete-btn").forEach(btn => {
        // Clone the button to remove all event listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // Add event listeners for the delete buttons
    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            if (confirm('Are you sure you want to delete this expense?')) {
                expenseList.removeExpense(id);
                renderTable(expenseList.expenses);
                
                // Re-attach event listeners after deletion
                deleteExpense(expenseList);
                modifyExpense(expenseList);
            }
        });
    });
}

// Edit expense functionality
export function modifyExpense(expenseList) {
    // Remove existing listeners to prevent duplicates
    document.querySelectorAll(".edit-btn").forEach(btn => {
        // Clone the button to remove all event listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // Add event listeners for the edit buttons
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const expense = expenseList.expenses.find(expense => expense.id === id);
            if (expense) {
                populateFormForEdit(expense);
                // Scroll to form
                document.querySelector('.add-entry').scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Populate form for editing
function populateFormForEdit(expense) {
    document.querySelector("#amount").value = expense.amount;
    document.querySelector("#categories").value = expense.category.toLowerCase();
    document.querySelector("#date").value = new Date(expense.date).toISOString().split('T')[0];
    document.querySelector("#description").value = expense.description;
    
    setEditingId(expense.id);
    document.querySelector(".submit-button").textContent = "Update Expense";
    document.querySelector(".new-expense-heading").textContent = "Edit Expense";
}