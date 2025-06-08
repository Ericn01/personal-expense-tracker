export const CATEGORIES = {
    housing: { name: 'Housing', icon: '🏠' },
    food: { name: 'Food & Dining', icon: '🍔' },
    transportation: { name: 'Transportation', icon: '🚗' },
    health: { name: 'Health', icon: '🏥' },
    entertainment: { name: 'Entertainment', icon: '🎬' },
    finances: { name: 'Finances', icon: '💰' },
    other: { name: 'Other', icon: '📝' }
};

// Comprehensive category mappings
const CATEGORY_MAPPINGS = {
    housing: [
        // Direct matches
        'housing', 'home', 'house', 'apartment', 'residence', 'dwelling',
        // Rent related
        'rent', 'rental', 'lease', 'monthly rent', 'rent payment', 'apartment rent',
        // Mortgage related
        'mortgage', 'home loan', 'house payment', 'mortgage payment',
        // Utilities
        'utilities', 'electricity', 'electric', 'power', 'gas', 'water', 'sewer',
        'trash', 'garbage', 'recycling', 'utility', 'utility bill', 'electric bill',
        'gas bill', 'water bill', 'power bill', 'heating', 'cooling', 'hvac',
        // Internet/Phone/Cable
        'internet', 'wifi', 'broadband', 'cable', 'phone', 'landline', 'mobile',
        'cell phone', 'cellphone', 'telephone', 'cable tv', 'streaming services',
        // Maintenance
        'maintenance', 'repairs', 'home repair', 'house repair', 'fixing',
        'plumbing', 'electrical', 'handyman', 'contractor',
        // Insurance
        'home insurance', 'renters insurance', 'homeowners insurance', 'property insurance',
        // Property related
        'property tax', 'hoa', 'homeowners association', 'condo fee', 'association fee',
        // Furnishing
        'furniture', 'furnishing', 'decoration', 'decor', 'home decor',
        'appliance', 'appliances', 'household items', 'household'
    ],
    
    food: [
        // Direct matches
        'food', 'dining', 'meal', 'meals', 'eating', 'food & dining',
        // Groceries
        'grocery', 'groceries', 'supermarket', 'market', 'food shopping',
        'walmart', 'kroger', 'safeway', 'whole foods', 'trader joes', 'target',
        'costco', 'sams club', 'aldi', 'publix', 'wegmans',
        // Restaurants
        'restaurant', 'restaurants', 'dining out', 'eating out', 'takeout',
        'take out', 'delivery', 'food delivery', 'uber eats', 'doordash',
        'grubhub', 'postmates', 'seamless',
        // Fast food
        'fast food', 'mcdonalds', 'burger king', 'wendys', 'subway',
        'chipotle', 'taco bell', 'kfc', 'pizza', 'pizza hut', 'dominos',
        // Coffee/Drinks
        'coffee', 'cafe', 'starbucks', 'dunkin', 'coffee shop', 'tea',
        'drinks', 'beverages', 'alcohol', 'beer', 'wine', 'liquor', 'bar',
        // Specific meals
        'breakfast', 'lunch', 'dinner', 'brunch', 'snack', 'snacks'
    ],
    
    transportation: [
        // Direct matches
        'transportation', 'transport', 'travel', 'commute', 'commuting',
        // Vehicle related
        'car', 'auto', 'automobile', 'vehicle', 'truck', 'motorcycle',
        'car payment', 'auto loan', 'car lease', 'vehicle payment',
        // Fuel
        'gas', 'gasoline', 'fuel', 'petrol', 'diesel', 'gas station',
        'shell', 'exxon', 'chevron', 'bp', 'mobil', 'texaco',
        // Maintenance
        'car maintenance', 'auto repair', 'car repair', 'oil change',
        'tire', 'tires', 'mechanic', 'auto service', 'car service',
        // Insurance
        'car insurance', 'auto insurance', 'vehicle insurance',
        // Parking
        'parking', 'parking fee', 'parking meter', 'garage', 'valet',
        // Public transport
        'bus', 'train', 'subway', 'metro', 'transit', 'public transport',
        'public transportation', 'taxi', 'cab', 'uber', 'lyft', 'rideshare',
        // Registration/License
        'registration', 'car registration', 'dmv', 'license', 'drivers license',
        'toll', 'tolls', 'toll road', 'turnpike',
        // Air travel
        'flight', 'airline', 'airfare', 'plane ticket', 'airport'
    ],
    
    health: [
        // Direct matches
        'health', 'medical', 'healthcare', 'health care', 'wellness',
        // Medical services
        'doctor', 'physician', 'hospital', 'clinic', 'emergency', 'urgent care',
        'dentist', 'dental', 'orthodontist', 'optometrist', 'eye doctor',
        'vision', 'glasses', 'contacts', 'eye care',
        // Specialists
        'therapist', 'therapy', 'counseling', 'psychiatrist', 'psychologist',
        'chiropractor', 'physical therapy', 'pt', 'specialist',
        // Pharmacy
        'pharmacy', 'prescription', 'medication', 'medicine', 'drugs',
        'cvs', 'walgreens', 'rite aid', 'pharmaceutical',
        // Insurance
        'health insurance', 'medical insurance', 'dental insurance',
        'vision insurance', 'insurance premium', 'copay', 'co-pay',
        'deductible', 'medical bill',
        // Fitness
        'gym', 'fitness', 'workout', 'exercise', 'yoga', 'pilates',
        'gym membership', 'fitness center', 'health club', 'sports club',
        // Health products
        'vitamins', 'supplements', 'health products', 'first aid',
        'medical supplies', 'health food'
    ],
    
    entertainment: [
        // Direct matches
        'entertainment', 'fun', 'leisure', 'recreation', 'hobby', 'hobbies',
        // Movies/Shows
        'movie', 'movies', 'cinema', 'theater', 'theatre', 'film',
        'netflix', 'hulu', 'disney+', 'disney plus', 'hbo', 'amazon prime',
        'streaming', 'subscription', 'spotify', 'apple music', 'youtube',
        // Gaming
        'game', 'games', 'gaming', 'video game', 'videogame', 'xbox',
        'playstation', 'nintendo', 'steam', 'console', 'arcade',
        // Sports/Activities
        'sports', 'sporting', 'golf', 'bowling', 'tennis', 'swimming',
        'concert', 'show', 'performance', 'ticket', 'tickets', 'event',
        // Social
        'bar', 'club', 'nightclub', 'party', 'social', 'outing',
        // Books/Media
        'book', 'books', 'magazine', 'newspaper', 'kindle', 'audible',
        'music', 'itunes', 'cd', 'vinyl', 'record',
        // Travel/Vacation
        'vacation', 'holiday', 'trip', 'hotel', 'motel', 'airbnb',
        'resort', 'tourism', 'sightseeing', 'amusement park', 'theme park',
        // Hobbies
        'craft', 'crafts', 'art', 'photography', 'hobby supplies'
    ],
    
    finances: [
        // Direct matches
        'finance', 'finances', 'financial', 'money', 'banking',
        // Banking
        'bank', 'bank fee', 'atm', 'atm fee', 'service charge', 'overdraft',
        'wire transfer', 'transfer', 'check', 'deposit',
        // Savings/Investment
        'savings', 'investment', 'investing', 'stock', 'stocks', 'bond',
        'mutual fund', '401k', 'ira', 'retirement', 'pension',
        'brokerage', 'trading', 'dividend', 'interest',
        // Loans/Debt
        'loan', 'loan payment', 'student loan', 'personal loan',
        'credit card', 'credit card payment', 'debt', 'debt payment',
        'interest payment', 'principal',
        // Taxes
        'tax', 'taxes', 'income tax', 'tax payment', 'tax refund',
        'tax preparation', 'accounting', 'bookkeeping', 'cpa',
        // Insurance (general)
        'insurance', 'life insurance', 'insurance payment', 'premium',
        // Financial services
        'financial advisor', 'financial planning', 'legal', 'lawyer',
        'attorney', 'legal fees', 'notary'
    ]
};

