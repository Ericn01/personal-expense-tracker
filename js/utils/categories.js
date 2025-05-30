export const Categories = Object.freeze({
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


// Populate the category inputs
export const populateCategoryDropdown = (HTMLDropdown) => {
    Object.values(Categories).forEach(symbol => {
        const option = document.createElement("option");
        option.value = symbol.description; 
        option.textContent = symbol.description.charAt(0).toUpperCase() + symbol.description.slice(1);
        HTMLDropdown.appendChild(option);
    });
}