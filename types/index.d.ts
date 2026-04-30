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
export type CarApplication = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  phone: string;
  licenseFrontPath: string;
  licensePinfl: string;
  typeOfLicence: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
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
