import { z } from "zod";
import {
  UserRole,
  HouseStatus,
  PaymentMode,
  ExpenseStatus,
  SettlementStatus,
  SponsorPackage,
} from "./constants";

export const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const registerUserSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional().nullable(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(Object.values(UserRole) as [string, ...string[]]).default(UserRole.COLLECTOR),
  assignedAreas: z.array(z.string()).optional().default([]),
});

export const updateUserSchema = registerUserSchema.partial().extend({
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
  assignedAreas: z.array(z.string()).optional(),
});

export const areaSchema = z.object({
  name: z.string().min(1, "Area name required"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

const houseStatusEnum = z.enum(Object.values(HouseStatus) as [string, ...string[]]);
const paymentModeEnum = z.enum(Object.values(PaymentMode) as [string, ...string[]]);

export const houseSchema = z.object({
  houseId: z.string().min(1, "House ID required"),
  ownerName: z.string().min(1, "Owner name required"),
  phone: z.string().optional().nullable(),
  address: z.string().min(1, "Address required"),
  area: z.string().min(1, "Area required"),
  street: z.string().optional().nullable(),
  houseNumber: z.string().optional().nullable(),
  previousYearDonation: z.number().min(0).optional().default(0),
  currentYearDonation: z.number().min(0).optional().default(0),
  status: houseStatusEnum.optional().default(HouseStatus.NOT_VISITED),
  assignedCollector: z.string().nullable().optional(),
  notes: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const houseUpdateSchema = houseSchema.partial();

export const shopSchema = z.object({
  shopId: z.string().min(1, "Shop ID required"),
  shopName: z.string().min(1, "Shop name required"),
  ownerName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().min(1, "Address required"),
  area: z.string().min(1, "Area required"),
  street: z.string().optional().nullable(),
  previousDonation: z.number().min(0).optional().default(0),
  currentDonation: z.number().min(0).optional().default(0),
  status: houseStatusEnum.optional().default(HouseStatus.NOT_VISITED),
  assignedCollector: z.string().nullable().optional(),
  notes: z.string().optional().nullable(),
});

export const shopUpdateSchema = shopSchema.partial();

export const assignCollectorSchema = z.object({
  collectorId: z.string().nullable(),
});

export const statusChangeSchema = z.object({
  status: houseStatusEnum,
});

export const donationSchema = z.object({
  donorType: z.enum(["HOUSE", "SHOP", "INDIVIDUAL"]).default("INDIVIDUAL"),
  houseId: z.string().optional().nullable(),
  shopId: z.string().optional().nullable(),
  donorName: z.string().min(1, "Donor name required"),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  houseShop: z.string().optional().nullable(),
  amount: z.number().min(1, "Amount must be greater than 0"),
  paymentMode: paymentModeEnum,
  transactionId: z.string().optional().nullable(),
  upiRef: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  idempotencyKey: z.string().optional().nullable(),
  collectedAt: z.string().optional().nullable(),
});

export const payDonationSchema = z.object({
  paymentMode: z.enum([PaymentMode.CASH, PaymentMode.UPI]),
});

export const expenseSchema = z.object({
  category: z.string().min(1, "Category required"),
  description: z.string().min(1, "Description required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
  date: z.string().optional().nullable(),
  paymentMode: paymentModeEnum.optional().default(PaymentMode.CASH),
  advance: z.number().min(0).optional().default(0),
  vendor: z.string().optional().nullable(),
  billNumber: z.string().optional().nullable(),
  billAttachment: z.string().optional().nullable(),
});

export const expenseStatusSchema = z.object({
  status: z.enum([ExpenseStatus.APPROVED, ExpenseStatus.REJECTED]),
  note: z.string().optional().nullable(),
});

export const settlementSchema = z.object({
  date: z.string().optional().nullable(),
  morningCash: z.number().min(0).default(0),
  items: z
    .array(
      z.object({
        label: z.string().min(1),
        amount: z.number().min(0),
      })
    )
    .default([]),
  expectedCash: z.number().min(0),
  submittedCash: z.number().min(0),
  difference: z.number().default(0),
});

export const settlementReviewSchema = z.object({
  status: z.enum([SettlementStatus.VERIFIED, SettlementStatus.REJECTED]),
  note: z.string().optional().nullable(),
});

export const eventSchema = z.object({
  name: z.string().min(1, "Event name required"),
  date: z.string().min(1, "Date required"),
  startTime: z.string().min(1, "Start time required"),
  endTime: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const announcementSchema = z.object({
  title: z.string().min(1, "Title required"),
  message: z.string().min(1, "Message required"),
  isActive: z.boolean().optional().default(true),
});

export const volunteerSchema = z.object({
  name: z.string().min(1, "Name required"),
  phone: z.string().min(1, "Phone required"),
  role: z.string().min(1, "Role required"),
  area: z.string().optional().nullable(),
  availability: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

export const sponsorSchema = z.object({
  businessName: z.string().min(1, "Business name required"),
  owner: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  amount: z.number().min(0).default(0),
  package: z.enum(Object.values(SponsorPackage) as [string, ...string[]]).optional().default(SponsorPackage.BRONZE),
  paymentMode: paymentModeEnum.optional().default(PaymentMode.CASH),
  logo: z.string().optional().nullable(),
  advertisement: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional().default("ACTIVE"),
});

export const inventorySchema = z.object({
  item: z.string().min(1, "Item name required"),
  category: z.string().optional().nullable(),
  quantity: z.number().min(0).default(0),
  purchased: z.number().min(0).default(0),
  used: z.number().min(0).default(0),
  remaining: z.number().min(0).default(0),
  vendor: z.string().optional().nullable(),
  cost: z.number().min(0).optional().nullable(),
});

export const receiptCancelSchema = z.object({
  reason: z.string().optional().nullable(),
});

export const collectionNoteSchema = z.object({
  status: houseStatusEnum.optional(),
  note: z.string().optional().nullable(),
});
