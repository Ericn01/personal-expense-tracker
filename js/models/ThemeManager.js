/**
 * Dark Mode Toggle Functionality
 * Handles theme switching between light and dark modes
 */

export class ThemeManager {
    constructor() {
        this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
        this.init();
    }

    /**
     * Initialize the theme manager
     */
    init() {
        this.applyTheme(this.currentTheme);
        this.createToggleButton();
    }

    /**
     * Get the stored theme from localStorage
     * @returns {string|null} The stored theme or null
     */
    getStoredTheme() {
        try {
            return localStorage.getItem('theme');
        } catch (error) {
            console.warn('localStorage not available:', error);
            return null;
        }
    }

    /**
     * Get the system preferred theme
     * @returns {string} 'dark' or 'light'
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Apply the theme to the document
     * @param {string} theme - 'light' or 'dark'
     */
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        
        // Store the theme preference
        try {
            localStorage.setItem('theme', theme);
        } catch (error) {
            console.warn('Could not save theme preference:', error);
        }

        // Update the toggle button if it exists
        this.updateToggleButton();
        
        // Dispatch custom event for other components that might need to respond
        document.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: theme } 
        }));
    }

    /**
     * Toggle between light and dark themes
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.applyTheme(newTheme);
    }

    /**
     * Create the theme toggle button
     */
    createToggleButton() {
        // Check if button already exists
        if (document.getElementById('theme-toggle')) {
            return;
        }

        const button = document.createElement('button');
        button.id = 'theme-toggle';
        button.className = 'theme-toggle';
        button.setAttribute('aria-label', 'Toggle theme');
        button.innerHTML = `
            <span class="icon light-icon">🌙</span>
            <span class="icon dark-icon">☀️</span>
        `;

        // Add to document to the header
        const header = document.querySelector("header");
        header.appendChild(button);
        
        // Bind click event
        button.addEventListener('click', () => this.toggleTheme());
        
        this.toggleButton = button;
    }

    /**
     * Update the toggle button appearance
     */
    updateToggleButton() {
        if (!this.toggleButton) return;
        
        const lightIcon = this.toggleButton.querySelector('.light-icon');
        const darkIcon = this.toggleButton.querySelector('.dark-icon');
        
        if (this.currentTheme === 'dark') {
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'block';
        } else {
            lightIcon.style.display = 'block';
            darkIcon.style.display = 'none';
        }
    }
}