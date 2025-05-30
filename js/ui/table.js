export const renderTable = (data) => {
    const tbody = document.querySelector(".expenses-table tbody");
    tbody.innerHTML = '';

    data.forEach(exp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(exp.date).toISOString().split('T')[0]}</td>
            <td>${exp.category}</td>
            <td>$${exp.amount.toFixed(2)}</td>
            <td>${exp.description}</td>
            <td> 
                <button class="edit-btn" data-id=${exp.id}"> ✏️ </button>
                <button class="delete-btn"data-id=${exp.id}"> 🗑️ </button>
            </td>
        `;

        tbody.appendChild(row);
    })
}

