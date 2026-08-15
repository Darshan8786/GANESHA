export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  FINANCE_ADMIN: "FINANCE_ADMIN",
  COLLECTION_MANAGER: "COLLECTION_MANAGER",
  COLLECTOR: "COLLECTOR",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const HouseStatus = {
  NOT_VISITED: "NOT_VISITED",
  VISITED: "VISITED",
  COLLECTED: "COLLECTED",
  WILL_PAY_LATER: "WILL_PAY_LATER",
  NOT_AVAILABLE: "NOT_AVAILABLE",
  REFUSED: "REFUSED",
} as const;

export type HouseStatus = (typeof HouseStatus)[keyof typeof HouseStatus];

export const PaymentMode = {
  CASH: "CASH",
  UPI: "UPI",
  BANK_TRANSFER: "BANK_TRANSFER",
  LATER: "LATER",
} as const;

export type PaymentMode = (typeof PaymentMode)[keyof typeof PaymentMode];

export const ExpenseCategory = {
  PALLAKI: "Pallaki",
  TENT: "Tent/Pendal",
  GANESHA: "Ganesha",
  CRACKERS: "Crackers",
  FLOWERS: "Flowers",
  DECORATION: "Decoration",
  FOOD: "Food/Prasada",
  SOUND: "Sound System",
  LIGHTS: "Lights",
  TRANSPORTATION: "Transportation",
  PRINTING: "Printing",
  SECURITY: "Security",
  CLEANING: "Cleaning",
  OTHER: "Other",
} as const;

export const ExpenseStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const SettlementStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const SponsorPackage = {
  GOLD: "Gold",
  SILVER: "Silver",
  BRONZE: "Bronze",
} as const;

export const VolunteerRole = {
  COLLECTION: "Collection",
  POOJA: "Pooja",
  DECORATION: "Decoration",
  FOOD: "Food",
  SECURITY: "Security",
  TRAFFIC: "Traffic",
  CLEANING: "Cleaning",
  CULTURAL: "Cultural Program",
} as const;
