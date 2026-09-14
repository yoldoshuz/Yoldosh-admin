// ============= Shared =============
export type DateRangePreset = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "custom" | "day";

export type RangeQuery = {
  range?: DateRangePreset;
  from?: string; // ISO
  to?: string; // ISO
};

export type RegistrationSourceValue = "user" | "from_bot" | "reg_bot";

// API segmentation aliases — backend renames raw enum values:
// user → self · from_bot → botImported · reg_bot → regBot
export type RegistrationSourceAlias = "self" | "botImported" | "regBot";

export type SourceSegmentation = {
  byRole: { drivers: number; passengers: number };
  bySource: Record<RegistrationSourceAlias, number>;
  byRoleAndSource: {
    drivers: Record<RegistrationSourceAlias, number>;
    passengers: Record<RegistrationSourceAlias, number>;
  };
};

export type DauMauBlock = {
  windowStart: string;
  total: number;
  byRole: { drivers: number; passengers: number };
  bySource: Record<RegistrationSourceAlias, number>;
};

export type DauMau = {
  now: string;
  dau: DauMauBlock;
  mau: DauMauBlock;
  stickiness: number; // DAU/MAU
  totals: SourceSegmentation;
};

export type GraphPoint = {
  date: string; // human label (e.g. "1 апр")
  timestamp?: string; // ISO timestamp
  value: number;
  count?: number;
  amount?: number;
};

// ============= Domain =============
export type ApplicationCar = {
  id: string;
  driver_id: string;
  techPassportFrontPath: string | null;
  techPassportBackPath: string | null;
  govNumber: string | null;
  make: string | null;
  model: string | null;
  color: string | null;
  techPassportSerial: string | null;
  issueDate: string | null;
  seats: number | null;
  status: "WAITING_FOR_DIDOX" | "PENDING" | "VERIFIED" | "REJECTED" | string;
  rejectionReason: string | null;
  // === Driver license copied onto Car (added 2026-05-12) ===
  licenseFrontPath?: string | null;
  licensePinfl?: string | null;
  typeOfLicence?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  bio: string | null;
  date_of__birthday: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  talkative: boolean | null;
  music_allowed: boolean | null;
  pets_allowed: boolean | null;
  rating: number | null;
  role: "Passenger" | "Driver" | null;
  verified: boolean | null;
  passport_verified: boolean | null;
  preferred_navigator: string | null;
  preferredLanguage: string | null;
  notificationPreferences: Record<string, boolean> | null;
  isBanned: boolean | null;
  isHavePromocode: boolean | null;
  banExpiresAt: string | null;
  banReason: string | null;
  registration_source: RegistrationSourceValue | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  cars: ApplicationCar[];
};

export type CarApplication = {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  phone: string;
  licenseFrontPath: string | null;
  licensePinfl: string | null;
  typeOfLicence: string | null;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "FAILED_DIDOX";
  createdAt: string;
  updatedAt: string;
  user?: ApplicationUser | null;
};

export type Region = {
  id: number;
  nameRu: string;
  nameUz: string;
};

export type Trip = {
  id: string;
  status: string;
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar?: string;
    rating?: number;
  };
  fromRegion?: Region;
  toRegion?: Region;
  from_address: string;
  to_address: string;
  departure_ts: string;
  seats_available: number;
  price_per_person: number;
  createdAt: string;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatar: string | null;
  role: "Passenger" | "Driver";
  isBanned: boolean;
  registration_source?: RegistrationSourceValue;
  rating?: number;
};

export type AdminPermissions = Partial<
  Record<
    | "driver_applications"
    | "reports"
    | "trips"
    | "bookings"
    | "notifications"
    | "promocodes"
    | "moderation"
    | "blogs"
    | "users",
    boolean
  >
>;

// ============= Booking =============
export type BookingStatusValue = "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED";

