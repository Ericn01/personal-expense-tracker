# Personal Finance Tracker

A clean, modern web application for tracking personal expenses and managing budgets. Built with vanilla JavaScript and hosted on GitHub Pages.

## Features

- **📊 Dashboard** - Overview of spending patterns with interactive charts
- **💳 Expense Management** - Add, edit, delete, and search expenses
- **📈 Budget Planning** - Set monthly budgets by category and track progress
- **📋 Financial Reports** - Generate detailed reports with export options

## Tech Stack

- Pure JavaScript (ES6 modules)
- CSS with custom properties
- Chart.js for data visualization
- Local storage for data persistence
- No build tools required

## Quick Start

Simply visit the **[live demo](https://ericn01.github.io/personal-expense-tracker/)** or clone and open `index.html` in your browser.

```bash
git clone https://github.com/ericn01/personal-expense-tracker.git
cd personal-expense-tracker
# Open index.html in your browser
```

## Project Structure

```
├── index.html          # Dashboard
├── expenses.html       # Expense management
├── budgets.html        # Budget planning
├── reports.html        # Financial reports
├── js/
│   ├── models/         # Data models (Expense, Budget, etc.)
│   ├── dashboard.js    # Dashboard functionality
│   ├── expenses.js     # Expense page logic
│   ├── budgets.js      # Budget page logic
│   └── shared.js       # Shared utilities
└── styles/
    ├── base.css        # Base styles and variables
    ├── components.css  # Reusable components
    ├── layout.css      # Layout structures
    └── pages.css       # Page-specific styles
```

## Browser Support

Modern browsers with ES6 module support (Chrome, Firefox, Safari, Edge).
