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
};

export type Admin = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "Admin" | "SuperAdmin";
  permissions: Partial<Record<(typeof AdminPermission)[keyof typeof AdminPermission], boolean>>;
};

export type Report = {
  id: string;
  reportingUser: { id: string; firstName: string };
  reportedUser: { id: string; firstName: string };
  reason: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
};

export type ChartData = {
  date: string;
  count?: number;
  amount?: number;
};

export type DashboardStats = {
  range: 'day' | 'week' | 'month';
  users: { totalNew: number; graph: ChartData[] };
  drivers: { totalNew: number; graph: ChartData[] };
  guests: { total: number; graph: ChartData[] };
  trips: {
    published: { total: number; graph: ChartData[] };
    completed: { total: number; graph: ChartData[] };
    activeCount: number;
  };
  reports: { total: number; graph: ChartData[] };
  wallet: { totalSum: number; graph: ChartData[] };
  searches: { top: { city: string; count: number }[] };
  bookings: { total: number; graph: ChartData[] };
  activeDrivers: { total: number; graph: ChartData[] };
};

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
    }
  }
};

export type Guest = {
  guestId: string;
  lastActive: string;
};