export type Booking = {
  id: string;
  tripId: string;
  passengerId: string;
  from_city: string;
  to_city: string;
  from_address: string;
  to_address: string;
  seatsBooked: number;
  totalPrice: string | number;
  status: BookingStatusValue;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
  passenger?: User;
  trip?: Trip & {
    driver_id?: string;
    arrival_ts?: string;
    price_per_person?: number | string;
    status?: string;
    driver?: User;
  };
};

// ============= Trip list row bookings (admin /trips and super-admin active/finished) =============
export type TripListBookingPassenger = {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatar: string | null;
  rating: number;
};

export type TripListBooking = {
  id: string;
  status: "CONFIRMED" | "PENDING";
  seatsBooked: number;
  totalPrice: number | string;
  from_city: string;
  to_city: string;
  passengerId: string;
  createdAt: string;
  passenger: TripListBookingPassenger | null;
};

// ============= Active trips — snapshot & detailed cards =============
export type ActiveTripStatus = "IN_PROGRESS" | "CREATED";

export type ActiveTripsByStatusEntry = {
  tripsCount: number;
  confirmedBookings: number;
  pendingBookings: number;
  seatsBooked: number;
  seatsAvailable: number;
  bookingsRevenue: number;
  potentialRevenue: number;
  avgPricePerPerson?: number;
};

export type ActiveTripsSnapshot = {
  counts: {
    inProgress: number;
    created: number;
    totalActive: number;
    departingToday: number;
    startedLast24h: number;
    confirmedBookings?: number;
    pendingBookings?: number;
    upcomingInWindow?: number;
    upcomingWindowHours?: number;
  };
  seats: {
    total: number;
    booked: number;
    available: number;
    fillRatePercent: number;
  };
  financials: {
    bookingsRevenue: number;
    potentialRevenue: number;
    grandTotalIfFull?: number;
    byStatus?: Record<
      ActiveTripStatus,
      { bookingsRevenue: number; potentialRevenue: number; avgPricePerPerson: number }
    >;
  };
  byStatus: Record<ActiveTripStatus, ActiveTripsByStatusEntry>;
};

export type ActiveTripBooking = {
  id: string;
  status: "CONFIRMED" | "PENDING";
  seatsBooked: number;
  totalPrice: number;
  fromCity: string;
  toCity: string;
  createdAt: string;
  passenger: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar: string | null;
    rating: number;
  } | null;
};

export type ActiveTripCard = {
  id: string;
  status: ActiveTripStatus;
  route: {
    from: { city: string; address: string; cityId: string | null };
    to: { city: string; address: string; cityId: string | null };
    distanceMeters: number | null;
    durationSeconds: number | null;
  };
  schedule: {
    departureTs: string;
    arrivalTs: string | null;
    tripStartTs: string | null;
    tripEndTs: string | null;
    createdAt: string;
    updatedAt: string;
  };
  pricing: {
    pricePerPerson: number;
    bookingsRevenue: number;
    potentialRevenue: number;
  };
  seats: {
    total: number;
    booked: number;
    available: number;
    fillRatePercent: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    list: ActiveTripBooking[];
  };
  driver: {
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar: string | null;
    rating: number;
  } | null;
  car: {
    id: string;
    make: string;
    model: string;
    color: string;
    govNumber: string;
  } | null;
  bookingType: "INSTANT" | "REQUEST";
  comment: string | null;
};

export type ActiveTripsStatsResponse = ActiveTripsSnapshot & {
  generatedAt: string;
  byDepartureCity: Array<{ from_city: string; count: number }>;
  byArrivalCity: Array<{ to_city: string; count: number }>;
  topRoutes: Array<{
    fromCity: string;
    toCity: string;
    tripsCount: number;
    seatsAvailable: number;
    seatsBooked: number;
    revenue: number;
    avgPrice: number;
  }>;
  timing: { avgTripDurationMinutes: number; avgStartDelayMinutes: number };
  trips: {
    inProgress: ActiveTripCard[];
    upcoming: ActiveTripCard[];
    listLimit: number;
  };
};

