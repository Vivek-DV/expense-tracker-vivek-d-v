const transactionForm = document.getElementById("transactionForm");

const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const descriptionInput = document.getElementById("description");

const totalIncome = document.getElementById("totalIncome");
const totalExpense = document.getElementById("totalExpense");
const balance = document.getElementById("balance");

const transactionList = document.getElementById("transactionList");
const transactionCount = document.getElementById("transactionCount");

const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");

const submitBtn = document.getElementById("submitBtn");
const cancelBtn = document.getElementById("cancelBtn");
const formTitle = document.getElementById("formTitle");

const typeButtons = document.querySelectorAll(".type-btn");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let selectedType = "income";
let editingId = null;


/* -----------------------------
   Set Today's Date
----------------------------- */

dateInput.value = new Date().toISOString().split("T")[0];


/* -----------------------------
   Transaction Type Selection
----------------------------- */

typeButtons.forEach(button => {

    button.addEventListener("click", () => {

        typeButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        selectedType = button.dataset.type;
    });

});


/* -----------------------------
   Add / Edit Transaction
----------------------------- */

transactionForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const amount = parseFloat(amountInput.value);
    const category = categoryInput.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!amount || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    if (!category) {
        alert("Please select a category.");
        return;
    }

    if (!date) {
        alert("Please select a date.");
        return;
    }


    if (editingId !== null) {

        const index = transactions.findIndex(
            transaction => transaction.id === editingId
        );

        if (index !== -1) {

            transactions[index] = {
                ...transactions[index],
                type: selectedType,
                amount: amount,
                category: category,
                date: date,
                description: description
            };

        }

        editingId = null;

        submitBtn.textContent = "Add Transaction";
        formTitle.textContent = "Add Transaction";
        cancelBtn.style.display = "none";

    } else {

        const transaction = {

            id: Date.now(),

            type: selectedType,

            amount: amount,

            category: category,

            date: date,

            description: description

        };

        transactions.push(transaction);

    }


    saveTransactions();

    transactionForm.reset();

    dateInput.value = new Date().toISOString().split("T")[0];

    selectedType = "income";

    typeButtons.forEach(btn => {
        btn.classList.remove("active");
    });

    document
        .querySelector('[data-type="income"]')
        .classList.add("active");

    renderTransactions();

});


/* -----------------------------
   Save to Local Storage
----------------------------- */

function saveTransactions() {

    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );

}


/* -----------------------------
   Render Transactions
----------------------------- */

