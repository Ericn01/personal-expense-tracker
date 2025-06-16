// Month Navigator Class
export class MonthNavigator {
    constructor(expenseList, updateCallback = null) { 
        this.expenseList = expenseList;
        this.currentDate = new Date();

        // Loading from session storage, or fallback to the current date
        const saved = JSON.parse(sessionStorage.getItem('selectedDate'));
        this.selectedMonth = saved?.month ?? this.currentDate.getMonth();
        this.selectedYear = saved?.year ?? this.currentDate.getFullYear();
        
        this.minDate = this.getMinDate();
        this.maxDate = new Date();
        
        // Fixed: Add null checks for DOM elements
        this.prevBtn = document.getElementById('prev-month');
        this.nextBtn = document.getElementById('next-month');
        this.monthDisplay = document.getElementById('current-month-display');
        
        if (!this.prevBtn || !this.nextBtn || !this.monthDisplay) {
            console.warn('Required DOM elements not found. Make sure prev-month, next-month, and current-month-display exist.');
        }
        
        this.updateCallback = updateCallback; // Store the callback
        this.setupEventListeners();
        this.updateDisplay();
    }

    getMinDate() {
        if (this.expenseList.expenses.length === 0) {
            return new Date();
        }
        const dates = this.expenseList.expenses.map(exp => new Date(exp.date));
        const minDate = new Date(Math.min(...dates));
        return new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    }

    setupEventListeners() {
        if (this.prevBtn) {
            this.prevBtn.addEventListener('click', () => this.navigateMonth(-1));
        }
        if (this.nextBtn) {
            this.nextBtn.addEventListener('click', () => this.navigateMonth(1));
        }
        
        // Update min date when expenses change
        this.expenseList.onUpdate = () => {
            this.minDate = this.getMinDate();
            this.updateButtons();
        };
    }

    navigateMonth(direction) {
        this.selectedMonth += direction;
        if (this.selectedMonth < 0) {
            this.selectedMonth = 11;
            this.selectedYear--;
        } else if (this.selectedMonth > 11) {
            this.selectedMonth = 0;
            this.selectedYear++;
        }

        // Store the selected month and year in session storage
        sessionStorage.setItem('selectedDate', JSON.stringify({
            month: this.selectedMonth,
            year: this.selectedYear
        }));

        this.updateDisplay();
        this.onMonthChange();
    }

    updateDisplay() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        if (this.monthDisplay) {
            this.monthDisplay.textContent = `${monthNames[this.selectedMonth]} ${this.selectedYear}`;
        }
        this.updateButtons();
    }

    updateButtons() {
        const selectedDate = new Date(this.selectedYear, this.selectedMonth, 1);
        const currentMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);

        // Disable prev button if at minimum date
        if (this.prevBtn) {
            this.prevBtn.disabled = selectedDate <= this.minDate;
        }
        // Disable next button if at current month
        if (this.nextBtn) {
            this.nextBtn.disabled = selectedDate >= currentMonth;
        }
    }

    getCurrentMonth() {
        return this.selectedMonth;
    }

    getCurrentYear() {
        return this.selectedYear;
    }

    getDateRange() {
        const start = new Date(this.selectedYear, this.selectedMonth, 1);
        const end = new Date(this.selectedYear, this.selectedMonth + 1, 0, 23, 59, 59);
        return { start, end };
    }

    onMonthChange() {
        // Fixed: Use callback instead of direct import
        if (this.updateCallback) {
            this.updateCallback();
        }
    }

    isCurrentMonth() {
        return this.selectedMonth === this.currentDate.getMonth() &&
            this.selectedYear === this.currentDate.getFullYear();
    }
    
    // Fixed: Add method to update callback after initialization
    setUpdateCallback(callback) {
        this.updateCallback = callback;
    }
}