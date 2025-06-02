export const renderTable = (expenses) => {
    const tbody = document.querySelector(".expenses-table tbody");
    tbody.innerHTML = '';

    expenses.sort((a,b) => b.date - a.date).forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(exp.date).toISOString().split('T')[0]}</td>
            <td><span class="category-badge category-${exp.category.toLowerCase()}">${exp.category}</span></td>
            <td><strong>$${exp.amount.toFixed(2)}</strong></td>
            <td>${exp.description}</td>
            <td class="action-buttons"> 
                <button class="btn-icon edit edit-btn" data-id="${exp.id}" title="Edit">✏️</button>
                <button class="btn-icon delete delete-btn" data-id="${exp.id}" title="Delete">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}