/**
 * Maps a user-provided category string to one of the predefined categories
 * @param {string} userCategory - The category string from user's import file
 * @returns {string} - The mapped category key (housing, food, etc.) or 'other'
 */
export function mapUserCategory(userCategory) {
    if (!userCategory) return 'other';
    
    // Convert to lowercase for comparison
    const normalizedCategory = userCategory.toLowerCase().trim();
    
    // First, check if it's already one of our category keys
    if (CATEGORIES[normalizedCategory]) {
        return normalizedCategory;
    }
    
    // Then check against all mappings
    for (const [categoryKey, mappings] of Object.entries(CATEGORY_MAPPINGS)) {
        if (mappings.some(mapping => normalizedCategory.includes(mapping) || mapping.includes(normalizedCategory))) {
            return categoryKey;
        }
    }
    
    // Check for partial matches (if the user category contains any of our mapping words)
    for (const [categoryKey, mappings] of Object.entries(CATEGORY_MAPPINGS)) {
        for (const mapping of mappings) {
            // Split both strings into words and check for word matches
            const userWords = normalizedCategory.split(/\s+/);
            const mappingWords = mapping.split(/\s+/);
            
            if (userWords.some(userWord => 
                mappingWords.some(mappingWord => 
                    userWord.length > 3 && mappingWord.length > 3 && 
                    (userWord.includes(mappingWord) || mappingWord.includes(userWord))
                )
            )) {
                return categoryKey;
            }
        }
    }
    
    // Default to 'other' if no match found
    return 'other';
}

/**
 * Formats a category name to proper case
 * @param {string} category - The category to format
 * @returns {string} - Properly formatted category
 */
export function formatCategoryName(category) {
    if (!category) return 'Other';
    
    // Map to our standard category first
    const mappedKey = mapUserCategory(category);
    const categoryInfo = CATEGORIES[mappedKey];
    
    // Return the standard category name
    return categoryInfo ? categoryInfo.name : 'Other';
}

// Update the existing functions to use the mapping
export function populateCategoryDropdown(dropdown) {
    if (!dropdown) return;
    
    Object.entries(CATEGORIES).forEach(([key, category]) => {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = category.name;
        dropdown.appendChild(option);
    });
}

export function getCategoryInfo(key) {
    return CATEGORIES[key] || { name: key, icon: '📝' };
}

export function getAllCategoryKeys() {
    return Object.keys(CATEGORIES);
}
