const CATEGORIES = {
  Housing: { color: "#60a5fa", icon: "⌂", budget: 15000 },
  Groceries: { color: "#34d399", icon: "🛒", budget: 5000 },
  Dining: { color: "#fbbf24", icon: "☕", budget: 2500 },
  Transport: { color: "#a78bfa", icon: "↗", budget: 2000 },
  Entertainment: { color: "#f472b6", icon: "♫", budget: 1500 },
  Health: { color: "#22d3ee", icon: "✚", budget: 2000 },
  Shopping: { color: "#fb923c", icon: "◇", budget: 3000 },
  Utilities: { color: "#c4b5fd", icon: "ϟ", budget: 2500 },
  Income: { color: "#34d399", icon: "₱", budget: 0 },
  Education: { color: "#f87171", icon: "▤", budget: 3000 },
  Other: { color: "#94a3b8", icon: "•", budget: 2000 }
};

const initialTransactions = [
  { id: 1, name: "Monthly allowance", category: "Income", date: "2026-10-07", amount: 12000 },
  { id: 2, name: "Grocery shopping", category: "Groceries", date: "2026-10-06", amount: -1250 },
  { id: 3, name: "Jeepney and commute", category: "Transport", date: "2026-10-05", amount: -180 },
  { id: 4, name: "Electricity bill", category: "Utilities", date: "2026-10-04", amount: -1450 },
  { id: 5, name: "Lunch with friends", category: "Dining", date: "2026-10-04", amount: -320 },
  { id: 6, name: "Freelance project", category: "Income", date: "2026-10-03", amount: 3500 },
  { id: 7, name: "School supplies", category: "Education", date: "2026-10-02", amount: -450 },
  { id: 8, name: "Streaming subscription", category: "Entertainment", date: "2026-10-01", amount: -249 },
  { id: 9, name: "Medicine", category: "Health", date: "2026-09-29", amount: -385 },
  { id: 10, name: "Rent contribution", category: "Housing", date: "2026-09-28", amount: -4500 },
  { id: 11, name: "Shoes", category: "Shopping", date: "2026-09-26", amount: -1200 },
  { id: 12, name: "Part-time work", category: "Income", date: "2026-09-25", amount: 2500 }
];

let transactions = loadTransactions();
let cashflowChart = null;
let spendingChart = null;
let toastTimeout;