function renderTransactions() {

    const typeValue = typeFilter.value;
    const categoryValue = categoryFilter.value;

    let filteredTransactions = transactions.filter(transaction => {

        const typeMatch =
            typeValue === "all" ||
            transaction.type === typeValue;

        const categoryMatch =
            categoryValue === "all" ||
            transaction.category === categoryValue;

        return typeMatch && categoryMatch;

    });


    /* Sort newest first */

    filteredTransactions.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
    );


    transactionList.innerHTML = "";


    if (filteredTransactions.length === 0) {

        transactionList.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">₹</div>

                <h3>No transactions found</h3>

                <p>
                    Add a transaction or change your filters.
                </p>

            </div>
        `;

    } else {

        filteredTransactions.forEach(transaction => {

            const transactionElement =
                document.createElement("div");

            transactionElement.className = "transaction";

            const sign =
                transaction.type === "income" ? "+" : "-";

            const icon =
                transaction.type === "income" ? "↗" : "↘";

            const formattedDate =
                formatDate(transaction.date);

            transactionElement.innerHTML = `

                <div class="transaction-left">

                    <div class="transaction-icon ${transaction.type}">
                        ${icon}
                    </div>

                    <div class="transaction-info">

                        <h3>
                            ${escapeHTML(
                                transaction.description ||
                                transaction.category
                            )}
                        </h3>

                        <p>
                            ${formattedDate}
                        </p>

                        <span class="category">
                            ${escapeHTML(transaction.category)}
                        </span>

                    </div>

                </div>


                <div class="transaction-right">

                    <div class="amount ${transaction.type}">
                        ${sign}${formatCurrency(transaction.amount)}
                    </div>

                    <div class="transaction-actions">

                        <button
                            class="action-btn edit-btn"
                            onclick="editTransaction(${transaction.id})">
                            Edit
                        </button>

                        <button
                            class="action-btn delete-btn"
                            onclick="deleteTransaction(${transaction.id})">
                            Delete
                        </button>

                    </div>

                </div>

            `;

            transactionList.appendChild(transactionElement);

        });

    }


    transactionCount.textContent =
        `${filteredTransactions.length} ${
            filteredTransactions.length === 1
                ? "transaction"
                : "transactions"
        }`;

    updateSummary();

}


/* -----------------------------
   Update Summary
----------------------------- */

function updateSummary() {

    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {

        if (transaction.type === "income") {

            income += Number(transaction.amount);

        } else {

            expense += Number(transaction.amount);

        }

    });


    const currentBalance = income - expense;


    totalIncome.textContent =
        formatCurrency(income);

    totalExpense.textContent =
        formatCurrency(expense);

    balance.textContent =
        formatCurrency(currentBalance);

}


/* -----------------------------
   Edit Transaction
----------------------------- */

function editTransaction(id) {

    const transaction =
        transactions.find(transaction => transaction.id === id);

    if (!transaction) {
        return;
    }


    editingId = id;


    amountInput.value = transaction.amount;

    categoryInput.value = transaction.category;

    dateInput.value = transaction.date;

    descriptionInput.value =
        transaction.description;


    selectedType = transaction.type;


    typeButtons.forEach(button => {

        button.classList.remove("active");

        if (button.dataset.type === transaction.type) {
            button.classList.add("active");
        }

    });


    submitBtn.textContent = "Update Transaction";

    formTitle.textContent = "Edit Transaction";

    cancelBtn.style.display = "block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* -----------------------------
   Delete Transaction
----------------------------- */

function deleteTransaction(id) {

    const confirmDelete =
        confirm("Are you sure you want to delete this transaction?");

    if (!confirmDelete) {
        return;
    }


    transactions =
        transactions.filter(
            transaction => transaction.id !== id
        );


    saveTransactions();

    renderTransactions();

}


/* -----------------------------
   Cancel Editing
----------------------------- */

cancelBtn.addEventListener("click", () => {

    editingId = null;

    transactionForm.reset();

    dateInput.value =
        new Date().toISOString().split("T")[0];

    selectedType = "income";


    typeButtons.forEach(button => {
        button.classList.remove("active");
    });

    document
        .querySelector('[data-type="income"]')
        .classList.add("active");


    submitBtn.textContent =
        "Add Transaction";

    formTitle.textContent =
        "Add Transaction";

    cancelBtn.style.display =
        "none";

});


/* -----------------------------
   Filters
----------------------------- */

typeFilter.addEventListener(
    "change",
    renderTransactions
);

categoryFilter.addEventListener(
    "change",
    renderTransactions
);


/* -----------------------------
   Format Currency
----------------------------- */

function formatCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {

        style: "currency",

        currency: "INR",

        minimumFractionDigits: 2

    }).format(amount);

}


/* -----------------------------
   Format Date
----------------------------- */

function formatDate(date) {

    const dateObject =
        new Date(date + "T00:00:00");

    return dateObject.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* -----------------------------
   Prevent HTML Injection
----------------------------- */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* -----------------------------
   Initial Render
----------------------------- */

renderTransactions();
/* =========================================
   DAY / NIGHT MODE
========================================= */

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");


// Load saved theme

const savedTheme = localStorage.getItem("theme");

if (savedTheme === "light") {

    document.body.classList.add("light-mode");

    themeIcon.textContent = "🌙";

} else {

    themeIcon.textContent = "☀️";

}