// ============= Search aggregate row =============
export type SearchRow = {
  from_city: string;
  to_city: string;
  count: number;
  unique_users: number;
  unique_guests: number;
  last_searched_at: string;
  active_trips: number;
};

export type Admin = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "Admin" | "SuperAdmin";
  permissions: AdminPermissions;
  createdAt?: string;
  updatedAt?: string;
};

export type Report = {
  id: string;
  reportingUser: { id: string; firstName: string };
  reportedUser: { id: string; firstName: string };
  reason: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
};

// ============= New Stats v2 (real/bots/guests segmentation + total/totalInRange) =============

export type UserSegment = "real" | "bots" | "guests" | "all";

export type Pair = { total: number; totalInRange: number };

export type SegmentTriplet = { real: number; bots: number; all: number };

export type CountsPair = { total: SegmentTriplet; totalInRange: SegmentTriplet };

export type SegmentBlock = {
  total: number;
  totalInRange: number;
  drivers?: Pair;
  passengers?: Pair;
};

export type OverviewSegments = {
  real: SegmentBlock;
  bots: SegmentBlock;
  guests: { total: number; totalInRange: number };
  all: SegmentBlock;
};

export type StatusPair<K extends string> = Record<K, Pair>;

export type StatsOverview = {
  range: DateRangePreset;
  from: string;
  to: string;
  users: {
    // legacy (still emitted by backend but ignored by FE)
    total?: number;
    passengers?: number;
    drivers?: number;
    verified?: number;
    banned?: number;
    newInRange?: number;
    newDriversInRange?: number;
    graph?: GraphPoint[];
    driversGraph?: GraphPoint[];
    bySource?: SourceSegmentation;
    newBySource?: SourceSegmentation;
    dauMau?: DauMau;
    // new
    counts: CountsPair;
    passengersCounts: CountsPair;
    driversCounts: CountsPair;
    flags: {
      verified: Pair;
      banned: Pair;
    };
    graphAll?: GraphPoint[];
  };
  trips: {
    total?: number;
    byStatus?: Record<string, number>;
    createdInRange?: number;
    completedInRange?: number;
    graph?: GraphPoint[];
    active?: ActiveTripsSnapshot;
    // new
    counts: Pair;
    byStatusInRange: Record<"CREATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED", number>;
    rates: {
      completionRateAllTime: number;
      completionRateInRange: number;
      cancellationRateAllTime: number;
      cancellationRateInRange: number;
    };
  };
  bookings: {
    total?: number;
    byStatus?: Record<string, number>;
    graph?: GraphPoint[];
    // new
    counts: Pair;
    byStatusInRange: Record<"CONFIRMED" | "PENDING" | "CANCELLED", number>;
    rates: {
      confirmationRateAllTime: number;
      confirmationRateInRange: number;
      cancellationRateAllTime: number;
      cancellationRateInRange: number;
    };
  };
  reports: {
    total?: number;
    newInRange?: number;
    byStatus?: Record<string, number>;
    graph?: GraphPoint[];
    // new
    counts: Pair;
    byStatusInRange: Record<"PENDING" | "RESOLVED" | "REJECTED", number>;
  };
  wallet: {
    totalBalance?: number;
    topUpsInRange?: number;
    graph?: GraphPoint[];
    // new
    balance: { total: number };
    topUps: Pair;
    payments: Pair;
    refunds: Pair;
  };
  applications: {
    pending?: number;
    verified?: number;
    pendingCounts: Pair;
    verifiedCounts: Pair;
  };
  admins: { admins: number; superAdmins: number };
  guests: {
    uniqueInRange?: number;
    counts: Pair;
  };
  segments: OverviewSegments;
  activeTrips?: ActiveTripsSnapshot;
};

