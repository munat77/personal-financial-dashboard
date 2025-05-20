document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const expenseName = document.getElementById('expense-name');
    const expenseAmount = document.getElementById('expense-amount');
    const addBtn = document.getElementById('add-btn');
    const expensesList = document.getElementById('expenses');
    const totalAmount = document.getElementById('total-amount');
    const remainingAmount = document.getElementById('remaining-amount');
    const resetBtn = document.getElementById('reset-btn');
    const budgetInput = document.getElementById('monthly-budget');
    const darkModeToggle = document.querySelector('.dark-mode-toggle');
    const receiptUpload = document.getElementById('receipt-upload');

    // Initialize data
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let budget = localStorage.getItem('budget') || 1000;
    budgetInput.value = budget;

    // Dark mode state
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) document.body.classList.add('dark-mode');

    // Render initial data
    renderExpenses();

    // Event Listeners
    addBtn.addEventListener('click', addExpense);
    expenseAmount.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addExpense();
    });
    resetBtn.addEventListener('click', resetData);
    budgetInput.addEventListener('change', updateBudget);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    receiptUpload.addEventListener('change', handleReceiptUpload);

    // Functions
    function addExpense() {
        const name = expenseName.value.trim();
        const amount = parseFloat(expenseAmount.value);
        const category = document.getElementById('expense-category').value;

        if (name && !isNaN(amount)) {
            const newExpense = {
                name,
                amount,
                category,
                date: new Date().toLocaleDateString(),
                receipt: null
            };
            
            expenses.push(newExpense);
            saveData();
            renderExpenses();
            
            // Clear inputs
            expenseName.value = '';
            expenseAmount.value = '';
            expenseName.focus();
        } else {
            alert("Please enter valid expense details!");
        }
    }

    function renderExpenses() {
        expensesList.innerHTML = '';
        let total = 0;

        // Calculate total
        expenses.forEach(expense => total += expense.amount);

        // Update totals
        totalAmount.textContent = total.toFixed(2);
        const remaining = budget - total;
        remainingAmount.textContent = remaining.toFixed(2);
        
        // Color remaining amount based on budget
        remainingAmount.style.color = remaining >= 0 ? '#27ae60' : '#e74c3c';

        // Render each expense
        expenses.forEach((expense, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <span>${expense.name}</span>
                    <span class="category-tag ${expense.category}">
                        ${getCategoryIcon(expense.category)} ${expense.category}
                    </span>
                    ${expense.receipt ? '<i class="fas fa-paperclip receipt-icon"></i>' : ''}
                </div>
                <span>$${expense.amount.toFixed(2)}</span>
            `;
            expensesList.appendChild(li);
        });

        renderCharts();
        celebrateBudget();
    }

    function renderCharts() {
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.innerHTML = '<h3><i class="fas fa-chart-bar"></i> Spending by Category</h3>';
        
        const categories = {};
        expenses.forEach(expense => {
            categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
        });

        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

        for (const [category, amount] of Object.entries(categories)) {
            const percentage = total > 0 ? (amount / total * 100).toFixed(1) : 0;
            chartContainer.innerHTML += `
                <div class="chart-row">
                    <span class="chart-label">${getCategoryIcon(category)} ${category}</span>
                    <div class="chart-bar-container">
                        <div class="chart-bar" style="width: ${percentage}%; background: ${getCategoryColor(category)};"></div>
                        <span class="chart-value">$${amount.toFixed(2)} (${percentage}%)</span>
                    </div>
                </div>
            `;
        }

        const existingChart = document.querySelector('.chart-container');
        if (existingChart) existingChart.remove();
        document.querySelector('.summary').appendChild(chartContainer);
    }

    function getCategoryIcon(category) {
        const icons = {
            household: '🏠',
            shopping: '👗',
            health: '🏥',
            travel: '✈️',
            education: '📚',
            pets: '🐾',
            gifts: '🎁'
        };
        return icons[category] || '💰';
    }

    function getCategoryColor(category) {
        const colors = {
            household: '#fdcb6e',
            shopping: '#a29bfe',
            health: '#00b894',
            travel: '#0984e3',
            education: '#6c5ce7',
            pets: '#e84393',
            gifts: '#fd79a8'
        };
        return colors[category] || '#f368e0';
    }

    function updateBudget() {
        budget = parseFloat(budgetInput.value) || 0;
        localStorage.setItem('budget', budget);
        renderExpenses();
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }

    function handleReceiptUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                // Store as base64 string
                const receiptData = event.target.result;
                // Add to most recent expense or create new one
                if (expenses.length > 0) {
                    expenses[expenses.length - 1].receipt = receiptData;
                } else {
                    expenses.push({
                        name: 'Receipt Upload',
                        amount: 0,
                        category: 'other',
                        date: new Date().toLocaleDateString(),
                        receipt: receiptData
                    });
                }
                saveData();
                renderExpenses();
            };
            reader.readAsDataURL(file);
        }
    }

    function celebrateBudget() {
        const total = parseFloat(totalAmount.textContent);
        if (total < budget * 0.8) {
            // Simple celebration effect
            const remaining = document.querySelector('.remaining span');
            remaining.style.animation = 'pulse 1s 3';
            setTimeout(() => {
                remaining.style.animation = '';
            }, 3000);
        }
    }

    function resetData() {
        if (confirm("Are you sure you want to delete ALL expenses?")) {
            expenses = [];
            saveData();
            renderExpenses();
        }
    }

    function saveData() {
        localStorage.setItem('expenses', JSON.stringify(expenses));
    }
});