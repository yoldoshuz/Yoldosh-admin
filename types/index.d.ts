export type CarApplication = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  licensePinfl: string;
  licenseFrontPath: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "FAILED_DIDOX";
  createdAt: string;
  updatedAt: string;
  driver: {
    // Included driver details
    id: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar?: string;
    role: string;
  };
  modelDetails: {
    // Included model details
    make: string;
    model: string;
  };
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