// ============= Stats — users (v2) =============
export type StatsUsers = {
  range: DateRangePreset;
  from: string;
  to: string;
  // legacy passthrough
  total?: number;
  totalInRange?: number;
  passengerInRange?: number;
  driversInRange?: number;
  distribution?: any;
  segmentation?: any;
  registrations?: {
    graph?: GraphPoint[];
    graphAll?: GraphPoint[];
    byHourOfDay?: any[];
  };
  top?: any;
  dauMau?: DauMau;
  // new
  counts: CountsPair;
  driversCounts: CountsPair;
  passengersCounts: CountsPair;
  guestsCounts: Pair;
  flags: {
    verified?: number;
    passportVerified?: number;
    banned?: number;
    walletBlocked?: number;
    withPromocode?: number;
    verifiedCounts: Pair;
    passportVerifiedCounts: Pair;
    bannedCounts: Pair;
    walletBlockedCounts: Pair;
    withPromocodeCounts: Pair;
  };
  segments: OverviewSegments;
};

// ============= Stats — trips (v2) =============
export type StatsTrips = {
  // legacy passthrough used by current pages
  byStatus?: any[];
  byBookingType?: any[];
  timeSeries?: { created?: GraphPoint[]; completed?: GraphPoint[]; canceled?: GraphPoint[] };
  averages?: any;
  top?: any;
  active?: ActiveTripsSnapshot;
  // new
  counts: Pair;
  byStatusTotals: Record<"CREATED" | "IN_PROGRESS" | "COMPLETED" | "CANCELED", Pair>;
  rates: {
    completionRateAllTime: number;
    completionRateInRange: number;
    cancellationRateAllTime: number;
    cancellationRateInRange: number;
  };
};

// ============= Stats — bookings (v2) =============
export type StatsBookings = {
  total?: number;
  byStatus?: any[];
  timeSeries?: { created?: GraphPoint[]; confirmed?: GraphPoint[]; cancelled?: GraphPoint[] };
  financials?: {
    revenueInRange?: number;
    revenueAllTime?: number;
    avgBookingPrice?: number;
    avgSeatsBooked?: number;
  };
  top?: any;
  segmentation?: {
    bySource?: Record<RegistrationSourceAlias, number>;
    bySourceInRange?: Record<RegistrationSourceAlias, number>;
    bySourceAllTime?: Record<RegistrationSourceAlias, number>;
  };
  // new
  counts: Pair;
  byStatusTotals: Record<"CONFIRMED" | "PENDING" | "CANCELLED" | "REJECTED" | "FAILED", Pair>;
  rates: {
    confirmationRateAllTime: number;
    confirmationRateInRange: number;
    cancellationRateAllTime: number;
    cancellationRateInRange: number;
    rejectionRateAllTime: number;
    rejectionRateInRange: number;
  };
};

// ============= Stats — reports (v2) =============
export type StatsReports = {
  byStatus?: any[];
  timeSeries?: { created?: GraphPoint[]; resolved?: GraphPoint[] };
  performance?: { avgResolutionMinutes?: number; avgResolutionMinutesInRange?: number };
  topReasons?: any[];
  topReportedUsers?: any[];
  counts: Pair;
  byStatusTotals: Record<"PENDING" | "RESOLVED" | "REJECTED", Pair>;
  rates: {
    resolutionRateAllTime: number;
    resolutionRateInRange: number;
    rejectionRateAllTime: number;
    rejectionRateInRange: number;
  };
};

// ============= Stats — wallet (v2) =============
export type StatsWallet = {
  balance: { total: number; distribution?: any[] };
  transactions?: {
    byType?: any[];
    byStatus?: any[];
    sumByCompletedType?: any[];
    byTypeAllTime?: any[];
    byStatusAllTime?: any[];
    sumByCompletedTypeAllTime?: any[];
  };
  topUps: {
    graph?: GraphPoint[];
    counts: Pair;
    sums: Pair;
    average: Pair;
  };
  payments: { counts: Pair; sums: Pair };
  refunds: { sums: Pair };
  commission: { sums: Pair };
  withdrawals: { sums: Pair };
  blocked?: { walletBlockedUsers?: number };
  top?: any;
  financials?: { revenueInRange?: number; revenueAllTime?: number };
};

