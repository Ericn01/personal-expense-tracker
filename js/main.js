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

// Create a global expenseList (might need to be a singleton)
const expenseList = new ExpenseList();

// Grab the HTML category dropdown elements
const newEntryCategoriesDropdown = document.querySelector("#categories");
const tableFilterCategoriesDropdown = document.querySelector("#filter-category");

// Populate the dropdowns
[newEntryCategoriesDropdown, tableFilterCategoriesDropdown]
    .forEach( dropdownElem => populateCategoryDropdown(dropdownElem))

// Grab the new entry HTML elements 
const expenseForm = document.querySelector("#new-entry-form");
// New expense form submission
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault(); // We don't want the default behaviour (resets the page)

    // Grab all the form data 
    const expenseFormData = new FormData(expenseForm);
    const data = Object.fromEntries(expenseFormData.entries());
    console.log(data)
    // Description is not included in the FormData entries
    const description = document.querySelector(".description").value;
    const date = data.date || getTodayDateString()

    const expense = new Expense(parseFloat(data.amount), description, data.categories, date);
    
    // Append the expense object to the ExpenseList object
    expenseList.addExpense(expense)
    renderTable(expenseList.expenses);
    
    e.target.reset();
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
    renderTable(filtered)
});

// Initial table rendering
renderTable(expenseList.expenses)