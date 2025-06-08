import { Expense } from "../models/Expense.js";
import stateManager from "../models/StateManager.js";
import { showNotification } from "./shared.js";
import { mapUserCategory } from "./categories.js";

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
        
        // Add all expenses using stateManager
        let successCount = 0;
        importedExpenses.forEach(expenseData => {
            try {
                const expense = new Expense(
                    expenseData.amount,
                    expenseData.description,
                    expenseData.category,
                    expenseData.date,
                    expenseData.id
                );
                stateManager.addExpense(expense);
                successCount++;
            } catch (err) {
                console.error('Error adding expense:', err);
            }
        });
        
        // Show success message
        if (statusEl) {
            statusEl.className = 'import-status-message success';
            statusEl.textContent = `✓ Successfully imported ${successCount} expense${successCount !== 1 ? 's' : ''}!`;
        }
        
        // Show notification
        showNotification(`Successfully imported ${successCount} expenses!`, 'success');
        
        // Clear the input
        event.target.value = '';
        
        // Call success callback if provided
        if (onSuccess && typeof onSuccess === 'function') {
            onSuccess(successCount);
        }
        
        // Hide status after 5 seconds
        if (statusEl) {
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 5000);
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
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
    
    const requiredFields = ['date', 'amount', 'category'];
    const missing = requiredFields.filter(field => !headers.includes(field));
    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    return lines.slice(1).map((line, index) => {
        try {
            // Handle CSV with quoted values
            const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
                ?.map(value => value.replace(/^"|"$/g, '').trim()) || [];
            
            const row = Object.fromEntries(headers.map((header, i) => [header, values[i] || '']));
            
            // Map the user's category to our predefined categories
            const mappedCategory = mapUserCategory(row.category);
            
            return {
                amount: parseFloat(row.amount),
                description: row.description || '',
                category: mappedCategory.charAt(0).toUpperCase() + mappedCategory.slice(1),
                date: row.date,
                id: row.id
            };
        } catch (err) {
            throw new Error(`Error parsing line ${index + 2}: ${err.message}`);
        }
    });
}

/**
 * Parses JSON text into expense data objects
 * @param {string} jsonText - Raw JSON content
 * @returns {Array} Array of expense data objects
 */
export function parseJSON(jsonText) {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
        throw new Error("JSON must be an array of expense objects");
    }
    
    return parsed.map((e, index) => {
        if (!e.amount || !e.category || !e.date) {
            throw new Error(`Missing required fields in entry ${index + 1}`);
        }
        
        // Map the user's category to our predefined categories
        const mappedCategory = mapUserCategory(e.category);
        
        return {
            amount: parseFloat(e.amount),
            description: e.description || '',
            category: mappedCategory.charAt(0).toUpperCase() + mappedCategory.slice(1),
            date: e.date,
            id: e.id
        };
    });
}
