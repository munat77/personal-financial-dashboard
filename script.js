// ===== DOM Elements =====
const dom = {
    // Home Page Elements
    mainCta: document.querySelector('.main-cta'),
    
    // Dashboard Elements
    expenseName: document.getElementById('expense-name'),
    expenseAmount: document.getElementById('expense-amount'),
    expenseCategory: document.getElementById('expense-category'),
    addBtn: document.getElementById('add-btn'),
    expensesList: document.getElementById('expenses'),
    totalAmount: document.getElementById('total-amount'),
    remainingAmount: document.getElementById('remaining-amount'),
    resetBtn: document.getElementById('reset-btn'),
    budgetInput: document.getElementById('monthly-budget'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    receiptUpload: document.getElementById('receipt-upload'),
    homeLink: document.querySelector('.home-link'),
    noExpensesMessage: document.querySelector('.no-expenses-message') // Added
};

// ===== State Management =====
const state = {
    expenses: JSON.parse(localStorage.getItem('expenses')) || [],
    budget: parseFloat(localStorage.getItem('budget')) || 1000, // Ensure budget is parsed as float
    darkMode: localStorage.getItem('darkMode') === 'true',
    categories: {
        household: { icon: '🏠', color: '#fdcb6e' },
        shopping: { icon: '👗', color: '#a29bfe' },
        health: { icon: '🏥', color: '#00b894' },
        travel: { icon: '✈️', color: '#0984e3' },
        education: { icon: '📚', color: '#6c5ce7' },
        pets: { icon: '🐾', color: '#e84393' },
        gifts: { icon: '🎁', color: '#fd79a8' },
        food_drink: { icon: '🍔', color: '#ff7675' }, // Added Food & Drink category
        other: { icon: '📦', color: '#b2bec3' } // Added a default 'other' category
    }
};

// ===== Initialize App =====
function init() {
    // Set initial budget value
    if (dom.budgetInput) {
        dom.budgetInput.value = state.budget.toFixed(0); // Display as whole number
    }

    // Set dark mode if enabled
    if (state.darkMode) {
        document.body.classList.add('dark-mode');
    }

    // Load expenses if on dashboard
    if (dom.expensesList) {
        renderExpenses();
        setupEventListeners();
    } else {
        // Setup event listeners for home page specific elements if not on dashboard
        if (dom.mainCta) {
            dom.mainCta.addEventListener('click', smoothNavigate);
        }
    }
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Dashboard Functionality
    if (dom.addBtn) {
        dom.addBtn.addEventListener('click', addExpense);
        dom.expenseAmount.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addExpense();
        });
        dom.expenseName.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') dom.expenseAmount.focus();
        });
    }

    if (dom.resetBtn) {
        dom.resetBtn.addEventListener('click', resetData);
    }

    if (dom.budgetInput) {
        dom.budgetInput.addEventListener('change', updateBudget);
    }

    if (dom.darkModeToggle) {
        dom.darkModeToggle.addEventListener('click', toggleDarkMode);
    }

    if (dom.receiptUpload) {
        dom.receiptUpload.addEventListener('change', handleReceiptUpload);
    }

    // Navigation (ensure these only run if elements exist on the page)
    if (dom.homeLink) {
        dom.homeLink.addEventListener('click', smoothNavigate);
    }
}

// ===== Core Functions =====
function addExpense() {
    const name = dom.expenseName.value.trim();
    const amount = parseFloat(dom.expenseAmount.value);
    const category = dom.expenseCategory.value;

    if (name && !isNaN(amount) && amount > 0) { // Ensure amount is positive
        const newExpense = {
            id: Date.now(), // Unique ID for each expense
            name,
            amount,
            category,
            date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            receipt: null // Initialize with null
        };
        
        state.expenses.push(newExpense);
        saveData();
        renderExpenses();
        
        // Clear inputs
        dom.expenseName.value = '';
        dom.expenseAmount.value = '';
        dom.expenseName.focus();
        
        // Show success animation
        animateAddButton();
    } else {
        showAlert('Please enter a valid expense name and a positive amount!');
    }
}

