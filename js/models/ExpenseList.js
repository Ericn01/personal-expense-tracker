import { Expense } from "./Expense.js";
import { loadExpensesFromStorage, saveExpensesToStorage } from "../utils/storage.js";

export class ExpenseList {
    constructor(){
        this.expenses = loadExpensesFromStorage().map(
            e => new Expense(e.amount, e.description, e.category, e.date, e.id)
        );
    }

    addExpense(expense){
        console.log(expense)
        this.expenses.push(expense);
        saveExpensesToStorage(this.expenses)
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
}