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

const Categories = Object.freeze({
    HOUSING: Symbol("housing"),
    FOOD: Symbol("food"),
    TRANSPORTATION: Symbol("transportation"),
    HEALTHCARE: Symbol("healthcare"),
    EDUCATION: Symbol("education"),
    PERSONAL: Symbol("personal"),
    ENTERTAINMENT: Symbol("entertainment"),
    FAMILY: Symbol("family"),
    FINANCES: Symbol("finances"),
    DONATIONS: Symbol("donations"),
    BUSINESS: Symbol("business")
});


class Expense {
    constructor(amount, description, category, date = new Date(), id=crypto.randomUUID()){
        this.amount = parseFloat(amount);
        this.description = description;
        this.category = category;
        this.date = new Date(date);
        this.id = id;  // create a unique identifier for the expense
    }
}

class ExpenseList {
    constructor(){
        this.expenses = [];
    }

    addExpense(expense){
        this.expenses.push(expense);
    }

    getFiltered( { startDate, endDate, category, minAmount, maxAmount }) {
        return this.expenses.filter( exp => {
            const matchDate = (!startDate || exp.date >= new Date(startDate)) && 
                            (!endDate || exp.date <= new Date(endDate));
            const matchCategory = !category || exp.category === category;
            const matchAmount = (!minAmount || exp.amount >= minAmount) &&
                                (!maxAmount || exp.amount <= maxAmount);

            return matchDate && matchCategory && matchAmount;
        } )
    }

    // Save expenses data to localStorage
    saveExpenses() {
        localStorage.setItem("expenses", JSON.stringify(this.expenses))
    }
    // Retrieve expenses data from localStorage
    loadExpenses(){
        expensesData = localStorage.getItem("expenses");
        if (!expensesData){
            return [];
        }
        return JSON.parse(expensesData).map(e => new Expense(e.amount, e.description, e.category, e.date, e.id));
    }
}

// Create a global expenseList (might need to be a singleton)
const expenseList = new ExpenseList();
/* 
TESTING DATA --> Remove later
*/
expenseList.addExpense(new Expense(50, "food", "Groceries", "2025-05-30"));
expenseList.addExpense(new Expense(200, "housing", "Rent", "2025-05-05"));

// Populate the category inputs

function populateCategoryDropdown (HTMLDropdown) {
    Object.entries(Categories).forEach( ([key, symbol]) => {
    const option = document.createElement("option");
    option.value = symbol.description; 
    option.textContent = symbol.description.charAt(0).toUpperCase() + symbol.description.slice(1);
    HTMLDropdown.appendChild(option);
});
}

// Grab the new entry HTML elements 
const expenseForm = document.querySelector("#new-entry-form");
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault(); // We don't want the default behaviour (resets the page)


    // handling the date input if left empty (default to today's date)
    const dateInput = document.querySelector("#date");
    if (!dateInput.value){
        const today = new Date.toISOString().split('T')[0]; // YYYY-MM-DD Format
        dateInput.value = today;
    }

    const expenseFormData = new FormData(expenseForm);
    const data = Object.fromEntries(expenseFormData.entries());

    // Description is not included in the FormData entries
    const description = document.querySelector(".description").value;

    const expense = new Expense(parseFloat(data.amount, description, data.category, data.date))
    // Append the expense object to the ExpenseList object
    expenseList.addExpense(expense)
});


/* Expenses table section */
const expensesTable = document.querySelector(".expenses-table");

function renderTable (data) {
    const tbody = document.querySelector(".expenses-table tbody");
    tbody.innerHTML = '';

    data.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(exp.date).toISOString().split('T')[0]}</td>
            <td>${exp.category}</td>
            <td>$${exp.amount.toFixed(2)}</td>
            <td>${exp.description}</td>
        `;

        tbody.appendChild(row);
    })
}

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

// Populate the HTML dropdown menus (categories)
const newEntryCategoriesDropdown = document.querySelector("#categories");
const tableFilterCategoriesDropdown = document.querySelector("#filter-category");

// Populate the dropdowns
[newEntryCategoriesDropdown, tableFilterCategoriesDropdown].forEach( dropdownElem => populateCategoryDropdown(dropdownElem))

renderTable(expenseList.expenses)