function renderExpenses() {
    dom.expensesList.innerHTML = '';
    let total = 0;

    // Calculate total
    state.expenses.forEach(expense => total += expense.amount);

    // Update UI
    if (dom.totalAmount) dom.totalAmount.textContent = `$${total.toFixed(2)}`;
    const remaining = state.budget - total;
    if (dom.remainingAmount) {
        dom.remainingAmount.textContent = `$${remaining.toFixed(2)}`;
        // Visual feedback
        dom.remainingAmount.style.color = remaining >= 0 ? 'var(--gold)' : 'var(--dark-pink)'; // Use CSS variables
        dom.remainingAmount.classList.toggle('negative', remaining < 0);
        dom.remainingAmount.classList.toggle('positive', remaining >= 0);
        if (remaining < 0) {
            animateBudgetWarning();
        }
    }

    // Show/hide no expenses message
    if (dom.noExpensesMessage) {
        dom.noExpensesMessage.style.display = state.expenses.length === 0 ? 'block' : 'none';
    }

    // Render each expense
    state.expenses.forEach(expense => {
        const li = document.createElement('li');
        li.dataset.id = expense.id; // Set data-id on the li for easier targeting
        li.innerHTML = `
            <div class="expense-info">
                <span class="expense-name">${expense.name}</span>
                <div class="expense-meta">
                    <span class="expense-date">${expense.date}</span>
                    <span class="category-tag" style="background: ${state.categories[expense.category]?.color || state.categories.other.color}">
                        ${state.categories[expense.category]?.icon || state.categories.other.icon} ${expense.category.charAt(0).toUpperCase() + expense.category.slice(1).replace(/_/g, ' ')}
                    </span>
                    ${expense.receipt ? '<i class="fas fa-paperclip receipt-icon" title="Has receipt"></i>' : ''}
                </div>
            </div>
            <div class="expense-amount">$${expense.amount.toFixed(2)}</div>
            <div class="expense-actions">
                <button class="edit-btn" data-id="${expense.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-btn" data-id="${expense.id}"><i class="fas fa-trash"></i></button></div>
            `;
        dom.expensesList.appendChild(li);
    });

    // Add event listeners to new buttons (delegation could be more efficient for large lists)
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteExpense(e.target.closest('button').dataset.id);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editExpense(e.target.closest('button').dataset.id);
        });
    });

    renderCharts();
}

function renderCharts() {
    const summarySection = document.querySelector('.summary'); // Target the summary section
    if (!summarySection) return; // Exit if summary section isn't found

    // Remove existing chart container if it exists
    const existingChart = summarySection.querySelector('.chart-container');
    if (existingChart) existingChart.remove();

    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = '<h3><i class="fas fa-chart-pie"></i> Spending Breakdown</h3>';
    
    const categories = {};
    state.expenses.forEach(expense => {
        categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });

    const total = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Only render chart if there are expenses
    if (total > 0) {
        for (const [category, amount] of Object.entries(categories)) {
            const percentage = (amount / total * 100).toFixed(1);
            const categoryInfo = state.categories[category] || state.categories.other; // Fallback to 'other'
            chartContainer.innerHTML += `
                <div class="chart-row">
                    <span class="chart-label">
                        ${categoryInfo.icon} ${category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')}
                    </span>
                    <div class="chart-bar-container">
                        <div class="chart-bar" style="width: ${percentage}%; background: ${categoryInfo.color};"></div>
                        <span class="chart-value">$${amount.toFixed(2)} (${percentage}%)</span>
                    </div>
                </div>
            `;
        }
    } else {
        chartContainer.innerHTML += '<p>No spending data to display yet.</p>';
    }

    summarySection.appendChild(chartContainer);
}

// ===== CRUD Operations =====
function deleteExpense(id) {
    if (confirm('Are you sure you want to delete this expense?')) {
        state.expenses = state.expenses.filter(expense => expense.id !== parseInt(id));
        saveData();
        renderExpenses();
        showAlert('Expense deleted successfully!', 'success');
    }
}

