const STORAGE_KEY = 'expenses';

export const loadExpensesFromStorage = () => {
    const expensesData = localStorage.getItem(STORAGE_KEY);
    return expensesData ? JSON.parse(expensesData) : [];
};

export const saveExpensesToStorage = (expenses) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}