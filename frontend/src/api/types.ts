export type UserRole = "SUPER_ADMIN" | "FINANCE_ADMIN" | "COLLECTION_MANAGER" | "COLLECTOR";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  assignedAreas?: { _id: string; name: string }[];
}

export interface Area {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface AreaStat extends Area {
  totalHouses: number;
  totalShops: number;
  visited: number;
  collected: number;
  pending: number;
  totalAmount: number;
  percentage: number;
}

export type TargetStatus =
  | "NOT_VISITED"
  | "VISITED"
  | "COLLECTED"
  | "WILL_PAY_LATER"
  | "NOT_AVAILABLE"
  | "REFUSED";

export interface House {
  _id: string;
  houseId: string;
  ownerName: string;
  phone?: string;
  address: string;
  area?: { _id: string; name: string } | string;
  street?: string;
  houseNumber?: string;
  previousYearDonation?: number;
  currentYearDonation?: number;
  status: TargetStatus;
  assignedCollector?: { _id: string; name: string } | string | null;
  notes?: string;
  latitude?: number;
  longitude?: number;
  lastVisitedAt?: string;
}

export interface Shop {
  _id: string;
  shopId: string;
  shopName: string;
  ownerName?: string;
  phone?: string;
  address: string;
  area?: { _id: string; name: string } | string;
  street?: string;
  previousDonation?: number;
  currentDonation?: number;
  status: TargetStatus;
  assignedCollector?: { _id: string; name: string } | string | null;
  notes?: string;
  lastVisitedAt?: string;
}

export type PaymentMode = "CASH" | "UPI" | "BANK_TRANSFER" | "LATER";

export interface Donation {
  _id: string;
  donorType: "HOUSE" | "SHOP" | "INDIVIDUAL";
  house?: string | null;
  shop?: string | null;
  donorName: string;
  phone?: string;
  address?: string;
  houseShop?: string;
  amount: number;
  paymentMode: PaymentMode;
  paymentStatus?: "PAID" | "PENDING";
  transactionId?: string;
  upiRef?: string;
  notes?: string;
  collector?: { _id: string; name: string } | string;
  area?: { _id: string; name: string } | string | null;
  receipt?: { _id: string; receiptNumber: string } | string | null;
  collectedAt: string;
  isCancelled: boolean;
}

export interface Receipt {
  _id: string;
  receiptNumber: string;
  donation?: Donation | string;
  devoteeName: string;
  phone?: string;
  address?: string;
  donorType: "HOUSE" | "SHOP" | "INDIVIDUAL";
  collector?: { _id: string; name: string } | string;
  collectorName?: string;
  paymentMode: PaymentMode;
  amount: number;
  qrDataUrl?: string;
  isCancelled: boolean;
  issuedAt: string;
  verifyUrl?: string;
}

export interface Expense {
  _id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMode: PaymentMode;
  advance?: boolean;
  vendor?: string;
  billNumber?: string;
  billAttachment?: string;
  addedBy?: { _id: string; name: string } | string;
  approvedBy?: { _id: string; name: string } | string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface CashSettlement {
  _id: string;
  collector?: { _id: string; name: string } | string;
  date: string;
  morningCash: number;
  items: { label: string; amount: number }[];
  expectedCash: number;
  submittedCash: number;
  difference: number;
  status: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED";
  reviewNote?: string;
}

export interface Collector {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  assignedAreas?: Partial<Area>[];
}

export interface Assignment extends House {
  type: "HOUSE" | "SHOP";
  shopName?: string;
  ownerName: string;
  previousDonation?: number;
  currentDonation?: number;
}

export interface DashboardData {
  year: number;
  totalCollection: number;
  totalDonations: number;
  totalExpenses: number;
  balance: number;
  todayCollection: number;
  todayCollectionsCount: number;
  todayExpenses: number;
  totalDonors: number;
  totalReceipts: number;
  totalHouses: number;
  totalShops: number;
  totalCollectors: number;
  pendingCollection: number;
  pendingCount: number;
  cashCollection: number;
  upiCollection: number;
  bankCollection: number;
  houseCollection: number;
  shopCollection: number;
  individualCollection: number;
  pendingHouses: number;
  pendingShops: number;
  totalPending: number;
  totalTargets: number;
  collectedTargets: number;
  collectionPercentage: number;
}

export type CollectionItemType = "HOUSE" | "SHOP";

export interface CollectionItem extends House {
  type: CollectionItemType;
  shopName?: string;
  ownerName: string;
  previousDonation?: number;
  currentDonation?: number;
}

export interface AppInfo {
  org: {
    name: string;
    fullName: string;
    tagline: string;
    festivalName: string;
    festivalYear: string;
    receiptPrefix: string;
  };
  databaseName: string;
}

export interface CollectorDashboardData {
  todayCollection: number;
  todayCollectionsCount: number;
  totalCollection: number;
  totalCollectionsCount: number;
  assignedHouses: number;
  assignedShops: number;
  assignedTargets: number;
  visited: number;
  collected: number;
  pending: number;
  visitedPercentage: number;
  collectionPercentage: number;
  expectedCashToday: number;
}

export interface Event {
  _id: string;
  name: string;
  date: string;
  startTime: string;
  endTime?: string;
  location?: string;
  description?: string;
}

export interface Announcement {
  _id: string;
  title: string;
  message: string;
  isActive: boolean;
  createdAt: string;
}

export interface Volunteer {
  _id: string;
  name: string;
  phone: string;
  role: string;
  area?: string;
  availability?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface Sponsor {
  _id: string;
  businessName: string;
  owner?: string;
  phone?: string;
  amount: number;
  package: string;
  paymentMode: PaymentMode;
  logo?: string;
  advertisement?: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface InventoryItem {
  _id: string;
  item: string;
  category?: string;
  quantity: number;
  purchased: number;
  used: number;
  remaining: number;
  vendor?: string;
  cost?: number;
}

export interface AuditLog {
  _id: string;
  userName?: string;
  action: string;
  recordType?: string;
  recordId?: string;
  ip?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}