function loadTransactions() {
  try {
    const saved = localStorage.getItem("vaultly-transactions");
    return saved ? JSON.parse(saved) : initialTransactions;
  } catch { return initialTransactions; }
}
function saveTransactions() {
  localStorage.setItem("vaultly-transactions", JSON.stringify(transactions));
}
function money(value, decimals = 2) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(Math.abs(value));
}
function dateLabel(dateString) {
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
function currentMonthTransactions() {
  const now = new Date();
  return transactions.filter(t => {
    const d = new Date(t.date + "T12:00:00");
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}
function getTotals(items = currentMonthTransactions()) {
  const income = items.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = items.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  return { income, expenses, balance: income - expenses, savingsRate: income ? Math.round(((income - expenses) / income) * 100) : 0 };
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}
function categoryStyle(category) {
  const meta = CATEGORIES[category] || CATEGORIES.Other;
  return `color:${meta.color};background:${meta.color}1c`;
}
function transactionRow(t, includeDelete = false) {
  const category = CATEGORIES[t.category] || CATEGORIES.Other;
  const income = t.amount > 0;
  return `<tr>
    <td><div class="transaction-cell"><span class="txn-icon" style="${categoryStyle(t.category)}">${category.icon}</span><div><div class="txn-title">${escapeHtml(t.name)}</div><div class="txn-subtitle">${income ? "Money received" : "Money spent"}</div></div></div></td>
    <td><span class="category-pill" style="${categoryStyle(t.category)}">${escapeHtml(t.category)}</span></td>
    <td class="txn-subtitle">${dateLabel(t.date)}</td>
    <td class="amount ${income ? "income" : ""}">${income ? "+" : "−"}${money(t.amount)}</td>
    ${includeDelete ? `<td><button class="delete-button" data-delete="${t.id}" title="Delete transaction" aria-label="Delete ${escapeHtml(t.name)}">×</button></td>` : ""}
  </tr>`;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function renderStats() {
  const totals = getTotals();
  document.getElementById("balanceValue").textContent = money(totals.balance);
  document.getElementById("incomeValue").textContent = money(totals.income);
  document.getElementById("expenseValue").textContent = money(totals.expenses);
  document.getElementById("savingsValue").textContent = `${totals.savingsRate}%`;
  const monthItems = currentMonthTransactions();
  document.getElementById("incomeCount").textContent = `${monthItems.filter(t => t.amount > 0).length} income entries this month`;
  document.getElementById("expenseCount").textContent = `${monthItems.filter(t => t.amount < 0).length} expense entries this month`;
}
function renderRecentTransactions() {
  const sorted = [...transactions].sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id).slice(0, 6);
  document.getElementById("recentTransactions").innerHTML = sorted.length ? sorted.map(t => transactionRow(t)).join("") : `<tr><td colspan="4" class="empty-state">No transactions yet.</td></tr>`;
}
function renderAllTransactions() {
  const query = document.getElementById("transactionSearch").value.trim().toLowerCase();
  const type = document.getElementById("typeFilter").value;
  const filtered = [...transactions].sort((a,b) => b.date.localeCompare(a.date) || b.id-a.id).filter(t => {
    const matchesText = t.name.toLowerCase().includes(query) || t.category.toLowerCase().includes(query);
    const matchesType = type === "all" || (type === "income" ? t.amount > 0 : t.amount < 0);
    return matchesText && matchesType;
  });
  document.getElementById("allTransactions").innerHTML = filtered.map(t => transactionRow(t, true)).join("");
  document.getElementById("emptyTransactions").classList.toggle("hidden", filtered.length !== 0);
}
function categorySpend() {
  const totals = {};
  currentMonthTransactions().filter(t => t.amount < 0).forEach(t => totals[t.category] = (totals[t.category] || 0) + Math.abs(t.amount));
  return Object.entries(totals).sort((a,b) => b[1]-a[1]);
}
function renderCategoryLegend() {
  const data = categorySpend();
  const total = data.reduce((sum, item) => sum + item[1], 0);
  document.getElementById("donutTotal").textContent = money(total, 0);
  document.getElementById("categoryLegend").innerHTML = data.slice(0, 5).map(([name, amount]) => `<div class="category-row"><span class="category-name"><i class="category-dot" style="background:${(CATEGORIES[name] || CATEGORIES.Other).color}"></i>${escapeHtml(name)}</span><span class="category-amount">${money(amount, 0)}</span></div>`).join("") || `<p class="muted">No expenses recorded this month.</p>`;
}
function renderCharts() {
  if (typeof Chart === "undefined") return;
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ month: d.toLocaleDateString("en-US", { month: "short" }), year: d.getFullYear(), monthIndex: d.getMonth() });
  }
  const cashData = months.map(m => {
    const list = transactions.filter(t => {
      const d = new Date(t.date + "T12:00:00");
      return d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
    });
    return { income: list.filter(t => t.amount > 0).reduce((s,t) => s+t.amount,0), expenses: list.filter(t => t.amount < 0).reduce((s,t) => s+Math.abs(t.amount),0) };
  });
  const chartText = "#8290a6";
  if (cashflowChart) cashflowChart.destroy();
  cashflowChart = new Chart(document.getElementById("cashflowChart"), {
    type: "line",
    data: { labels: months.map(m => m.month), datasets: [
      { label: "Income", data: cashData.map(d => d.income), borderColor: "#34d399", backgroundColor: "rgba(52,211,153,.10)", fill: true, tension: .38, pointRadius: 2, pointHoverRadius: 5, borderWidth: 2 },
      { label: "Expenses", data: cashData.map(d => d.expenses), borderColor: "#fb7185", backgroundColor: "rgba(251,113,133,.08)", fill: true, tension: .38, pointRadius: 2, pointHoverRadius: 5, borderWidth: 2 }
    ] },
    options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0b1019", borderColor: "rgba(148,163,184,.2)", borderWidth: 1, titleColor: "#eef3fb", bodyColor: "#cbd5e1", callbacks: { label: ctx => `${ctx.dataset.label}: ${money(ctx.raw)}` } } }, scales: {
      x: { grid: { display: false }, ticks: { color: chartText, font: { family: "DM Mono", size: 10 } }, border: { display: false } },
      y: { beginAtZero: true, grid: { color: "rgba(148,163,184,.09)", drawTicks: false }, ticks: { color: chartText, font: { family: "DM Mono", size: 9 }, callback: value => value >= 1000 ? `₱${(value/1000).toFixed(0)}k` : `₱${value}` }, border: { display: false } }
    } }
  });
  const spending = categorySpend();
  if (spendingChart) spendingChart.destroy();
  spendingChart = new Chart(document.getElementById("spendingChart"), {
    type: "doughnut",
    data: { labels: spending.map(x => x[0]), datasets: [{ data: spending.map(x => x[1]), backgroundColor: spending.map(x => (CATEGORIES[x[0]] || CATEGORIES.Other).color), borderColor: "#111a28", borderWidth: 3, hoverOffset: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: "73%", plugins: { legend: { display: false }, tooltip: { backgroundColor: "#0b1019", borderColor: "rgba(148,163,184,.2)", borderWidth: 1, callbacks: { label: ctx => `${ctx.label}: ${money(ctx.raw)}` } } } }
  });
}
function renderBudget() {
  const budgets = Object.entries(CATEGORIES).filter(([name]) => name !== "Income");
  let totalBudget = 0, totalSpent = 0;
  const items = budgets.map(([name, meta]) => {
    const spent = currentMonthTransactions().filter(t => t.category === name && t.amount < 0).reduce((s,t) => s+Math.abs(t.amount),0);
    totalBudget += meta.budget; totalSpent += spent;
    const pct = meta.budget ? spent/meta.budget*100 : 0;
    const over = spent > meta.budget;
    return `<div class="budget-item"><div class="budget-item-top"><div class="budget-item-name"><i class="category-dot" style="background:${meta.color}"></i>${name}</div><div class="budget-item-values"><strong>${money(spent)}</strong> / ${money(meta.budget)} <span style="color:${over ? "var(--red)" : "var(--green)"}"> ${over ? "Over budget" : `${Math.max(0,100-pct).toFixed(0)}% left`}</span></div></div><div class="budget-progress"><span style="width:${Math.min(100,pct)}%;background:${over ? "var(--red)" : meta.color}"></span></div><div class="budget-note">${over ? `You are ${money(spent-meta.budget)} over your planned budget.` : `${money(meta.budget-spent)} remaining in this category.`}</div></div>`;
  });
  document.getElementById("budgetTotal").textContent = money(totalBudget);
  document.getElementById("budgetSpent").textContent = money(totalSpent);
  document.getElementById("budgetRemaining").textContent = money(totalBudget-totalSpent);
  document.getElementById("budgetRemaining").style.color = totalSpent > totalBudget ? "var(--red)" : "var(--green)";
  document.getElementById("budgetList").innerHTML = items.join("");
}
function renderSavingsView() {
  const monthItems = currentMonthTransactions();
  const totals = getTotals(monthItems);
  document.getElementById("savingsIncome").textContent = money(totals.income);
  document.getElementById("savingsExpenses").textContent = money(totals.expenses);
  document.getElementById("availableSavings").textContent = money(totals.balance);
  const incomeItems = [...monthItems].filter(t => t.amount > 0).sort((a,b) => b.date.localeCompare(a.date));
  const expenseItems = [...monthItems].filter(t => t.amount < 0).sort((a,b) => b.date.localeCompare(a.date));
  document.getElementById("incomeTransactions").innerHTML = incomeItems.length
    ? incomeItems.map(t => `<tr><td>${escapeHtml(t.name)}</td><td>${dateLabel(t.date)}</td><td class="amount income align-right">+${money(t.amount)}</td></tr>`).join("")
    : `<tr><td colspan="3" class="empty-state">No income recorded this month.</td></tr>`;
  document.getElementById("expenseTransactions").innerHTML = expenseItems.length
    ? expenseItems.map(t => `<tr><td>${escapeHtml(t.name)}</td><td>${dateLabel(t.date)}</td><td class="amount align-right">−${money(t.amount)}</td></tr>`).join("")
    : `<tr><td colspan="3" class="empty-state">No expenses recorded this month.</td></tr>`;
}
function calculateSavingsGoal() {
  const target = Number(document.getElementById("savingsGoalAmount").value);
  const months = Number(document.getElementById("savingsGoalMonths").value);
  const result = document.getElementById("savingsGoalResult");
  if (!Number.isFinite(target) || !Number.isFinite(months) || target <= 0 || months <= 0) {
    result.textContent = "Please enter a target amount and a number of months greater than zero.";
    return;
  }
  result.textContent = `You need to save ${money(target / months)} per month to reach your goal.`;
}
let calcExpression = "";
let calcFreshInput = true;
function updateCalcDisplay(value) {
  document.getElementById("calcDisplay").value = value;
}
function handleCalculatorInput(key) {
  const display = document.getElementById("calcDisplay");
  if (key === "clear") {
    calcExpression = ""; calcFreshInput = true; updateCalcDisplay("0"); return;
  }
  if (key === "backspace") {
    calcExpression = calcExpression.slice(0, -1);
    updateCalcDisplay(calcExpression || "0"); return;
  }
  if (key === "equals") {
    if (!calcExpression.trim()) return;
    if (!/^[0-9+*/%.()\\s-]+$/.test(calcExpression)) { updateCalcDisplay("Error"); calcExpression = ""; return; }
    try {
      const result = Function('"use strict"; return (' + calcExpression.replace(/%/g, "/100") + ')')();
      if (!Number.isFinite(result)) throw new Error("Invalid result");
      calcExpression = String(Number(result.toFixed(8)));
      updateCalcDisplay(calcExpression);
      calcFreshInput = true;
    } catch {
      updateCalcDisplay("Error"); calcExpression = ""; calcFreshInput = true;
    }
    return;
  }
  if (calcFreshInput && /[0-9.]/.test(key) && !/[+*/%-]/.test(key)) calcExpression = "";
  calcFreshInput = false;
  if (calcExpression.length < 40) calcExpression += key;
  updateCalcDisplay(calcExpression || "0");
}

function renderAll() {
  renderStats(); renderRecentTransactions(); renderAllTransactions(); renderCategoryLegend(); renderCharts(); renderBudget();
}
function switchView(view) {
  document.querySelectorAll(".page-view").forEach(el => el.classList.toggle("active", el.id === `${view}View`));
  document.querySelectorAll(".nav-item[data-view]").forEach(el => el.classList.toggle("active", el.dataset.view === view));
  const titles = {
    dashboard: ["Overview", "Your money at a glance"],
    transactions: ["Transactions", "A complete record of your activity"],
    budget: ["Budget Planner", "Plan your spending with confidence"],
    savings: ["Savings & Expenses", "Understand what comes in and what goes out"],
    calculator: ["Financial Calculator", "Quick calculations for everyday money decisions"]
  };
  document.getElementById("pageTitle").textContent = titles[view][0];
  document.getElementById("pageSubtitle").textContent = titles[view][1];
  closeMobileNav();
  if (view === "dashboard") setTimeout(renderCharts, 50);
  if (view === "savings") renderSavingsView();
}
function closeMobileNav() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("mobileOverlay").classList.remove("show");
}
function openDialog() {
  document.getElementById("transactionForm").reset();
  document.getElementById("transactionDate").value = new Date().toISOString().slice(0,10);
  updateCategoryOptions();
  document.getElementById("transactionDialog").showModal();
}
function updateCategoryOptions() {
  const type = document.getElementById("transactionType").value;
  const options = Object.keys(CATEGORIES).filter(name => type === "income" ? name === "Income" || name === "Other" : name !== "Income");
  document.getElementById("transactionCategory").innerHTML = options.map(name => `<option value="${name}">${name}</option>`).join("");
}
function addTransaction(event) {
  event.preventDefault();
  const name = document.getElementById("transactionName").value.trim();
  const amount = Number(document.getElementById("transactionAmount").value);
  const type = document.getElementById("transactionType").value;
  const category = document.getElementById("transactionCategory").value;
  const date = document.getElementById("transactionDate").value;
  if (!name || !Number.isFinite(amount) || amount <= 0 || !date) { showToast("Please complete all fields with a valid amount."); return; }
  transactions.push({ id: Date.now(), name, category, date, amount: type === "income" ? amount : -amount });
  saveTransactions();
  document.getElementById("transactionDialog").close();
  renderAll();
  showToast("Transaction added successfully.");
}
function deleteTransaction(id) {
  const item = transactions.find(t => t.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.name}" from your transactions?`)) return;
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions(); renderAll(); showToast("Transaction deleted.");
}

