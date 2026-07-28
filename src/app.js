(function () {
  const STORAGE_KEY = "universal-app-state-v2";

  const categories = [
    "Salary",
    "Freelance",
    "Food",
    "Housing",
    "Transport",
    "Utilities",
    "Health",
    "Entertainment",
    "Shopping",
    "Savings",
    "Other"
  ];

  const categoryLabels = {
    Salary: "Lương",
    Freelance: "Làm thêm",
    Food: "Ăn uống",
    Housing: "Nhà ở",
    Transport: "Di chuyển",
    Utilities: "Hóa đơn",
    Health: "Sức khỏe",
    Entertainment: "Giải trí",
    Shopping: "Mua sắm",
    Savings: "Tiết kiệm",
    Other: "Khác"
  };

  const typeLabels = {
    all: "Tất cả",
    income: "Thu nhập",
    expense: "Chi tiêu"
  };

  const defaultBudgets = {
    Food: 6000000,
    Housing: 12000000,
    Transport: 2500000,
    Utilities: 3000000,
    Health: 2500000,
    Entertainment: 3000000,
    Shopping: 4000000,
    Other: 2000000
  };

  const icons = {
    money: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
    goals: "M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9ZM12 17a5 5 0 1 0-5-5 5 5 0 0 0 5 5ZM12 13a1 1 0 1 0-1-1 1 1 0 0 0 1 1Z",
    projects: "M4 5h16M4 12h16M4 19h16M8 5v14M16 5v14",
    habits: "M8 12l3 3 5-7M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z",
    plus: "M12 5v14M5 12h14",
    download: "M12 3v12M7 10l5 5 5-5M5 21h14",
    upload: "M12 21V9M7 14l5-5 5 5M5 3h14",
    refresh: "M21 12a9 9 0 0 1-15.4 6.4M3 12A9 9 0 0 1 18.4 5.6M18 2v4h-4M6 22v-4h4",
    edit: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3"
  };

  const state = loadState();
  let activeModuleId = "money";
  let editingId = null;

  const modules = [
    {
      id: "money",
      label: "Tien",
      description: "Dòng tiền, ngân sách và lịch sử giao dịch.",
      icon: "money",
      enabled: true,
      render: renderMoney
    },
    {
      id: "goals",
      label: "Muc tieu",
      description: "Kế hoạch tiết kiệm và cột mốc sau này.",
      icon: "goals",
      enabled: false
    },
    {
      id: "projects",
      label: "Du an",
      description: "Quản lý dự án và công việc sau này.",
      icon: "projects",
      enabled: false
    },
    {
      id: "habits",
      label: "Thoi quen",
      description: "Theo dõi thói quen và chuỗi ngày sau này.",
      icon: "habits",
      enabled: false
    }
  ];

  function loadState() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return normalizeState(parsed);
      } catch (error) {
        console.warn("Unable to parse saved state.", error);
      }
    }

    return normalizeState({
      money: {
        transactions: demoTransactions(),
        budgets: defaultBudgets,
        filters: {
          month: currentMonth(),
          type: "all",
          category: "all",
          search: ""
        }
      }
    });
  }

  function normalizeState(input) {
    const money = input.money || {};
    const importedBudgets = money.budgets && typeof money.budgets === "object" ? money.budgets : {};
    const budgets = Object.entries({ ...defaultBudgets, ...importedBudgets }).reduce((safeBudgets, [category, limit]) => {
      safeBudgets[String(category)] = Math.max(0, Number(limit) || 0);
      return safeBudgets;
    }, {});
    const filters = money.filters && typeof money.filters === "object" ? money.filters : {};
    const month = /^\d{4}-\d{2}$/.test(String(filters.month)) ? String(filters.month) : currentMonth();
    const type = ["all", "income", "expense"].includes(filters.type) ? filters.type : "all";

    return {
      money: {
        transactions: Array.isArray(money.transactions) ? money.transactions.map(normalizeTransaction).filter(Boolean) : [],
        budgets,
        filters: {
          month,
          type,
          category: String(filters.category || "all").slice(0, 60),
          search: String(filters.search || "").slice(0, 100)
        }
      }
    };
  }

  function normalizeTransaction(transaction) {
    if (!transaction || typeof transaction !== "object") return null;

    const type = transaction.type === "income" ? "income" : "expense";
    const amount = Math.max(0, Number(transaction.amount) || 0);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(transaction.date)) ? String(transaction.date) : new Date().toISOString().slice(0, 10);

    return {
      id: String(transaction.id || newId()),
      category: String(transaction.category || "Other").slice(0, 60),
      note: String(transaction.note || "Giao dịch đã nhập").slice(0, 140),
      amount,
      type,
      date
    };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function currentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  function demoTransactions() {
    const month = currentMonth();
    return [
      createTransaction("Salary", "Lương chính", 45000000, "income", `${month}-01`),
      createTransaction("Freelance", "Dự án ngoài giờ", 7000000, "income", `${month}-07`),
      createTransaction("Housing", "Tiền nhà", 12000000, "expense", `${month}-02`),
      createTransaction("Food", "Đi chợ", 950000, "expense", `${month}-04`),
      createTransaction("Transport", "Thẻ xe buýt và taxi", 650000, "expense", `${month}-06`),
      createTransaction("Utilities", "Điện, nước và internet", 2100000, "expense", `${month}-09`),
      createTransaction("Entertainment", "Ăn tối với bạn bè", 780000, "expense", `${month}-12`),
      createTransaction("Savings", "Quỹ khẩn cấp", 8000000, "expense", `${month}-15`),
      createTransaction("Health", "Nhà thuốc", 320000, "expense", `${month}-16`),
      createTransaction("Shopping", "Túi đi làm", 1500000, "expense", `${month}-18`)
    ];
  }

  function createTransaction(category, note, amount, type, date) {
    return {
      id: newId(),
      category,
      note,
      amount: Number(amount),
      type,
      date
    };
  }

  function newId() {
    return window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now() + Math.random());
  }

  function moneyFormatter() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    });
  }

  function preciseMoneyFormatter() {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0
    });
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("vi-VN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(`${value}T12:00:00`));
  }

  function svgIcon(name) {
    return `
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${icons[name] || icons.money}"></path>
      </svg>
    `;
  }

  function app() {
    const root = document.querySelector("#app");
    root.innerHTML = `
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-mark">U</div>
          <div>
            <strong>Universal App</strong>
            <span>Điều hành cá nhân</span>
          </div>
        </div>
        <nav class="module-list" aria-label="Modules">
          ${modules.map(moduleButton).join("")}
        </nav>
        <div class="sidebar-footer">
          Dữ liệu đang lưu trên trình duyệt này. Hãy xuất bản sao lưu trước khi đổi thiết bị.
        </div>
      </aside>
      <main class="main" id="main"></main>
      <input class="hidden-file" id="import-file" type="file" accept="application/json">
    `;

    if (!root.dataset.bound) {
      root.addEventListener("click", handleClick);
      root.addEventListener("input", handleInput);
      root.addEventListener("change", handleChange);
      root.addEventListener("submit", handleSubmit);
      root.dataset.bound = "true";
    }
    renderActiveModule();
  }

  function moduleButton(module) {
    return `
      <button class="module-button ${module.id === activeModuleId ? "active" : ""}"
        data-action="switch-module" data-module-id="${module.id}" ${module.enabled ? "" : "disabled"}
        title="${module.description}">
        <span class="module-icon">${svgIcon(module.icon)}</span>
        <span>${module.label}</span>
      </button>
    `;
  }

  function renderActiveModule() {
    const module = modules.find((item) => item.id === activeModuleId);
    document.querySelector("#main").innerHTML = module.render();
  }

  function renderMoney() {
    const data = getMoneyViewData();
    const dollars = moneyFormatter();
    const precise = preciseMoneyFormatter();

    return `
      <section class="topbar">
        <div>
          <p class="eyebrow">Theo dõi tiền</p>
          <h1>Kiểm soát dòng tiền tháng này</h1>
          <p>Theo dõi tiền vào, tiền ra và những danh mục cần chú ý trước khi kết thúc tháng.</p>
        </div>
        <div class="toolbar">
          <button class="button secondary" data-action="import">${svgIcon("upload")}Nhập</button>
          <button class="button secondary" data-action="export">${svgIcon("download")}Xuất</button>
          <button class="button secondary" data-action="reset-demo">${svgIcon("refresh")}Dữ liệu mẫu</button>
        </div>
      </section>

      <section class="metric-grid" aria-label="Tổng quan tiền">
        <article class="metric">
          <span>Số dư</span>
          <strong>${dollars.format(data.balance)}</strong>
          <small>${data.selectedLabel}</small>
        </article>
        <article class="metric">
          <span>Thu nhập</span>
          <strong>${dollars.format(data.income)}</strong>
          <small>${data.incomeCount} giao dich</small>
        </article>
        <article class="metric">
          <span>Chi tiêu</span>
          <strong>${dollars.format(data.expenses)}</strong>
          <small>${data.expenseCount} giao dich</small>
        </article>
        <article class="metric">
          <span>Tỷ lệ tiết kiệm</span>
          <strong>${data.savingsRate}%</strong>
          <small>${data.balance >= 0 ? "Dòng tiền dương" : "Cần chú ý"}</small>
        </article>
      </section>

      <section class="dashboard-grid">
        <div class="left-column">
          <article class="panel">
            <div class="panel-header">
              <div>
                <h2>Giao dich</h2>
                <p>${data.filteredTransactions.length} kết quả sau bộ lọc</p>
              </div>
            </div>
            <div class="filters">
              <div class="field">
                <label for="filter-month">Tháng</label>
                <input id="filter-month" type="month" data-filter="month" value="${escapeAttr(state.money.filters.month)}">
              </div>
              <div class="field">
                <label for="filter-type">Loại</label>
                <select id="filter-type" data-filter="type">
                  ${option("all", typeLabels.all, state.money.filters.type)}
                  ${option("income", typeLabels.income, state.money.filters.type)}
                  ${option("expense", typeLabels.expense, state.money.filters.type)}
                </select>
              </div>
              <div class="field">
                <label for="filter-category">Danh muc</label>
                <select id="filter-category" data-filter="category">
                  ${option("all", "Tất cả danh mục", state.money.filters.category)}
                  ${categories.map((category) => option(category, categoryLabel(category), state.money.filters.category)).join("")}
                </select>
              </div>
              <div class="field">
                <label for="filter-search">Tìm kiếm</label>
                <input id="filter-search" type="search" data-filter="search" value="${escapeAttr(state.money.filters.search)}" placeholder="Ghi chú hoặc danh mục">
              </div>
            </div>
            <div class="transaction-list">
              ${transactionTable(data.filteredTransactions, precise)}
            </div>
          </article>

          <article class="panel" style="margin-top: 18px;">
            <div class="panel-header">
              <div>
                <h2>Chi tieu theo danh muc</h2>
                <p>Phân bổ chi tiêu trong tháng đã chọn</p>
              </div>
            </div>
            ${categoryChart(data.categorySpend)}
          </article>
        </div>

        <aside class="right-column">
          <article class="panel">
            <div class="panel-header">
              <div>
                <h2>${editingId ? "Sửa giao dịch" : "Thêm giao dịch"}</h2>
                <p>Nhập ngắn gọn để dễ theo dõi về sau.</p>
              </div>
            </div>
            ${transactionForm()}
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <h2>Tiến độ ngân sách</h2>
                <p>Hạn mức chi tiêu hằng tháng theo danh mục</p>
              </div>
            </div>
            ${budgetList(data.budgetProgress, precise)}
          </article>
        </aside>
      </section>
    `;
  }

  function getMoneyViewData() {
    const filters = state.money.filters;
    const selectedMonth = filters.month || currentMonth();
    const selectedMonthTransactions = state.money.transactions.filter((transaction) => transaction.date.startsWith(selectedMonth));
    const filteredTransactions = selectedMonthTransactions
      .filter((transaction) => filters.type === "all" || transaction.type === filters.type)
      .filter((transaction) => filters.category === "all" || transaction.category === filters.category)
      .filter((transaction) => {
        const query = filters.search.trim().toLowerCase();
        return !query || `${transaction.note} ${transaction.category}`.toLowerCase().includes(query);
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const income = selectedMonthTransactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expenses = selectedMonthTransactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const balance = income - expenses;
    const savingsRate = income > 0 ? Math.round((balance / income) * 100) : 0;
    const categorySpend = categoryTotals(selectedMonthTransactions);
    const budgetProgress = Object.entries(state.money.budgets)
      .map(([category, limit]) => ({
        category,
        limit,
        spent: categorySpend[category] || 0,
        percent: limit > 0 ? Math.round(((categorySpend[category] || 0) / limit) * 100) : 0
      }))
      .sort((a, b) => b.percent - a.percent);

    return {
      selectedLabel: new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(`${selectedMonth}-01T12:00:00`)),
      selectedMonthTransactions,
      filteredTransactions,
      income,
      expenses,
      balance,
      savingsRate,
      incomeCount: selectedMonthTransactions.filter((transaction) => transaction.type === "income").length,
      expenseCount: selectedMonthTransactions.filter((transaction) => transaction.type === "expense").length,
      categorySpend,
      budgetProgress
    };
  }

  function categoryTotals(transactions) {
    return transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((totals, transaction) => {
        totals[transaction.category] = (totals[transaction.category] || 0) + transaction.amount;
        return totals;
      }, {});
  }

  function option(value, label, selected) {
    return `<option value="${escapeAttr(value)}" ${value === selected ? "selected" : ""}>${label}</option>`;
  }

  function categoryLabel(category) {
    return categoryLabels[category] || category;
  }

  function transactionTypeLabel(type) {
    return typeLabels[type] || type;
  }

  function transactionTable(transactions, formatter) {
    if (!transactions.length) {
      return `<div class="empty-state">Không có giao dịch nào khớp với bộ lọc hiện tại.</div>`;
    }

    return `
      <table>
        <thead>
          <tr>
            <th>Ngày</th>
            <th>Danh mục</th>
            <th>Ghi chú</th>
            <th>Loại</th>
            <th class="amount">Số tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map((transaction) => `
            <tr>
              <td>${formatDate(transaction.date)}</td>
              <td><span class="pill">${escapeHtml(categoryLabel(transaction.category))}</span></td>
              <td>${escapeHtml(transaction.note)}</td>
              <td>${escapeHtml(transactionTypeLabel(transaction.type))}</td>
              <td class="amount ${transaction.type}">${transaction.type === "income" ? "+" : "-"}${formatter.format(transaction.amount)}</td>
              <td>
                <div class="actions">
                  <button class="button secondary icon" data-action="edit-transaction" data-id="${escapeAttr(transaction.id)}" title="Sửa">${svgIcon("edit")}</button>
                  <button class="button secondary icon" data-action="delete-transaction" data-id="${escapeAttr(transaction.id)}" title="Xóa">${svgIcon("trash")}</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  }

  function transactionForm() {
    const editing = state.money.transactions.find((transaction) => transaction.id === editingId);
    return `
      <form class="form-grid" data-form="transaction">
        <input type="hidden" name="id" value="${escapeAttr(editing ? editing.id : "")}">
        <div class="field">
          <label for="transaction-type">Loại</label>
          <select id="transaction-type" name="type" required>
            ${option("expense", typeLabels.expense, editing?.type || "expense")}
            ${option("income", typeLabels.income, editing?.type || "expense")}
          </select>
        </div>
        <div class="field">
          <label for="transaction-date">Ngày</label>
          <input id="transaction-date" name="date" type="date" value="${editing?.date || new Date().toISOString().slice(0, 10)}" required>
        </div>
        <div class="field">
          <label for="transaction-category">Danh mục</label>
          <select id="transaction-category" name="category" required>
            ${categories.map((category) => option(category, categoryLabel(category), editing?.category || "Food")).join("")}
          </select>
        </div>
        <div class="field">
          <label for="transaction-amount">Số tiền</label>
          <input id="transaction-amount" name="amount" type="number" min="1000" step="1000" value="${editing?.amount || ""}" placeholder="0" required>
        </div>
        <div class="field wide">
          <label for="transaction-note">Ghi chú</label>
          <input id="transaction-note" name="note" type="text" value="${escapeAttr(editing?.note || "")}" placeholder="Mô tả ngắn" required>
        </div>
        <div class="form-actions">
          ${editing ? `<button class="button secondary" type="button" data-action="cancel-edit">Hủy</button>` : ""}
          <button class="button" type="submit">${svgIcon("plus")}${editing ? "Lưu thay đổi" : "Thêm giao dịch"}</button>
        </div>
      </form>
    `;
  }

  function budgetList(items, formatter) {
    if (!items.length) {
      return `<div class="empty-state">Chưa có ngân sách nào.</div>`;
    }

    return `
      <div class="budget-list">
        ${items.map((item) => {
          const className = item.percent >= 100 ? "danger" : item.percent >= 80 ? "warning" : "";
          return `
            <div class="budget-row">
              <div class="row-top">
                <strong>${escapeHtml(categoryLabel(item.category))}</strong>
                <span>${formatter.format(item.spent)} / ${formatter.format(item.limit)}</span>
              </div>
              <div class="progress ${className}" style="--value: ${Math.min(item.percent, 100)}%">
                <span></span>
              </div>
              <div class="field">
                <label for="budget-${slug(item.category)}">Hạn mức tháng</label>
                <input id="budget-${slug(item.category)}" data-budget="${escapeAttr(item.category)}" type="number" min="0" step="1000" value="${item.limit}">
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function categoryChart(spend) {
    const entries = Object.entries(spend).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!entries.length) {
      return `<div class="empty-state">Danh mục chi tiêu sẽ xuất hiện sau khi bạn thêm giao dịch.</div>`;
    }

    const max = Math.max(...entries.map((entry) => entry[1]));
    return `
      <div class="mini-chart" aria-label="Biểu đồ chi tiêu theo danh mục">
        ${entries.map(([category, total]) => `
          <div class="bar-wrap" title="${escapeAttr(categoryLabel(category))}: ${preciseMoneyFormatter().format(total)}">
            <div class="bar" style="--height: ${Math.max(12, Math.round((total / max) * 170))}px"></div>
            <div class="bar-label">${escapeHtml(categoryLabel(category))}</div>
          </div>
        `).join("")}
      </div>
    `;
  }

  function handleClick(event) {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    if (action === "switch-module") {
      activeModuleId = actionTarget.dataset.moduleId;
      app();
    }

    if (action === "edit-transaction") {
      editingId = actionTarget.dataset.id;
      renderActiveModule();
    }

    if (action === "delete-transaction") {
      deleteTransaction(actionTarget.dataset.id);
    }

    if (action === "cancel-edit") {
      editingId = null;
      renderActiveModule();
    }

    if (action === "export") {
      exportData();
    }

    if (action === "import") {
      document.querySelector("#import-file").click();
    }

    if (action === "reset-demo") {
      state.money.transactions = demoTransactions();
      state.money.budgets = { ...defaultBudgets };
      state.money.filters = { month: currentMonth(), type: "all", category: "all", search: "" };
      editingId = null;
      saveAndRender("Đã khôi phục dữ liệu mẫu.");
    }
  }

  function handleInput(event) {
    if (event.target.matches("#filter-search")) {
      state.money.filters.search = event.target.value;
      saveState();
    }
  }

  function handleChange(event) {
    if (event.target.id === "import-file") {
      importData(event.target.files[0]);
      event.target.value = "";
    }

    if (event.target.matches("[data-filter]")) {
      state.money.filters[event.target.dataset.filter] = event.target.value;
      saveState();
      renderActiveModule();
    }

    if (event.target.matches("[data-budget]")) {
      const category = event.target.dataset.budget;
      state.money.budgets[category] = Number(event.target.value || 0);
      saveState();
      renderActiveModule();
    }
  }

  function handleSubmit(event) {
    const form = event.target.closest("[data-form='transaction']");
    if (!form) return;

    event.preventDefault();
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const transaction = {
      id: id || newId(),
      type: String(formData.get("type")),
      date: String(formData.get("date")),
      category: String(formData.get("category")),
      amount: Number(formData.get("amount")),
      note: String(formData.get("note")).trim()
    };

    if (!transaction.note || !transaction.amount || transaction.amount <= 0) {
      showToast("Hãy nhập ghi chú và số tiền lớn hơn 0.");
      return;
    }

    if (id) {
      state.money.transactions = state.money.transactions.map((item) => item.id === id ? transaction : item);
      editingId = null;
      saveAndRender("Đã cập nhật giao dịch.");
    } else {
      state.money.transactions.unshift(transaction);
      saveAndRender("Đã thêm giao dịch.");
    }
  }

  function deleteTransaction(id) {
    state.money.transactions = state.money.transactions.filter((transaction) => transaction.id !== id);
    if (editingId === id) editingId = null;
    saveAndRender("Đã xóa giao dịch.");
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `universal-app-tien-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Đã tải bản xuất dữ liệu.");
  }

  function importData(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = normalizeState(JSON.parse(reader.result));
        state.money = imported.money;
        editingId = null;
        saveAndRender("Nhập dữ liệu hoàn tất.");
      } catch (error) {
        console.warn(error);
        showToast("Nhập dữ liệu thất bại. Hãy chọn bản sao lưu JSON hợp lệ.");
      }
    };
    reader.readAsText(file);
  }

  function saveAndRender(message) {
    saveState();
    renderActiveModule();
    showToast(message);
  }

  function showToast(message) {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2200);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function slug(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }

  app();
})();