function editExpense(id) {
    const expense = state.expenses.find(e => e.id === parseInt(id));
    if (!expense) return;

    dom.expenseName.value = expense.name;
    dom.expenseAmount.value = expense.amount;
    dom.expenseCategory.value = expense.category;
    
    // Scroll to form if it exists
    const inputSection = document.querySelector('.input-section');
    if (inputSection) {
        inputSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Remove the expense being edited from the list
    state.expenses = state.expenses.filter(e => e.id !== parseInt(id));
    saveData();
    showAlert('Expense loaded for editing. Adjust and click Add Expense to save!', 'success');
}

function resetData() {
    if (confirm('Are you sure you want to delete ALL expenses and reset your budget? This action cannot be undone.')) {
        state.expenses = [];
        state.budget = 1000; // Reset budget to default
        if (dom.budgetInput) dom.budgetInput.value = state.budget.toFixed(0);
        saveData();
        renderExpenses();
        showAlert('All data has been reset!', 'success');
    }
}

// ===== Utility Functions =====
function updateBudget() {
    const newBudget = parseFloat(dom.budgetInput.value);
    if (!isNaN(newBudget) && newBudget >= 0) { // Ensure budget is non-negative
        state.budget = newBudget;
        localStorage.setItem('budget', state.budget);
        renderExpenses();
        showAlert('Budget updated successfully!', 'success');
    } else {
        showAlert('Please enter a valid positive number for your budget.');
        if (dom.budgetInput) dom.budgetInput.value = state.budget.toFixed(0); // Revert to previous valid budget
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    state.darkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', state.darkMode);
}

function handleReceiptUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
        showAlert('Please select an image smaller than 2MB', 'error');
        e.target.value = ''; // Clear the input
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        // Find the most recent expense or add a new one
        if (state.expenses.length > 0) {
            // Find the most recent expense by ID (last one added)
            const lastExpense = state.expenses[state.expenses.length - 1];
            lastExpense.receipt = event.target.result;
            showAlert('Receipt added to your last expense!', 'success');
        } else {
            // Create a new expense for the receipt if no expenses exist
            state.expenses.push({
                id: Date.now(),
                name: 'Receipt Upload',
                amount: 0, // Assume 0 if no amount is specified
                category: 'other', // Default category for standalone receipt
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                receipt: event.target.result
            });
            showAlert('New expense created with receipt!', 'success');
        }
        saveData();
        renderExpenses();
        e.target.value = ''; // Clear the input
    };
    reader.readAsDataURL(file);
}

function saveData() {
    localStorage.setItem('expenses', JSON.stringify(state.expenses));
    localStorage.setItem('budget', state.budget); // Save budget separately
    localStorage.setItem('darkMode', state.darkMode); // Save dark mode state
}

// ===== UI Effects =====
function animateAddButton() {
    if (!dom.addBtn) return;
    dom.addBtn.innerHTML = '<i class="fas fa-check"></i> Added!';
    dom.addBtn.style.backgroundColor = '#2ecc71';
    
    setTimeout(() => {
        dom.addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Expense';
        dom.addBtn.style.backgroundColor = 'var(--gold)'; // Revert to original color
    }, 1500);
}

function animateBudgetWarning() {
    const remainingElement = document.querySelector('.remaining');
    if (remainingElement) {
        remainingElement.style.animation = 'pulse 0.5s 3';
        setTimeout(() => {
            remainingElement.style.animation = '';
        }, 1500);
    }
}

function showAlert(message, type = 'error') {
    const alertBox = document.createElement('div');
    alertBox.className = `alert ${type}`;
    alertBox.textContent = message;
    
    document.body.appendChild(alertBox);
    
    setTimeout(() => {
        alertBox.style.opacity = '0';
        setTimeout(() => alertBox.remove(), 300);
    }, 3000);
}

function smoothNavigate(e) {
    if (e.target.closest('a')) {
        e.preventDefault();
        document.body.style.opacity = '0'; // Fade out
        setTimeout(() => {
            window.location.href = e.target.closest('a').href;
        }, 300); // Wait for fade out
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', init);
