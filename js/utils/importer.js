import { Expense } from "../models/Expense";
import { expenseList } from "./shared"; // The share expense list for the application

document.getElementById('fileInput').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) return; // Exit out if no file has been selected

    const text = await file.text();
    const fileType = file.name.split('.').pop().toLowerCase();

    try {
        if (fileType === 'csv'){
            const expenses = parseCSV(text)
            expenses.forEach(exp => expenseList.addExpense(exp));
        } else if (fileType === 'json'){
            const expenses = parseJSON(text);
            expenses.forEach(exp => expenseList.addExpense); 
        } else{
            alert('Unsupported file type.');
        }
    } catch (e){
        console.error('Failed to import file: ', e);
        alert("Error processing the file. Please check the format.");
    }
})


/**
 * Parses CSV text into an array of Expense objects.
 * 
 * @param {string} csvText - The raw CSV file content as a string.
 * @returns {Expense[]} - An array of Expense instances.
 * @throws {Error} - If required headers are missing or parsing fails.
 */
const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());

    const requiredFields = ['date', 'amount', 'category'];
    const missing = requiredFields.filter(field => !headers.includes(field));
    if (missing.length > 0) throw new Error(`Missing required fields: ${missing.join(', ')}`)
    
    return lines.slice(1).map(line => {
        const values = line.split(',').map(value => value.trim());
        const row = Object.fromEntries(headers.map( (header, index) => [header, values[index]]));

        return new Expense (
            row.amount,
            row.description || '',
            row.category,
            row.date,
            row.id // may be undefine, in that case it's auto-generated
        );
    });
}

/**
 * Parses JSON text into an array of Expense objects.
 * 
 * @param {string} jsonText - The raw JSON file content as a string.
 * @returns {Expense[]} - An array of Expense instances.
 * @throws {Error} - If the content is not an array or entries are missing required fields.
 */
const parseJSON = (jsonText) => {
    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) throw new Error("JSON must be an array of expense objects");

    return parsed.map(e => {
        if (!e.amount || !e.category || !e.date) throw new Error("Missing required fields in JSON entry");
        return new Expense(e.amount, e.description, e.category, e.date || '', e.category, e.date, e.id);
    });
}
