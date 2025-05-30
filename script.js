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
    constructor(amount, description, category, date){
        this.amount = amount;
        this.description = description;
        this.category = category;
        this.date = date;
    }

    displayExpense(){

    }
}



// Populate the category inputs
const categoryDropdown = document.querySelector("#categories");
Object.entries(Categories).forEach( ([key, symbol]) => {
    const option = document.createElement("option");
    option.value = symbol.description; 
    option.textContent = symbol.description.charAt(0).toUpperCase() + symbol.description.slice(1);
    categoryDropdown.appendChild(option);
});

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

    console.log(data);
});