// ============= Stats — searches (v2) =============
export type SearchesSegment = { searches: number; uniqueActors: number };
export type StatsSearches = {
  counts: {
    totalSearches?: number;
    uniqueUsers?: number;
    uniqueGuests?: number;
    total: number;
    totalInRange: number;
    uniqueUsersTotal: number;
    uniqueUsersTotalInRange: number;
    uniqueGuestsTotal: number;
    uniqueGuestsTotalInRange: number;
  };
  segmentation: {
    inRange: {
      real: SearchesSegment;
      bots: SearchesSegment;
      guests: SearchesSegment;
      unknown: SearchesSegment;
      all: SearchesSegment;
    };
    allTime: {
      real: SearchesSegment;
      bots: SearchesSegment;
      guests: SearchesSegment;
      unknown: SearchesSegment;
      all: SearchesSegment;
    };
  };
  top?: any;
  unmatched?: { routes?: any[] };
};

// ============= DAU / MAU (v2) =============
export type DauMauSegmentRow = {
  dau: { count: number; drivers?: number; passengers?: number };
  mau: { count: number; drivers?: number; passengers?: number };
  stickiness: number;
};
export type DauMauV2 = {
  now: string;
  // legacy fields
  dau?: DauMauBlock;
  mau?: DauMauBlock;
  stickiness?: number;
  totals?: SourceSegmentation;
  // new
  windows: { dauStart: string; mauStart: string };
  bySegment: {
    real: DauMauSegmentRow;
    bots: DauMauSegmentRow;
    all: DauMauSegmentRow;
    guests: DauMauSegmentRow;
  };
  totalsBySegment: {
    real: { all: number; drivers: number; passengers: number };
    bots: { all: number; drivers: number; passengers: number };
    all: { all: number; drivers: number; passengers: number };
  };
};

// ============= Engagement (v2 — real-users-only) =============
export type FunnelCohort = {
  signups: number;
  withSearch: number;
  withBooking: number;
  withConfirmedBooking: number;
  withCompletedTrip: number;
  conversion: {
    signupToSearch: number;
    signupToBooking: number;
    signupToConfirmed: number;
    signupToCompletedTrip: number;
    searchToBooking: number;
    bookingToConfirmed: number;
  };
};

export type EngagementStats = {
  range: DateRangePreset;
  from: string;
  to: string;
  scope: "real-users-only";
  signups: Pair;
  funnel: { cohort: FunnelCohort; allTime: FunnelCohort };
  activity: {
    avgSearchesPerUser: Pair;
    avgBookingsPerPassenger: Pair;
    avgTripsPerDriver: Pair;
  };
  drivers: {
    totalReal: number;
    withAnyTrip: number;
    with10PlusTrips: number;
    activeLast30Days: number;
    zeroTripRate: number;
    activationRate: number;
  };
  repeatPassengers: {
    with2PlusConfirmed: number;
    with5PlusConfirmed: number;
  };
  conversion: {
    searchToBookingRateInRange: number;
    bookingToConfirmedRateInRange: number;
    bookingToCompletedTripRateInRange: number;
    raw: {
      searchesInRange: number;
      bookingsInRange: number;
      confirmedBookingsInRange: number;
      completedTripsInRange: number;
    };
  };
  timing: {
    daysFromSignupToFirstBooking: { avg: number | null; median: number | null };
    daysFromSignupToFirstTrip: { avg: number | null; median: number | null };
  };
};

// ============= Admin logs =============
export type AdminLogCategory =
  | "SESSION"
  | "USERS"
  | "TRIPS"
  | "REPORTS"
  | "APPLICATIONS"
  | "ADMINS"
  | "NOTIFICATIONS"
  | "MODERATION"
  | "BLOG"
  | "PROMOCODES"
  | "OTHER";

export type AdminLogEntityType =
  | "USER"
  | "TRIP"
  | "BOOKING"
  | "REPORT"
  | "DRIVER_APPLICATION"
  | "ADMIN"
  | "BLOG"
  | "NOTIFICATION"
  | "RESTRICTED_WORD"
  | "PROMOCODE";

