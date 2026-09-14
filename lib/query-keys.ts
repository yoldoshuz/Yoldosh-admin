export const queryKeys = {
  admin: {
    all: ["admin"] as const,
    profile: () => [...queryKeys.admin.all, "profile"] as const,

    // === Stats ===
    stats: (range: any = {}) => [...queryKeys.admin.all, "stats", "overview", range] as const,
    statsUsers: (range: any = {}) => [...queryKeys.admin.all, "stats", "users", range] as const,
    statsTrips: (range: any = {}) => [...queryKeys.admin.all, "stats", "trips", range] as const,
    statsWallet: (range: any = {}) => [...queryKeys.admin.all, "stats", "wallet", range] as const,
    statsActiveTrips: (range: any = {}) => [...queryKeys.admin.all, "stats", "active-trips", range] as const,
    statsReports: (range: any = {}) => [...queryKeys.admin.all, "stats", "reports", range] as const,
    statsAdmins: (range: any = {}) => [...queryKeys.admin.all, "stats", "admins", range] as const,
    statsBookings: (range: any = {}) => [...queryKeys.admin.all, "stats", "bookings", range] as const,
    statsSearches: (range: any = {}) => [...queryKeys.admin.all, "stats", "searches", range] as const,
    statsDauMau: () => [...queryKeys.admin.all, "stats", "dau-mau"] as const,
    statsEngagement: (range: any = {}) => [...queryKeys.admin.all, "stats", "engagement", range] as const,

    // === Lists ===
    carApplications: (filters: any = {}) => [...queryKeys.admin.all, "car-applications", filters] as const,
    reports: (filters: any = {}) => [...queryKeys.admin.all, "reports", filters] as const,
    trips: (filters: any = {}) => [...queryKeys.admin.all, "trips", filters] as const,
    tripDetails: (tripId: string) => [...queryKeys.admin.all, "trips", tripId] as const,
    bookings: (filters: any = {}) => [...queryKeys.admin.all, "bookings", filters] as const,
    bookingDetails: (bookingId: string) => [...queryKeys.admin.all, "bookings", bookingId] as const,
    notifications: (filters: any = {}) => [...queryKeys.admin.all, "notifications", filters] as const,
    carModels: (filters: any = {}) => [...queryKeys.admin.all, "car-models", filters] as const,
    restrictedWords: (filters: any = {}) => [...queryKeys.admin.all, "restricted-words", filters] as const,
    users: (filters: any = {}) => [...queryKeys.admin.all, "users", filters] as const,
    bannedUsers: (filters: any = {}) => [...queryKeys.admin.all, "users", "banned", filters] as const,
    userDetails: (userId: string) => [...queryKeys.admin.all, "users", userId] as const,
    searchUsers: (query: string) => [...queryKeys.admin.all, "users", "search", query] as const,
    promoCodes: (type: string) => [...queryKeys.admin.all, "promo-codes", type] as const,
  },
  // ============================================================
  // Product analytics (Yoldosh Analytics) — {api}/admin/analytics/*
  // Все ключи включают фильтры (from/to/platform/app_version/role),
  // потому что каждый набор фильтров — отдельная витрина.
  // ============================================================
  analytics: {
    all: ["analytics"] as const,
    overview: (q: any = {}) => [...queryKeys.analytics.all, "overview", q] as const,
    events: (q: any = {}) => [...queryKeys.analytics.all, "events", q] as const,
    eventSeries: (name: string, q: any = {}) => [...queryKeys.analytics.all, "events", "series", name, q] as const,
    funnel: (funnel: string, q: any = {}) => [...queryKeys.analytics.all, "funnel", funnel, q] as const,
    signupSources: (q: any = {}) => [...queryKeys.analytics.all, "signup-sources", q] as const,
    nav: (q: any = {}) => [...queryKeys.analytics.all, "nav", q] as const,
    searchInputs: (q: any = {}) => [...queryKeys.analytics.all, "search", "inputs", q] as const,
    searchQueries: (q: any = {}) => [...queryKeys.analytics.all, "search", "queries", q] as const,
    searchDemand: (q: any = {}) => [...queryKeys.analytics.all, "search", "demand", q] as const,
    searchFilters: (q: any = {}) => [...queryKeys.analytics.all, "search", "filters", q] as const,
    forms: (q: any = {}) => [...queryKeys.analytics.all, "forms", q] as const,
    formDetails: (form: string, q: any = {}) => [...queryKeys.analytics.all, "forms", form, q] as const,
    tripStats: (tripId: string) => [...queryKeys.analytics.all, "trips", tripId] as const,
    topTrips: (q: any = {}) => [...queryKeys.analytics.all, "trips", "top", q] as const,
    chats: (q: any = {}) => [...queryKeys.analytics.all, "chats", q] as const,
    userTimeline: (userId: string, q: any = {}) => [...queryKeys.analytics.all, "timeline", userId, q] as const,
    retention: (q: any = {}) => [...queryKeys.analytics.all, "retention", q] as const,
    errors: (q: any = {}) => [...queryKeys.analytics.all, "errors", q] as const,
    config: () => [...queryKeys.analytics.all, "config"] as const,
    registry: () => [...queryKeys.analytics.all, "registry"] as const,
    unknownEvents: () => [...queryKeys.analytics.all, "registry", "unknown"] as const,
  },
  superAdmin: {
    all: ["super-admin"] as const,
    profile: () => [...queryKeys.superAdmin.all, "profile"] as const,
    admins: (filters: any = {}) => [...queryKeys.superAdmin.all, "admins", filters] as const,
    adminProfile: (id: string, filters: any = {}) =>
      [...queryKeys.superAdmin.all, "admin-profile", id, filters] as const,
    stats: () => [...queryKeys.superAdmin.all, "stats"] as const,
    logs: (adminId: string, filters: any = {}) =>
      [...queryKeys.superAdmin.all, "admin-logs", adminId, filters] as const,
    globalLogs: (filters: any = {}) => [...queryKeys.superAdmin.all, "global-logs", filters] as const,

    // === Mirror admin lists ===
    bookings: (filters: any = {}) => [...queryKeys.superAdmin.all, "bookings", filters] as const,
    bookingDetails: (bookingId: string) => [...queryKeys.superAdmin.all, "bookings", bookingId] as const,
    searches: (filters: any = {}) => [...queryKeys.superAdmin.all, "searches", filters] as const,
  },
} as const;
