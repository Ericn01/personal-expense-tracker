const Categories = {
    HOUSING: 'housing',
    FOOD: 'food',
    TRANSPORTATION: 'transportation',
    HEALTHCARE: 'healthcare',
    EDUCATION: 'education',
    PERSONAL: 'personal',
    ENTERTAINMENT: 'entertainment',
    FAMILY: 'family',
    FINANCES: 'finances',
    DONATIONS: 'donations',
    BUSINESS: 'business'
};


// Populate the category inputs
export const populateCategoryDropdown = (HTMLDropdown) => {
    Object.values(Categories).forEach(category => {
        const option = document.createElement("option");
        option.value = category; 
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        HTMLDropdown.appendChild(option);
    });
}