export type EntitySnapshot = {
  label?: string;
  subLabel?: string;
  meta?: Record<string, any>;
};

export type AdminLog = {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  category: AdminLogCategory;
  details: string | null;
  timestamp: string;
  relatedEntityId: string | null;
  relatedEntityType: AdminLogEntityType | null;
  entitySnapshot: EntitySnapshot | null;
  metadata: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  isReverted?: boolean;
};

// ============= Admin profile-by-id =============
export type AdminSession = {
  sessionId: string;
  loginAt: string;
  logoutAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  durationMinutes: number | null;
};

export type AdminProfileById = {
  admin: Admin;
  stats: {
    total: number;
    byCategory: { category: AdminLogCategory; count: number }[];
    byAction: { action: string; count: number }[];
    firstActionAt: string | null;
    lastActionAt: string | null;
  };
  sessions: {
    tracked: AdminSession[];
    legacyLogins: { id: string; timestamp: string; ipAddress?: string; userAgent?: string }[];
    legacyLogouts: { id: string; timestamp: string; ipAddress?: string; userAgent?: string }[];
  };
  recentActions: AdminLog[];
};

// ============= Wallet / Misc =============
export type Transaction = {
  id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  wallet?: {
    user?: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
    };
  };
};

export type Guest = {
  guestId: string;
  lastActive: string;
};

// Legacy alias kept for backward compatibility (existing pages still import this)
export type DashboardStats = {
  range: "day" | "week" | "month";
  users: { totalNew: number; graph: GraphPoint[] };
  drivers: { totalNew: number; graph: GraphPoint[] };
  guests: { total: number; graph: GraphPoint[] };
  trips: {
    published: { total: number; graph: GraphPoint[] };
    completed: { total: number; graph: GraphPoint[] };
    activeCount: number;
  };
  reports: { total: number; graph: GraphPoint[] };
  wallet: { totalSum: number; graph: GraphPoint[] };
  searches: { top: { city: string; count: number }[] };
  bookings: { total: number; graph: GraphPoint[] };
  activeDrivers: { total: number; graph: GraphPoint[] };
};

export type ChartData = GraphPoint;

// ============================================================
// Product Analytics (Yoldosh Analytics)
// Base: {api}/admin/analytics/*  — см. док «Yoldosh Analytics».
// Все ответы приходят в стандартной обёртке apiResponse.success:
//   { success, message, data, meta }
// `meta` обязателен для UI: подпись «Обновлено в 14:32» и пометка
// неполного сегодняшнего дня.
//
// ВАЖНО про необязательные поля. Витрины наполняются постепенно, и
// на практике бэк отдаёт частичные объекты: проценты, массивы и
// вложенные блоки приходят не всегда. Поэтому здесь обязательны
// только идентификаторы, а всё остальное помечено `?` — чтобы
// компилятор заставлял писать безопасный рендер, а не падать в
// проде на `undefined.toFixed()`.
// ============================================================

export type AnalyticsMeta = {
  from?: string;
  to?: string;
  /** ISO-время последнего пересчёта витрины (раз в ~15 минут). */
  calculated_at?: string;
  /** true — в диапазон входит сегодняшний (незавершённый) день. */
  partial_today?: boolean;
  timezone?: string;
};

/** Унифицированный результат аналитического запроса: данные + meta. */
export type AnalyticsResult<T> = {
  data: T;
  meta: AnalyticsMeta;
};

export type AnalyticsPlatform = "android" | "ios";
export type AnalyticsRole = "passenger" | "driver";
export type AnalyticsGranularity = "day" | "hour";

/** Общие query-параметры, поддерживаются везде, где не указано иное. */
export type AnalyticsQuery = {
  /** YYYY-MM-DD, включительно. Максимум 90 дней на запрос. */
  from: string;
  /** YYYY-MM-DD, включительно. */
  to: string;
  platform?: AnalyticsPlatform;
  app_version?: string;
  role?: AnalyticsRole;
  /** `hour` допустим только для диапазона ≤ 3 дней. */
  granularity?: AnalyticsGranularity;
};

