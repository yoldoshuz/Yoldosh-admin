import { z } from "zod";

// Admin Login Schema
export const loginSchema = z.object({
  email: z
    .email("Введите правильную почту")
    .refine((email) => email.endsWith("@yoldosh.uz"), "Разрешены только корпоративные почты (@yoldosh.uz)"),
  password: z.string().min(1, "Пароль необходим").min(6, "Пароль должен быть хотя бы из 6 символов"),
});

// Application Status Update Schema
export const updateApplicationStatusSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  status: z.enum(["VERIFIED", "REJECTED"], "Status is required"),
});

// Report Status Update Schema
export const updateReportStatusSchema = z.object({
  reportId: z.string().min(1, "Report ID is required"),
  status: z.enum(["RESOLVED", "REJECTED"], "Status is required"),
});

// Ban User Schema
export const banUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  reason: z
    .string()
    .min(10, "Причина бана должна быть не менее 10 символов")
    .max(500, "Причина бана не должна превышать 500 символов"),
  durationInDays: z.number().int().positive("Срок должен быть положительным числом").optional().nullable(),
});

// Global Notification Schema
export const globalNotificationSchema = z.object({
  title: z.string().min(1, "Заголовок обязателен"),
  content: z.string().min(1, "Содержание обязательно"),
  type: z.enum(["general", "trips", "promotionAndDiscounts", "newsAndAgreement", "messages"]),
  targetAudience: z.enum(["ALL", "DRIVERS", "PASSENGERS"]),
});
// Car Model Schema
export const carModelSchema = z.object({
  make: z.string().min(1, "Производитель обязателен").max(50),
  model: z.string().min(1, "Модель обязательна").max(50),
  seats_std: z.number().min(1, "Минимум 1 место").max(20, "Максимум 20 мест"),
});

// Trip Edit Schema
export enum BookingType {
  instant = "INSTANT",
  request = "REQUEST",
}

export enum GarageStatus {
  Empty = "EMPTY",
  HalfEmpty = "HALF_EMPTY",
  Full = "FULL",
}

export const editTripSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),

  // === GEO ===
  from_latitude: z.coerce.number().optional(),
  from_longitude: z.coerce.number().optional(),
  to_latitude: z.coerce.number().optional(),
  to_longitude: z.coerce.number().optional(),

  // === ROUTE META ===
  distance: z.coerce.number().positive().optional(),
  duration: z.coerce.number().positive().optional(),

  // === CORE ===
  booking_type: z.nativeEnum(BookingType).optional(),
  departure_ts: z.string().optional(), // datetime-local
  seats_available: z.coerce.number().int().min(1).optional(),
  price_per_person: z.coerce.number().positive().optional(),

  // === FEATURES ===
  max_two_back: z.boolean().optional(),
  conditioner: z.boolean().optional(),
  smoking_allowed: z.boolean().optional(),
  door_pickup: z.boolean().optional(),
  food_stop: z.boolean().optional(),

  garage: z.nativeEnum(GarageStatus).optional(),

  // === OTHER ===
  comment: z.string().max(500).optional().nullable(),

  // Добавляем то, чего не хватало:
  from_address: z.string().optional(), // если хочешь позволить вручную
  to_address: z.string().optional(),
  from_city: z.string().optional(),
  to_city: z.string().optional(),
});

// Super Admin Create Admin Schema
export const createAdminSchema = z.object({
  email: z
    .email("Please enter a valid email")
    .refine((email) => email.endsWith("@yoldosh.uz"), "Only corporate emails are allowed (@yoldosh.uz)"),
  firstName: z.string().min(1, "First name is required").max(50, "First name must not exceed 50 characters"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must not exceed 50 characters"),
});

// Promocode Schemas
export const personalPromoCodeSchema = z.object({
  userId: z.string(),
  discountPercentage: z.number().min(1, "Скидка должна быть не менее 1%").max(100, "Скидка не может превышать 100%"),
  expiresAt: z.date().optional(),
});

export const globalPromoCodeSchema = z.object({
  discountPercentage: z.number().min(1, "Скидка должна быть не менее 1%").max(100, "Скидка не может превышать 100%"),
  useAmount: z.number().min(1, "Количество использований должно быть не менее 1"),
  expiresAt: z.date().optional(),
});

// Schema for the rejection reason form
export const rejectionSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters.").max(500, "Reason too long."),
});

// Schema for adding restricted words
export const wordSchema = z.object({ word: z.string().min(2, "Слово должно содержать минимум 2 символа.") });

const langObject = (required = false) =>
  z.object({
    ru: required ? z.string().trim().min(3, "Минимум 3 символа") : z.string().trim(),
    uz: z.string().trim(),
    en: z.string().trim(),
  });

export const blogSchema = z.object({
  title: langObject(true),
  subtitle: langObject(false),
  content: z.object({
    ru: z.string().trim().min(10, "Контент слишком короткий"),
    uz: z.string().trim(),
    en: z.string().trim(),
  }),
  coverImage: z.string().trim(),
  isPublished: z.boolean(),
  seoTitle: langObject(false),
  seoDescription: langObject(false),
});

export type BlogFormValues = z.infer<typeof blogSchema>;
