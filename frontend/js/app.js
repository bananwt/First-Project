// Expense Tracker - frontend logic

// PHASE 2
// Your backend from Phase 1 is already running, with real expenses in the
// database (from schema.sql). Build this page directly against it with
// fetch and async/await - there is no in-memory or localStorage stage
// this time, and no sample data file.
//
// A possible structure (change it if you have a better idea):
//   - async function getExpenses()          fetch(API_URL), return the JSON
//   - async function addExpense(data)       fetch(API_URL, { method: "POST", ... })
//   - async function updateExpense(id,data) fetch(API_URL + "/" + id, { method: "PUT", ... })
//   - async function deleteExpense(id)      fetch(API_URL + "/" + id, { method: "DELETE" })
//   - async function refresh()              get the list, then call renderTable and renderSummary
//   - renderTable(list)                     build the table rows from the array the API returned
//   - renderSummary(list)                   update the summary cards
//   - applyFilter()                         re-render with the list filtered by category
//
// Don't forget:
//   - Show a Bootstrap spinner while a request is in flight.
//   - Wrap every fetch call in try/catch, and show a Bootstrap alert on failure.
//   - After add, edit, or delete, call refresh() so the page always shows
//     what the server actually saved - never update the table by hand.
//   - The API is at http://localhost:3000/api/expenses (see the Roadmap).
// Base API endpoint - adjust port if process.env.PORT differs
// Base API endpoint
const API_URL = 'http://localhost:3000/api/expenses';

// State
let allExpenses = [];
const editModal = new bootstrap.Modal(document.getElementById('editModal'));

// DOM Elements
const tableBody = document.getElementById('expensesTableBody');
const spinner = document.getElementById('spinner');
const alertBox = document.getElementById('alertBox');
const addForm = document.getElementById('addExpenseForm');
const editForm = document.getElementById('editExpenseForm');
const categoryFilter = document.getElementById('categoryFilter');

const totalAmountEl = document.getElementById('totalAmount');
const totalCountEl = document.getElementById('totalCount');
const highestExpenseAmountEl = document.getElementById('highestExpenseAmount');
const highestExpenseTitleEl = document.getElementById('highestExpenseTitle');

const searchInput = document.getElementById('searchInput');
const exportCsvBtn = document.getElementById('exportCsvBtn');

// --- Helper Functions ---

function showSpinner() {
  if (spinner) spinner.classList.remove('d-none');
}

function hideSpinner() {
  if (spinner) spinner.classList.add('d-none');
}

function showError(message) {
  if (!alertBox) return;
  alertBox.textContent = message;
  alertBox.classList.remove('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => alertBox.classList.add('d-none'), 5000);
}

function getCategoryBadgeClass(category) {
  const colorMap = {
    'Food': 'bg-success text-white',
    'Transport': 'bg-primary text-white',
    'Bills': 'bg-warning text-dark',
    'Entertainment': 'bg-info text-dark',
    'Other': 'bg-secondary text-white'
  };

  return colorMap[category] || 'bg-light text-dark';
}

// --- API Layer ---

async function getExpenses() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to retrieve expenses from server.');
  }
  return await res.json();
}

async function addExpense(data) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create expense.');
  }
  return await res.json();
}

async function updateExpense(id, data) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update expense.');
  }
  return await res.json();
}

async function deleteExpense(id) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete expense.');
  }
  return await res.json();
}

// --- Rendering Layer ---