// ===== 2.1 Обзор =====
export type AnalyticsOverviewPoint = {
  day?: string;
  dau?: number;
  new_users?: number;
  sessions?: number;
};

export type AnalyticsTopScreen = {
  screen?: string;
  views?: number;
  avg_sec?: number;
};

export type AnalyticsOverview = {
  dau?: number;
  wau?: number;
  mau?: number;
  new_users?: number;
  sessions?: number;
  avg_session_sec?: number;
  events_total?: number;
  series?: AnalyticsOverviewPoint[];
  by_platform?: Record<string, number>;
  top_screens?: AnalyticsTopScreen[];
};

// ===== 2.2 События =====
export type AnalyticsEventRow = {
  name: string;
  cnt?: number;
  users?: number;
  sessions?: number;
  /** Динамика к предыдущему периоду такой же длины, в процентах. */
  delta_pct?: number | null;
};

export type AnalyticsEventsResponse = {
  items?: AnalyticsEventRow[];
  total?: number;
};

export type AnalyticsEventPoint = {
  t?: string;
  cnt?: number;
  users?: number;
};

export type AnalyticsEventTimeseries = {
  points?: AnalyticsEventPoint[];
};

// ===== 2.3 Воронки =====
export type AnalyticsFunnelCode =
  "search_to_booking" | "signup" | "trip_create" | "parcel" | "topup" | "chat_to_booking";

export type AnalyticsFunnelStep = {
  step?: number;
  name: string;
  users?: number;
  /** Конверсия от предыдущего шага, %. */
  conv_from_prev?: number;
  /** Конверсия от первого шага, %. */
  conv_from_start?: number;
  /** Вспомогательное: в скольких сессиях встречался шаг (без учёта порядка). */
  sessions?: number;
};

export type AnalyticsFunnel = {
  funnel?: AnalyticsFunnelCode | string;
  steps?: AnalyticsFunnelStep[];
  /** Окно между соседними шагами, минуты. */
  window_minutes?: number;
};

// ===== 2.4 Источники регистраций =====
export type AnalyticsSignupSource = {
  entry_point: string;
  signups?: number;
  share_pct?: number;
  /** Доля увидевших стену авторизации в этой точке и всё-таки зарегавшихся. */
  conv_from_wall_pct?: number;
};

export type AnalyticsSignupSources = {
  items?: AnalyticsSignupSource[];
  total_signups?: number;
};

// ===== 2.4.1 Нижнее меню (таб-бар) =====
export type AnalyticsNavTab = {
  tab: string;
  taps?: number;
  users?: number;
  guest_taps?: number;
  blocked_by_auth?: number;
  signups?: number;
  block_rate_pct?: number;
  signup_conv_pct?: number;
  share_of_signups_pct?: number;
};

export type AnalyticsNav = {
  items?: AnalyticsNavTab[];
  total_signups?: number;
};

// ===== 2.4.2 Ввод «откуда / куда» =====
export type AnalyticsSearchInputMethod = "typed" | "suggest" | "recent" | "map" | "swap";

export type AnalyticsSearchInput = {
  field: string;
  method: string;
  cnt?: number;
  users?: number;
  avg_time_ms?: number;
  searches?: number;
  zero_results?: number;
  share_in_field_pct?: number;
};

export type AnalyticsSearchQuery = {
  field: string;
  query: string;
  cnt?: number;
  users?: number;
  matched?: number;
  unmatched?: number;
  unmatched_pct?: number;
};

// ===== 2.5 Формы =====
export type AnalyticsFormListItem = {
  form: string;
  started?: number;
  submitted?: number;
  completion_pct?: number;
  avg_time_sec?: number;
};

export type AnalyticsFormField = {
  field: string;
  index?: number;
  focused?: number;
  filled?: number;
  abandoned_here?: number;
  avg_fill_ms?: number;
  errors?: number;
};

