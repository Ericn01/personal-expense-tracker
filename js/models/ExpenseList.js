// ExpenseList.js - Simplified with integrated storage
import { Expense } from "./Expense.js";

const STORAGE_KEY = 'expenses';

// Storage functions (integrated from storage.js)
function loadExpensesFromStorage() {
    const expensesData = localStorage.getItem(STORAGE_KEY);
    return expensesData ? JSON.parse(expensesData) : [];
}

function saveExpensesToStorage(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

export class ExpenseList {
    constructor() {
        this.expenses = loadExpensesFromStorage().map(
            e => new Expense(e.amount, e.description, e.category, e.date, e.id)
        );
        this.onUpdate = null;
    }

    addExpense(expense) {
        this.expenses.push(expense);
        saveExpensesToStorage(this.expenses);
        if (this.onUpdate) this.onUpdate();
    }

    modifyExpense(expenseId, updateData) {
        const expenseIndex = this.expenses.findIndex(expense => expense.id === expenseId);
        if (expenseIndex === -1) {
            console.log("The provided expense could not be located");
        } else {
            this.expenses[expenseIndex] = {
                ...this.expenses[expenseIndex],
                ...updateData,
                date: new Date(updateData.date),
            };
            saveExpensesToStorage(this.expenses);
            if (this.onUpdate) this.onUpdate();
        }
    }

    removeExpense(expenseId) {
        this.expenses = this.expenses.filter(expense => expense.id !== expenseId);
        saveExpensesToStorage(this.expenses);
        if (this.onUpdate) this.onUpdate();
    }

    getFiltered({ startDate, endDate, category, minAmount, maxAmount }) {
        return this.expenses.filter(exp => {
            const matchDate = (!startDate || exp.date >= new Date(startDate)) &&
                (!endDate || exp.date <= new Date(endDate));
            const matchCategory = !category || exp.category === category;
            const matchAmount = (!minAmount || exp.amount >= parseFloat(minAmount)) &&
                (!maxAmount || exp.amount <= parseFloat(maxAmount));
            return matchDate && matchCategory && matchAmount;
        });
    }

    getMonthlyExpenses(month, year) {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === month && expenseDate.getFullYear() === year;
        });
    }
}