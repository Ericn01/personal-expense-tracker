export const CATEGORIES = {
    housing: { name: 'Housing', icon: '🏠' },
    food: { name: 'Food & Dining', icon: '🍔' },
    transportation: { name: 'Transportation', icon: '🚗' },
    health: { name: 'Health', icon: '🏥' },
    entertainment: { name: 'Entertainment', icon: '🎬' },
    finances: { name: 'Finances', icon: '💰' },
    other: { name: 'Other', icon: '📝' }
};

// Populate the category dropdown
export function populateCategoryDropdown(dropdown) {
    if (!dropdown) return;
    
    Object.entries(CATEGORIES).forEach(([key, category]) => {
        const option = document.createElement("option");
        option.value = key; 
        option.textContent = category.name;
        dropdown.appendChild(option);
    });
}

// Get category info by key
export function getCategoryInfo(key) {
    return CATEGORIES[key] || { name: key, icon: '📝' };
}

// Get all category keys
export function getAllCategoryKeys() {
    return Object.keys(CATEGORIES);
}