export type AnalyticsFormDropOff = {
  field: string;
  users?: number;
  share_pct?: number;
};

export type AnalyticsFormDetails = {
  form?: string;
  started?: number;
  submitted?: number;
  completion_pct?: number;
  avg_time_sec?: number;
  fields?: AnalyticsFormField[];
  drop_off_top?: AnalyticsFormDropOff[];
};

// ===== 2.6 Поиск =====
export type AnalyticsSearchDemandRow = {
  from_city?: string;
  to_city?: string;
  searches?: number;
  users?: number;
  zero_results?: number;
  bookings?: number;
  conv_pct?: number;
};

export type AnalyticsSearchFilterRow = {
  filter: string;
  value?: string | null;
  uses?: number;
  users?: number;
  share_pct?: number;
};

// ===== 2.7 Трипы =====
export type AnalyticsTripStats = {
  trip_id?: string;
  card_impressions?: number;
  card_taps?: number;
  detail_views?: number;
  unique_viewers?: number;
  chats_started?: number;
  booking_starts?: number;
  bookings?: number;
  ctr_pct?: number;
  view_to_book_pct?: number;
};

export type AnalyticsTopTripMetric = "views" | "bookings" | "ctr";

export type AnalyticsTopTrip = AnalyticsTripStats & {
  from_city?: string | null;
  to_city?: string | null;
  departure_ts?: string | null;
  driver_name?: string | null;
};

// ===== 2.8 Чаты =====
export type AnalyticsChatsStats = {
  chats_created?: number;
  chat_opens?: number;
  unique_users?: number;
  messages_sent?: number;
  avg_messages_per_chat?: number;
  first_response_median_sec?: number;
  chat_to_booking_pct?: number;
  by_source?: Record<string, number>;
};

// ===== 2.9 Таймлайн пользователя =====
export type AnalyticsTimelineEvent = {
  ts?: string;
  name?: string;
  screen?: string | null;
  entity_id?: string | null;
  props?: Record<string, any> | null;
};

export type AnalyticsTimelineSession = {
  session_id?: string;
  started_at?: string;
  duration_sec?: number;
  platform?: string | null;
  app_version?: string | null;
  events?: AnalyticsTimelineEvent[];
};

export type AnalyticsTimeline = {
  sessions?: AnalyticsTimelineSession[];
  next_cursor?: string | null;
};

// ===== 2.10 Ретеншн и когорты =====
export type AnalyticsRetentionRow = {
  cohort?: string;
  size?: number;
  /** retention[0] всегда 100; длина = depth + 1. */
  retention?: number[];
};

// ===== 2.11 Ошибки клиента =====
export type AnalyticsErrorRow = {
  endpoint?: string;
  status?: number;
  error_code?: string | null;
  cnt?: number;
  users?: number;
  app_version?: string | null;
};

// ===== 2.12 Экспорт =====
export type AnalyticsExportReport = "events" | "funnel" | "forms" | "search";

// ===== 2.13 Управление трекингом =====
export type AnalyticsConfig = {
  enabled?: boolean;
  batch_size?: number;
  flush_interval_sec?: number;
  max_queue_days?: number;
  /** Доля отправляемых событий: 0..1, либо мапа «событие → доля». */
  sampling?: number | Record<string, number>;
  disabled_events?: string[];
  version?: number;
};

export type AnalyticsConfigPatch = Partial<Omit<AnalyticsConfig, "version">>;

export type AnalyticsRegistryEvent = {
  name: string;
  description?: string | null;
  props?: string[];
};

export type AnalyticsRegistry = {
  events?: AnalyticsRegistryEvent[];
  funnels?: { code: string; steps?: string[]; window_minutes?: number }[];
  forms?: { form: string; fields?: string[] }[];
};

export type AnalyticsUnknownEvent = {
  name: string;
  cnt?: number;
  first_seen?: string | null;
  last_seen?: string | null;
  app_version?: string | null;
};
