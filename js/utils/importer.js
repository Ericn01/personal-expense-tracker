import { Expense } from "../models/Expense.js";
import stateManager from "../models/StateManager.js";
import { showNotification } from "./shared.js";
import { mapUserCategory } from "./categories.js";

/**
 * Validates expense data before creating Expense object
 * @param {Object} expenseData - Raw expense data to validate
 * @param {number} lineNumber - Line number for error reporting (optional)
 * @returns {Object} Validated expense data
 * @throws {Error} If validation fails
 */
function validateExpenseData(expenseData, lineNumber = null) {
    const errors = [];
    const linePrefix = lineNumber ? `Line ${lineNumber}: ` : '';

    // Validate ID
    if (stateManager.expenseList.expenses.map( exp => exp.id).includes(expenseData.id)){
        errors.push(`${linePrefix}Expense with ID "${expenseData.id}" already exists`);
    }
    
    // Validate amount
    if (expenseData.amount === undefined || expenseData.amount === null || expenseData.amount === '') {
        errors.push(`${linePrefix}Amount is required`);
    } else {
        const numAmount = parseFloat(expenseData.amount);
        if (isNaN(numAmount)) {
            errors.push(`${linePrefix}Amount must be a valid number (got: "${expenseData.amount}")`);
        } else if (numAmount < 0) {
            errors.push(`${linePrefix}Amount cannot be negative (got: ${numAmount})`);
        } else if (numAmount === 0) {
            errors.push(`${linePrefix}Amount must be greater than zero`);
        } else if (!isFinite(numAmount)) {
            errors.push(`${linePrefix}Amount must be a finite number`);
        } else {
            // Update the amount to the parsed number
            expenseData.amount = numAmount;
        }
    }
    
    // Validate date
    if (!expenseData.date || expenseData.date.trim() === '') {
        errors.push(`${linePrefix}Date is required`);
    } else {
        const expenseDate = new Date(expenseData.date);
        const today = new Date();
        
        // Reset time to start of day for fair comparison
        today.setHours(23, 59, 59, 999);
        
        if (isNaN(expenseDate.getTime())) {
            errors.push(`${linePrefix}Date must be a valid date format (got: "${expenseData.date}")`);
        } else if (expenseDate > today) {
            errors.push(`${linePrefix}Date cannot be in the future (got: "${expenseData.date}")`);
        }
    }
    
    // Validate category
    if (!expenseData.category || expenseData.category.trim() === '') {
        errors.push(`${linePrefix}Category is required`);
    }
    
    // Validate description (optional, but clean it up)
    if (expenseData.description === undefined || expenseData.description === null) {
        expenseData.description = '';
    } else {
        expenseData.description = String(expenseData.description).trim();
    }
    
    if (errors.length > 0) {
        throw new Error(errors.join('; '));
    }
    
    return expenseData;
}

/**
 * Handles expense import from file input events
 * Can be used by both welcome modal and expenses page
 * @param {Event} event - The file input change event
 * @param {Object} options - Configuration options
 * @param {string} options.statusElementId - ID of the element to show status messages
 * @param {Function} options.onSuccess - Callback function after successful import
 * @param {Function} options.onError - Callback function after import error
 */