function renderTable(list) {
  tableBody.innerHTML = '';

  if (list.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No expenses found.</td></tr>`;
    return;
  }

  list.forEach(item => {
    const tr = document.createElement('tr');

    // 1. Title (safe textContent)
    const tdTitle = document.createElement('td');
    tdTitle.className = 'fw-semibold';
    tdTitle.textContent = item.title;

    // 2. Amount
    const tdAmount = document.createElement('td');
    tdAmount.textContent = `$${parseFloat(item.amount).toFixed(2)}`;

    // 3. Category
    const tdCategory = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `badge rounded-pill ${getCategoryBadgeClass(item.category)}`;
    badge.textContent = item.category;
    tdCategory.appendChild(badge);

    // 4. Date
    const tdDate = document.createElement('td');
    tdDate.textContent = item.date;

    // 5. Actions
    const tdActions = document.createElement('td');
    tdActions.className = 'text-end';

    // Edit Button
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-outline-primary me-1';
    editBtn.textContent = 'Edit';
    editBtn.dataset.action = 'edit';
    editBtn.dataset.id = item.id;

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-sm btn-outline-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = item.id;

    tdActions.append(editBtn, deleteBtn);

    tr.append(tdTitle, tdAmount, tdCategory, tdDate, tdActions);
    tableBody.appendChild(tr);
  });
}

function renderSummary(list) {
  const count = list.length;
  const total = list.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  let highest = { amount: 0, title: '-' };
  list.forEach(item => {
    const amt = parseFloat(item.amount);
    if (amt > highest.amount) {
      highest = { amount: amt, title: item.title };
    }
  });

  totalCountEl.textContent = count;
  totalAmountEl.textContent = `$${total.toFixed(2)}`;
  highestExpenseAmountEl.textContent = `$${highest.amount.toFixed(2)}`;
  highestExpenseTitleEl.textContent = highest.title;
}

function applyFilter() {
  const selectedCategory = categoryFilter.value;
  const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

  const filtered = allExpenses.filter(exp => {
    const matchesCategory = selectedCategory === 'All' || exp.category === selectedCategory;
    const matchesSearch = exp.title.toLowerCase().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  renderTable(filtered);
}

// --- Controller / Sync ---

async function refresh() {
  showSpinner();
  try {
    allExpenses = await getExpenses();
    renderSummary(allExpenses);
    applyFilter();
  } catch (err) {
    showError(err.message);
  } finally {
    hideSpinner();
  }
}

// --- Event Handlers ---
// Search input listener
if (searchInput) {
  searchInput.addEventListener('input', applyFilter);
}

// CSV Export Handler
if (exportCsvBtn) {
  exportCsvBtn.addEventListener('click', () => {
    if (allExpenses.length === 0) {
      alert('No expenses to export.');
      return;
    }

    const headers = ['ID', 'Title', 'Amount', 'Category', 'Date'];
    const rows = allExpenses.map(e => [
      e.id,
      `"${e.title.replace(/"/g, '""')}"`,
      parseFloat(e.amount).toFixed(2),
      `"${e.category}"`,
      e.date
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
// Add Expense Form Submit
addForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('addTitle').value.trim();
  const amount = parseFloat(document.getElementById('addAmount').value);
  const category = document.getElementById('addCategory').value;
  const date = document.getElementById('addDate').value;

  if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
    addForm.classList.add('was-validated');
    return;
  }

  showSpinner();
  try {
    await addExpense({ title, amount, category, date });
    addForm.reset();
    addForm.classList.remove('was-validated');
    await refresh();
  } catch (err) {
    showError(err.message);
  } finally {
    hideSpinner();
  }
});

// Edit Expense Form Submit
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = parseInt(document.getElementById('editId').value, 10);
  const title = document.getElementById('editTitle').value.trim();
  const amount = parseFloat(document.getElementById('editAmount').value);
  const category = document.getElementById('editCategory').value;
  const date = document.getElementById('editDate').value;

  if (!title || isNaN(amount) || amount <= 0 || !category || !date) {
    editForm.classList.add('was-validated');
    return;
  }

  showSpinner();
  try {
    await updateExpense(id, { title, amount, category, date });
    editModal.hide();
    await refresh();
  } catch (err) {
    showError(err.message);
  } finally {
    hideSpinner();
  }
});

// Table Event Delegation (Edit & Delete buttons)
tableBody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;
  const id = parseInt(btn.dataset.id, 10);

  if (action === 'edit') {
    const item = allExpenses.find(exp => exp.id === id);
    if (!item) return;

    document.getElementById('editId').value = item.id;
    document.getElementById('editTitle').value = item.title;
    document.getElementById('editAmount').value = item.amount;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editDate').value = item.date;

    editModal.show();
  } else if (action === 'delete') {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    showSpinner();
    try {
      await deleteExpense(id);
      await refresh();
    } catch (err) {
      showError(err.message);
    } finally {
      hideSpinner();
    }
  }
});

// Filter change listener
categoryFilter.addEventListener('change', applyFilter);

// Initial Load
document.addEventListener('DOMContentLoaded', refresh);