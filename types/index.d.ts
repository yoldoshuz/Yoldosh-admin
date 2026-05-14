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

// ============= New Stats Overview =============
export type StatsOverview = {
  range: DateRangePreset;
  from: string;
  to: string;
  users: {
    total: number;
    passengers: number;
    drivers: number;
    verified: number;
    banned: number;
    newInRange: number;
    newDriversInRange: number;
    graph: GraphPoint[];
    driversGraph: GraphPoint[];
    bySource?: SourceSegmentation;
    newBySource?: SourceSegmentation;
    dauMau?: DauMau;
  };
  trips: {
    total: number;
    byStatus: Record<string, number>;
    createdInRange: number;
    completedInRange: number;
    graph: GraphPoint[];
  };
  bookings: {
    total: number;
    byStatus: Record<string, number>;
    graph: GraphPoint[];
  };
  reports: {
    total: number;
    byStatus: Record<string, number>;
    graph: GraphPoint[];
  };
  wallet: {
    totalBalance: number;
    topUpsInRange: number;
    graph: GraphPoint[];
  };
  applications: { pending: number; verified: number };
  admins: { admins: number; superAdmins: number };
  guests: { uniqueInRange: number };
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