document.getElementById("currentDate").textContent = new Date().toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
document.querySelectorAll(".nav-item[data-view]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
document.querySelectorAll("[data-go]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.go)));
["addTransactionButton", "transactionsAddButton", "topAddButton"].forEach(id => document.getElementById(id).addEventListener("click", openDialog));
document.getElementById("closeDialog").addEventListener("click", () => document.getElementById("transactionDialog").close());
document.getElementById("cancelDialog").addEventListener("click", () => document.getElementById("transactionDialog").close());
document.getElementById("transactionType").addEventListener("change", updateCategoryOptions);
document.getElementById("transactionForm").addEventListener("submit", addTransaction);
document.getElementById("transactionSearch").addEventListener("input", renderAllTransactions);
document.getElementById("typeFilter").addEventListener("change", renderAllTransactions);
document.addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (button) deleteTransaction(Number(button.dataset.delete));
});
document.getElementById("mobileMenu").addEventListener("click", () => {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("mobileOverlay").classList.add("show");
});
document.getElementById("mobileOverlay").addEventListener("click", closeMobileNav);
document.getElementById("settingsButton").addEventListener("click", () => showToast("Settings are not included in this demo."));
document.getElementById("calculateSavingsGoal").addEventListener("click", calculateSavingsGoal);
document.getElementById("calculatorKeys").addEventListener("click", event => {
  const button = event.target.closest("[data-calc]");
  if (button) handleCalculatorInput(button.dataset.calc);
});
updateCategoryOptions();
renderAll();
renderSavingsView();