export async function handleExpenseImport(event, options = {}) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Default options
    const {
        statusElementId = 'import-status',
        onSuccess = null,
        onError = null
    } = options;
    
    const statusEl = document.getElementById(statusElementId);
    
    // Show processing status if element exists
    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.className = 'import-status-message info';
        statusEl.textContent = 'Processing file...';
    }
    
    try {
        const text = await file.text();
        const fileType = file.name.split('.').pop().toLowerCase();
        let importedExpenses = [];
        
        if (fileType === 'csv') {
            importedExpenses = parseCSV(text);
        } else if (fileType === 'json') {
            importedExpenses = parseJSON(text);
        } else {
            throw new Error('Unsupported file type. Please use CSV or JSON.');
        }
        
        // Add all expenses using stateManager with enhanced validation
        let successCount = 0;
        const validationErrors = [];
        
        importedExpenses.forEach((expenseData, index) => {
            try {
                // Validate the expense data first
                const validatedData = validateExpenseData(expenseData, index + 2); // +2 for header row in CSV
                
                const expense = new Expense(
                    validatedData.amount,
                    validatedData.description,
                    validatedData.category,
                    validatedData.date,
                    validatedData.id
                );
                stateManager.addExpense(expense);
                successCount++;
            } catch (err) {
                console.error('Error adding expense:', err);
                validationErrors.push(err.message);
            }
        });
        
        // Determine success message based on results
        let statusMessage;
        let notificationMessage;
        let statusClass;
        
        if (successCount === importedExpenses.length) {
            // All successful
            statusMessage = `✓ Successfully imported ${successCount} expense${successCount !== 1 ? 's' : ''}!`;
            notificationMessage = `Successfully imported ${successCount} expenses!`;
            statusClass = 'success';
        } else if (successCount > 0) {
            // Partial success
            const failedCount = importedExpenses.length - successCount;
            statusMessage = `⚠ Imported ${successCount} of ${importedExpenses.length} expenses. ${failedCount} failed validation.`;
            notificationMessage = `Partially imported: ${successCount} successful, ${failedCount} failed`;
            statusClass = 'warning';
            
            // Log validation errors for debugging
            console.warn('Validation errors:', validationErrors);
        } else {
            // All failed
            throw new Error(`No expenses could be imported. Validation errors: ${validationErrors.slice(0, 3).join('; ')}${validationErrors.length > 3 ? '...' : ''}`);
        }
        
        // Show status message
        if (statusEl) {
            statusEl.className = `import-status-message ${statusClass}`;
            statusEl.textContent = statusMessage;
        }
        
        // Show notification
        showNotification(notificationMessage, statusClass === 'warning' ? 'warning' : 'success');
        
        // Clear the input
        event.target.value = '';
        
        // Call success callback if provided (even for partial success)
        if (onSuccess && typeof onSuccess === 'function') {
            onSuccess(successCount, validationErrors);
        }

        // Hide status after 7 seconds (longer for warning messages)
        if (statusEl) {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, statusClass === 'warning' ? 7000 : 5000);
        }
        
    } catch (error) {
        console.error('Import error:', error);
        
        if (statusEl) {
            statusEl.className = 'import-status-message error';
            statusEl.textContent = `✗ ${error.message || 'Error importing file. Please check the format.'}`;
        }
        
        // Show notification
        showNotification(error.message || 'Error importing file', 'error');
        
        // Clear the input
        event.target.value = '';
        
        // Call error callback if provided
        if (onError && typeof onError === 'function') {
            onError(error);
        }
        
        // Hide error after 5 seconds
        if (statusEl) {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
        }
    }
}

/**
 * Parses CSV text into expense data objects
 * @param {string} csvText - Raw CSV content
 * @returns {Array} Array of expense data objects
 */
export function parseCSV(csvText) {
    if (!csvText || csvText.trim() === '') {
        throw new Error('CSV file is empty');
    }
    
    const lines = csvText.trim().split('\n');
    
    if (lines.length < 2) {
        throw new Error('CSV must contain at least a header row and one data row');
    }
    
    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    
    const requiredFields = ['date', 'amount', 'category'];
    const missing = requiredFields.filter(field => !headers.includes(field));
    if (missing.length > 0) {
        throw new Error(`Missing required CSV columns: ${missing.join(', ')}`);
    }
    
    const expenses = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        try {
            // Handle CSV with quoted values
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                ?.map(value => value.replace(/^"|"$/g, '').trim()) || [];
            
            if (values.length === 0) continue; // Skip empty rows
            
            const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
            
            // Map the user's category to our predefined categories
            const mappedCategory = mapUserCategory(row.category);
            
            expenses.push({
                amount: row.amount,
                description: row.description || '',
                category: mappedCategory.charAt(0).toUpperCase() + mappedCategory.slice(1),
                date: row.date,
                id: row.id
            });
        } catch (err) {
            throw new Error(`Error parsing CSV line ${i + 1}: ${err.message}`);
        }
    }
    
    if (expenses.length === 0) {
        throw new Error('No valid expense data found in CSV file');
    }
    
    return expenses;
}

/**
 * Parses JSON text into expense data objects
 * @param {string} jsonText - Raw JSON content
 * @returns {Array} Array of expense data objects
 */
export function parseJSON(jsonText) {
    if (!jsonText || jsonText.trim() === '') {
        throw new Error('JSON file is empty');
    }
    
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    } catch (err) {
        throw new Error(`Invalid JSON format: ${err.message}`);
    }
    
    if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of expense objects");
    }
    
    if (parsed.length === 0) {
        throw new Error("JSON array cannot be empty");
    }
    
    return parsed.map((e, index) => {
        if (!e || typeof e !== 'object') {
            throw new Error(`Entry ${index + 1} must be an object`);
        }
        
        // Map the user's category to our predefined categories
        const mappedCategory = e.category ? mapUserCategory(e.category) : '';
        
        return {
            amount: e.amount,
            description: e.description || '',
            category: mappedCategory ? mappedCategory.charAt(0).toUpperCase() + mappedCategory.slice(1) : '',
            date: e.date,
            id: e.id
        };
    });
}