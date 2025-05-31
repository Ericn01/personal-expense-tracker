/*
Core Requirements
Main Function: Build a web application that helps users track expenses, visualize spending patterns, and manage budgets.
Key Features to Implement:

1. Add/edit/delete expense entries with categories (food, transport, entertainment, etc.)
2. Set monthly budgets per category and track spending against limits
3. Display expenses in a filterable table (by date range, category, amount)

Show spending trends with interactive charts (monthly totals, category breakdowns)
Calculate and display key metrics (total spent, remaining budget, average daily spending)

Expected Inputs:

Expense amount, description, category, and date
Budget limits for each category
Date ranges for filtering

Expected Outputs:

Responsive dashboard with expense summary cards
Interactive charts showing spending over time
Alerts when approaching or exceeding budget limits
Exportable expense reports
*/

import { Expense } from "./models/Expense.js";
import { ExpenseList } from "./models/ExpenseList.js";
import { populateCategoryDropdown } from "./utils/categories.js";
import { getTodayDateString } from "./utils/helpers.js";
import { renderTable } from "./ui/table.js";

 // Global variables
const expenseList = new ExpenseList();
let editingId = null;
let monthlyChart = null;
let categoryChart = null;
let budgets = {};

// Grab the HTML category dropdown elements
const newEntryCategoriesDropdown = document.querySelector("#categories");
const tableFilterCategoriesDropdown = document.querySelector("#filter-category");

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default
    document.getElementById('date').valueAsDate = new Date();
    
    // Populate the dropdowns
    [newEntryCategoriesDropdown, tableFilterCategoriesDropdown].forEach( dropdownElem => populateCategoryDropdown(dropdownElem))
    
    // Initialize budgets
    
    //loadBudgets();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initial render
    updateAll();
});


function setupEventListeners () {
    // New expense form submission
    document.querySelector("#new-entry-form").addEventListener('submit', (e) => {
        e.preventDefault(); // We don't want the default behaviour (resets the page)

        // Grab all the form data 
        const expenseFormData = new FormData(expenseForm);
        const data = Object.fromEntries(expenseFormData.entries());

        const expenseData = {
            amount: "" ? 0 : parseFloat(data.amount),
            description: data.description,
            category: data.categories.charAt(0).toUpperCase() + data.categories.slice(1),
            date: data.date || getTodayDateString(),
        }

        if (editingId){
            expenseList.modifyExpense(editingId, expenseData);
            editingId = null;
            // Reset the header and submission button to default state
            document.querySelector(".submit-button").textContent = "Add Expense"
            document.querySelector(".new-expense-heading").textContent = "Add a New Expense"
        } else {    
            const newExpense = new Expense(...Object.values(expenseData));
            expenseList.addExpense(newExpense)
        }
        
        e.target.reset();
        // Append the expense object to the ExpenseList object
        renderTable(expenseList.expenses);
    });

    // Filtering logic
    document.querySelector('#apply-filters').addEventListener('click', () => {
        const filters = {
            startDate: document.querySelector("#start-date").value,
            endDate: document.querySelector("#end-date").value,
            category: document.querySelector("#filter-category").value,
            minAmount: document.querySelector("#min-amount").value || null,
            maxAmount: document.querySelector("#max-amount").value || null 
        };

        const filtered = expenseList.getFiltered(filters);
        updateSummaryAndAlerts(expenseList)
        renderTable(filtered)

        // Adding event listeners for the delete and edit buttons
    document.querySelectorAll(".delete-btn").forEach( btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            expenseList.removeExpense(id);
            renderTable(expenseList.expenses)
        });
    })

    document.querySelectorAll(".edit-btn").forEach( btn => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const expense = expenseList.expenses.find(expense => expense.id === id);
            populateFormForEdit(expense)
        });
    })
});
}




// Edit the form function 
const populateFormForEdit = (expense) => {
    document.querySelector("#amount").value = expense.amount;
    document.querySelector("#categories").value = expense.category
    document.querySelector("#date").value = new Date(expense.date).toISOString().split(["T"])[0];
    document.querySelector("#description").value = expense.description;

    editingId = expense.id;

    document.querySelector(".submit-button").textContent = "Update Expense"
    document.querySelector(".new-expense-heading").textContent = "Edit Expense"
}



function updateSummaryAndAlerts(expenseList, budgetsByCategory = {}) {
    const expenses = expenseList.expenses;

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const days = new Set(expenses.map(exp => new Date(exp.date).toISOString().split('T')[0]));
    const avgSpending = days.size > 0 ? totalSpent / days.size : 0;

    const remainingBudget = Object.entries(budgetsByCategory).reduce((remaining, [category, budget]) => {
        const spent = expenses
            .filter(e => e.category === category)
            .reduce((sum, e) => sum + e.amount, 0);
        return remaining + Math.max(0, budget - spent);
    }, 0);

    document.querySelector(".total-spent").textContent = `$${totalSpent.toFixed(2)}`;
    document.querySelector(".average-spending").textContent = `$${avgSpending.toFixed(2)}`;
    document.querySelector(".remaining-budget").textContent = `$${remainingBudget.toFixed(2)}`;

    // ALERTS
    const alerts = [];
    Object.entries(budgetsByCategory).forEach(([category, budget]) => {
        const spent = expenses
            .filter(e => e.category === category)
            .reduce((sum, e) => sum + e.amount, 0);
        if (spent >= budget) {
            alerts.push(`You have exceeded your ${category} budget!`);
        } else if (spent >= budget * 0.9) {
            alerts.push(`You're approaching your ${category} budget.`);
        }
    });

    const alertsList = document.querySelector("#alerts-list");
    alertsList.innerHTML = "";
    alerts.forEach(msg => {
        const li = document.createElement("li");
        li.textContent = msg;
        alertsList.appendChild(li);
    });
}


// Initial table rendering
renderTable(expenseList.expenses)