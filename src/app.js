(function () {
  const STORAGE_KEY = "universal-app-state-v2";
  const AUTH_STORAGE_KEY = "universal-app-auth-v1";
  const ONBOARDING_DRAFT_STORAGE_KEY = "universal-app-onboarding-draft-v1";
  const FEATURE_NOTIFICATION_STORAGE_KEY = "universal-app-feature-notifications-v1";
  const API_BASE_STORAGE_KEY = "universal-app-api-base-url";
  const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
  const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
  const avatarMimeLabels = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "image/webp": "WEBP",
    "image/gif": "GIF"
  };

  const legacyCategoryLabels = {
    Food: "Ăn uống",
    Housing: "Nhà ở",
    Transport: "Di chuyển",
    Utilities: "Hóa đơn",
    Health: "Sức khỏe",
    Entertainment: "Giải trí",
    Shopping: "Mua sắm",
    Other: "Khác"
  };

  const excludedDefaultCategories = new Set(["Salary", "Freelance", "Savings", "Lương", "Làm thêm", "Tiết kiệm"]);
  const defaultCategories = [
    "Nhà ở",
    "Ăn uống",
    "Gửi bố mẹ",
    "Hóa đơn",
    "Di chuyển",
    "Sức khỏe",
    "Dating",
    "Mua sắm",
    "Giải trí",
    "Khác"
  ];
  const categoryLabels = legacyCategoryLabels;

  const typeLabels = {
    expense: "Chi tiêu"
  };

  const currencyOptions = {
    VND: { label: "VND", locale: "vi-VN", currency: "VND", fractionDigits: 0, step: "1000" },
    USD: { label: "Dollar", locale: "en-US", currency: "USD", fractionDigits: 2, step: "0.01" },
    EUR: { label: "Euro", locale: "de-DE", currency: "EUR", fractionDigits: 2, step: "0.01" }
  };

  const defaultBudgets = {
    "Nhà ở": 12000000,
    "Ăn uống": 6000000,
    "Gửi bố mẹ": 3000000,
    "Hóa đơn": 3000000,
    "Di chuyển": 2500000,
    "Sức khỏe": 2500000,
    "Dating": 2500000,
    "Mua sắm": 4000000,
    "Giải trí": 3000000,
    "Khác": 2000000
  };

  const budgetColors = [
    "#2563eb",
    "#0f766e",
    "#f59e0b",
    "#7c3aed",
    "#0891b2",
    "#16a34a",
    "#4f46e5",
    "#0284c7",
    "#059669",
    "#65a30d",
    "#14b8a6",
    "#64748b"
  ];
  const defaultBudgetColor = budgetColors[0];
  const dangerBudgetColor = "#e11d48";
  const fundColors = [
    "#0f766e",
    "#2563eb",
    "#7c3aed",
    "#f59e0b",
    "#0891b2",
    "#16a34a",
    "#4f46e5",
    "#64748b"
  ];
  const defaultFundColor = fundColors[0];
  const automaticFundDefinitions = [
    {
      id: "emergency",
      name: "Quỹ khẩn cấp",
      subtitle: "12 tháng Chi tiêu tối thiểu",
      color: "#0f766e",
      target: (totals) => totals.minimum * 12
    },
    {
      id: "independence",
      name: "Quỹ độc lập tài chính",
      subtitle: "25 năm Chi tiêu tối thiểu",
      color: "#2563eb",
      target: (totals) => totals.minimum * 12 * 25
    },
    {
      id: "freedom",
      name: "Quỹ tự do tài chính",
      subtitle: "25 năm Chi tiêu đầy đủ",
      color: "#7c3aed",
      target: (totals) => totals.full * 12 * 25
    }
  ];
  const automaticFundAliases = [
    "Độc lập tài chính",
    "Tự do tài chính"
  ];
  const automaticFundNames = new Set([
    ...automaticFundDefinitions.map((fund) => fund.name),
    ...automaticFundAliases
  ].map((name) => name.toLowerCase()));
  const defaultFundRecommendations = [
    "Du lịch",
    "Đầu tư cổ phiếu"
  ];
  const featureAnnouncements = [
    {
      id: "friends-current-month-progress-2026-08-04",
      badge: "Cải tiến mới",
      title: "Bạn bè chỉ hiển thị tiến độ tháng hiện tại",
      timestamp: "2026-08-04T21:23:05+07:00",
      timeLabel: "2026-08-04 21:23:05 +07",
      summary: "Danh sách Bạn bè giờ chỉ dùng tiến độ ngân sách tháng hiện tại và đồng bộ cùng một cách tính cho mọi người.",
      purpose: [
        "Tránh việc mỗi người chọn một tháng khác nhau rồi nhìn thấy phần trăm tiến độ không giống nhau.",
        "Đảm bảo dòng của bạn và dòng bạn bè cùng dùng dữ liệu tháng hiện tại từ máy chủ.",
        "Giữ danh sách Bạn bè tập trung vào so sánh tiến độ hiện tại, không phải lịch sử ngân sách."
      ],
      recommended: [
        "Dùng khi bạn muốn xem nhanh ai đang dùng bao nhiêu phần trăm ngân sách trong tháng này.",
        "Dùng khi cần so sánh với bạn bè mà không cần đổi tháng hoặc nhớ đang xem tháng nào."
      ],
      howTo: [
        "Mở tab Bạn bè.",
        "Ứng dụng tự tải tiến độ tháng hiện tại từ máy chủ.",
        "Xem thanh tiến độ của bạn và bạn bè; mọi người sẽ thấy cùng một phần trăm cho cùng một người.",
        "Muốn xem tháng khác thì dùng tab Ngân sách của chính bạn, không dùng danh sách Bạn bè."
      ],
      ctaLabel: "Mở Bạn bè",
      moduleId: "friends"
    },
    {
      id: "game-wordle-phase2-2026-08-04",
      badge: "Tính năng GAME",
      title: "GAME Wordle có bàn phím ảo và kiểm tra từ tốt hơn",
      timestamp: "2026-08-04T09:47:12+07:00",
      timeLabel: "2026-08-04 09:47:12 +07",
      summary: "Tab GAME có Wordle hằng ngày, tiến độ người chơi dạng bảng màu, bàn phím ảo và chấp nhận từ tiếng Anh hợp lệ ngoài bộ 3000 từ.",
      purpose: [
        "Tạo một game Wordle chung mỗi ngày để mọi người cùng đoán một đáp án.",
        "Cho người chơi xem tiến độ của nhau mà không lộ chữ hoặc từ đã đoán.",
        "Giúp thao tác dễ hơn bằng bàn phím ảo có màu gợi ý cho từng chữ."
      ],
      recommended: [
        "Dùng khi bạn muốn chơi Wordle hằng ngày ngay trong app.",
        "Dùng bàn phím ảo khi chơi bằng chuột hoặc trên màn hình cảm ứng.",
        "Xem Tiến độ người chơi để biết người khác đã đi được bao nhiêu hàng mà vẫn giữ riêng tư đáp án."
      ],
      howTo: [
        "Mở tab GAME.",
        "Gõ từ tiếng Anh 5 chữ hoặc bấm bàn phím ảo.",
        "Bấm ĐOÁN để gửi lượt đoán.",
        "Dùng màu trên ô và bàn phím: xanh là đúng vị trí, cam là có chữ sai vị trí, xám là không có trong từ.",
        "Theo dõi bảng màu của người chơi khác trong Tiến độ người chơi."
      ],
      ctaLabel: "Mở GAME",
      moduleId: "game"
    },
    {
      id: "funds-bucket-automatic-2026-08-04",
      badge: "Tính năng mới",
      title: "Túi tiền và Quỹ dài hạn",
      timestamp: "2026-08-04T11:18:09+07:00",
      timeLabel: "2026-08-04 11:18:09 +07",
      summary: "Theo dõi tổng tiền hiện có, mục tiêu tiết kiệm riêng, và ba quỹ chiến lược được tự động tính từ ngân sách.",
      purpose: [
        "Túi tiền giúp bạn ghi lại tổng số tiền đang có ở thời điểm hiện tại.",
        "Quỹ riêng giúp bạn đặt mục tiêu dài hạn như du lịch, đầu tư cổ phiếu hoặc khoản mua lớn.",
        "Quỹ khẩn cấp, Quỹ độc lập tài chính và Quỹ tự do tài chính được tự tính từ Chi tiêu tối thiểu và Chi tiêu đầy đủ để bạn không phải nhập tay."
      ],
      recommended: [
        "Dùng Túi tiền khi bạn muốn có một con số tổng cho tiền mặt, tài khoản ngân hàng và khoản tiết kiệm dễ dùng.",
        "Dùng Quỹ riêng khi mục tiêu không lặp lại theo tháng, ví dụ chuyến đi, học phí, thiết bị làm việc hoặc khoản đầu tư.",
        "Dùng ba quỹ tự động để kiểm tra nhanh mức an toàn tài chính: khẩn cấp bằng 12 tháng chi tiêu tối thiểu, độc lập tài chính bằng 25 năm chi tiêu tối thiểu, tự do tài chính bằng 25 năm chi tiêu đầy đủ."
      ],
      howTo: [
        "Mở tab Túi tiền, nhập Tổng tiền hiện có rồi lưu.",
        "Thiết lập Chi tiêu tối thiểu và Chi tiêu đầy đủ trong onboarding hoặc Ngân sách để các quỹ tự động có mục tiêu đúng.",
        "Tạo Quỹ riêng bằng tên, mục tiêu và số tiền đã có; cập nhật định kỳ khi bạn chuyển thêm tiền vào mục tiêu đó.",
        "Xem phần Quỹ tự động để biết Túi tiền hiện tại đã đạt bao nhiêu phần trăm so với các mốc khẩn cấp, độc lập và tự do tài chính."
      ],
      ctaLabel: "Mở Túi tiền",
      moduleId: "funds"
    },
    {
      id: "onboarding-prefill-current-settings-2026-08-04",
      badge: "Cải tiến mới",
      title: "Thiết lập ngân sách lại không còn bắt đầu trống",
      timestamp: "2026-08-04T17:08:19+07:00",
      timeLabel: "2026-08-04 17:08:19 +07",
      summary: "Khi mở lại thiết lập ngân sách từ Hồ sơ, ứng dụng sẽ điền sẵn Túi tiền, Quỹ riêng, thu nhập, tiền tệ và ngân sách hiện tại để bạn chỉ cần chỉnh phần muốn đổi.",
      purpose: [
        "Giảm việc phải nhớ lại từng hạn mức, thu nhập hoặc quỹ đã nhập trước đó.",
        "Giúp bạn điều chỉnh ngân sách nhanh hơn khi chi phí sống, thu nhập hoặc mục tiêu thay đổi.",
        "Giữ onboarding như một màn hình chỉnh sửa tổng thể, không chỉ là thiết lập lần đầu."
      ],
      recommended: [
        "Dùng khi bạn vừa đổi mức chi tiêu tối thiểu hoặc chi tiêu đầy đủ cho nhiều danh mục.",
        "Dùng khi thu nhập tháng thay đổi và bạn muốn các ước tính tài chính tự cập nhật.",
        "Dùng khi muốn rà soát lại toàn bộ Túi tiền, Quỹ riêng và ngân sách mà không phải mở từng tab."
      ],
      howTo: [
        "Mở Hồ sơ rồi chọn Thiết lập ngân sách lại.",
        "Ứng dụng sẽ tải thiết lập hiện tại của tháng này và điền sẵn vào màn hình thiết lập.",
        "Chỉnh các dòng cần thay đổi, thêm hoặc xóa danh mục/quỹ riêng nếu cần.",
        "Bấm lưu để cập nhật Túi tiền, Quỹ riêng, thu nhập, tiền tệ và ngân sách tháng hiện tại."
      ],
      ctaLabel: "Mở Hồ sơ",
      moduleId: "profile"
    },
    {
      id: "compact-newest-feature-notifications-2026-08-04",
      badge: "Cải tiến mới",
      title: "Thông báo gọn hơn, mới nhất ở trên",
      timestamp: "2026-08-04T17:10:20+07:00",
      timeLabel: "2026-08-04 17:10:20 +07",
      summary: "Thông báo tính năng giờ hiển thị ngắn gọn theo thứ tự mới nhất trước; bấm vào từng dòng để mở trang chi tiết đầy đủ.",
      purpose: [
        "Giúp bạn nhìn nhanh các cập nhật mới mà không phải đọc một khối nội dung dài ngay lập tức.",
        "Giữ thông báo rõ ràng hơn khi ứng dụng có nhiều tính năng mới."
      ],
      recommended: [
        "Dùng khi bạn chỉ muốn lướt nhanh tính năng mới sau khi đăng nhập.",
        "Bấm vào thông báo có liên quan khi bạn muốn đọc mục đích, trường hợp nên dùng và cách dùng chi tiết mà không bị nội dung dài che mất phần còn lại."
      ],
      howTo: [
        "Mở Thông báo ở thanh bên.",
        "Xem các dòng thông báo ngắn, mới nhất nằm trên cùng.",
        "Bấm vào dòng thông báo hoặc chữ Xem chi tiết để mở trang chi tiết đầy đủ.",
        "Bấm Danh sách thông báo để quay lại danh sách ngắn."
      ]
    },
    {
      id: "freedom-time-uses-bucket-2026-08-04",
      badge: "Cải tiến mới",
      title: "Thời gian tự do tài chính đã tính Túi tiền hiện có",
      timestamp: "2026-08-04T17:40:23+07:00",
      timeLabel: "2026-08-04 17:40:23 +07",
      summary: "Ước tính Độc lập tài chính và Tự do tài chính giờ trừ số tiền đã có trong Túi tiền trước khi tính thời gian còn lại.",
      purpose: [
        "Làm thời gian ước tính thực tế hơn vì người dùng đã có sẵn một phần tài sản.",
        "Tránh tính lại từ con số 0 khi người dùng đã nhập Túi tiền."
      ],
      recommended: [
        "Dùng khi bạn đã nhập tổng tiền hiện có trong Túi tiền.",
        "Dùng để xem còn bao lâu nữa tới Độc lập tài chính hoặc Tự do tài chính sau khi trừ tài sản hiện có."
      ],
      howTo: [
        "Mở tab Túi tiền và nhập Tổng tiền hiện có.",
        "Thiết lập Chi tiêu tối thiểu, Chi tiêu đầy đủ và Thu nhập tháng.",
        "Xem các thẻ Độc lập tài chính và Tự do tài chính trong Ngân sách hoặc onboarding; thời gian sẽ tính theo mục tiêu còn lại."
      ],
      ctaLabel: "Mở Túi tiền",
      moduleId: "funds"
    }
  ];

  const icons = {
    money: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
    transactions: "M4 6h16M4 12h16M4 18h10",
    profile: "M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM20 21a8 8 0 1 0-16 0",
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
    game: "M7 3h10l4 7-9 11L3 10l4-7ZM7 3l5 18M17 3l-5 18M3 10h18",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
    close: "M18 6 6 18M6 6l12 12",
    chevronLeft: "M15 18l-6-6 6-6",
    chevronRight: "M9 18l6-6-6-6",
    check: "M20 6 9 17l-5-5"
  };

  const state = loadState();
  const auth = loadAuth();
  const readFeatureNotificationIds = loadReadFeatureNotificationIds();
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
    self: null,
    items: [],
    incoming: [],
    outgoing: []
  };
  const gameSync = {
    loaded: false,
    loading: false,
    error: "",
    data: null,
    guessDraft: "",
    pollingId: null
  };
  let authMode = "login";
  let activeModuleId = "money";
  let editingId = null;
  let editingBudgetId = null;
  let budgetAddOpen = false;
  let onboardingActive = false;
  let onboardingDraft = null;
  let featureNotificationPanelOpen = false;
  let featureNotificationAutoChecked = false;
  let openedFeatureAnnouncementId = "";

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
      id: "funds",
      label: "Túi tiền",
      description: "Theo dõi tổng tiền hiện có và các quỹ dài hạn.",
      icon: "goals",
      enabled: true,
      render: renderFunds
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
      id: "game",
      label: "GAME",
      description: "Wordle hằng ngày và tiến độ người chơi.",
      icon: "game",
      enabled: true,
      render: renderGame
    },
    {
      id: "profile",
      label: "Hồ sơ",
      description: "Cập nhật tài khoản, ảnh đại diện, tiền tệ và mật khẩu.",
      icon: "profile",
      enabled: true,
      render: renderProfile
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
        bucket: { id: "", total: 0 },
        funds: [],
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
      safeBudgets[localizeCategoryName(category)] = Math.max(0, Number(limit) || 0);
      return safeBudgets;
    }, {});
    const filters = money.filters && typeof money.filters === "object" ? money.filters : {};
    const month = /^\d{4}-\d{2}$/.test(String(filters.month)) ? String(filters.month) : currentMonth();
    const categoryFilter = String(filters.category || "all");

    return {
      money: {
        transactions: Array.isArray(money.transactions) ? money.transactions.map(normalizeTransaction).filter(Boolean) : [],
        budgetRecords: Array.isArray(money.budgetRecords) ? money.budgetRecords.map(normalizeBudgetRecord).filter(Boolean) : [],
        categoryRecords: Array.isArray(money.categoryRecords) ? money.categoryRecords.map(normalizeCategoryRecord).filter(Boolean) : [],
        bucket: normalizeBucketRecord(money.bucket),
        funds: Array.isArray(money.funds)
          ? money.funds.map(normalizeFundRecord).filter((fund) => fund && !isAutomaticFundName(fund.name))
          : [],
        categories: normalizeCategories(money.categories),
        budgets,
        filters: {
          month,
          type: "expense",
          category: categoryFilter === "all" ? "all" : localizeCategoryName(categoryFilter).slice(0, 60),
          search: String(filters.search || "").slice(0, 100)
        }
      }
    };
  }

  function normalizeCategories(values) {
    const source = Array.isArray(values) && values.length ? values : defaultCategories;
    return [...new Set(source.map(localizeCategoryName).filter((name) => name && !excludedDefaultCategories.has(name)))].slice(0, 80);
  }

  function localizeCategoryName(category) {
    const name = String(category || "").trim().slice(0, 60);
    return legacyCategoryLabels[name] || name;
  }

  function normalizeCategoryRecord(category) {
    if (!category || typeof category !== "object") return null;

    const name = String(category.name || "").trim().slice(0, 60);
    if (!name) return null;

    return {
      id: category.id === undefined || category.id === null ? "" : String(category.id),
      name: localizeCategoryName(name)
    };
  }

  function normalizeBudgetRecord(budget) {
    if (!budget || typeof budget !== "object") return null;

    return {
      id: budget.id === undefined || budget.id === null ? "" : String(budget.id),
      category: localizeCategoryName(budget.category || "Khác").slice(0, 60),
      month: /^\d{4}-\d{2}$/.test(String(budget.month)) ? String(budget.month) : currentMonth(),
      limit: Math.max(0, Number(budget.limit || budget.limit_amount || 0)),
      minimum: Math.max(0, Number(budget.minimum || budget.minimum_amount || budget.limit || budget.limit_amount || 0)),
      full: Math.max(0, Number(budget.full || budget.full_amount || budget.limit || budget.limit_amount || 0)),
      spent: Math.max(0, Number(budget.spent || budget.spent_amount || 0)),
      percent: Math.max(0, Number(budget.percent || budget.percent_used || 0)),
      color: normalizeBudgetColor(budget.color)
    };
  }

  function normalizeBucketRecord(bucket) {
    if (!bucket || typeof bucket !== "object") return { id: "", total: 0 };
    return {
      id: bucket.id === undefined || bucket.id === null ? "" : String(bucket.id),
      total: Math.max(0, Number(bucket.total || bucket.total_amount || 0))
    };
  }

  function normalizeFundRecord(fund) {
    if (!fund || typeof fund !== "object") return null;
    const name = String(fund.name || "").trim().slice(0, 80);
    if (!name) return null;
    const target = Math.max(0, Number(fund.target || fund.target_amount || 0));
    const saved = Math.max(0, Number(fund.saved || fund.saved_amount || 0));
    return {
      id: fund.id === undefined || fund.id === null ? "" : String(fund.id),
      name,
      target,
      saved,
      percent: Math.max(0, Number(fund.percent || fund.percent_saved || (target > 0 ? Math.round((saved / target) * 100) : 0))),
      color: normalizeFundColor(fund.color)
    };
  }

  function isAutomaticFundName(name) {
    return automaticFundNames.has(String(name || "").trim().toLowerCase());
  }

  function normalizeFundColor(value) {
    const color = String(value || "").trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return defaultFundColor;
    return color;
  }

  function normalizeBudgetColor(value) {
    const color = String(value || "").trim();
    const normalized = color.toLowerCase();
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return defaultBudgetColor;
    if (isRedAdjacentBudgetColor(normalized)) return defaultBudgetColor;
    return color;
  }

  function budgetColorTint(value) {
    const color = normalizeBudgetColor(value).slice(1);
    const red = parseInt(color.slice(0, 2), 16);
    const green = parseInt(color.slice(2, 4), 16);
    const blue = parseInt(color.slice(4, 6), 16);
    return `rgba(${red}, ${green}, ${blue}, 0.14)`;
  }

  function isRedAdjacentBudgetColor(color) {
    if (["#e11d48", "#dc2626", "#ef4444", "#f43f5e", "#fb7185", "#ea580c"].includes(color)) return true;

    const red = parseInt(color.slice(1, 3), 16) / 255;
    const green = parseInt(color.slice(3, 5), 16) / 255;
    const blue = parseInt(color.slice(5, 7), 16) / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    if (delta === 0) return false;

    let hue = 0;
    if (max === red) hue = 60 * (((green - blue) / delta) % 6);
    if (max === green) hue = 60 * ((blue - red) / delta + 2);
    if (max === blue) hue = 60 * ((red - green) / delta + 4);
    hue = (hue + 360) % 360;

    return hue <= 28 || hue >= 340;
  }

  function normalizeTransaction(transaction) {
    if (!transaction || typeof transaction !== "object") return null;
    if (transaction.type === "income") return null;

    const amount = Math.max(0, Number(transaction.amount) || 0);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(transaction.date)) ? String(transaction.date) : currentDate();

    return {
      id: String(transaction.id || newId()),
      category: localizeCategoryName(transaction.category || "Khác").slice(0, 60),
      note: String(transaction.note || "Giao dịch đã nhập").slice(0, 140),
      amount,
      type: "expense",
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
        user: normalizeUser(parsed.user)
      };
    } catch (error) {
      console.warn("Unable to parse saved auth state.", error);
      return { token: "", user: null };
    }
  }

  function saveAuth() {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }

  function loadOnboardingDraft() {
    const stored = localStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY);
    if (!stored) return null;

    try {
      const parsed = JSON.parse(stored);
      const rows = Array.isArray(parsed.rows) ? parsed.rows.map((row) => ({
        category: localizeCategoryName(row.category),
        minimum: String(row.minimum || ""),
        full: String(row.full || ""),
        editing: row.editing !== false
      })).filter((row) => row.category) : [];
      const fundRows = Array.isArray(parsed.fundRows) ? parsed.fundRows.map((row) => ({
        name: String(row.name || "").trim().slice(0, 80),
        target: String(row.target || ""),
        saved: String(row.saved || ""),
        editing: row.editing !== false
      })).filter((row) => row.name && !isAutomaticFundName(row.name)) : [];
      return {
        bucketTotal: String(parsed.bucketTotal || ""),
        monthlyIncome: String(parsed.monthlyIncome || ""),
        currency: currencyOptions[parsed.currency] ? parsed.currency : auth.user?.currency || "VND",
        customFund: String(parsed.customFund || ""),
        customFundOpen: Boolean(parsed.customFundOpen),
        customCategory: String(parsed.customCategory || ""),
        customCategoryOpen: Boolean(parsed.customCategoryOpen),
        fundRows,
        rows
      };
    } catch (error) {
      console.warn("Unable to parse onboarding draft.", error);
      return null;
    }
  }

  function saveOnboardingDraft() {
    if (!onboardingDraft) return;
    localStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(onboardingDraft));
  }

  function clearOnboardingDraft() {
    localStorage.removeItem(ONBOARDING_DRAFT_STORAGE_KEY);
  }

  function loadReadFeatureNotificationIds() {
    const stored = localStorage.getItem(FEATURE_NOTIFICATION_STORAGE_KEY);
    if (!stored) return new Set();

    try {
      const parsed = JSON.parse(stored);
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch (error) {
      console.warn("Unable to parse feature notification state.", error);
      return new Set();
    }
  }

  function saveReadFeatureNotificationIds() {
    localStorage.setItem(FEATURE_NOTIFICATION_STORAGE_KEY, JSON.stringify([...readFeatureNotificationIds]));
  }

  function unreadFeatureAnnouncements() {
    return featureAnnouncements.filter((announcement) => !readFeatureNotificationIds.has(announcement.id));
  }

  function unreadFeatureAnnouncementCount() {
    return unreadFeatureAnnouncements().length;
  }

  function featureAnnouncementsForDisplay() {
    return [...featureAnnouncements].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  }

  function featureAnnouncementById(id) {
    return featureAnnouncements.find((announcement) => announcement.id === id) || null;
  }

  function markFeatureAnnouncementsRead() {
    featureAnnouncements.forEach((announcement) => readFeatureNotificationIds.add(announcement.id));
    saveReadFeatureNotificationIds();
  }

  function normalizeUser(user) {
    if (!user || typeof user !== "object") return null;
    const currency = currencyOptions[user.currency] ? user.currency : "VND";
    return {
      id: user.id === undefined || user.id === null ? "" : String(user.id),
      email: String(user.email || ""),
      full_name: String(user.full_name || "").trim(),
      avatar_url: String(user.avatar_url || "").trim(),
      currency,
      monthly_income: Math.max(0, Number(user.monthly_income || 0)),
      onboarding_completed: Boolean(user.onboarding_completed),
      created_at: String(user.created_at || "")
    };
  }

  function apiBaseUrl() {
    return runtimeApiBaseUrl() || localStorage.getItem(API_BASE_STORAGE_KEY) || DEFAULT_API_BASE_URL;
  }

  function runtimeApiBaseUrl() {
    return String(window.UNIVERSAL_APP_CONFIG?.API_BASE_URL || "").trim().replace(/\/+$/, "");
  }

  function currentMonth() {
    return monthKeyFromDate(new Date());
  }

  function currentDate() {
    return dateKeyFromDate(new Date());
  }

  function monthKeyFromDate(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
  }

  function dateKeyFromDate(date) {
    return `${monthKeyFromDate(date)}-${pad2(date.getDate())}`;
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function shiftMonth(month, offset) {
    const [year, monthIndex] = month.split("-").map(Number);
    const date = new Date(year, monthIndex - 1 + offset, 1, 12);
    return monthKeyFromDate(date);
  }

  function demoTransactions() {
    const month = currentMonth();
    return [
      createTransaction("Nhà ở", "Tiền nhà", 12000000, `${month}-02`),
      createTransaction("Ăn uống", "Đi chợ", 950000, `${month}-04`),
      createTransaction("Di chuyển", "Thẻ xe buýt và taxi", 650000, `${month}-06`),
      createTransaction("Hóa đơn", "Điện, nước và internet", 2100000, `${month}-09`),
      createTransaction("Giải trí", "Ăn tối với bạn bè", 780000, `${month}-12`),
      createTransaction("Sức khỏe", "Nhà thuốc", 320000, `${month}-16`),
      createTransaction("Mua sắm", "Túi đi làm", 1500000, `${month}-18`)
    ];
  }

  function createTransaction(category, note, amount, date) {
    return {
      id: newId(),
      category,
      note,
      amount: Number(amount),
      type: "expense",
      date
    };
  }

  function newId() {
    return window.crypto?.randomUUID ? window.crypto.randomUUID() : String(Date.now() + Math.random());
  }

  function moneyFormatter() {
    const currency = activeCurrency();
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.currency,
      maximumFractionDigits: currency.fractionDigits
    });
  }

  function preciseMoneyFormatter() {
    const currency = activeCurrency();
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.currency,
      maximumFractionDigits: currency.fractionDigits
    });
  }

  function activeCurrency() {
    return currencyByCode(auth.user?.currency);
  }

  function amountStep() {
    return activeCurrency().step;
  }

  function currencyByCode(code) {
    return currencyOptions[code] || currencyOptions.VND;
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("vi-VN", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(`${value}T12:00:00`));
  }

  function formatDateTime(value) {
    if (!value) return "";
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  }

  function svgIcon(name) {
    return `
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="${icons[name] || icons.money}"></path>
      </svg>
    `;
  }

  function avatarMarkup(user, className = "profile-avatar-small") {
    const name = user?.full_name || user?.email || "Tài khoản";
    const avatarUrl = String(user?.avatar_url || "").trim();
    if (avatarUrl) {
      return `<span class="${className}"><img src="${escapeAttr(avatarUrl)}" alt="${escapeAttr(name)}"></span>`;
    }
    return `<span class="${className}">${escapeHtml(friendInitials(name))}</span>`;
  }

  function app() {
    const root = document.querySelector("#app");
    if (!auth.token) {
      stopGamePolling();
      featureNotificationPanelOpen = false;
      featureNotificationAutoChecked = false;
      root.className = "auth-root";
      root.innerHTML = renderAuth();
      bindRoot(root);
      return;
    }

    if (onboardingActive || !auth.user?.onboarding_completed) {
      stopGamePolling();
      featureNotificationPanelOpen = false;
      root.className = "auth-root";
      root.innerHTML = renderOnboarding();
      bindRoot(root);
      return;
    }

    if (!featureNotificationAutoChecked) {
      featureNotificationPanelOpen = unreadFeatureAnnouncementCount() > 0;
      featureNotificationAutoChecked = true;
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
        ${featureNotificationButton()}
        <div class="sidebar-footer">
          <div class="account-chip">
            ${avatarMarkup(auth.user)}
            <span>${escapeHtml(auth.user?.full_name || auth.user?.email || "Tài khoản")}</span>
          </div>
          <button class="module-button logout-button" data-action="logout">
            <span class="module-icon">${svgIcon("logout")}</span>
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main class="main" id="main"></main>
      ${featureNotificationPanelOpen ? featureNotificationPanel() : ""}
    `;

    bindRoot(root);
    renderActiveModule();
    ensureMoneyLoaded();
    ensureFriendsLoaded();
    ensureGameLoaded();
    updateGamePolling();
  }

  function bindRoot(root) {
    if (root.dataset.bound) return;

    root.addEventListener("click", handleClick);
    root.addEventListener("input", handleInput);
    root.addEventListener("change", handleChange);
    root.addEventListener("keydown", handleKeydown);
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
              <h1>Nắm rõ chi phí mỗi tháng.</h1>
              <p>Một không gian gọn gàng để đặt ngân sách, theo dõi khoản chi và giữ hạn mức trong tầm kiểm soát.</p>
            </div>

            <div class="auth-preview" aria-hidden="true">
              <div class="preview-top">
                <span>Chi tiêu tháng này</span>
                <strong>23.680.000 ₫</strong>
              </div>
              <div class="preview-metrics">
                <div>
                  <span>Ngân sách</span>
                  <strong>33.000.000 ₫</strong>
                </div>
                <div>
                  <span>Còn lại</span>
                  <strong>9.320.000 ₫</strong>
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
              <p>${isRegister ? "Dùng email và mật khẩu để bắt đầu lưu dữ liệu trên backend." : "Tiếp tục quản lý chi phí và ngân sách của bạn."}</p>
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

  function renderOnboarding() {
    const draft = ensureOnboardingDraft();
    const currency = currencyByCode(draft.currency);
    const formatter = formatterForCurrency(currency);
    const selectedNames = new Set(draft.rows.map((row) => row.category.toLowerCase()));
    const selectedFundNames = new Set(draft.fundRows.map((row) => row.name.toLowerCase()));
    const recommendations = onboardingRecommendationOptions().filter((category) => !selectedNames.has(category.toLowerCase()));
    const fundRecommendations = defaultFundRecommendations.filter((name) => !selectedFundNames.has(name.toLowerCase()));
    return `
      <main class="onboarding-shell">
        <section class="onboarding-frame">
          <div class="onboarding-copy">
            <p class="eyebrow">Thiết lập ban đầu</p>
            <h1>Lập Túi tiền, Quỹ và ngân sách.</h1>
            <p>Nhập tổng tiền hiện có, thêm quỹ riêng nếu cần, rồi thiết lập thu nhập và ngân sách tháng. Quỹ khẩn cấp, độc lập tài chính và tự do tài chính được tự tính từ ngân sách.</p>
            <div class="onboarding-definitions">
              <div>
                <strong>Túi tiền</strong>
                <span>Tổng số tiền bạn đang có đến hiện tại, gồm tiền mặt, tài khoản ngân hàng hoặc khoản tiết kiệm dễ dùng.</span>
              </div>
              <div>
                <strong>Quỹ</strong>
                <span>Mục tiêu tiết kiệm dài hạn. Ba quỹ chiến lược được tính tự động; bạn chỉ cần thêm quỹ riêng như du lịch hoặc đầu tư.</span>
              </div>
              <div>
                <strong>Chi tiêu tối thiểu</strong>
                <span>Mức cần thiết mỗi tháng: hóa đơn bắt buộc, ăn uống cơ bản, di chuyển và khoản không nên bỏ.</span>
              </div>
              <div>
                <strong>Chi tiêu đầy đủ</strong>
                <span>Mức thoải mái hơn, gồm phần tối thiểu cộng thêm giải trí, mua sắm hoặc nâng chất lượng sống.</span>
              </div>
            </div>
          </div>

          <form class="onboarding-panel" data-form="onboarding">
            <div class="panel-header">
              <div>
                <h2>Ngân sách tháng này</h2>
                <p>${escapeHtml(new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(`${currentMonth()}-01T12:00:00`)))}</p>
              </div>
            </div>
            <div class="onboarding-body">
              <section class="onboarding-money-start">
                <div class="field">
                  <label for="onboarding-bucket-total">Túi tiền hiện có</label>
                  <input id="onboarding-bucket-total" name="bucket_total" type="number" min="0" step="${escapeAttr(currency.step)}" value="${escapeAttr(draft.bucketTotal)}" placeholder="0" required>
                </div>
              </section>

              <section class="onboarding-list onboarding-funds">
                <div class="onboarding-list-header">
                  <h3>Quỹ dài hạn</h3>
                  <span>${draft.fundRows.length} quỹ riêng</span>
                </div>
                <div class="onboarding-fund-recommendations">
                  ${fundRecommendations.map((name) => `
                    <button class="onboarding-recommendation" type="button" data-action="add-onboarding-fund-recommendation" data-fund="${escapeAttr(name)}">
                      <span>${escapeHtml(name)}</span>
                      <strong>Thêm</strong>
                    </button>
                  `).join("")}
                  ${draft.customFundOpen ? `
                    <div class="onboarding-custom-inline">
                      <input data-onboarding-fund-custom type="text" maxlength="80" value="${escapeAttr(draft.customFund)}" placeholder="Tên quỹ" autofocus>
                      <button class="icon-button primary" type="button" data-action="add-onboarding-fund-custom" title="Thêm quỹ">
                        ${svgIcon("plus")}
                      </button>
                    </div>
                  ` : `
                    <button class="onboarding-add-custom" type="button" data-action="open-onboarding-fund-custom" title="Thêm quỹ riêng">
                      ${svgIcon("plus")}
                    </button>
                  `}
                </div>
                <div class="onboarding-fund-list">
                  ${onboardingFundRows(draft.fundRows, currency)}
                  ${draft.fundRows.length ? "" : `<p class="empty-state">Chọn quỹ gợi ý hoặc thêm quỹ riêng. Quỹ khẩn cấp, độc lập tài chính và tự do tài chính sẽ hiện tự động sau khi bạn nhập ngân sách.</p>`}
                </div>
              </section>

              <div class="onboarding-settings">
                <div class="field">
                  <label for="onboarding-income">Thu nhập tháng</label>
                  <input id="onboarding-income" name="monthly_income" type="number" min="0" step="${escapeAttr(currency.step)}" value="${escapeAttr(draft.monthlyIncome)}" placeholder="0" required>
                </div>
                <div class="field">
                  <label for="onboarding-currency">Đơn vị tiền</label>
                  <select id="onboarding-currency" name="currency" data-onboarding-currency>
                    ${Object.entries(currencyOptions).map(([code, option]) => `
                      <option value="${escapeAttr(code)}" ${code === draft.currency ? "selected" : ""}>${escapeHtml(option.label)}</option>
                    `).join("")}
                  </select>
                </div>
              </div>
              <div class="onboarding-estimates" data-onboarding-estimates>
                ${renderOnboardingEstimates(draft, formatter)}
              </div>
              <div class="onboarding-lists">
                <section class="onboarding-list">
                  <div class="onboarding-list-header">
                    <h3>Gợi ý</h3>
                    <span>${recommendations.length} danh mục</span>
                  </div>
                  <div class="onboarding-recommendations">
                    ${recommendations.length ? recommendations.map((category) => `
                      <button class="onboarding-recommendation" type="button" data-action="add-onboarding-recommendation" data-category="${escapeAttr(category)}">
                        <span>${escapeHtml(categoryLabel(category))}</span>
                        <strong>Thêm</strong>
                      </button>
                    `).join("") : `<p class="empty-state">Đã thêm hết danh mục gợi ý.</p>`}
                    ${draft.customCategoryOpen ? `
                      <div class="onboarding-custom-inline">
                        <input data-onboarding-custom type="text" maxlength="60" value="${escapeAttr(draft.customCategory)}" placeholder="Tên danh mục" autofocus>
                        <button class="icon-button primary" type="button" data-action="add-onboarding-custom" title="Thêm danh mục">
                          ${svgIcon("plus")}
                        </button>
                      </div>
                    ` : `
                      <button class="onboarding-add-custom" type="button" data-action="open-onboarding-custom" title="Thêm danh mục riêng">
                        ${svgIcon("plus")}
                      </button>
                    `}
                  </div>
                </section>

                <section class="onboarding-list">
                  <div class="onboarding-list-header">
                    <h3>Danh sách của bạn</h3>
                    <span>${draft.rows.length} danh mục</span>
                  </div>
                  <div class="onboarding-budget-head" aria-hidden="true">
                    <span>Danh mục</span>
                    <span>Chi tiêu tối thiểu</span>
                    <span>Chi tiêu đầy đủ</span>
                    <span></span>
                  </div>
                  <div class="onboarding-budget-list">
                    ${onboardingBudgetRows(draft.rows, currency)}
                  </div>
                  ${draft.rows.length ? "" : `<p class="empty-state">Chọn danh mục gợi ý hoặc thêm danh mục riêng.</p>`}
                </section>
              </div>
              <div class="form-actions">
                ${auth.user?.onboarding_completed ? `<button class="button secondary" type="button" data-action="cancel-onboarding">Hủy</button>` : ""}
                <button class="button secondary" type="button" data-action="skip-onboarding">Thiết lập sau</button>
                <button class="button" type="submit">Lưu thiết lập</button>
              </div>
            </div>
          </form>
        </section>
      </main>
    `;
  }

  function onboardingBudgetRows(rows, currency) {
    const formatter = formatterForCurrency(currency);
    return rows.map((row, index) => {
      const isEditing = row.editing !== false;
      return `
        <div class="onboarding-budget-row ${isEditing ? "editing" : ""}" data-onboarding-category="${escapeAttr(row.category)}" data-onboarding-minimum-value="${escapeAttr(row.minimum)}" data-onboarding-full-value="${escapeAttr(row.full)}" data-onboarding-row-index="${index}" data-onboarding-editing="${isEditing ? "true" : "false"}">
          ${isEditing ? `
            <div class="onboarding-row-main">
              <label class="onboarding-edit-field">
                <span>Danh mục</span>
                <input data-onboarding-row-category name="category_${index}" type="text" maxlength="60" value="${escapeAttr(row.category)}" placeholder="Tên danh mục" required>
              </label>
              <label class="onboarding-edit-field">
                <span>Chi tiêu tối thiểu</span>
                <input data-onboarding-minimum name="minimum_amount_${index}" type="number" min="0" step="${escapeAttr(currency.step)}" value="${escapeAttr(row.minimum)}" placeholder="0" required>
              </label>
              <label class="onboarding-edit-field">
                <span>Chi tiêu đầy đủ</span>
                <input data-onboarding-full name="full_amount_${index}" type="number" min="0" step="${escapeAttr(currency.step)}" value="${escapeAttr(row.full)}" placeholder="0" required>
              </label>
            </div>
            <div class="onboarding-row-actions">
              <button class="icon-button primary" type="button" data-action="finish-onboarding-row-edit" data-row-index="${index}" title="Xong">
                ${svgIcon("check")}
              </button>
              <button class="icon-button danger" type="button" data-action="remove-onboarding-category" data-row-index="${index}" title="Xóa">
                ${svgIcon("trash")}
              </button>
            </div>
          ` : `
            <div class="onboarding-row-main">
              <div class="onboarding-value">
                <span>Danh mục</span>
                <strong>${escapeHtml(categoryLabel(row.category))}</strong>
              </div>
              <div class="onboarding-value">
                <span>Chi tiêu tối thiểu</span>
                <strong>${escapeHtml(formatOnboardingAmount(row.minimum, formatter))}</strong>
              </div>
              <div class="onboarding-value">
                <span>Chi tiêu đầy đủ</span>
                <strong>${escapeHtml(formatOnboardingAmount(row.full, formatter))}</strong>
              </div>
            </div>
            <div class="onboarding-row-actions">
              <button class="icon-button" type="button" data-action="edit-onboarding-row" data-row-index="${index}" title="Sửa">
                ${svgIcon("edit")}
              </button>
              <button class="icon-button danger" type="button" data-action="remove-onboarding-category" data-row-index="${index}" title="Xóa">
                ${svgIcon("trash")}
              </button>
            </div>
          `}
        </div>
      `;
    }).join("");
  }

  function onboardingFundRows(rows, currency) {
    const formatter = formatterForCurrency(currency);
    return rows.map((row, index) => {
      const isEditing = row.editing !== false;
      return `
        <div class="onboarding-fund-row ${isEditing ? "editing" : ""}" data-onboarding-fund-name="${escapeAttr(row.name)}" data-onboarding-fund-target-value="${escapeAttr(row.target)}" data-onboarding-fund-saved-value="${escapeAttr(row.saved)}" data-onboarding-fund-row-index="${index}" data-onboarding-fund-editing="${isEditing ? "true" : "false"}">
          ${isEditing ? `
            <div class="onboarding-fund-main">
              <label class="onboarding-edit-field">
                <span>Tên quỹ</span>
                <input data-onboarding-fund-name-input name="fund_name_${index}" type="text" maxlength="80" value="${escapeAttr(row.name)}" placeholder="Tên quỹ" required>
              </label>
              <label class="onboarding-edit-field">
                <span>Mục tiêu</span>
                <input data-onboarding-fund-target name="fund_target_${index}" type="number" min="0" step="${escapeAttr(currency.step)}" value="${escapeAttr(row.target)}" placeholder="0" required>
              </label>
              <label class="onboarding-edit-field">
                <span>Đã có</span>
                <input data-onboarding-fund-saved name="fund_saved_${index}" type="number" min="0" step="${escapeAttr(currency.step)}" value="${escapeAttr(row.saved)}" placeholder="0">
              </label>
            </div>
            <div class="onboarding-row-actions">
              <button class="icon-button primary" type="button" data-action="finish-onboarding-fund-edit" data-row-index="${index}" title="Xong">
                ${svgIcon("check")}
              </button>
              <button class="icon-button danger" type="button" data-action="remove-onboarding-fund" data-row-index="${index}" title="Xóa">
                ${svgIcon("trash")}
              </button>
            </div>
          ` : `
            <div class="onboarding-fund-main">
              <div class="onboarding-value">
                <span>Tên quỹ</span>
                <strong>${escapeHtml(row.name)}</strong>
              </div>
              <div class="onboarding-value">
                <span>Mục tiêu</span>
                <strong>${escapeHtml(formatOnboardingAmount(row.target, formatter))}</strong>
              </div>
              <div class="onboarding-value">
                <span>Đã có</span>
                <strong>${escapeHtml(formatOnboardingAmount(row.saved, formatter))}</strong>
              </div>
            </div>
            <div class="onboarding-row-actions">
              <button class="icon-button" type="button" data-action="edit-onboarding-fund" data-row-index="${index}" title="Sửa">
                ${svgIcon("edit")}
              </button>
              <button class="icon-button danger" type="button" data-action="remove-onboarding-fund" data-row-index="${index}" title="Xóa">
                ${svgIcon("trash")}
              </button>
            </div>
          `}
        </div>
      `;
    }).join("");
  }

  function formatterForCurrency(currency) {
    return new Intl.NumberFormat(currency.locale, {
      style: "currency",
      currency: currency.currency,
      maximumFractionDigits: currency.fractionDigits
    });
  }

  function formatOnboardingAmount(value, formatter) {
    const amount = Number(value || 0);
    return Number.isFinite(amount) && amount > 0 ? formatter.format(amount) : "Chưa nhập";
  }

  function renderOnboardingEstimates(draft, formatter) {
    const monthlyIncome = Number(draft.monthlyIncome || 0);
    const currentAmount = Number(draft.bucketTotal || 0);
    const minimumBudget = draft.rows.reduce((sum, row) => sum + Number(row.minimum || 0), 0);
    const fullBudget = draft.rows.reduce((sum, row) => sum + Number(row.full || 0), 0);
    return `
      ${onboardingEstimateCard("Quỹ khẩn cấp", "12 tháng Chi tiêu tối thiểu", targetSavingsEstimate(monthlyIncome, minimumBudget, 12, currentAmount), formatter)}
      ${onboardingEstimateCard("Quỹ độc lập tài chính", "25 năm Chi tiêu tối thiểu", targetSavingsEstimate(monthlyIncome, minimumBudget, 12 * 25, currentAmount), formatter)}
      ${onboardingEstimateCard("Quỹ tự do tài chính", "25 năm Chi tiêu đầy đủ", targetSavingsEstimate(monthlyIncome, fullBudget, 12 * 25, currentAmount), formatter)}
    `;
  }

  function onboardingEstimateCard(title, subtitle, estimate, formatter) {
    return `
      <article class="onboarding-estimate-card">
        <div>
          <span>${escapeHtml(subtitle)}</span>
          <strong>${escapeHtml(title)}</strong>
        </div>
        <div class="onboarding-estimate-time">${escapeHtml(formatFreedomTime(estimate))}</div>
        <small>Mục tiêu ${formatter.format(estimate.target)} · Còn lại ${formatter.format(estimate.remainingTarget)} · Tiết kiệm ${formatter.format(estimate.monthlySavings)}/tháng</small>
      </article>
    `;
  }

  function updateOnboardingEstimates() {
    const target = document.querySelector("[data-onboarding-estimates]");
    if (!target) return;

    const draft = ensureOnboardingDraft();
    const formatter = formatterForCurrency(currencyByCode(draft.currency));
    target.innerHTML = renderOnboardingEstimates(draft, formatter);
  }

  function ensureOnboardingDraft() {
    if (!onboardingDraft) {
      onboardingDraft = loadOnboardingDraft() || {
        bucketTotal: state.money.bucket?.total ? String(state.money.bucket.total) : "",
        monthlyIncome: "",
        currency: auth.user?.currency || "VND",
        customFund: "",
        customFundOpen: false,
        customCategory: "",
        customCategoryOpen: false,
        fundRows: (state.money.funds || []).map((fund) => ({
          name: fund.name,
          target: String(fund.target || ""),
          saved: String(fund.saved || ""),
          editing: false
        })).filter((fund) => !isAutomaticFundName(fund.name)),
        rows: []
      };
    }
    return onboardingDraft;
  }

  function onboardingDraftFromCurrentSettings() {
    const budgetRows = (state.money.budgetRecords || []).map((budget) => ({
      category: localizeCategoryName(budget.category),
      minimum: String(Number(budget.minimum || budget.limit || 0)),
      full: String(Number(budget.full || budget.limit || 0)),
      editing: false
    })).filter((row) => row.category);

    return {
      bucketTotal: String(Number(state.money.bucket?.total || 0)),
      monthlyIncome: String(Number(auth.user?.monthly_income || 0)),
      currency: auth.user?.currency || "VND",
      customFund: "",
      customFundOpen: false,
      customCategory: "",
      customCategoryOpen: false,
      fundRows: (state.money.funds || []).map((fund) => ({
        name: fund.name,
        target: String(Number(fund.target || 0)),
        saved: String(Number(fund.saved || 0)),
        editing: false
      })).filter((fund) => !isAutomaticFundName(fund.name)),
      rows: budgetRows
    };
  }

  async function startOnboardingFromCurrentSettings() {
    try {
      state.money.filters.month = currentMonth();
      moneySync.loaded = false;
      moneySync.budgetMonth = "";
      saveState();
      await loadMoneyFromApi();
      if (!auth.token) return;
      onboardingDraft = onboardingDraftFromCurrentSettings();
      saveOnboardingDraft();
      onboardingActive = true;
      app();
    } catch (error) {
      if (error.authExpired) return;
      showToast(error.message || "Không thể tải thiết lập hiện tại.");
    }
  }

  function syncOnboardingDraftFromDom() {
    const draft = ensureOnboardingDraft();
    const form = document.querySelector("[data-form='onboarding']");
    if (!form) return draft;

    const formData = new FormData(form);
    draft.bucketTotal = String(formData.get("bucket_total") || "");
    draft.monthlyIncome = String(formData.get("monthly_income") || "");
    draft.currency = currencyOptions[formData.get("currency")] ? String(formData.get("currency")) : "VND";
    draft.customFund = String(form.querySelector("[data-onboarding-fund-custom]")?.value || "").trim();
    draft.customCategory = String(form.querySelector("[data-onboarding-custom]")?.value || "").trim();
    draft.fundRows = [...form.querySelectorAll("[data-onboarding-fund-name]")].map((row) => {
      return {
        name: String(row.querySelector("[data-onboarding-fund-name-input]")?.value || row.dataset.onboardingFundName || "").trim().slice(0, 80),
        target: String(row.querySelector("[data-onboarding-fund-target]")?.value || row.dataset.onboardingFundTargetValue || ""),
        saved: String(row.querySelector("[data-onboarding-fund-saved]")?.value || row.dataset.onboardingFundSavedValue || ""),
        editing: row.dataset.onboardingFundEditing !== "false"
      };
    }).filter((row) => row.name && !isAutomaticFundName(row.name));
    draft.rows = [...form.querySelectorAll("[data-onboarding-category]")].map((row) => {
      return {
        category: localizeCategoryName(row.querySelector("[data-onboarding-row-category]")?.value || row.dataset.onboardingCategory),
        minimum: String(row.querySelector("[data-onboarding-minimum]")?.value || row.dataset.onboardingMinimumValue || ""),
        full: String(row.querySelector("[data-onboarding-full]")?.value || row.dataset.onboardingFullValue || ""),
        editing: row.dataset.onboardingEditing !== "false"
      };
    }).filter((row) => row.category);
    saveOnboardingDraft();
    return draft;
  }

  function hasDuplicateOnboardingCategories(rows) {
    const seen = new Set();
    return rows.some((row) => {
      const key = row.category.toLowerCase();
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
  }

  function hasDuplicateOnboardingFunds(rows) {
    const seen = new Set();
    return rows.some((row) => {
      const key = row.name.toLowerCase();
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });
  }

  function finishOnboardingRowEdit(index) {
    const draft = syncOnboardingDraftFromDom();
    const row = draft.rows[index];
    if (!row?.category) {
      showToast("Hãy nhập tên danh mục.");
      return false;
    }
    if (hasDuplicateOnboardingCategories(draft.rows)) {
      showToast("Danh mục này đã có trong danh sách của bạn.");
      return false;
    }
    row.editing = false;
    return true;
  }

  function addOnboardingCategory(category) {
    const draft = ensureOnboardingDraft();
    const name = localizeCategoryName(category).slice(0, 60);
    if (!name) {
      showToast("Hãy nhập tên danh mục.");
      return false;
    }
    if (draft.rows.some((row) => row.category.toLowerCase() === name.toLowerCase())) {
      showToast("Danh mục này đã có trong danh sách của bạn.");
      return false;
    }
    draft.rows.push({ category: name, minimum: "", full: "", editing: true });
    saveOnboardingDraft();
    return true;
  }

  function finishOnboardingFundEdit(index) {
    const draft = syncOnboardingDraftFromDom();
    const row = draft.fundRows[index];
    if (!row?.name) {
      showToast("Hãy nhập tên quỹ.");
      return false;
    }
    if (hasDuplicateOnboardingFunds(draft.fundRows)) {
      showToast("Quỹ này đã có trong danh sách của bạn.");
      return false;
    }
    if (isAutomaticFundName(row.name)) {
      showToast("Quỹ này được tự động tính từ ngân sách.");
      return false;
    }
    row.editing = false;
    return true;
  }

  function addOnboardingFund(name) {
    const draft = ensureOnboardingDraft();
    const safeName = String(name || "").trim().slice(0, 80);
    if (!safeName) {
      showToast("Hãy nhập tên quỹ.");
      return false;
    }
    if (draft.fundRows.some((row) => row.name.toLowerCase() === safeName.toLowerCase())) {
      showToast("Quỹ này đã có trong danh sách của bạn.");
      return false;
    }
    if (isAutomaticFundName(safeName)) {
      showToast("Quỹ này được tự động tính từ ngân sách.");
      return false;
    }
    draft.fundRows.push({ name: safeName, target: "", saved: "", editing: true });
    saveOnboardingDraft();
    return true;
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

  function featureNotificationButton() {
    const unreadCount = unreadFeatureAnnouncementCount();
    return `
      <button class="module-button notification-button" data-action="open-feature-notifications" title="Thông báo tính năng">
        <span class="module-icon">${svgIcon("bell")}</span>
        <span>Thông báo</span>
        ${unreadCount ? `<strong class="notification-count">${unreadCount}</strong>` : ""}
      </button>
    `;
  }

  function featureNotificationPanel() {
    const openedAnnouncement = featureAnnouncementById(openedFeatureAnnouncementId);
    const announcements = featureAnnouncementsForDisplay();
    return `
      <div class="notification-layer" role="dialog" aria-modal="true" aria-labelledby="feature-notification-title">
        <section class="notification-panel">
          <div class="notification-header">
            <div>
              <p class="eyebrow">Cập nhật mới</p>
              <h2 id="feature-notification-title">Thông báo tính năng</h2>
            </div>
            <button class="icon-button" type="button" data-action="close-feature-notifications" title="Đóng thông báo">
              ${svgIcon("close")}
            </button>
          </div>
          ${openedAnnouncement ? featureAnnouncementDetail(openedAnnouncement) : `
            <div class="notification-list" data-feature-notification-list>
              ${announcements.map(featureAnnouncementCard).join("")}
            </div>
          `}
          <div class="notification-actions">
            ${openedAnnouncement ? `<button class="button secondary" type="button" data-action="back-feature-notifications">Danh sách</button>` : ""}
            <button class="button secondary" type="button" data-action="close-feature-notifications">Đã hiểu</button>
          </div>
        </section>
      </div>
    `;
  }

  function featureAnnouncementCard(announcement) {
    return `
      <article class="notification-card ${readFeatureNotificationIds.has(announcement.id) ? "read" : "unread"}">
        <button class="notification-card-summary" type="button" data-action="open-feature-announcement" data-announcement-id="${escapeAttr(announcement.id)}">
          <span class="notification-card-top">
            <span>${escapeHtml(announcement.badge)}</span>
            <small>${escapeHtml(announcement.timeLabel)}</small>
          </span>
          <strong>${escapeHtml(announcement.title)}</strong>
          <span class="notification-summary-text">${escapeHtml(announcement.summary)}</span>
          <span class="notification-read-more">Xem chi tiết ${svgIcon("chevronRight")}</span>
        </button>
      </article>
    `;
  }

  function featureAnnouncementDetail(announcement) {
    return `
      <div class="notification-detail-view">
        <button class="notification-back-link" type="button" data-action="back-feature-notifications">
          ${svgIcon("chevronLeft")}Danh sách thông báo
        </button>
        <article class="notification-detail-card">
          <div class="notification-card-top">
            <span>${escapeHtml(announcement.badge)}</span>
            <small>${escapeHtml(announcement.timeLabel)}</small>
          </div>
          <h3>${escapeHtml(announcement.title)}</h3>
          <p>${escapeHtml(announcement.summary)}</p>
          ${featureAnnouncementSection("Mục đích", announcement.purpose)}
          ${featureAnnouncementSection("Nên dùng khi", announcement.recommended)}
          ${featureAnnouncementSection("Cách dùng", announcement.howTo)}
          ${announcement.ctaLabel && announcement.moduleId ? `<div class="notification-card-actions">
            <button class="button" type="button" data-action="open-feature-module" data-module-id="${escapeAttr(announcement.moduleId)}">
              ${escapeHtml(announcement.ctaLabel)}
            </button>
          </div>` : ""}
        </article>
      </div>
    `;
  }

  function featureAnnouncementSection(title, items) {
    return `
      <div class="notification-section">
        <strong>${escapeHtml(title)}</strong>
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function renderActiveModule() {
    const module = modules.find((item) => item.id === activeModuleId);
    document.querySelector("#main").innerHTML = module.render();
  }

  function updateFeatureNotificationPanel() {
    const existingPanel = document.querySelector(".notification-layer");
    if (!existingPanel) return false;
    existingPanel.outerHTML = featureNotificationPanel();
    return true;
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
      ${financialFreedomEstimates(data, precise)}
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
          <p>Xem, lọc, thêm và chỉnh sửa các khoản chi theo tháng.</p>
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
          <span>Chi tiêu</span>
          <strong>${formatter.format(data.expenses)}</strong>
          <small>${data.selectedLabel}</small>
        </article>
        <article class="metric">
          <span>Giao dịch</span>
          <strong>${data.expenseCount}</strong>
          <small>Khoản chi trong tháng</small>
        </article>
        <article class="metric">
          <span>Còn lại</span>
          <strong>${formatter.format(data.remainingBudget)}</strong>
          <small>So với tổng ngân sách</small>
        </article>
        <article class="metric">
          <span>Vượt ngân sách</span>
          <strong>${data.overBudgetCount}</strong>
          <small>Danh mục từ 100% trở lên</small>
        </article>
      </section>
    `;
  }

  function financialFreedomEstimates(data, formatter) {
    return `
      <section class="freedom-grid" aria-label="Ước tính tự do tài chính">
        ${freedomEstimateCard("Độc lập tài chính", "25 năm Chi tiêu tối thiểu", data.minimumFreedom, formatter)}
        ${freedomEstimateCard("Tự do tài chính", "25 năm Chi tiêu đầy đủ", data.fullFreedom, formatter)}
      </section>
    `;
  }

  function freedomEstimateCard(title, subtitle, estimate, formatter) {
    return `
      <article class="freedom-card">
        <div>
          <span>${escapeHtml(subtitle)}</span>
          <strong>${escapeHtml(title)}</strong>
        </div>
        <div class="freedom-time">${escapeHtml(formatFreedomTime(estimate))}</div>
        <div class="freedom-meta">
          <span>Mục tiêu ${formatter.format(estimate.target)}</span>
          <span>Còn lại ${formatter.format(estimate.remainingTarget)}</span>
          <span>Tiết kiệm ${formatter.format(estimate.monthlySavings)}/tháng</span>
        </div>
      </article>
    `;
  }

  function formatFreedomTime(estimate) {
    if (estimate.monthlyBudget <= 0) return "Cần thiết lập ngân sách";
    if (estimate.remainingTarget <= 0 && estimate.target > 0) return "Đã đạt mục tiêu";
    if (estimate.monthlyIncome <= 0) return "Cần nhập thu nhập";
    if (estimate.monthlySavings <= 0) return "Chưa có thặng dư";

    const years = Math.floor(estimate.months / 12);
    const months = estimate.months % 12;
    if (!years) return `${months} tháng`;
    if (!months) return `${years} năm`;
    return `${years} năm ${months} tháng`;
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
    const items = definedCategoryOptions();
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
            ${items.length ? items.map((category) => categoryDefinitionRow(category, usedCounts)).join("") : `<div class="empty-state">Chưa có danh mục nào.</div>`}
          </div>
        </div>
      </section>
    `;
  }

  function renderFunds() {
    const formatter = preciseMoneyFormatter();
    const data = getMoneyViewData();
    const bucket = state.money.bucket || { total: 0 };
    const customFunds = (state.money.funds || []).filter((fund) => !isAutomaticFundName(fund.name));
    const automaticFunds = automaticFundRecords(data, bucket);
    const allocated = customFunds.reduce((sum, fund) => sum + Number(fund.saved || 0), 0);
    const unallocated = Math.max(0, Number(bucket.total || 0) - allocated);
    const totalTarget = [
      ...automaticFunds,
      ...customFunds
    ].reduce((sum, fund) => sum + Number(fund.target || 0), 0);
    return `
      <section class="topbar">
        <div>
          <p class="eyebrow">Túi tiền</p>
          <h1>Túi tiền và Quỹ dài hạn</h1>
          <p>Túi tiền là tổng số tiền bạn đang có. Quỹ khẩn cấp, độc lập tài chính và tự do tài chính được tự tính từ ngân sách; các quỹ còn lại là mục tiêu riêng của bạn.</p>
        </div>
      </section>

      ${moneySync.loading ? `<div class="sync-banner">Đang đồng bộ túi tiền và quỹ...</div>` : ""}
      ${moneySync.error ? `<div class="sync-banner error">${escapeHtml(moneySync.error)}</div>` : ""}

      <section class="metric-grid fund-metrics" aria-label="Tổng quan túi tiền">
        <article class="metric">
          <span>Túi tiền hiện có</span>
          <strong>${formatter.format(bucket.total || 0)}</strong>
          <small>Tổng tài sản tiền mặt/tiết kiệm bạn nhập</small>
        </article>
        <article class="metric">
          <span>Đã phân vào quỹ riêng</span>
          <strong>${formatter.format(allocated)}</strong>
          <small>${customFunds.length} quỹ tự tạo đang theo dõi</small>
        </article>
        <article class="metric">
          <span>Chưa phân bổ</span>
          <strong>${formatter.format(unallocated)}</strong>
          <small>Túi tiền trừ phần đã ghi vào quỹ</small>
        </article>
        <article class="metric">
          <span>Mục tiêu quỹ</span>
          <strong>${formatter.format(totalTarget)}</strong>
          <small>Gồm quỹ tự động và quỹ riêng</small>
        </article>
      </section>

      <section class="fund-layout">
        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Cập nhật Túi tiền</h2>
              <p>Nhập tổng tiền bạn đang có đến hiện tại.</p>
            </div>
          </div>
          <form class="bucket-form" data-form="bucket">
            <div class="field">
              <label for="bucket-total">Tổng tiền hiện có</label>
              <input id="bucket-total" name="total_amount" type="number" min="0" step="${escapeAttr(amountStep())}" value="${escapeAttr(bucket.total || "")}" placeholder="0" required>
            </div>
            <button class="button" type="submit">Lưu Túi tiền</button>
          </form>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Thêm Quỹ</h2>
              <p>Tạo mục tiêu riêng như du lịch hoặc đầu tư. Ba quỹ chiến lược được tự tính bên dưới.</p>
            </div>
          </div>
          <form class="fund-form" data-form="fund">
            <div class="field">
              <label for="fund-name">Tên quỹ</label>
              <input id="fund-name" name="name" type="text" maxlength="80" placeholder="Ví dụ: Du lịch" required>
            </div>
            <div class="field">
              <label for="fund-target">Mục tiêu</label>
              <input id="fund-target" name="target_amount" type="number" min="0" step="${escapeAttr(amountStep())}" placeholder="0" required>
            </div>
            <div class="field">
              <label for="fund-saved">Đã có</label>
              <input id="fund-saved" name="saved_amount" type="number" min="0" step="${escapeAttr(amountStep())}" placeholder="0">
            </div>
            <button class="button" type="submit">${svgIcon("plus")}Thêm Quỹ</button>
          </form>
        </article>
      </section>

      <section class="panel fund-panel">
        <div class="panel-header">
          <div>
            <h2>Quỹ tự động</h2>
            <p>Tự tính sau khi bạn thiết lập Chi tiêu tối thiểu và Chi tiêu đầy đủ.</p>
          </div>
        </div>
        <div class="fund-card-grid">
          ${automaticFunds.map((fund) => automaticFundCard(fund, formatter)).join("")}
        </div>
      </section>

      <section class="panel fund-panel">
        <div class="panel-header">
          <div>
            <h2>Quỹ riêng</h2>
            <p>Theo dõi tiến độ từng mục tiêu tiết kiệm dài hạn bạn tự tạo.</p>
          </div>
        </div>
        <div class="fund-card-grid">
          ${customFunds.length ? customFunds.map((fund) => fundCard(fund, formatter)).join("") : `<div class="empty-state">Chưa có quỹ riêng nào. Tạo quỹ riêng để theo dõi mục tiêu dài hạn ngoài ba quỹ tự động.</div>`}
        </div>
      </section>
    `;
  }

  function automaticFundCard(fund, formatter) {
    const percent = Math.max(0, Number(fund.percent || 0));
    return `
      <article class="fund-card automatic-fund-card" style="--fund-color: ${escapeAttr(normalizeFundColor(fund.color))}">
        <div class="fund-card-top readonly">
          <div>
            <span class="fund-card-badge">Tự động</span>
            <h3>${escapeHtml(fund.name)}</h3>
          </div>
          <small>${escapeHtml(fund.subtitle)}</small>
        </div>
        <div class="fund-card-amounts">
          <div class="fund-value">
            <span>Mục tiêu</span>
            <strong>${formatter.format(fund.target)}</strong>
          </div>
          <div class="fund-value">
            <span>Đang có</span>
            <strong>${formatter.format(fund.saved)}</strong>
          </div>
        </div>
        <div class="fund-progress">
          <div class="row-top">
            <strong>${percent}%</strong>
            <span>${formatter.format(fund.saved)} / ${formatter.format(fund.target)}</span>
          </div>
          <div class="progress" style="--value: ${Math.min(percent, 100)}%">
            <span></span>
          </div>
        </div>
      </article>
    `;
  }

  function fundCard(fund, formatter) {
    const percent = Math.max(0, Number(fund.percent || 0));
    return `
      <form class="fund-card" data-form="fund-card" data-fund-id="${escapeAttr(fund.id)}" style="--fund-color: ${escapeAttr(normalizeFundColor(fund.color))}">
        <div class="fund-card-top">
          <div>
            <label for="fund-name-${escapeAttr(fund.id)}">Tên quỹ</label>
            <input id="fund-name-${escapeAttr(fund.id)}" name="name" type="text" maxlength="80" value="${escapeAttr(fund.name)}" required>
          </div>
          <button class="button secondary icon" type="button" data-action="delete-fund" data-fund-id="${escapeAttr(fund.id)}" title="Xóa quỹ">${svgIcon("trash")}</button>
        </div>
        <div class="fund-card-amounts">
          <div class="field">
            <label for="fund-target-${escapeAttr(fund.id)}">Mục tiêu</label>
            <input id="fund-target-${escapeAttr(fund.id)}" name="target_amount" type="number" min="0" step="${escapeAttr(amountStep())}" value="${escapeAttr(fund.target)}" required>
          </div>
          <div class="field">
            <label for="fund-saved-${escapeAttr(fund.id)}">Đã có</label>
            <input id="fund-saved-${escapeAttr(fund.id)}" name="saved_amount" type="number" min="0" step="${escapeAttr(amountStep())}" value="${escapeAttr(fund.saved)}" required>
          </div>
        </div>
        <div class="fund-progress">
          <div class="row-top">
            <strong>${percent}%</strong>
            <span>${formatter.format(fund.saved)} / ${formatter.format(fund.target)}</span>
          </div>
          <div class="progress" style="--value: ${Math.min(percent, 100)}%">
            <span></span>
          </div>
        </div>
        <div class="field">
          <label>Màu</label>
          <div class="color-picker">
            ${fundColors.map((swatch) => `
              <label class="color-swatch" style="--swatch: ${escapeAttr(swatch)}" title="${escapeAttr(swatch)}">
                <input type="radio" name="color" value="${escapeAttr(swatch)}" ${swatch.toLowerCase() === normalizeFundColor(fund.color).toLowerCase() ? "checked" : ""}>
                <span></span>
              </label>
            `).join("")}
          </div>
        </div>
        <div class="form-actions">
          <button class="button" type="submit">Lưu Quỹ</button>
        </div>
      </form>
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

  function renderProfile() {
    const user = auth.user || {};
    const formatter = preciseMoneyFormatter();
    const createdLabel = user.created_at
      ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(user.created_at))
      : "Chưa rõ";

    return `
      <section class="topbar">
        <div>
          <p class="eyebrow">Hồ sơ</p>
          <h1>Cài đặt tài khoản</h1>
          <p>Cập nhật tên hiển thị, ảnh đại diện, tiền tệ và mật khẩu đăng nhập.</p>
        </div>
      </section>

      <section class="profile-layout">
        <article class="panel profile-summary">
          <div class="profile-hero">
            ${avatarMarkup(user, "profile-avatar-large")}
            <div>
              <h2>${escapeHtml(user.full_name || user.email || "Tài khoản")}</h2>
              <p>${escapeHtml(user.email || "")}</p>
            </div>
          </div>
          <div class="profile-facts">
            <div>
              <span>ID tài khoản</span>
              <strong>${escapeHtml(user.id || "")}</strong>
            </div>
            <div>
              <span>Tiền tệ</span>
              <strong>${escapeHtml(activeCurrency().label)}</strong>
            </div>
            <div>
              <span>Thu nhập tháng</span>
              <strong>${formatter.format(Number(user.monthly_income || 0))}</strong>
            </div>
            <div>
              <span>Ngày tạo</span>
              <strong>${escapeHtml(createdLabel)}</strong>
            </div>
            <div>
              <span>Phiên đăng nhập</span>
              <strong>30 ngày</strong>
            </div>
          </div>
          <button class="button secondary" type="button" data-action="start-onboarding">Thiết lập ngân sách lại</button>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Thông tin cá nhân</h2>
              <p>Tên và ảnh đại diện sẽ hiển thị trong tài khoản và lời mời kết bạn.</p>
            </div>
          </div>
          <form class="profile-form" data-form="profile">
            <div class="field">
              <label for="profile-name">Họ tên</label>
              <input id="profile-name" name="full_name" type="text" maxlength="120" value="${escapeAttr(user.full_name || "")}" required>
            </div>
            <div class="field avatar-upload-field">
              <label for="profile-avatar-file">Ảnh đại diện</label>
              <input id="profile-avatar" name="avatar_url" type="hidden" value="${escapeAttr(user.avatar_url || "")}">
              <div class="avatar-upload-box">
                <div class="avatar-upload-preview" data-avatar-preview>
                  ${avatarMarkup(user, "profile-avatar-large")}
                </div>
                <div class="avatar-upload-copy">
                  <strong data-avatar-file-name>${user.avatar_url ? "Ảnh hiện tại" : "Chưa có ảnh"}</strong>
                  <span>JPG, PNG, WEBP hoặc GIF, tối đa 2MB.</span>
                  <button class="button secondary avatar-upload-button" type="button" data-action="choose-avatar">
                    ${svgIcon("upload")}
                    Chọn ảnh
                  </button>
                  <input class="hidden-file" id="profile-avatar-file" name="avatar_file" type="file" accept="image/jpeg,image/png,image/webp,image/gif">
                </div>
              </div>
            </div>
            <div class="field">
              <label for="profile-currency">Tiền tệ</label>
              <select id="profile-currency" name="currency">
                ${Object.entries(currencyOptions).map(([value, config]) => option(value, config.label, user.currency || "VND")).join("")}
              </select>
            </div>
            <div class="form-actions">
              <button class="button" type="submit">Lưu hồ sơ</button>
            </div>
          </form>
        </article>

        <article class="panel">
          <div class="panel-header">
            <div>
              <h2>Đổi mật khẩu</h2>
              <p>Mật khẩu mới cần tối thiểu 8 ký tự.</p>
            </div>
          </div>
          <form class="profile-form" data-form="password">
            <div class="field">
              <label for="current-password">Mật khẩu hiện tại</label>
              <input id="current-password" name="current_password" type="password" autocomplete="current-password" minlength="8" required>
            </div>
            <div class="field">
              <label for="new-password">Mật khẩu mới</label>
              <input id="new-password" name="new_password" type="password" autocomplete="new-password" minlength="8" required>
            </div>
            <div class="field">
              <label for="confirm-password">Nhập lại mật khẩu mới</label>
              <input id="confirm-password" name="confirm_password" type="password" autocomplete="new-password" minlength="8" required>
            </div>
            <div class="form-actions">
              <button class="button" type="submit">Đổi mật khẩu</button>
            </div>
          </form>
        </article>
      </section>
    `;
  }

  function renderFriends() {
    const month = friendsSync.month || currentMonth();
    const selfItem = friendsSync.self ? { ...friendsSync.self, is_self: true } : selfFriendComparison(getMoneyViewData());
    const friendItems = uniqueFriends([selfItem, ...friendsSync.items]);
    const monthLabel = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(`${month}-01T12:00:00`));
    return `
      <section class="topbar">
        <div>
          <p class="eyebrow">Bạn bè</p>
          <h1>Theo dõi tiến độ ngân sách</h1>
          <p>Gửi lời mời bằng email hoặc ID. Danh sách này chỉ hiển thị tiến độ ngân sách tháng hiện tại để mọi người nhìn cùng một dữ liệu.</p>
        </div>
        <div class="friends-current-month">
          <span>Tháng hiện tại</span>
          <strong>${escapeHtml(monthLabel)}</strong>
        </div>
      </section>

      ${friendsSync.loading ? `<div class="sync-banner">Đang tải danh sách bạn bè...</div>` : ""}
      ${friendsSync.error ? `<div class="sync-banner error">${escapeHtml(friendsSync.error)}</div>` : ""}

      <section class="panel friends-panel">
        <div class="panel-header">
          <div>
            <h2>Lời mời và bạn bè</h2>
            <p>ID của bạn: ${escapeHtml(auth.user?.id || "")}</p>
          </div>
        </div>
        <div class="friends-body">
          <form class="friend-add" data-form="friend">
            <div class="field">
              <label for="friend-identifier">Email hoặc ID</label>
              <input id="friend-identifier" name="identifier" type="text" maxlength="320" placeholder="friend@example.com hoặc 12" required>
            </div>
            <button class="button" type="submit">${svgIcon("plus")}Gửi lời mời</button>
          </form>
          ${friendRequestSection("Lời mời đến", friendsSync.incoming, "incoming")}
          ${friendRequestSection("Đã gửi", friendsSync.outgoing, "outgoing")}
          <div class="friend-list">
            ${friendItems.map(friendRow).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function selfFriendComparison(data) {
    const totalSpent = data.budgetProgress.reduce((sum, budget) => sum + Number(budget.spent || 0), 0);
    const totalLimit = data.budgetProgress.reduce((sum, budget) => sum + Number(budget.limit || 0), 0);
    return {
      id: auth.user?.id || "",
      email: auth.user?.email || "",
      full_name: auth.user?.full_name || auth.user?.email || "Bạn",
      avatar_url: auth.user?.avatar_url || "",
      budget_percent_used: totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
      budget_count: data.budgetProgress.length,
      is_self: true
    };
  }

  function friendRow(friend) {
    const percent = Math.max(0, Number(friend.budget_percent_used || 0));
    const className = percent >= 100 ? "danger" : percent >= 80 ? "warning" : "";
    return `
      <div class="friend-row ${friend.is_self ? "friend-self-row" : ""}">
        <div class="friend-profile">
          ${avatarMarkup(friend, "friend-avatar")}
          <div>
            <strong>${escapeHtml(friend.full_name || friend.email)}</strong>
            <small>${friend.is_self ? "Bạn" : escapeHtml(friend.email)} · ID ${escapeHtml(friend.id)}</small>
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
        ${friend.is_self
          ? `<span class="friend-self-badge">Bạn</span>`
          : `<button class="button secondary icon friend-remove" type="button" data-action="delete-friend" data-friend-id="${escapeAttr(friend.id)}" title="Xóa bạn">${svgIcon("trash")}</button>`}
      </div>
    `;
  }

  function friendRequestSection(title, requests, direction) {
    if (!requests.length) return "";
    return `
      <div class="friend-request-section">
        <h3>${escapeHtml(title)}</h3>
        <div class="friend-list">
          ${requests.map((request) => friendRequestRow(request, direction)).join("")}
        </div>
      </div>
    `;
  }

  function friendRequestRow(request, direction) {
    return `
      <div class="friend-row friend-request-row">
        <div class="friend-profile">
          ${avatarMarkup(request, "friend-avatar")}
          <div>
            <strong>${escapeHtml(request.full_name || request.email)}</strong>
            <small>${escapeHtml(request.email)} · ID ${escapeHtml(request.user_id)}</small>
          </div>
        </div>
        <div class="friend-request-status">
          <strong>${direction === "incoming" ? "Đang chờ bạn chấp nhận" : "Đang chờ phản hồi"}</strong>
          <span>${formatDateTime(request.created_at)}</span>
        </div>
        <div class="friend-request-actions">
          ${direction === "incoming" ? `
            <button class="button secondary" type="button" data-action="accept-friend-request" data-request-id="${escapeAttr(request.request_id)}">Chấp nhận</button>
            <button class="button secondary" type="button" data-action="reject-friend-request" data-request-id="${escapeAttr(request.request_id)}">Từ chối</button>
          ` : `
            <button class="button secondary" type="button" data-action="cancel-friend-request" data-request-id="${escapeAttr(request.request_id)}">Hủy lời mời</button>
          `}
        </div>
      </div>
    `;
  }

  function renderGame() {
    const game = gameSync.data;
    const attempts = game?.attempts_used || 0;
    const maxAttempts = game?.max_attempts || 6;
    const solvedCount = game?.progress?.filter((player) => player.status === "solved").length || 0;
    const activeCount = game?.progress?.filter((player) => player.status === "playing").length || 0;
    return `
      <section class="topbar">
        <div>
          <p class="eyebrow">GAME</p>
          <h1>Wordle hôm nay</h1>
          <p>Đoán một từ tiếng Anh 5 chữ trong 6 lượt. Mọi người dùng nhận cùng một từ mỗi ngày và tiến độ được cập nhật gần thời gian thực.</p>
        </div>
        <button class="button secondary" type="button" data-action="refresh-game">${svgIcon("refresh")}Cập nhật</button>
      </section>

      ${gameSync.loading && !game ? `<div class="sync-banner">Đang tải game hôm nay...</div>` : ""}
      ${gameSync.error ? `<div class="sync-banner error">${escapeHtml(gameSync.error)}</div>` : ""}

      <section class="metric-grid game-metrics" aria-label="Tổng quan game">
        <article class="metric">
          <span>Trạng thái</span>
          <strong>${escapeHtml(gameStatusLabel(game?.status || "loading"))}</strong>
          <small>${game?.answer ? `Đáp án: ${escapeHtml(game.answer.toUpperCase())}` : "Đáp án được giữ kín khi đang chơi"}</small>
        </article>
        <article class="metric">
          <span>Lượt đoán</span>
          <strong>${attempts}/${maxAttempts}</strong>
          <small>${game ? `${game.remaining_attempts} lượt còn lại` : "Đang tải"}</small>
        </article>
        <article class="metric">
          <span>Người đã giải</span>
          <strong>${solvedCount}</strong>
          <small>${game?.progress?.length || 0} người chơi hôm nay</small>
        </article>
        <article class="metric">
          <span>Ván kế tiếp</span>
          <strong>${escapeHtml(formatGameCountdown(game?.seconds_until_next_puzzle || 0))}</strong>
          <small>Nguồn top ${escapeHtml(formatNumber(game?.source_word_count || 3000))} từ phổ biến</small>
        </article>
      </section>

      <section class="game-layout">
        <article class="panel game-board-panel">
          <div class="panel-header">
            <div>
              <h2>Bảng đoán</h2>
              <p>${game ? `Ngày ${escapeHtml(formatDate(game.puzzle_date))} · ${game.answer_pool_count} đáp án phổ biến 5 chữ` : "Đang chuẩn bị dữ liệu"}</p>
            </div>
          </div>
          <div class="game-board-wrap">
            ${gameBoard(game)}
            ${gameGuessForm(game)}
            ${gameKeyboard(game)}
          </div>
        </article>

        <article class="panel game-progress-panel">
          <div class="panel-header">
            <div>
              <h2>Tiến độ người chơi</h2>
              <p>${activeCount} người đang chơi · tự cập nhật mỗi 5 giây khi mở tab</p>
            </div>
          </div>
          <div class="game-progress-list">
            ${game?.progress?.length ? game.progress.map(gameProgressRow).join("") : `<div class="empty-state">Chưa có tiến độ người chơi hôm nay.</div>`}
          </div>
        </article>
      </section>
    `;
  }

  function gameBoard(game) {
    const wordLength = game?.word_length || 5;
    const maxAttempts = game?.max_attempts || 6;
    const guesses = game?.guesses || [];
    return `
      <div class="wordle-board" aria-label="Bảng Wordle">
        ${Array.from({ length: maxAttempts }, (_, index) => gameBoardRow(guesses[index], wordLength)).join("")}
      </div>
    `;
  }

  function gameBoardRow(guess, wordLength) {
    const letters = guess ? guess.word.toUpperCase().split("") : Array.from({ length: wordLength }, () => "");
    const results = guess?.result || [];
    return `
      <div class="wordle-row">
        ${Array.from({ length: wordLength }, (_, index) => `
          <span class="wordle-tile ${results[index] || ""}" title="${escapeAttr(gameTileLabel(results[index]))}">
            ${escapeHtml(letters[index] || "")}
          </span>
        `).join("")}
      </div>
    `;
  }

  function gameGuessForm(game) {
    const isPlaying = game?.status === "playing";
    const disabled = !game || !isPlaying || gameSync.loading;
    return `
      <form class="game-guess-form" data-form="game-guess">
        <div class="field">
          <label for="game-guess-word">Từ đoán</label>
          <input id="game-guess-word" name="word" data-game-guess-input type="text" minlength="5" maxlength="5" pattern="[A-Za-z]{5}" autocomplete="off" autocapitalize="characters" value="${escapeAttr(gameSync.guessDraft)}" ${disabled ? "disabled" : ""} required>
        </div>
        <button class="button" type="submit" ${disabled ? "disabled" : ""}>Đoán</button>
      </form>
      ${game?.status === "solved" ? `<p class="game-result good">Bạn đã giải đúng trong ${game.attempts_used} lượt.</p>` : ""}
      ${game?.status === "failed" ? `<p class="game-result danger">Hết lượt. Đáp án hôm nay là ${escapeHtml(String(game.answer || "").toUpperCase())}.</p>` : ""}
    `;
  }

  function gameKeyboard(game) {
    const disabled = !game || game.status !== "playing" || gameSync.loading;
    const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    const statuses = gameKeyboardStatuses(game);
    return `
      <div class="wordle-keyboard" aria-label="Bàn phím Wordle">
        ${rows.map((row, rowIndex) => `
          <div class="wordle-keyboard-row">
            ${rowIndex === 2 ? keyboardButton("enter", "Đoán", "", disabled) : ""}
            ${row.split("").map((letter) => keyboardButton(letter, letter, statuses[letter] || "", disabled)).join("")}
            ${rowIndex === 2 ? keyboardButton("backspace", "Xóa", "", disabled) : ""}
          </div>
        `).join("")}
      </div>
    `;
  }

  function keyboardButton(key, label, status, disabled) {
    return `
      <button class="wordle-key ${status} ${key.length > 1 ? "wide" : ""}" type="button" data-action="game-key" data-key="${escapeAttr(key)}" ${disabled ? "disabled" : ""}>
        ${escapeHtml(label)}
      </button>
    `;
  }

  function gameKeyboardStatuses(game) {
    const priority = { absent: 1, present: 2, correct: 3 };
    const statuses = {};
    (game?.guesses || []).forEach((guess) => {
      String(guess.word || "").toUpperCase().split("").forEach((letter, index) => {
        const result = guess.result?.[index] || "";
        if (!result) return;
        if ((priority[result] || 0) > (priority[statuses[letter]] || 0)) {
          statuses[letter] = result;
        }
      });
    });
    return statuses;
  }

  function gameProgressRow(player) {
    const isSelf = String(player.user_id) === String(auth.user?.id);
    return `
      <div class="game-progress-row ${isSelf ? "self" : ""}">
        <div class="friend-profile">
          ${avatarMarkup({ ...player, id: player.user_id }, "friend-avatar")}
          <div>
            <strong>${escapeHtml(player.full_name || "Người chơi")}</strong>
            <small>${isSelf ? "Bạn" : `ID ${escapeHtml(player.user_id)}`} · ${escapeHtml(formatDateTime(player.updated_at))}</small>
          </div>
        </div>
        <div class="friend-progress">
          <div class="row-top">
            <strong>${escapeHtml(gameStatusLabel(player.status))}</strong>
            <span>${player.attempts_used}/${player.max_attempts} lượt</span>
          </div>
          ${gameProgressBoard(player)}
        </div>
      </div>
    `;
  }

  function gameProgressBoard(player) {
    const maxAttempts = Math.max(1, Number(player.max_attempts || 6));
    const wordLength = gameSync.data?.word_length || 5;
    const board = Array.isArray(player.board) ? player.board : [];
    return `
      <div class="wordle-mini-board" aria-label="Bảng màu của ${escapeAttr(player.full_name || "người chơi")}">
        ${Array.from({ length: maxAttempts }, (_, rowIndex) => `
          <div class="wordle-mini-row">
            ${Array.from({ length: wordLength }, (_, tileIndex) => {
              const result = board[rowIndex]?.[tileIndex] || "";
              return `<span class="wordle-mini-tile ${escapeAttr(result)}" title="${escapeAttr(gameTileLabel(result))}"></span>`;
            }).join("")}
          </div>
        `).join("")}
      </div>
    `;
  }

  function gameStatusLabel(status) {
    if (status === "solved") return "Đã giải";
    if (status === "failed") return "Hết lượt";
    if (status === "playing") return "Đang chơi";
    return "Đang tải";
  }

  function gameTileLabel(result) {
    if (result === "correct") return "Đúng chữ, đúng vị trí";
    if (result === "present") return "Có chữ, sai vị trí";
    if (result === "absent") return "Không có trong từ";
    return "Ô trống";
  }

  function formatGameCountdown(seconds) {
    const safeSeconds = Math.max(0, Number(seconds || 0));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    if (hours <= 0) return `${minutes} phút`;
    return `${hours} giờ ${minutes} phút`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
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
    const selectedMonthTransactions = state.money.transactions
      .filter((transaction) => transaction.type === "expense")
      .filter((transaction) => transaction.date.startsWith(selectedMonth));
    const filteredTransactions = selectedMonthTransactions
      .filter((transaction) => filters.category === "all" || transaction.category === filters.category)
      .filter((transaction) => {
        const query = filters.search.trim().toLowerCase();
        return !query || `${transaction.note} ${transaction.category}`.toLowerCase().includes(query);
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    const expenses = selectedMonthTransactions
      .reduce((sum, transaction) => sum + transaction.amount, 0);
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
          minimum: budget.minimum,
          full: budget.full,
          spent,
          percent: hasSyncedProgress ? budget.percent : budget.limit > 0 ? Math.round((spent / budget.limit) * 100) : 0,
          color: normalizeBudgetColor(budget.color)
        };
      })
      .sort((a, b) => b.percent - a.percent);
    const totalLimit = budgetProgress.reduce((sum, budget) => sum + Number(budget.limit || 0), 0);
    const remainingBudget = totalLimit - expenses;
    const overBudgetCount = budgetProgress.filter((budget) => Number(budget.percent || 0) >= 100).length;
    const monthlyIncome = Number(auth.user?.monthly_income || 0);
    const currentAmount = Number(state.money.bucket?.total || 0);
    const minimumMonthlyBudget = budgetProgress.reduce((sum, budget) => sum + Number(budget.minimum || budget.limit || 0), 0);
    const fullMonthlyBudget = budgetProgress.reduce((sum, budget) => sum + Number(budget.full || budget.limit || 0), 0);

    return {
      selectedLabel: new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(new Date(`${selectedMonth}-01T12:00:00`)),
      selectedMonthTransactions,
      filteredTransactions,
      expenses,
      remainingBudget,
      overBudgetCount,
      expenseCount: selectedMonthTransactions.length,
      categorySpend,
      budgetProgress,
      minimumMonthlyBudget,
      fullMonthlyBudget,
      minimumFreedom: financialFreedomEstimate(monthlyIncome, minimumMonthlyBudget, currentAmount),
      fullFreedom: financialFreedomEstimate(monthlyIncome, fullMonthlyBudget, currentAmount)
    };
  }

  function automaticFundRecords(data, bucket) {
    const totals = {
      minimum: Number(data.minimumMonthlyBudget || 0),
      full: Number(data.fullMonthlyBudget || 0)
    };
    const saved = Math.max(0, Number(bucket?.total || 0));
    return automaticFundDefinitions.map((definition) => {
      const target = Math.max(0, Number(definition.target(totals) || 0));
      return {
        id: definition.id,
        name: definition.name,
        subtitle: definition.subtitle,
        target,
        saved,
        percent: target > 0 ? Math.round((saved / target) * 100) : 0,
        color: definition.color
      };
    });
  }

  function financialFreedomEstimate(monthlyIncome, monthlyBudget, currentAmount = 0) {
    return targetSavingsEstimate(monthlyIncome, monthlyBudget, 12 * 25, currentAmount);
  }

  function targetSavingsEstimate(monthlyIncome, monthlyBudget, targetMonths, currentAmount = 0) {
    const safeIncome = Math.max(0, Number(monthlyIncome || 0));
    const safeBudget = Math.max(0, Number(monthlyBudget || 0));
    const safeTargetMonths = Math.max(0, Number(targetMonths || 0));
    const safeCurrentAmount = Math.max(0, Number(currentAmount || 0));
    const monthlySavings = safeIncome - safeBudget;
    const target = safeBudget * safeTargetMonths;
    const remainingTarget = Math.max(0, target - safeCurrentAmount);
    return {
      monthlyIncome: safeIncome,
      monthlyBudget: safeBudget,
      currentAmount: safeCurrentAmount,
      monthlySavings,
      target,
      remainingTarget,
      months: monthlySavings > 0 && remainingTarget > 0 ? Math.ceil(remainingTarget / monthlySavings) : 0
    };
  }

  function categoryTotals(transactions) {
    return transactions
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

  function definedCategoryOptions() {
    return normalizeCategories(state.money.categories);
  }

  function onboardingRecommendationOptions() {
    return normalizeCategories([...defaultCategories, ...definedCategoryOptions()]);
  }

  function transactionCategoryOptions(editing) {
    const categories = definedCategoryOptions();
    if (editing?.category && !categories.includes(editing.category)) {
      return normalizeCategories([editing.category, ...categories]);
    }
    return categories;
  }

  function categoryRecordFromApi(category) {
    return {
      id: String(category.id),
      name: localizeCategoryName(category.name)
    };
  }

  function categoryLabel(category) {
    return categoryLabels[category] || localizeCategoryName(category);
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
      type: "expense",
      category: transaction.category,
      note: transaction.note,
      amount: String(transaction.amount),
      occurred_on: transaction.date
    };
  }

  function budgetsFromApi(budgets) {
    return budgets.reduce((result, budget) => {
      result[localizeCategoryName(budget.category)] = Number(budget.limit_amount || 0);
      return result;
    }, {});
  }

  function budgetExistsForCurrentMonth(category) {
    const month = state.money.filters.month || currentMonth();
    return Object.prototype.hasOwnProperty.call(state.money.budgets, category)
      || state.money.budgetRecords.some((budget) => (
        budget.category === category && budget.month === month
      ));
  }

  function budgetRecordFromApi(budget) {
    return normalizeBudgetRecord({
      id: budget.id,
      category: budget.category,
      month: budget.month,
      limit_amount: budget.limit_amount,
      minimum_amount: budget.minimum_amount,
      full_amount: budget.full_amount,
      color: budget.color,
      spent_amount: budget.spent_amount,
      percent_used: budget.percent_used
    });
  }

  function bucketRecordFromApi(bucket) {
    return normalizeBucketRecord({
      id: bucket?.id || "",
      total_amount: bucket?.total_amount || 0
    });
  }

  function fundRecordFromApi(fund) {
    return normalizeFundRecord({
      id: fund.id,
      name: fund.name,
      target_amount: fund.target_amount,
      saved_amount: fund.saved_amount,
      percent_saved: fund.percent_saved,
      color: fund.color
    });
  }

  async function ensureMoneyLoaded() {
    if (!auth.token || moneySync.loading) return;
    if (moneySync.loaded && moneySync.budgetMonth === state.money.filters.month) return;
    await loadMoneyFromApi();
  }

  async function ensureFriendsLoaded() {
    if (!auth.token || activeModuleId !== "friends" || friendsSync.loading) return;
    if (friendsSync.loaded && friendsSync.month === currentMonth()) return;
    await loadFriendsFromApi();
  }

  async function ensureGameLoaded() {
    if (!auth.token || activeModuleId !== "game" || gameSync.loading) return;
    if (gameSync.loaded) return;
    await loadGameFromApi();
  }

  async function loadMoneyFromApi() {
    moneySync.loading = true;
    moneySync.error = "";
    renderActiveModule();

    try {
      const month = state.money.filters.month || currentMonth();
      const categories = await loadCategoriesFromApi();
      const [transactions, summary, bucket, funds] = await Promise.all([
        apiRequest("/api/money/transactions"),
        apiRequest(`/api/money/summary?month=${encodeURIComponent(month)}`),
        apiRequest("/api/money/bucket"),
        apiRequest("/api/money/funds")
      ]);
      const budgets = summary.budgets || [];
      state.money.transactions = transactions.map(mapTransactionFromApi).filter(Boolean);
      state.money.budgetRecords = budgets.map(budgetRecordFromApi);
      state.money.budgets = budgetsFromApi(budgets);
      state.money.bucket = bucketRecordFromApi(bucket);
      state.money.funds = Array.isArray(funds)
        ? funds.map(fundRecordFromApi).filter((fund) => fund && !isAutomaticFundName(fund.name))
        : [];
      state.money.categoryRecords = categories.map(categoryRecordFromApi);
      state.money.categories = normalizeCategories(state.money.categoryRecords.map((category) => category.name));
      moneySync.loaded = true;
      moneySync.budgetMonth = month;
      saveState();
    } catch (error) {
      moneySync.error = error.message || "Không thể đồng bộ dữ liệu.";
      if (error.authExpired) return;
    } finally {
      moneySync.loading = false;
      if (auth.token && document.querySelector("#main")) {
        renderActiveModule();
      }
    }
  }

  async function loadCategoriesFromApi() {
    let categoryRecords = await apiRequest("/api/money/categories");
    if (categoryRecords.length) return migrateLegacyCategoryRecords(categoryRecords);

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

  async function migrateLegacyCategoryRecords(categoryRecords) {
    const names = new Set(categoryRecords.map((category) => String(category.name || "")));
    const migrated = [];

    for (const category of categoryRecords) {
      const oldName = String(category.name || "");
      const nextName = legacyCategoryLabels[oldName];
      if (nextName && nextName !== oldName && !names.has(nextName)) {
        try {
          const updated = await apiRequest(`/api/money/categories/${encodeURIComponent(category.id)}`, {
            method: "PATCH",
            body: { name: nextName }
          });
          names.delete(oldName);
          names.add(nextName);
          migrated.push(updated);
          continue;
        } catch (error) {
          console.warn("Unable to migrate category name.", error);
        }
      }
      migrated.push(category);
    }

    return migrated;
  }

  async function loadFriendsFromApi() {
    friendsSync.loading = true;
    friendsSync.error = "";
    renderActiveModule();

    try {
      const month = currentMonth();
      const payload = await apiRequest("/api/friends");
      const selfFriend = normalizeFriend(payload.self);
      friendsSync.self = selfFriend ? { ...selfFriend, is_self: true } : null;
      friendsSync.items = uniqueFriends(Array.isArray(payload.friends) ? payload.friends.map(normalizeFriend).filter(Boolean) : []);
      friendsSync.incoming = uniqueFriendRequests(Array.isArray(payload.incoming_requests) ? payload.incoming_requests.map(normalizeFriendRequest).filter(Boolean) : []);
      friendsSync.outgoing = uniqueFriendRequests(Array.isArray(payload.outgoing_requests) ? payload.outgoing_requests.map(normalizeFriendRequest).filter(Boolean) : []);
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

  async function loadGameFromApi(options = {}) {
    const quiet = Boolean(options.quiet);
    if (!quiet) {
      gameSync.loading = true;
      gameSync.error = "";
      renderActiveModule();
    }

    try {
      const previousDate = gameSync.data?.puzzle_date || "";
      gameSync.data = normalizeGameState(await apiRequest("/api/game/today"));
      if (previousDate && gameSync.data?.puzzle_date !== previousDate) gameSync.guessDraft = "";
      gameSync.loaded = true;
      gameSync.error = "";
    } catch (error) {
      if (error.authExpired) return;
      gameSync.error = error.message || "Không thể tải game hôm nay.";
    } finally {
      gameSync.loading = false;
      const shouldRender = !quiet || !isEditingGameGuess();
      if (shouldRender && auth.token && activeModuleId === "game" && document.querySelector("#main")) {
        renderActiveModule();
      }
    }
  }

  function isEditingGameGuess() {
    const input = document.querySelector("[data-game-guess-input]");
    return Boolean(input && document.activeElement === input && input.value.trim());
  }

  function updateGamePolling() {
    if (auth.token && activeModuleId === "game") {
      if (!gameSync.pollingId) {
        gameSync.pollingId = window.setInterval(() => {
          if (auth.token && activeModuleId === "game" && !gameSync.loading) {
            loadGameFromApi({ quiet: true });
          }
        }, 5000);
      }
      return;
    }

    stopGamePolling();
  }

  function stopGamePolling() {
    if (!gameSync.pollingId) return;
    window.clearInterval(gameSync.pollingId);
    gameSync.pollingId = null;
  }

  function normalizeFriend(friend) {
    if (!friend || typeof friend !== "object") return null;
    return {
      id: String(friend.id || ""),
      email: String(friend.email || ""),
      full_name: String(friend.full_name || ""),
      avatar_url: String(friend.avatar_url || ""),
      budget_percent_used: Math.max(0, Number(friend.budget_percent_used || 0)),
      budget_count: Math.max(0, Number(friend.budget_count || 0))
    };
  }

  function uniqueFriends(friends) {
    const seen = new Set();
    return friends.filter((friend) => {
      const key = String(friend.id || friend.email || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function normalizeFriendRequest(request) {
    if (!request || typeof request !== "object") return null;
    return {
      request_id: String(request.request_id || ""),
      user_id: String(request.user_id || ""),
      email: String(request.email || ""),
      full_name: String(request.full_name || ""),
      avatar_url: String(request.avatar_url || ""),
      direction: String(request.direction || ""),
      status: String(request.status || ""),
      created_at: String(request.created_at || "")
    };
  }

  function uniqueFriendRequests(requests) {
    const seen = new Set();
    return requests.filter((request) => {
      const key = String(request.user_id || request.email || request.request_id || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function normalizeGameState(game) {
    if (!game || typeof game !== "object") return null;
    return {
      puzzle_date: String(game.puzzle_date || currentDate()),
      word_length: Math.max(1, Number(game.word_length || 5)),
      max_attempts: Math.max(1, Number(game.max_attempts || 6)),
      attempts_used: Math.max(0, Number(game.attempts_used || 0)),
      remaining_attempts: Math.max(0, Number(game.remaining_attempts || 0)),
      status: String(game.status || "playing"),
      guesses: Array.isArray(game.guesses) ? game.guesses.map(normalizeGameGuess).filter(Boolean) : [],
      answer: game.answer ? String(game.answer).toLowerCase() : "",
      progress: Array.isArray(game.progress) ? game.progress.map(normalizeGameProgress).filter(Boolean) : [],
      source_word_count: Math.max(0, Number(game.source_word_count || 0)),
      answer_pool_count: Math.max(0, Number(game.answer_pool_count || 0)),
      seconds_until_next_puzzle: Math.max(0, Number(game.seconds_until_next_puzzle || 0))
    };
  }

  function normalizeGameGuess(guess) {
    if (!guess || typeof guess !== "object") return null;
    const word = String(guess.word || "").toLowerCase();
    if (!word) return null;
    return {
      word,
      result: Array.isArray(guess.result) ? guess.result.map((item) => String(item || "")) : [],
      created_at: String(guess.created_at || "")
    };
  }

  function normalizeGameProgress(player) {
    if (!player || typeof player !== "object") return null;
    return {
      user_id: String(player.user_id || ""),
      full_name: String(player.full_name || ""),
      avatar_url: String(player.avatar_url || ""),
      attempts_used: Math.max(0, Number(player.attempts_used || 0)),
      max_attempts: Math.max(1, Number(player.max_attempts || 6)),
      board: Array.isArray(player.board) ? player.board.map(normalizeGameProgressRow).filter(Boolean) : [],
      status: String(player.status || "playing"),
      updated_at: String(player.updated_at || "")
    };
  }

  function normalizeGameProgressRow(row) {
    if (!Array.isArray(row)) return null;
    return row.map((item) => String(item || "")).slice(0, 5);
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
              <td class="amount expense">${formatter.format(transaction.amount)}</td>
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
    const categories = transactionCategoryOptions(editing);
    return `
      <form class="form-grid" data-form="transaction">
        <input type="hidden" name="id" value="${escapeAttr(editing ? editing.id : "")}">
        <div class="field">
          <label for="transaction-date">Ngày</label>
          <input id="transaction-date" name="date" type="date" value="${editing?.date || currentDate()}" required>
        </div>
        <div class="field">
          <label for="transaction-category">Danh mục</label>
          <select id="transaction-category" name="category" required>
            ${categories.map((category) => option(category, categoryLabel(category), editing?.category || categories[0] || "Ăn uống")).join("")}
          </select>
        </div>
        <div class="field">
          <label for="transaction-amount">Số tiền</label>
          <input id="transaction-amount" name="amount" type="number" min="0" step="${escapeAttr(amountStep())}" value="${editing?.amount || ""}" placeholder="0" required>
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
    const addOptions = definedCategoryOptions()
      .map((category) => option(category, categoryLabel(category), ""));
    const hasAddOptions = addOptions.length > 0;
    const totalSpent = items.reduce((sum, item) => sum + Number(item.spent || 0), 0);
    const totalLimit = items.reduce((sum, item) => sum + Number(item.limit || 0), 0);
    const totalPercent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
    const totalClassName = totalPercent >= 100 ? "danger" : totalPercent >= 80 ? "warning" : "";
    return `
      <div class="budget-list">
        ${budgetAddOpen ? `
          <form class="budget-add expanded" data-form="budget">
            <div class="field">
              <label for="budget-new-category">Danh mục</label>
              <select id="budget-new-category" name="category" required ${hasAddOptions ? "" : "disabled"}>
                ${hasAddOptions ? addOptions.join("") : `<option value="">Chưa có danh mục nào</option>`}
              </select>
            </div>
            <div class="field">
              <label for="budget-new-limit">Số tiền</label>
              <input id="budget-new-limit" name="limit_amount" type="number" min="0" step="${escapeAttr(amountStep())}" placeholder="0" required>
            </div>
            <div class="form-actions budget-add-actions">
              <button class="button secondary" type="button" data-action="close-budget-add">Hủy</button>
              <button class="button" type="submit" ${hasAddOptions ? "" : "disabled"}>${svgIcon("plus")}Lưu ngân sách</button>
            </div>
          </form>
        ` : `
          <div class="budget-add-collapsed">
            <button class="button secondary" type="button" data-action="open-budget-add" ${hasAddOptions ? "" : "disabled"}>${svgIcon("plus")}Thêm ngân sách</button>
          </div>
        `}
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
    const displayColor = percent >= 100 ? dangerBudgetColor : color;
    const displayTint = percent >= 100 ? "rgba(225, 29, 72, 0.13)" : budgetColorTint(color);
    const isEditing = editingBudgetId === item.id;
    return `
      <div class="category-chart-card budget-card ${className}" data-budget-row="${escapeAttr(item.id)}" style="--row-accent: ${escapeAttr(displayColor)}; --row-bg: ${escapeAttr(displayTint)}" title="${escapeAttr(categoryLabel(item.category))}: ${formatter.format(item.spent)} / ${formatter.format(item.limit)}">
        <div class="row-top">
          <strong>${escapeHtml(categoryLabel(item.category))}</strong>
          <span>${percent}%</span>
        </div>
        <div class="progress ${className}" style="--value: ${Math.min(percent, 100)}%">
          <span></span>
        </div>
        <small>${formatter.format(item.spent)} / ${formatter.format(item.limit)}</small>
        <small>Tối thiểu ${formatter.format(item.minimum || item.limit)} · Đầy đủ ${formatter.format(item.full || item.limit)}</small>
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
          <input id="budget-${escapeAttr(item.id || slug(item.category))}" name="limit_amount" type="number" min="0" step="${escapeAttr(amountStep())}" value="${item.limit}" required>
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

    if (action === "open-feature-notifications") {
      featureNotificationPanelOpen = true;
      openedFeatureAnnouncementId = "";
      app();
    }

    if (action === "open-feature-announcement") {
      openedFeatureAnnouncementId = actionTarget.dataset.announcementId || "";
      if (!updateFeatureNotificationPanel()) app();
    }

    if (action === "back-feature-notifications") {
      openedFeatureAnnouncementId = "";
      if (!updateFeatureNotificationPanel()) app();
    }

    if (action === "close-feature-notifications") {
      markFeatureAnnouncementsRead();
      featureNotificationPanelOpen = false;
      openedFeatureAnnouncementId = "";
      app();
    }

    if (action === "open-feature-module") {
      markFeatureAnnouncementsRead();
      featureNotificationPanelOpen = false;
      openedFeatureAnnouncementId = "";
      const nextModuleId = actionTarget.dataset.moduleId;
      if (modules.some((module) => module.enabled && module.id === nextModuleId)) {
        activeModuleId = nextModuleId;
      }
      app();
    }

    if (action === "refresh-game") {
      await loadGameFromApi();
    }

    if (action === "game-key") {
      applyGameKey(actionTarget.dataset.key);
    }

    if (action === "switch-auth-mode") {
      authMode = authMode === "login" ? "register" : "login";
      app();
    }

    if (action === "start-onboarding") {
      await startOnboardingFromCurrentSettings();
    }

    if (action === "cancel-onboarding") {
      onboardingActive = false;
      onboardingDraft = null;
      clearOnboardingDraft();
      app();
    }

    if (action === "skip-onboarding") {
      await skipOnboarding();
    }

    if (action === "choose-avatar") {
      document.querySelector("#profile-avatar-file")?.click();
    }

    if (action === "add-onboarding-recommendation") {
      syncOnboardingDraftFromDom();
      if (addOnboardingCategory(actionTarget.dataset.category)) app();
    }

    if (action === "add-onboarding-fund-recommendation") {
      syncOnboardingDraftFromDom();
      if (addOnboardingFund(actionTarget.dataset.fund)) app();
    }

    if (action === "open-onboarding-custom") {
      const draft = syncOnboardingDraftFromDom();
      draft.customCategoryOpen = true;
      app();
    }

    if (action === "open-onboarding-fund-custom") {
      const draft = syncOnboardingDraftFromDom();
      draft.customFundOpen = true;
      app();
    }

    if (action === "add-onboarding-custom") {
      const draft = syncOnboardingDraftFromDom();
      if (addOnboardingCategory(draft.customCategory)) {
        draft.customCategory = "";
        draft.customCategoryOpen = false;
        app();
      }
    }

    if (action === "add-onboarding-fund-custom") {
      const draft = syncOnboardingDraftFromDom();
      if (addOnboardingFund(draft.customFund)) {
        draft.customFund = "";
        draft.customFundOpen = false;
        app();
      }
    }

    if (action === "edit-onboarding-row") {
      const draft = syncOnboardingDraftFromDom();
      const index = Number(actionTarget.dataset.rowIndex);
      if (draft.rows[index]) {
        draft.rows[index].editing = true;
        saveOnboardingDraft();
        app();
      }
    }

    if (action === "edit-onboarding-fund") {
      const draft = syncOnboardingDraftFromDom();
      const index = Number(actionTarget.dataset.rowIndex);
      if (draft.fundRows[index]) {
        draft.fundRows[index].editing = true;
        saveOnboardingDraft();
        app();
      }
    }

    if (action === "finish-onboarding-row-edit") {
      if (finishOnboardingRowEdit(Number(actionTarget.dataset.rowIndex))) app();
    }

    if (action === "finish-onboarding-fund-edit") {
      if (finishOnboardingFundEdit(Number(actionTarget.dataset.rowIndex))) app();
    }

    if (action === "remove-onboarding-category") {
      const draft = syncOnboardingDraftFromDom();
      const index = Number(actionTarget.dataset.rowIndex);
      draft.rows = draft.rows.filter((_, rowIndex) => rowIndex !== index);
      saveOnboardingDraft();
      app();
    }

    if (action === "remove-onboarding-fund") {
      const draft = syncOnboardingDraftFromDom();
      const index = Number(actionTarget.dataset.rowIndex);
      draft.fundRows = draft.fundRows.filter((_, rowIndex) => rowIndex !== index);
      saveOnboardingDraft();
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

    if (action === "logout") {
      auth.token = "";
      auth.user = null;
      localStorage.removeItem(AUTH_STORAGE_KEY);
      editingId = null;
      editingBudgetId = null;
      gameSync.loaded = false;
      gameSync.loading = false;
      gameSync.error = "";
      gameSync.data = null;
      gameSync.guessDraft = "";
      stopGamePolling();
      friendsSync.self = null;
      friendsSync.items = [];
      friendsSync.incoming = [];
      friendsSync.outgoing = [];
      onboardingDraft = null;
      onboardingActive = false;
      clearOnboardingDraft();
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

    if (action === "open-budget-add") {
      budgetAddOpen = true;
      renderActiveModule();
    }

    if (action === "close-budget-add") {
      budgetAddOpen = false;
      renderActiveModule();
    }

    if (action === "delete-category") {
      await deleteCategory(actionTarget.dataset.categoryId);
    }

    if (action === "delete-fund") {
      await deleteFund(actionTarget.dataset.fundId);
    }

    if (action === "delete-friend") {
      await deleteFriend(actionTarget.dataset.friendId);
    }

    if (action === "accept-friend-request") {
      await acceptFriendRequest(actionTarget.dataset.requestId);
    }

    if (action === "reject-friend-request" || action === "cancel-friend-request") {
      await deleteFriendRequest(actionTarget.dataset.requestId, action === "cancel-friend-request");
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

    if (event.target.matches("[data-game-guess-input]")) {
      event.target.value = event.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 5);
      gameSync.guessDraft = event.target.value;
    }

    if (event.target.closest("[data-form='onboarding']")) {
      syncOnboardingDraftFromDom();
      updateOnboardingEstimates();
    }
  }

  function handleKeydown(event) {
    if (event.key !== "Enter") return;

    if (event.target.matches("[data-onboarding-custom]")) {
      event.preventDefault();
      const draft = syncOnboardingDraftFromDom();
      if (addOnboardingCategory(draft.customCategory)) {
        draft.customCategory = "";
        draft.customCategoryOpen = false;
        app();
      }
      return;
    }

    if (event.target.matches("[data-onboarding-fund-custom]")) {
      event.preventDefault();
      const draft = syncOnboardingDraftFromDom();
      if (addOnboardingFund(draft.customFund)) {
        draft.customFund = "";
        draft.customFundOpen = false;
        app();
      }
      return;
    }

    const row = event.target.closest("[data-onboarding-row-index]");
    if (row && row.dataset.onboardingEditing === "true") {
      event.preventDefault();
      if (finishOnboardingRowEdit(Number(row.dataset.onboardingRowIndex))) app();
    }

    const fundRow = event.target.closest("[data-onboarding-fund-row-index]");
    if (fundRow && fundRow.dataset.onboardingFundEditing === "true") {
      event.preventDefault();
      if (finishOnboardingFundEdit(Number(fundRow.dataset.onboardingFundRowIndex))) app();
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

    if (event.target.matches("[data-onboarding-currency]")) {
      syncOnboardingDraftFromDom();
      app();
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

    if (event.target.id === "profile-avatar-file") {
      previewAvatarFile(event.target);
    }
  }

  async function handleSubmit(event) {
    const authForm = event.target.closest("[data-form='login'], [data-form='register']");
    if (authForm) {
      event.preventDefault();
      await submitAuth(authForm);
      return;
    }

    const onboardingForm = event.target.closest("[data-form='onboarding']");
    if (onboardingForm) {
      event.preventDefault();
      await saveOnboarding(onboardingForm);
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

    const bucketForm = event.target.closest("[data-form='bucket']");
    if (bucketForm) {
      event.preventDefault();
      await saveBucket(bucketForm);
      return;
    }

    const fundForm = event.target.closest("[data-form='fund']");
    if (fundForm) {
      event.preventDefault();
      await createFund(fundForm);
      return;
    }

    const fundCardForm = event.target.closest("[data-form='fund-card']");
    if (fundCardForm) {
      event.preventDefault();
      await saveFundCard(fundCardForm);
      return;
    }

    const gameGuessForm = event.target.closest("[data-form='game-guess']");
    if (gameGuessForm) {
      event.preventDefault();
      await submitGameGuess(gameGuessForm);
      return;
    }

    const profileForm = event.target.closest("[data-form='profile']");
    if (profileForm) {
      event.preventDefault();
      await saveProfile(profileForm);
      return;
    }

    const passwordForm = event.target.closest("[data-form='password']");
    if (passwordForm) {
      event.preventDefault();
      await changePassword(passwordForm);
      return;
    }

    const form = event.target.closest("[data-form='transaction']");
    if (!form) return;

    event.preventDefault();
    const formData = new FormData(form);
    const id = String(formData.get("id") || "");
    const transaction = {
      id,
      type: "expense",
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
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const fullName = String(formData.get("full_name") || "").trim();

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
      auth.user = normalizeUser(await apiRequest("/api/auth/me", { token: auth.token }));
      if (!auth.user?.onboarding_completed && loadOnboardingDraft()) {
        onboardingActive = true;
        onboardingDraft = null;
      }
      moneySync.loaded = false;
      moneySync.budgetMonth = "";
      moneySync.error = "";
      gameSync.loaded = false;
      gameSync.loading = false;
      gameSync.error = "";
      gameSync.data = null;
      gameSync.guessDraft = "";
      saveAuth();
      app();
      showToast(mode === "register" ? "Tạo tài khoản thành công." : "Đăng nhập thành công.");
    } catch (error) {
      showToast(error.message || "Không thể kết nối API.");
    }
  }

  async function validateStoredAuth() {
    if (!auth.token) {
      app();
      return;
    }

    try {
      auth.user = normalizeUser(await apiRequest("/api/auth/me", { token: auth.token }));
      if (!auth.user?.onboarding_completed && loadOnboardingDraft()) {
        onboardingActive = true;
        onboardingDraft = null;
      }
      saveAuth();
      app();
    } catch (error) {
      if (error.authExpired) return;
      app();
      showToast(error.message || "Không thể kiểm tra phiên đăng nhập.");
    }
  }

  async function saveProfile(form) {
    const formData = new FormData(form);
    const fullName = String(formData.get("full_name") || "").trim();
    const avatarUrl = String(formData.get("avatar_url") || "").trim();
    const currency = String(formData.get("currency") || "VND");
    const avatarFile = formData.get("avatar_file");
    if (!fullName) {
      showToast("Hãy nhập họ tên.");
      return;
    }
    if (hasSelectedAvatarFile(avatarFile)) {
      const validationMessage = avatarValidationMessage(avatarFile);
      if (validationMessage) {
        showToast(validationMessage);
        return;
      }
    }

    try {
      let updatedUser = await apiRequest("/api/auth/me", {
        method: "PATCH",
        body: {
          full_name: fullName,
          avatar_url: avatarUrl,
          currency
        }
      });
      if (hasSelectedAvatarFile(avatarFile)) {
        updatedUser = await uploadAvatarFile(avatarFile);
      }
      auth.user = normalizeUser(updatedUser);
      saveAuth();
      moneySync.loaded = false;
      friendsSync.loaded = false;
      app();
      showToast("Đã lưu hồ sơ.");
    } catch (error) {
      showToast(error.message || "Không thể lưu hồ sơ.");
    }
  }

  async function changePassword(form) {
    const formData = new FormData(form);
    const currentPassword = String(formData.get("current_password") || "");
    const newPassword = String(formData.get("new_password") || "");
    const confirmPassword = String(formData.get("confirm_password") || "");
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Hãy nhập đầy đủ mật khẩu.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Mật khẩu mới chưa khớp.");
      return;
    }

    try {
      await apiRequest("/api/auth/password", {
        method: "PATCH",
        body: {
          current_password: currentPassword,
          new_password: newPassword
        }
      });
      form.reset();
      showToast("Đã đổi mật khẩu.");
    } catch (error) {
      showToast(error.message || "Không thể đổi mật khẩu.");
    }
  }

  async function saveOnboarding(form) {
    const draft = syncOnboardingDraftFromDom();
    const bucketTotal = Number(draft.bucketTotal || 0);
    const monthlyIncome = Number(draft.monthlyIncome || 0);
    const currency = currencyOptions[draft.currency] ? draft.currency : "VND";
    const fundRows = draft.fundRows.map((row) => ({
      name: String(row.name || "").trim(),
      target: Number(row.target || 0),
      saved: Number(row.saved || 0)
    })).filter((row) => row.name && !isAutomaticFundName(row.name));
    const rows = draft.rows.map((row) => ({
      category: localizeCategoryName(row.category),
      minimum: Number(row.minimum || 0),
      full: Number(row.full || 0)
    })).filter((row) => row.category);

    if (!Number.isFinite(bucketTotal) || !Number.isFinite(monthlyIncome) || fundRows.some((row) => !Number.isFinite(row.target) || !Number.isFinite(row.saved)) || rows.some((row) => !Number.isFinite(row.minimum) || !Number.isFinite(row.full))) {
      showToast("Hãy nhập số tiền hợp lệ.");
      return;
    }

    if (bucketTotal < 0 || monthlyIncome < 0 || fundRows.some((row) => row.target < 0 || row.saved < 0) || rows.some((row) => row.minimum < 0 || row.full < 0)) {
      showToast("Các số tiền không được nhỏ hơn 0.");
      return;
    }

    if (hasDuplicateOnboardingFunds(fundRows)) {
      showToast("Danh sách Quỹ có tên bị trùng.");
      return;
    }

    try {
      const month = state.money.filters.month || currentMonth();
      await apiRequest("/api/money/bucket", {
        method: "PUT",
        body: { total_amount: String(bucketTotal) }
      });
      await upsertOnboardingFunds(fundRows);
      await ensureBudgetCategories(rows.map((row) => row.category));
      await Promise.all(rows.map((row, index) => (
        apiRequest("/api/money/budgets", {
          method: "PUT",
          body: {
            category: row.category,
            month,
            limit_amount: String(row.full),
            minimum_amount: String(row.minimum),
            full_amount: String(row.full),
            color: budgetColors[index % budgetColors.length]
          }
        })
      )));
      await apiRequest("/api/auth/me", {
        method: "PATCH",
        body: { currency }
      });
      auth.user = normalizeUser(await apiRequest("/api/auth/onboarding", {
        method: "PATCH",
        body: { monthly_income: String(monthlyIncome) }
      }));
      onboardingActive = false;
      onboardingDraft = null;
      clearOnboardingDraft();
      moneySync.loaded = false;
      moneySync.budgetMonth = "";
      saveAuth();
      app();
      showToast("Đã lưu thiết lập ban đầu.");
    } catch (error) {
      if (error.authExpired) return;
      showToast(error.message || "Không thể lưu thiết lập ban đầu.");
    }
  }

  async function skipOnboarding() {
    try {
      auth.user = normalizeUser(await apiRequest("/api/auth/onboarding", {
        method: "PATCH",
        body: { monthly_income: String(auth.user?.monthly_income || 0) }
      }));
      onboardingActive = false;
      onboardingDraft = null;
      clearOnboardingDraft();
      moneySync.loaded = false;
      moneySync.budgetMonth = "";
      saveAuth();
      app();
      showToast("Bạn có thể thiết lập ngân sách sau trong Hồ sơ.");
    } catch (error) {
      if (error.authExpired) return;
      showToast(error.message || "Không thể bỏ qua thiết lập ban đầu.");
    }
  }

  async function ensureBudgetCategories(categories) {
    const records = await loadCategoriesFromApi();
    const knownNames = new Set(records.map((record) => localizeCategoryName(record.name)));
    await Promise.all(categories.filter((category) => !knownNames.has(category)).map((category) => (
      apiRequest("/api/money/categories", {
        method: "POST",
        body: { name: category }
      }).catch((error) => {
        if (!String(error.message || "").includes("tồn tại")) throw error;
      })
    )));
  }

  async function upsertOnboardingFunds(funds) {
    const existingFunds = await apiRequest("/api/money/funds");
    const customFunds = funds.filter((fund) => !isAutomaticFundName(fund.name));
    const byName = new Map(existingFunds
      .filter((fund) => !isAutomaticFundName(fund.name))
      .map((fund) => [String(fund.name || "").toLowerCase(), fund]));
    await Promise.all(customFunds.map((fund, index) => {
      const existing = byName.get(fund.name.toLowerCase());
      const payload = {
        name: fund.name,
        target_amount: String(fund.target),
        saved_amount: String(fund.saved),
        color: fundColors[index % fundColors.length]
      };
      if (existing) {
        return apiRequest(`/api/money/funds/${encodeURIComponent(existing.id)}`, {
          method: "PATCH",
          body: { ...payload, color: existing.color || payload.color }
        });
      }
      return apiRequest("/api/money/funds", {
        method: "POST",
        body: payload
      });
    }));
  }

  async function submitGameGuess(form) {
    const formData = new FormData(form);
    const word = String(formData.get("word") || "").trim().toLowerCase();
    if (!/^[a-z]{5}$/.test(word)) {
      showToast("Hãy nhập một từ tiếng Anh 5 chữ.");
      return;
    }

    gameSync.loading = true;
    gameSync.error = "";
    renderActiveModule();
    try {
      gameSync.data = normalizeGameState(await apiRequest("/api/game/guesses", {
        method: "POST",
        body: { word }
      }));
      gameSync.loaded = true;
      gameSync.guessDraft = "";
      showToast(gameSync.data?.status === "solved" ? "Chính xác." : "Đã ghi lượt đoán.");
    } catch (error) {
      if (error.authExpired) return;
      gameSync.error = error.message || "Không thể gửi lượt đoán.";
      showToast(gameSync.error);
    } finally {
      gameSync.loading = false;
      if (auth.token && activeModuleId === "game" && document.querySelector("#main")) {
        renderActiveModule();
      }
    }
  }

  function applyGameKey(key) {
    const input = document.querySelector("[data-game-guess-input]");
    const form = document.querySelector("[data-form='game-guess']");
    if (!input || input.disabled) return;

    const normalizedKey = String(key || "");
    if (normalizedKey === "enter") {
      form?.requestSubmit();
      return;
    }

    const current = String(input.value || "").toUpperCase();
    if (normalizedKey === "backspace") {
      input.value = current.slice(0, -1);
    } else if (/^[A-Z]$/.test(normalizedKey) && current.length < 5) {
      input.value = `${current}${normalizedKey}`;
    }
    gameSync.guessDraft = input.value;
    input.focus();
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
      if (response.status === 401 && isInvalidAuthDetail(payload.detail)) {
        handleAuthExpired();
        const error = new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");
        error.authExpired = true;
        throw error;
      }
      throw new Error(apiErrorMessage(payload.detail, response.status));
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async function uploadAvatarFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    let response;
    try {
      response = await fetch(`${apiBaseUrl()}/api/auth/avatar`, {
        method: "POST",
        headers: auth.token ? { Authorization: `Bearer ${auth.token}` } : {},
        body: formData
      });
    } catch (error) {
      throw new Error("Không thể kết nối API. Hãy kiểm tra backend đã chạy chưa.");
    }

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401 && isInvalidAuthDetail(payload.detail)) {
        handleAuthExpired();
        const error = new Error("Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");
        error.authExpired = true;
        throw error;
      }
      throw new Error(apiErrorMessage(payload.detail, response.status));
    }

    return response.json();
  }

  function hasSelectedAvatarFile(file) {
    return file instanceof File && file.size > 0;
  }

  function avatarValidationMessage(file) {
    if (!avatarMimeLabels[file.type]) {
      return "Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.";
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return "Ảnh đại diện tối đa 2MB.";
    }
    return "";
  }

  function previewAvatarFile(input) {
    const file = input.files?.[0];
    const fileName = document.querySelector("[data-avatar-file-name]");
    const preview = document.querySelector("[data-avatar-preview]");
    if (!file) {
      if (fileName) fileName.textContent = auth.user?.avatar_url ? "Ảnh hiện tại" : "Chưa có ảnh";
      if (preview) preview.innerHTML = avatarMarkup(auth.user || {}, "profile-avatar-large");
      return;
    }

    const validationMessage = avatarValidationMessage(file);
    if (validationMessage) {
      showToast(validationMessage);
      input.value = "";
      return;
    }

    if (fileName) fileName.textContent = file.name;
    if (!preview) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const name = auth.user?.full_name || auth.user?.email || "Tài khoản";
      preview.innerHTML = `<span class="profile-avatar-large"><img src="${escapeAttr(String(reader.result || ""))}" alt="${escapeAttr(name)}"></span>`;
    });
    reader.readAsDataURL(file);
  }

  function isInvalidAuthDetail(detail) {
    return detail === "Invalid authentication credentials" || detail === "Not authenticated";
  }

  function handleAuthExpired() {
    if (onboardingActive || document.querySelector("[data-form='onboarding']")) {
      syncOnboardingDraftFromDom();
    }
    const hasDraft = Boolean(loadOnboardingDraft());
    auth.token = "";
    auth.user = null;
    onboardingActive = false;
    onboardingDraft = null;
    moneySync.loaded = false;
    moneySync.loading = false;
    moneySync.budgetMonth = "";
    friendsSync.loaded = false;
    friendsSync.loading = false;
    gameSync.loaded = false;
    gameSync.loading = false;
    gameSync.error = "";
    gameSync.data = null;
    gameSync.guessDraft = "";
    stopGamePolling();
    localStorage.removeItem(AUTH_STORAGE_KEY);
    app();
    showToast(hasDraft ? "Phiên đăng nhập đã hết hạn. Đã giữ lại thiết lập đang nhập, hãy đăng nhập lại." : "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.");
  }

  function apiErrorMessage(detail, status) {
    if (detail === "Email is already registered") return "Email này đã được đăng ký.";
    if (detail === "Incorrect email or password") return "Email hoặc mật khẩu không đúng.";
    if (detail === "Current password is incorrect") return "Mật khẩu hiện tại không đúng.";
    if (detail === "Income transactions are disabled") return "Ứng dụng hiện chỉ theo dõi khoản chi.";
    if (detail === "Budget already exists for this category and month") return "Danh mục này đã có ngân sách trong tháng.";
    if (detail === "Budget not found") return "Không tìm thấy ngân sách.";
    if (detail === "Category already exists") return "Danh mục này đã tồn tại.";
    if (detail === "Category is in use") return "Danh mục đang được dùng trong giao dịch hoặc ngân sách.";
    if (detail === "Category not found") return "Không tìm thấy danh mục.";
    if (detail === "Fund already exists") return "Quỹ này đã tồn tại.";
    if (detail === "System fund is automatic") return "Quỹ này được tự động tính từ ngân sách.";
    if (detail === "Fund not found") return "Không tìm thấy Quỹ.";
    if (detail === "Friend user not found") return "Không tìm thấy người dùng này.";
    if (detail === "Cannot add yourself as a friend") return "Bạn không thể thêm chính mình.";
    if (detail === "Friend already exists") return "Người này đã có trong danh sách bạn bè.";
    if (detail === "Friend request already exists") return "Lời mời kết bạn đã tồn tại.";
    if (detail === "Friend request not found") return "Không tìm thấy lời mời kết bạn.";
    if (detail === "Friend request is not yours") return "Bạn không thể thao tác lời mời này.";
    if (detail === "Friend not found") return "Không tìm thấy bạn bè.";
    if (detail === "Today's game is already complete") return "Bạn đã hoàn thành Wordle hôm nay.";
    if (detail === "No guesses remaining") return "Bạn đã hết lượt đoán hôm nay.";
    if (detail === "Guess is not in the word pool") return "Từ này không nằm trong bộ từ của game.";
    if (detail === "Guess is not a valid English word") return "Từ này chưa được nhận diện là từ tiếng Anh hợp lệ.";
    if (detail === "You already guessed this word") return "Bạn đã đoán từ này rồi.";
    if (detail === "Unsupported avatar image type") return "Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF.";
    if (detail === "Avatar file is empty") return "Tệp ảnh không có nội dung.";
    if (detail === "Avatar file is too large") return "Ảnh đại diện tối đa 2MB.";
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

    if (budgetExistsForCurrentMonth(category)) {
      showToast("Đã có ngân sách cho hạn mục này, xem ở dưới");
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
      budgetAddOpen = false;
      await loadMoneyFromApi();
      showToast("Đã thêm ngân sách cho tháng này và các tháng sau.");
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
      showToast("Đã cập nhật ngân sách cho tháng này và các tháng sau.");
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
      const month = state.money.filters.month || currentMonth();
      await apiRequest(`/api/money/budgets/${encodeURIComponent(id)}?month=${encodeURIComponent(month)}`, { method: "DELETE" });
      if (editingBudgetId === id) editingBudgetId = null;
      await loadMoneyFromApi();
      showToast("Đã xóa ngân sách từ tháng này trở đi.");
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
      month: state.money.filters.month || currentMonth(),
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

  async function saveBucket(form) {
    const formData = new FormData(form);
    const total = Number(formData.get("total_amount") || 0);
    if (!Number.isFinite(total) || total < 0) {
      showToast("Hãy nhập tổng tiền hợp lệ.");
      return;
    }

    try {
      const bucket = await apiRequest("/api/money/bucket", {
        method: "PUT",
        body: { total_amount: String(total) }
      });
      state.money.bucket = bucketRecordFromApi(bucket);
      saveAndRender("Đã lưu Túi tiền.");
    } catch (error) {
      showToast(error.message || "Không thể lưu Túi tiền.");
    }
  }

  async function createFund(form) {
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const target = Number(formData.get("target_amount") || 0);
    const saved = Number(formData.get("saved_amount") || 0);
    if (!name || !Number.isFinite(target) || !Number.isFinite(saved) || target < 0 || saved < 0) {
      showToast("Hãy nhập tên quỹ và số tiền hợp lệ.");
      return;
    }
    if (isAutomaticFundName(name)) {
      showToast("Quỹ này được tự động tính từ ngân sách.");
      return;
    }

    try {
      await apiRequest("/api/money/funds", {
        method: "POST",
        body: {
          name,
          target_amount: String(target),
          saved_amount: String(saved),
          color: fundColors[state.money.funds.length % fundColors.length]
        }
      });
      form.reset();
      await loadMoneyFromApi();
      showToast("Đã thêm Quỹ.");
    } catch (error) {
      showToast(error.message || "Không thể thêm Quỹ.");
    }
  }

  async function saveFundCard(form) {
    const id = form.dataset.fundId;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const target = Number(formData.get("target_amount") || 0);
    const saved = Number(formData.get("saved_amount") || 0);
    const color = normalizeFundColor(formData.get("color"));
    if (!id || !name || !Number.isFinite(target) || !Number.isFinite(saved) || target < 0 || saved < 0) {
      showToast("Hãy nhập thông tin Quỹ hợp lệ.");
      return;
    }
    if (isAutomaticFundName(name)) {
      showToast("Quỹ này được tự động tính từ ngân sách.");
      return;
    }

    try {
      await apiRequest(`/api/money/funds/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: {
          name,
          target_amount: String(target),
          saved_amount: String(saved),
          color
        }
      });
      await loadMoneyFromApi();
      showToast("Đã lưu Quỹ.");
    } catch (error) {
      showToast(error.message || "Không thể lưu Quỹ.");
    }
  }

  async function deleteFund(id) {
    if (!id) {
      showToast("Quỹ chưa sẵn sàng để xóa.");
      return;
    }

    try {
      await apiRequest(`/api/money/funds/${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadMoneyFromApi();
      showToast("Đã xóa Quỹ.");
    } catch (error) {
      showToast(error.message || "Không thể xóa Quỹ.");
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
      await apiRequest("/api/friends", {
        method: "POST",
        body: { identifier }
      });
      form.reset();
      friendsSync.loaded = false;
      await loadFriendsFromApi();
      showToast("Đã gửi lời mời kết bạn.");
    } catch (error) {
      showToast(error.message || "Không thể gửi lời mời.");
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

  async function acceptFriendRequest(id) {
    if (!id) {
      showToast("Lời mời chưa sẵn sàng.");
      return;
    }

    try {
      await apiRequest(`/api/friends/requests/${encodeURIComponent(id)}/accept`, { method: "POST" });
      friendsSync.loaded = false;
      await loadFriendsFromApi();
      showToast("Đã chấp nhận lời mời.");
    } catch (error) {
      showToast(error.message || "Không thể chấp nhận lời mời.");
    }
  }

  async function deleteFriendRequest(id, isCancel) {
    if (!id) {
      showToast("Lời mời chưa sẵn sàng.");
      return;
    }

    try {
      await apiRequest(`/api/friends/requests/${encodeURIComponent(id)}`, { method: "DELETE" });
      friendsSync.loaded = false;
      await loadFriendsFromApi();
      showToast(isCancel ? "Đã hủy lời mời." : "Đã từ chối lời mời.");
    } catch (error) {
      showToast(error.message || "Không thể cập nhật lời mời.");
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
      state.money.filters = { month, type: "expense", category: "all", search: "" };
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
    link.download = `universal-app-tien-${currentDate()}.json`;
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

  validateStoredAuth();
})();
