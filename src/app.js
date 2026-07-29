(function () {
  const STORAGE_KEY = "universal-app-state-v2";
  const AUTH_STORAGE_KEY = "universal-app-auth-v1";
  const API_BASE_STORAGE_KEY = "universal-app-api-base-url";
  const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";

  const defaultCategories = [
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

  const budgetColors = ["#2563eb", "#0f766e", "#f59e0b", "#7c3aed", "#0891b2", "#16a34a", "#ea580c"];

  const icons = {
    money: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
    transactions: "M4 6h16M4 12h16M4 18h10",
    goals: "M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9ZM12 17a5 5 0 1 0-5-5 5 5 0 0 0 5 5ZM12 13a1 1 0 1 0-1-1 1 1 0 0 0 1 1Z",
    projects: "M4 5h16M4 12h16M4 19h16M8 5v14M16 5v14",
    habits: "M8 12l3 3 5-7M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9Z",
    plus: "M12 5v14M5 12h14",
    download: "M12 3v12M7 10l5 5 5-5M5 21h14",
    upload: "M12 21V9M7 14l5-5 5 5M5 3h14",
    refresh: "M21 12a9 9 0 0 1-15.4 6.4M3 12A9 9 0 0 1 18.4 5.6M18 2v4h-4M6 22v-4h4",
    edit: "M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z",
    trash: "M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3",
    logout: "M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5M14 21h5a2 2 0 0 0 2-2",
    user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0-5-5 5 5 0 0 0 5 5Z",
    friends: "M17 21a6 6 0 0 0-12 0M11 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4M23 21a5 5 0 0 0-7-4.6M17 3a4 4 0 0 1 0 8",
    chevronLeft: "M15 18l-6-6 6-6",
    chevronRight: "M9 18l6-6-6-6"
  };

  const state = loadState();
  const auth = loadAuth();
  const moneySync = {
    loaded: false,
    loading: false,
    budgetMonth: "",
    error: ""
  };
  const friendsSync = {
    loaded: false,
    loading: false,
    month: "",
    error: "",
    items: []
  };
  let authMode = "login";
  let activeModuleId = "money";
  let editingId = null;
  let editingBudgetId = null;

  const modules = [
    {
      id: "money",
      label: "Ngân sách",
      description: "Tiến độ ngân sách tháng.",
      icon: "money",
      enabled: true,
      render: renderMoney
    },
    {
      id: "transactions",
      label: "Giao dịch",
      description: "Lịch sử thu chi và giao dịch tháng.",
      icon: "transactions",
      enabled: true,
      render: renderTransactions
    },
    {
      id: "categories",
      label: "Danh mục",
      description: "Tạo và chỉnh sửa danh mục tiền.",
      icon: "projects",
      enabled: true,
      render: renderCategories
    },
    {
      id: "friends",
      label: "Bạn bè",
      description: "Theo dõi phần trăm ngân sách của bạn bè.",
      icon: "friends",
      enabled: true,
      render: renderFriends
    },
    {
      id: "goals",
      label: "Mục tiêu",
      description: "Kế hoạch tiết kiệm và cột mốc sau này.",
      icon: "goals",
      enabled: false
    },
    {
      id: "projects",
      label: "Dự án",
      description: "Quản lý dự án và công việc sau này.",
      icon: "projects",
      enabled: false
    },
    {
      id: "habits",
      label: "Thói quen",
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
        categories: defaultCategories,
        categoryRecords: [],
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
        budgetRecords: Array.isArray(money.budgetRecords) ? money.budgetRecords.map(normalizeBudgetRecord).filter(Boolean) : [],
        categoryRecords: Array.isArray(money.categoryRecords) ? money.categoryRecords.map(normalizeCategoryRecord).filter(Boolean) : [],
        categories: normalizeCategories(money.categories),
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

  function normalizeCategories(values) {
    const source = Array.isArray(values) && values.length ? values : defaultCategories;
    return [...new Set(source.map((category) => String(category || "").trim()).filter(Boolean))].slice(0, 80);
  }

  function normalizeCategoryRecord(category) {
    if (!category || typeof category !== "object") return null;

    const name = String(category.name || "").trim().slice(0, 60);
    if (!name) return null;

    return {
      id: category.id === undefined || category.id === null ? "" : String(category.id),
      name
    };
  }

  function normalizeBudgetRecord(budget) {
    if (!budget || typeof budget !== "object") return null;

    return {
      id: budget.id === undefined || budget.id === null ? "" : String(budget.id),
      category: String(budget.category || "Other").slice(0, 60),
      month: /^\d{4}-\d{2}$/.test(String(budget.month)) ? String(budget.month) : currentMonth(),
      limit: Math.max(0, Number(budget.limit || budget.limit_amount || 0)),
      spent: Math.max(0, Number(budget.spent || budget.spent_amount || 0)),
      percent: Math.max(0, Number(budget.percent || budget.percent_used || 0)),
      color: normalizeBudgetColor(budget.color)
    };
  }

  function normalizeBudgetColor(value) {
    const color = String(value || "").trim();
    const normalized = color.toLowerCase();
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return "#2563eb";
    if (normalized === "#e11d48" || normalized === "#dc2626" || normalized === "#ef4444") return "#2563eb";
    return color;
  }

  function budgetColorTint(value) {
    const color = normalizeBudgetColor(value).slice(1);
    const red = parseInt(color.slice(0, 2), 16);
    const green = parseInt(color.slice(2, 4), 16);
    const blue = parseInt(color.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, 0.14)`;
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

  function loadAuth() {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return { token: "", user: null };

    try {
      const parsed = JSON.parse(stored);
      return {
        token: String(parsed.token || ""),
        user: parsed.user && typeof parsed.user === "object" ? parsed.user : null
      };
    } catch (error) {
      console.warn("Unable to parse saved auth state.", error);
      return { token: "", user: null };
    }
  }

  function saveAuth() {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }

  function apiBaseUrl() {
    return runtimeApiBaseUrl() || localStorage.getItem(API_BASE_STORAGE_KEY) || DEFAULT_API_BASE_URL;
  }

  function setApiBaseUrl(value) {
    if (runtimeApiBaseUrl()) return;

    const normalized = String(value || "").trim().replace(/\/+$/, "");
    localStorage.setItem(API_BASE_STORAGE_KEY, normalized || DEFAULT_API_BASE_URL);
  }

  function runtimeApiBaseUrl() {
    return String(window.UNIVERSAL_APP_CONFIG?.API_BASE_URL || "").trim().replace(/\/+$/, "");
  }

  function currentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  function shiftMonth(month, offset) {
    const [year, monthIndex] = month.split("-").map(Number);
    const date = new Date(year, monthIndex - 1 + offset, 1, 12);
    return date.toISOString().slice(0, 7);
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
    if (!auth.token) {
      root.className = "auth-root";
      root.innerHTML = renderAuth();
      bindRoot(root);
      return;
    }

    root.className = "app-shell";
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
          <div class="account-chip">
            <span class="module-icon">${svgIcon("user")}</span>
            <span>${escapeHtml(auth.user?.full_name || auth.user?.email || "Tài khoản")}</span>
          </div>
          <button class="module-button logout-button" data-action="logout">
            <span class="module-icon">${svgIcon("logout")}</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main class="main" id="main"></main>
    `;

    bindRoot(root);
    renderActiveModule();
    ensureMoneyLoaded();
    ensureFriendsLoaded();
  }

  function bindRoot(root) {
    if (root.dataset.bound) return;

    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("change", handleChange);
    root.addEventListener("submit", handleSubmit);
    root.dataset.bound = "true";
  }

  function renderAuth() {
    const isRegister = authMode === "register";
    return `
      <main class="auth-shell">
        <section class="auth-frame">
          <div class="auth-showcase" aria-label="Universal App">
            <div class="auth-brand">
              <div class="brand-mark">U</div>
              <div>
                <strong>Universal App</strong>
                <span>Money workspace</span>
              </div>
            </div>

            <div class="showcase-copy">
              <p class="eyebrow">Tài chính cá nhân</p>
              <h1>Nắm rõ tiền vào và tiền ra.</h1>
              <p>Một không gian gọn gàng để theo dõi giao dịch, ngân sách và số dư bằng VND.</p>
            </div>

            <div class="auth-preview" aria-hidden="true">
              <div class="preview-top">
                <span>Số dư hiện tại</span>
                <strong>28.320.000 ₫</strong>
              </div>
              <div class="preview-metrics">
                <div>
                  <span>Thu nhập</span>
                  <strong>52.000.000 ₫</strong>
                </div>
                <div>
                  <span>Chi tiêu</span>
                  <strong>23.680.000 ₫</strong>
                </div>
              </div>
              <div class="preview-progress">
                <div>
                  <span>Ngân sách ăn uống</span>
                  <strong>71%</strong>
                </div>
                <div class="progress" style="--value: 71%">
                  <span></span>
                </div>
              </div>
              <div class="preview-row">
                <span>Nhà ở</span>
                <strong>12.000.000 ₫</strong>
              </div>
              <div class="preview-row">
                <span>Di chuyển</span>
                <strong>650.000 ₫</strong>
              </div>
            </div>
          </div>

          <section class="auth-panel">
            <div class="auth-copy">
              <p class="eyebrow">${isRegister ? "Tạo tài khoản" : "Đăng nhập"}</p>
              <h1>${isRegister ? "Tạo tài khoản mới" : "Đăng nhập tài khoản"}</h1>
              <p>${isRegister ? "Dùng email và mật khẩu để bắt đầu lưu dữ liệu trên backend." : "Tiếp tục quản lý giao dịch và ngân sách của bạn."}</p>
            </div>
            <form class="auth-form" data-form="${isRegister ? "register" : "login"}">
              ${isRegister ? `
                <div class="field">
                  <label for="auth-name">Họ tên</label>
                  <input id="auth-name" name="full_name" type="text" autocomplete="name" placeholder="Nguyễn Văn A" required>
                </div>
              ` : ""}
              <div class="field">
                <label for="auth-email">Email</label>
                <input id="auth-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
              </div>
              <div class="field">
                <label for="auth-password">Mật khẩu</label>
                <input id="auth-password" name="password" type="password" autocomplete="${isRegister ? "new-password" : "current-password"}" minlength="8" placeholder="Tối thiểu 8 ký tự" required>
              </div>
              <div class="field">
                <label for="auth-api">API URL</label>
                <input id="auth-api" name="api_base_url" type="url" value="${escapeAttr(apiBaseUrl())}" required>
              </div>
              <button class="button" type="submit">${isRegister ? "Tạo tài khoản" : "Đăng nhập"}</button>
            </form>
            <button class="auth-switch" data-action="switch-auth-mode">
              ${isRegister ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Tạo tài khoản"}
            </button>
          </section>
        </section>
      </main>
    `;
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
          <p class="eyebrow">Ngân sách</p>
          <h1>Tiến độ ngân sách tháng này</h1>
          <p>Theo dõi hạn mức chi tiêu, phần trăm đã dùng và những danh mục cần chú ý trước khi kết thúc tháng.</p>
        </div>
      </section>

      ${moneySync.loading ? `<div class="sync-banner">Đang đồng bộ dữ liệu với backend...</div>` : ""}
      ${moneySync.error ? `<div class="sync-banner error">${escapeHtml(moneySync.error)}</div>` : ""}

      ${moneyMetrics(data, dollars)}
      ${renderBudgetTab(data, precise)}
    `;
  }

  function renderTransactions() {
    const data = getMoneyViewData();
    const dollars = moneyFormatter();
    const precise = preciseMoneyFormatter();
    return `
      <section class="topbar">
        <div>
          <p class="eyebrow">Giao dịch</p>
          <h1>Giao dịch tháng này</h1>
          <p>Xem, lọc, thêm và chỉnh sửa các khoản thu chi theo tháng.</p>
        </div>
      </section>

      ${moneySync.loading ? `<div class="sync-banner">Đang đồng bộ dữ liệu với backend...</div>` : ""}
      ${moneySync.error ? `<div class="sync-banner error">${escapeHtml(moneySync.error)}</div>` : ""}

      ${moneyMetrics(data, dollars)}
      ${renderTransactionTab(data, precise)}
    `;
  }

  function moneyMetrics(data, formatter) {
    return `
      <section class="metric-grid" aria-label="Tổng quan tiền">
        <article class="metric">
          <span>Số dư</span>
          <strong>${formatter.format(data.balance)}</strong>
          <small>${data.selectedLabel}</small>
        </article>
        <article class="metric">
          <span>Thu nhập</span>
          <strong>${formatter.format(data.income)}</strong>
          <small>${data.incomeCount} giao dịch</small>
        </article>
        <article class="metric">
          <span>Chi tiêu</span>
          <strong>${formatter.format(data.expenses)}</strong>
          <small>${data.expenseCount} giao dịch</small>
        </article>
        <article class="metric">
          <span>Tỷ lệ tiết kiệm</span>
          <strong>${data.savingsRate}%</strong>
          <small>${data.balance >= 0 ? "Dòng tiền dương" : "Cần chú ý"}</small>
        </article>
      </section>
    `;
  }

  function renderBudgetTab(data, formatter) {
    return `
      <section class="budget-dashboard">
        <article class="panel budget-focus">
          <div class="panel-header">
            <div>
              <h2>Tiến độ ngân sách</h2>
              <p>Tỷ lệ đã dùng so với hạn mức từng danh mục</p>
            </div>
            <div class="month-control compact-month">
              <button type="button" data-action="previous-month" title="Tháng trước">${svgIcon("chevronLeft")}</button>
              <input type="month" data-filter="month" value="${escapeAttr(state.money.filters.month)}">
              <button type="button" data-action="next-month" title="Tháng sau">${svgIcon("chevronRight")}</button>
            </div>
          </div>
          ${budgetList(data.budgetProgress, formatter)}
        </article>
      </section>
    `;
  }

  function renderTransactionTab(data, formatter) {
    return `
      <section class="dashboard-grid">
        <div class="left-column">
          <article class="panel">
            <div class="panel-header">
              <div>
                <h2>Giao dịch</h2>
                <p>${data.filteredTransactions.length} kết quả sau bộ lọc</p>
              </div>
            </div>
            <div class="filters">
              <div class="field month-field">
                <label for="filter-month">Tháng</label>
                <div class="month-control">
                  <button type="button" data-action="previous-month" title="Tháng trước">${svgIcon("chevronLeft")}</button>
                  <input id="filter-month" type="month" data-filter="month" value="${escapeAttr(state.money.filters.month)}">
                  <button type="button" data-action="next-month" title="Tháng sau">${svgIcon("chevronRight")}</button>
                </div>
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
                <label for="filter-category">Danh mục</label>
                <select id="filter-category" data-filter="category">
                  ${option("all", "Tất cả danh mục", state.money.filters.category)}
                  ${categoryOptions().map((category) => option(category, categoryLabel(category), state.money.filters.category)).join("")}
                </select>
              </div>
              <div class="field">
                <label for="filter-search">Tìm kiếm</label>
                <input id="filter-search" type="search" data-filter="search" value="${escapeAttr(state.money.filters.search)}" placeholder="Ghi chú hoặc danh mục">
              </div>
            </div>
            <div class="transaction-list">
              ${transactionTable(data.filteredTransactions, formatter)}
            </div>
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
        </aside>
      </section>
    `;
  }

  function renderCategories() {
    const items = categoryOptions();
    const usedCounts = categoryUsageCounts();

    return `
      <section class="topbar">
        <div>
          <p class="eyebrow">Danh mục</p>
          <h1>Quản lý danh mục tiền</h1>
          <p>Tạo danh mục riêng cho giao dịch và ngân sách. Khi đổi tên danh mục, lịch sử giao dịch và ngân sách liên quan sẽ được cập nhật theo.</p>
        </div>
      </section>

      ${moneySync.loading ? `<div class="sync-banner">Đang đồng bộ danh mục với backend...</div>` : ""}
      ${moneySync.error ? `<div class="sync-banner error">${escapeHtml(moneySync.error)}</div>` : ""}

      <section class="panel category-manager">
        <div class="panel-header">
          <div>
            <h2>Danh sách danh mục</h2>
            <p>${items.length} danh mục có thể dùng trong giao dịch và ngân sách</p>
          </div>
        </div>
        <div class="category-manager-body">
          <form class="category-add" data-form="category">
            <div class="field">
              <label for="category-new-name">Tên danh mục</label>
              <input id="category-new-name" name="name" type="text" maxlength="60" placeholder="Ví dụ: Cà phê" required>
            </div>
            <button class="button" type="submit">${svgIcon("plus")}Thêm danh mục</button>
          </form>
          <div class="category-definition-list">
            ${state.money.categories.length ? state.money.categories.map((category) => categoryDefinitionRow(category, usedCounts)).join("") : `<div class="empty-state">Chưa có danh mục nào.</div>`}
          </div>
        </div>
      </section>
    `;
  }

  function categoryDefinitionRow(category, usedCounts) {
    const categoryRecord = state.money.categoryRecords.find((item) => item.name === category);
    const id = categoryRecord?.id || "";
    const usageCount = usedCounts[category] || 0;

    return `
      <div class="category-definition-row">
        <div class="field">
          <label for="category-${escapeAttr(id || slug(category))}">Tên danh mục</label>
          <input id="category-${escapeAttr(id || slug(category))}" data-category-name="${escapeAttr(id)}" data-original-name="${escapeAttr(category)}" type="text" value="${escapeAttr(category)}" maxlength="60" ${id ? "" : "disabled"}>
        </div>
        <div class="category-usage">
          <span>${usageCount}</span>
          <small>mục đang dùng</small>
        </div>
        <button class="button secondary icon" type="button" data-action="delete-category" data-category-id="${escapeAttr(id)}" title="Xóa danh mục" ${id ? "" : "disabled"}>${svgIcon("trash")}</button>
      </div>
    `;
  }

  function categoryUsageCounts() {
    const counts = {};
    state.money.transactions.forEach((transaction) => {
      counts[transaction.category] = (counts[transaction.category] || 0) + 1;
    });
    state.money.budgetRecords.forEach((budget) => {
      counts[budget.category] = (counts[budget.category] || 0) + 1;
    });
    return counts;
  }

  function renderFriends() {
    const month = state.money.filters.month || currentMonth();
    return `
      <section class="topbar">
        <div>
          <p class="eyebrow">Bạn bè</p>
          <h1>Theo dõi tiến độ ngân sách</h1>
          <p>Thêm bạn bằng email hoặc ID. Ứng dụng chỉ hiển thị phần trăm ngân sách đã dùng, không hiển thị số tiền.</p>
        </div>
        <div class="month-control compact-month">
          <button type="button" data-action="previous-friends-month" title="Tháng trước">${svgIcon("chevronLeft")}</button>
          <input type="month" data-filter="month" value="${escapeAttr(month)}">
          <button type="button" data-action="next-friends-month" title="Tháng sau">${svgIcon("chevronRight")}</button>
        </div>
      </section>

      ${friendsSync.loading ? `<div class="sync-banner">Đang tải danh sách bạn bè...</div>` : ""}
      ${friendsSync.error ? `<div class="sync-banner error">${escapeHtml(friendsSync.error)}</div>` : ""}

      <section class="panel friends-panel">
        <div class="panel-header">
          <div>
            <h2>Danh sách bạn bè</h2>
            <p>ID của bạn: ${escapeHtml(auth.user?.id || "")}</p>
          </div>
        </div>
        <div class="friends-body">
          <form class="friend-add" data-form="friend">
            <div class="field">
              <label for="friend-identifier">Email hoặc ID</label>
              <input id="friend-identifier" name="identifier" type="text" maxlength="320" placeholder="friend@example.com hoặc 12" required>
            </div>
            <button class="button" type="submit">${svgIcon("plus")}Thêm bạn</button>
          </form>
          <div class="friend-list">
            ${friendsSync.items.length ? friendsSync.items.map(friendRow).join("") : `<div class="empty-state">Chưa có bạn bè nào. Thêm một người để xem phần trăm tiến độ ngân sách.</div>`}
          </div>
        </div>
      </section>
    `;
  }

  function friendRow(friend) {
    const percent = Math.max(0, Number(friend.budget_percent_used || 0));
    const className = percent >= 100 ? "danger" : percent >= 80 ? "warning" : "";
    return `
      <div class="friend-row">
        <div class="friend-profile">
          <span class="friend-avatar">${escapeHtml(friendInitials(friend.full_name || friend.email))}</span>
          <div>
            <strong>${escapeHtml(friend.full_name || friend.email)}</strong>
            <small>${escapeHtml(friend.email)} · ID ${escapeHtml(friend.id)}</small>
          </div>
        </div>
        <div class="friend-progress">
          <div class="row-top">
            <strong>${percent}%</strong>
            <span>${Number(friend.budget_count || 0)} ngân sách</span>
          </div>
          <div class="progress ${className}" style="--value: ${Math.min(percent, 100)}%">
            <span></span>
          </div>
        </div>
        <button class="button secondary icon friend-remove" type="button" data-action="delete-friend" data-friend-id="${escapeAttr(friend.id)}" title="Xóa bạn">${svgIcon("trash")}</button>
      </div>
    `;
  }

  function friendInitials(value) {
    return String(value || "?")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
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
    const budgetSource = auth.token && moneySync.loaded
      ? state.money.budgetRecords
      : state.money.budgetRecords.length
      ? state.money.budgetRecords
      : Object.entries(state.money.budgets).map(([category, limit]) => ({ id: "", category, limit }));
    const budgetProgress = budgetSource
      .map((budget) => {
        const hasSyncedProgress = auth.token && moneySync.loaded && budget.spent !== undefined && budget.percent !== undefined;
        const spent = hasSyncedProgress ? budget.spent : categorySpend[budget.category] || 0;
        return {
          id: budget.id,
          category: budget.category,
          limit: budget.limit,
          spent,
          percent: hasSyncedProgress ? budget.percent : budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0,
          color: normalizeBudgetColor(budget.color)
        };
      })
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

  function categoryOptions() {
    const used = [
      ...state.money.transactions.map((transaction) => transaction.category),
      ...state.money.budgetRecords.map((budget) => budget.category),
      ...Object.keys(state.money.budgets)
    ];
    return normalizeCategories([...state.money.categories, ...used]);
  }

  function categoryRecordFromApi(category) {
    return {
      id: String(category.id),
      name: String(category.name || "").slice(0, 60)
    };
  }

  function categoryLabel(category) {
    return categoryLabels[category] || category;
  }

  function transactionTypeLabel(type) {
    return typeLabels[type] || type;
  }

  function mapTransactionFromApi(transaction) {
    return normalizeTransaction({
      id: transaction.id,
      type: transaction.type,
      category: transaction.category,
      note: transaction.note,
      amount: transaction.amount,
      date: transaction.occurred_on
    });
  }

  function mapTransactionToApi(transaction) {
    return {
      type: transaction.type,
      category: transaction.category,
      note: transaction.note,
      amount: String(transaction.amount),
      occurred_on: transaction.date
    };
  }

  function budgetsFromApi(budgets) {
    return budgets.reduce((result, budget) => {
      result[budget.category] = Number(budget.limit_amount || 0);
      return result;
    }, {});
  }

  function budgetRecordFromApi(budget) {
    return normalizeBudgetRecord({
      id: budget.id,
      category: budget.category,
      month: budget.month,
      limit_amount: budget.limit_amount,
      color: budget.color,
      spent_amount: budget.spent_amount,
      percent_used: budget.percent_used
    });
  }

  async function ensureMoneyLoaded() {
    if (!auth.token || moneySync.loading) return;
    if (moneySync.loaded && moneySync.budgetMonth === state.money.filters.month) return;
    await loadMoneyFromApi();
  }

  async function ensureFriendsLoaded() {
    if (!auth.token || activeModuleId !== "friends" || friendsSync.loading) return;
    if (friendsSync.loaded && friendsSync.month === state.money.filters.month) return;
    await loadFriendsFromApi();
  }

  async function loadMoneyFromApi() {
    moneySync.loading = true;
    moneySync.error = "";
    renderActiveModule();

    try {
      const month = state.money.filters.month || currentMonth();
      const [transactions, summary, categories] = await Promise.all([
        apiRequest("/api/money/transactions"),
        apiRequest(`/api/money/summary?month=${encodeURIComponent(month)}`),
        loadCategoriesFromApi()
      ]);
      const budgets = summary.budgets || [];
      state.money.transactions = transactions.map(mapTransactionFromApi);
      state.money.budgetRecords = budgets.map(budgetRecordFromApi);
      state.money.budgets = budgetsFromApi(budgets);
      state.money.categoryRecords = categories.map(categoryRecordFromApi);
      state.money.categories = normalizeCategories(state.money.categoryRecords.map((category) => category.name));
      moneySync.loaded = true;
      moneySync.budgetMonth = month;
      saveState();
    } catch (error) {
      moneySync.error = error.message || "Không thể đồng bộ dữ liệu.";
      if (String(error.message || "").includes("authentication")) {
        auth.token = "";
        auth.user = null;
        localStorage.removeItem(AUTH_STORAGE_KEY);
        app();
        return;
      }
    } finally {
      moneySync.loading = false;
      if (auth.token && document.querySelector("#main")) {
        renderActiveModule();
      }
    }
  }

  async function loadCategoriesFromApi() {
    let categoryRecords = await apiRequest("/api/money/categories");
    if (categoryRecords.length) return categoryRecords;

    categoryRecords = await Promise.all(
      defaultCategories.map((name) => (
        apiRequest("/api/money/categories", {
          method: "POST",
          body: { name }
        })
      ))
    );
    return categoryRecords;
  }

  async function loadFriendsFromApi() {
    friendsSync.loading = true;
    friendsSync.error = "";
    renderActiveModule();

    try {
      const month = state.money.filters.month || currentMonth();
      const payload = await apiRequest(`/api/friends?month=${encodeURIComponent(month)}`);
      friendsSync.items = Array.isArray(payload.friends) ? payload.friends.map(normalizeFriend).filter(Boolean) : [];
      friendsSync.month = payload.month || month;
      friendsSync.loaded = true;
    } catch (error) {
      friendsSync.error = error.message || "Không thể tải danh sách bạn bè.";
    } finally {
      friendsSync.loading = false;
      if (auth.token && activeModuleId === "friends" && document.querySelector("#main")) {
        renderActiveModule();
      }
    }
  }

  function normalizeFriend(friend) {
    if (!friend || typeof friend !== "object") return null;
    return {
      id: String(friend.id || ""),
      email: String(friend.email || ""),
      full_name: String(friend.full_name || ""),
      budget_percent_used: Math.max(0, Number(friend.budget_percent_used || 0)),
      budget_count: Math.max(0, Number(friend.budget_count || 0))
    };
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
            ${categoryOptions().map((category) => option(category, categoryLabel(category), editing?.category || "Food")).join("")}
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
    const usedCategories = new Set(items.map((item) => item.category));
    const addOptions = categoryOptions()
      .filter((category) => !usedCategories.has(category))
      .map((category) => option(category, categoryLabel(category), ""));
    const totalSpent = items.reduce((sum, item) => sum + Number(item.spent || 0), 0);
    const totalLimit = items.reduce((sum, item) => sum + Number(item.limit || 0), 0);
    const totalPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
    const totalClassName = totalPercent >= 100 ? "danger" : totalPercent >= 80 ? "warning" : "";
    return `
      <div class="budget-list">
        <form class="budget-add" data-form="budget">
          <div class="field">
            <label for="budget-new-category">Danh mục</label>
            <select id="budget-new-category" name="category" required>
              ${addOptions.length ? addOptions.join("") : categoryOptions().map((category) => option(category, categoryLabel(category), "")).join("")}
            </select>
          </div>
          <div class="field">
            <label for="budget-new-limit">Hạn mức</label>
            <input id="budget-new-limit" name="limit_amount" type="number" min="0" step="1000" placeholder="0" required>
          </div>
          <button class="button secondary" type="submit">${svgIcon("plus")}Thêm</button>
        </form>
        ${items.length ? `
          <div class="budget-total">
            <div class="row-top">
              <strong>Tổng ngân sách</strong>
              <span>${formatter.format(totalSpent)} / ${formatter.format(totalLimit)}</span>
            </div>
            <div class="progress ${totalClassName}" style="--value: ${Math.min(totalPercent, 100)}%">
              <span></span>
            </div>
            <small>${totalPercent}% đã dùng trong tháng</small>
          </div>
        ` : ""}
        ${items.length ? "" : `<div class="empty-state">Chưa có ngân sách nào. Thêm danh mục để bắt đầu theo dõi.</div>`}
        ${items.length ? `
          <div class="category-chart-grid budget-card-grid">
            ${items.map((item) => budgetCard(item, formatter)).join("")}
          </div>
        ` : ""}
      </div>
    `;
  }

  function budgetCard(item, formatter) {
    const percent = Math.max(0, Number(item.percent || 0));
    const className = percent >= 100 ? "danger" : percent >= 80 ? "warning" : "";
    const color = normalizeBudgetColor(item.color);
    const isEditing = editingBudgetId === item.id;
    return `
      <div class="category-chart-card budget-card" data-budget-row="${escapeAttr(item.id)}" style="--row-accent: ${escapeAttr(color)}; --row-bg: ${escapeAttr(budgetColorTint(color))}" title="${escapeAttr(categoryLabel(item.category))}: ${formatter.format(item.spent)} / ${formatter.format(item.limit)}">
        <div class="row-top">
          <strong>${escapeHtml(categoryLabel(item.category))}</strong>
          <span>${percent}%</span>
        </div>
        <div class="progress ${className}" style="--value: ${Math.min(percent, 100)}%">
          <span></span>
        </div>
        <small>${formatter.format(item.spent)} / ${formatter.format(item.limit)}</small>
        ${isEditing ? budgetEditForm(item, color) : budgetCardActions(item)}
      </div>
    `;
  }

  function budgetCardActions(item) {
    return `
      <div class="budget-card-actions">
        <button class="button secondary" type="button" data-action="edit-budget" data-budget-id="${escapeAttr(item.id)}">${svgIcon("edit")}Sửa</button>
        <button class="button secondary" type="button" data-action="delete-budget" data-budget-id="${escapeAttr(item.id)}">${svgIcon("trash")}Xóa</button>
      </div>
    `;
  }

  function budgetEditForm(item, color) {
    return `
      <form class="budget-card-edit" data-form="budget-card" data-budget-id="${escapeAttr(item.id)}">
        <div class="field">
          <label>Danh mục</label>
          <div class="readonly-field">${escapeHtml(categoryLabel(item.category))}</div>
        </div>
        <div class="field">
          <label for="budget-${escapeAttr(item.id || slug(item.category))}">Hạn mức tháng</label>
          <input id="budget-${escapeAttr(item.id || slug(item.category))}" name="limit_amount" type="number" min="0" step="1000" value="${item.limit}" required>
        </div>
        <div class="field wide">
          <label>Màu</label>
          <div class="color-picker">
            ${budgetColors.map((swatch) => `
              <label class="color-swatch" style="--swatch: ${escapeAttr(swatch)}" title="${escapeAttr(swatch)}">
                <input type="radio" name="color" value="${escapeAttr(swatch)}" ${swatch.toLowerCase() === color.toLowerCase() ? "checked" : ""}>
                <span></span>
              </label>
            `).join("")}
          </div>
        </div>
        <div class="form-actions">
          <button class="button secondary" type="button" data-action="cancel-budget-edit">Hủy</button>
          <button class="button" type="submit">Lưu</button>
        </div>
      </form>
    `;
  }

  async function handleClick(event) {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;

    const action = actionTarget.dataset.action;
    if (action === "switch-module") {
      activeModuleId = actionTarget.dataset.moduleId;
      app();
    }

    if (action === "switch-auth-mode") {
      authMode = authMode === "login" ? "register" : "login";
      app();
    }

    if (action === "previous-month" || action === "next-month") {
      state.money.filters.month = shiftMonth(
        state.money.filters.month || currentMonth(),
        action === "previous-month" ? -1 : 1
      );
      moneySync.loaded = false;
      saveState();
      renderActiveModule();
      ensureMoneyLoaded();
    }

    if (action === "previous-friends-month" || action === "next-friends-month") {
      state.money.filters.month = shiftMonth(
        state.money.filters.month || currentMonth(),
        action === "previous-friends-month" ? -1 : 1
      );
      friendsSync.loaded = false;
      saveState();
      renderActiveModule();
      ensureFriendsLoaded();
    }

    if (action === "logout") {
      auth.token = "";
      auth.user = null;
      localStorage.removeItem(AUTH_STORAGE_KEY);
      editingId = null;
      editingBudgetId = null;
      app();
      showToast("Đã đăng xuất.");
    }

    if (action === "edit-transaction") {
      editingId = actionTarget.dataset.id;
      renderActiveModule();
    }

    if (action === "delete-transaction") {
      await deleteTransaction(actionTarget.dataset.id);
    }

    if (action === "delete-budget") {
      await deleteBudget(actionTarget.dataset.budgetId);
    }

    if (action === "edit-budget") {
      editingBudgetId = actionTarget.dataset.budgetId;
      renderActiveModule();
    }

    if (action === "cancel-budget-edit") {
      editingBudgetId = null;
      renderActiveModule();
    }

    if (action === "delete-category") {
      await deleteCategory(actionTarget.dataset.categoryId);
    }

    if (action === "delete-friend") {
      await deleteFriend(actionTarget.dataset.friendId);
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
      await resetDemoData();
    }
  }

  function handleInput(event) {
    if (event.target.matches("#filter-search")) {
      state.money.filters.search = event.target.value;
      saveState();
    }
  }

  async function handleChange(event) {
    if (event.target.id === "import-file") {
      importData(event.target.files[0]);
      event.target.value = "";
    }

    if (event.target.matches("[data-filter]")) {
      state.money.filters[event.target.dataset.filter] = event.target.value;
      if (event.target.dataset.filter === "month") friendsSync.loaded = false;
      saveState();
      renderActiveModule();
      ensureMoneyLoaded();
      ensureFriendsLoaded();
    }

    if (event.target.matches("[data-category-name]")) {
      const nextName = event.target.value.trim();
      const previousName = event.target.dataset.originalName;
      if (nextName && nextName !== previousName) {
        await updateCategory(event.target.dataset.categoryName, nextName);
      } else {
        event.target.value = previousName;
      }
    }
  }

  async function handleSubmit(event) {
    const authForm = event.target.closest("[data-form='login'], [data-form='register']");
    if (authForm) {
      event.preventDefault();
      await submitAuth(authForm);
      return;
    }

    const budgetForm = event.target.closest("[data-form='budget']");
    if (budgetForm) {
      event.preventDefault();
      await createBudget(budgetForm);
      return;
    }

    const budgetCardForm = event.target.closest("[data-form='budget-card']");
    if (budgetCardForm) {
      event.preventDefault();
      await saveBudgetCard(budgetCardForm);
      return;
    }

    const categoryForm = event.target.closest("[data-form='category']");
    if (categoryForm) {
      event.preventDefault();
      await createCategory(categoryForm);
      return;
    }

    const friendForm = event.target.closest("[data-form='friend']");
    if (friendForm) {
      event.preventDefault();
      await createFriend(friendForm);
      return;
    }

    const form = event.target.closest("[data-form='transaction']");
    if (!form) return;

    event.preventDefault();
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const transaction = {
      id,
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

    try {
      if (id) {
        const updated = await apiRequest(`/api/money/transactions/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: mapTransactionToApi(transaction)
        });
        state.money.transactions = state.money.transactions.map((item) => item.id === id ? mapTransactionFromApi(updated) : item);
        editingId = null;
        saveAndRender("Đã cập nhật giao dịch.");
      } else {
        const created = await apiRequest("/api/money/transactions", {
          method: "POST",
          body: mapTransactionToApi(transaction)
        });
        state.money.transactions.unshift(mapTransactionFromApi(created));
        saveAndRender("Đã thêm giao dịch.");
      }
      await loadMoneyFromApi();
    } catch (error) {
      showToast(error.message || "Không thể lưu giao dịch.");
    }
  }

  async function submitAuth(form) {
    const formData = new FormData(form);
    const mode = form.dataset.form;
    const apiUrl = String(formData.get("api_base_url") || DEFAULT_API_BASE_URL);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const fullName = String(formData.get("full_name") || "").trim();

    setApiBaseUrl(apiUrl);

    if (!email || !password || (mode === "register" && !fullName)) {
      showToast("Hãy nhập đầy đủ thông tin.");
      return;
    }

    try {
      if (mode === "register") {
        await apiRequest("/api/auth/register", {
          method: "POST",
          body: { email, password, full_name: fullName }
        });
      }

      const token = await apiRequest("/api/auth/login", {
        method: "POST",
        body: { email, password }
      });
      auth.token = token.access_token;
      auth.user = await apiRequest("/api/auth/me", { token: auth.token });
      moneySync.loaded = false;
      moneySync.budgetMonth = "";
      moneySync.error = "";
      saveAuth();
      app();
      showToast(mode === "register" ? "Tạo tài khoản thành công." : "Đăng nhập thành công.");
    } catch (error) {
      showToast(error.message || "Không thể kết nối API.");
    }
  }

  async function apiRequest(path, options = {}) {
    const token = options.token === undefined ? auth.token : options.token;
    let response;
    try {
      response = await fetch(`${apiBaseUrl()}${path}`, {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });
    } catch (error) {
      throw new Error("Không thể kết nối API. Hãy kiểm tra backend đã chạy chưa.");
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(apiErrorMessage(payload.detail, response.status));
    }

    if (response.status === 204) return null;
    return response.json();
  }

  function apiErrorMessage(detail, status) {
    if (detail === "Email is already registered") return "Email này đã được đăng ký.";
    if (detail === "Incorrect email or password") return "Email hoặc mật khẩu không đúng.";
    if (detail === "Budget already exists for this category and month") return "Danh mục này đã có ngân sách trong tháng.";
    if (detail === "Budget not found") return "Không tìm thấy ngân sách.";
    if (detail === "Category already exists") return "Danh mục này đã tồn tại.";
    if (detail === "Category is in use") return "Danh mục đang được dùng trong giao dịch hoặc ngân sách.";
    if (detail === "Category not found") return "Không tìm thấy danh mục.";
    if (detail === "Friend user not found") return "Không tìm thấy người dùng này.";
    if (detail === "Cannot add yourself as a friend") return "Bạn không thể thêm chính mình.";
    if (detail === "Friend already exists") return "Người này đã có trong danh sách bạn bè.";
    if (detail === "Friend not found") return "Không tìm thấy bạn bè.";
    if (status === 0) return "Không thể kết nối API.";
    if (typeof detail === "string") return detail;
    return "Yêu cầu không thành công.";
  }

  async function deleteTransaction(id) {
    try {
      await apiRequest(`/api/money/transactions/${encodeURIComponent(id)}`, { method: "DELETE" });
      state.money.transactions = state.money.transactions.filter((transaction) => transaction.id !== id);
      if (editingId === id) editingId = null;
      saveAndRender("Đã xóa giao dịch.");
      await loadMoneyFromApi();
    } catch (error) {
      showToast(error.message || "Không thể xóa giao dịch.");
    }
  }

  async function createBudget(form) {
    const formData = new FormData(form);
    const category = String(formData.get("category") || "");
    const limit = Number(formData.get("limit_amount") || 0);

    if (!category) {
      showToast("Hãy chọn danh mục ngân sách.");
      return;
    }

    try {
      await apiRequest("/api/money/budgets", {
        method: "PUT",
        body: {
          category,
          month: state.money.filters.month || currentMonth(),
          limit_amount: String(limit),
          color: budgetColors[0]
        }
      });
      form.reset();
      await loadMoneyFromApi();
      showToast("Đã thêm ngân sách.");
    } catch (error) {
      showToast(error.message || "Không thể thêm ngân sách.");
    }
  }

  async function updateBudget(id, updates) {
    if (!id) {
      showToast("Ngân sách chưa sẵn sàng để chỉnh sửa.");
      return;
    }

    try {
      await apiRequest(`/api/money/budgets/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: updates
      });
      editingBudgetId = null;
      await loadMoneyFromApi();
      showToast("Đã cập nhật ngân sách.");
    } catch (error) {
      showToast(error.message || "Không thể cập nhật ngân sách.");
      await loadMoneyFromApi();
    }
  }

  async function deleteBudget(id) {
    if (!id) {
      showToast("Ngân sách chưa sẵn sàng để xóa.");
      return;
    }

    try {
      await apiRequest(`/api/money/budgets/${encodeURIComponent(id)}`, { method: "DELETE" });
      if (editingBudgetId === id) editingBudgetId = null;
      await loadMoneyFromApi();
      showToast("Đã xóa ngân sách.");
    } catch (error) {
      showToast(error.message || "Không thể xóa ngân sách.");
    }
  }

  async function saveBudgetCard(form) {
    const id = form.dataset.budgetId;
    const formData = new FormData(form);
    const limit = Number(formData.get("limit_amount") || 0);
    const color = normalizeBudgetColor(formData.get("color"));

    await updateBudget(id, {
      limit_amount: String(limit),
      color
    });
  }

  async function createCategory(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    if (!name) {
      showToast("Hãy nhập tên danh mục.");
      return;
    }

    try {
      await apiRequest("/api/money/categories", {
        method: "POST",
        body: { name }
      });
      form.reset();
      await loadMoneyFromApi();
      showToast("Đã thêm danh mục.");
    } catch (error) {
      showToast(error.message || "Không thể thêm danh mục.");
    }
  }

  async function updateCategory(id, name) {
    if (!id) {
      showToast("Danh mục chưa sẵn sàng để chỉnh sửa.");
      return;
    }

    try {
      await apiRequest(`/api/money/categories/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: { name }
      });
      await loadMoneyFromApi();
      showToast("Đã cập nhật danh mục.");
    } catch (error) {
      showToast(error.message || "Không thể cập nhật danh mục.");
      await loadMoneyFromApi();
    }
  }

  async function deleteCategory(id) {
    if (!id) {
      showToast("Danh mục chưa sẵn sàng để xóa.");
      return;
    }

    try {
      await apiRequest(`/api/money/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadMoneyFromApi();
      showToast("Đã xóa danh mục.");
    } catch (error) {
      showToast(error.message || "Không thể xóa danh mục.");
    }
  }

  async function createFriend(form) {
    const formData = new FormData(form);
    const identifier = String(formData.get("identifier") || "").trim();
    if (!identifier) {
      showToast("Hãy nhập email hoặc ID.");
      return;
    }

    try {
      await apiRequest(`/api/friends?month=${encodeURIComponent(state.money.filters.month || currentMonth())}`, {
        method: "POST",
        body: { identifier }
      });
      form.reset();
      friendsSync.loaded = false;
      await loadFriendsFromApi();
      showToast("Đã thêm bạn bè.");
    } catch (error) {
      showToast(error.message || "Không thể thêm bạn bè.");
    }
  }

  async function deleteFriend(id) {
    if (!id) {
      showToast("Bạn bè chưa sẵn sàng để xóa.");
      return;
    }

    try {
      await apiRequest(`/api/friends/${encodeURIComponent(id)}`, { method: "DELETE" });
      friendsSync.loaded = false;
      await loadFriendsFromApi();
      showToast("Đã xóa bạn bè.");
    } catch (error) {
      showToast(error.message || "Không thể xóa bạn bè.");
    }
  }

  async function resetDemoData() {
    try {
      const month = currentMonth();
      const currentMonthTransactions = state.money.transactions.filter((transaction) => transaction.date.startsWith(month));
      await Promise.all(
        currentMonthTransactions.map((transaction) => (
          apiRequest(`/api/money/transactions/${encodeURIComponent(transaction.id)}`, { method: "DELETE" })
        ))
      );
      await Promise.all(
        demoTransactions().map((transaction) => (
          apiRequest("/api/money/transactions", {
            method: "POST",
            body: mapTransactionToApi(transaction)
          })
        ))
      );
      await Promise.all(
        Object.entries(defaultBudgets).map(([category, limit], index) => (
          apiRequest("/api/money/budgets", {
            method: "PUT",
            body: { category, month, limit_amount: String(limit), color: budgetColors[index % budgetColors.length] }
          })
        ))
      );
      state.money.filters = { month, type: "all", category: "all", search: "" };
      editingId = null;
      editingBudgetId = null;
      await loadMoneyFromApi();
      showToast("Đã khôi phục dữ liệu mẫu.");
    } catch (error) {
      showToast(error.message || "Không thể tạo dữ liệu mẫu.");
    }
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
