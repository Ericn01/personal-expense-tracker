export class Expense {
    constructor(amount, description, category, date = new Date(), id=crypto.randomUUID()){
        this.amount = parseFloat(amount);
        this.description = description;
        this.category = category;
        this.date = new Date(date);
        this.id = id;  // create a unique identifier for the expense
    }
}