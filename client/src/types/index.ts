// Shared TypeScript types for the frontend

export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

// ─── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  bio?: string;
  phone?: string;
  department?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: Role;
  bio?: string;
  phone?: string;
  department?: string;
}

export interface UpdateProfileData {
  name?: string;
  bio?: string;
  phone?: string;
  department?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ─── Customer ─────────────────────────────────────────────────────────────────
export interface Customer {
  id: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  businessName: string;
  gstNumber?: string;
  customerType: CustomerType;
  address?: string;
  status: CustomerStatus;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { followUps: number; challans: number };
}

export interface CustomerFollowUp {
  id: string;
  customerId: string;
  note: string;
  followUpDate: string;
  createdById: string;
  createdAt: string;
  customer?: { id?: string; customerName: string; businessName?: string };
  createdBy: { id: string; name: string; role: Role };
}

// ─── Product ──────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  productName: string;
  sku: string;
  category: string;
  unitPrice: number | string;
  currentStock: number;
  minimumStock: number;
  warehouseLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdById: string;
  createdAt: string;
  product?: { productName: string; sku: string };
  createdBy: { id: string; name: string; role: Role };
}

// ─── Challan ──────────────────────────────────────────────────────────────────
export interface ChallanItem {
  id: string;
  challanId: string;
  productId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  unitPriceSnapshot: number | string;
  quantity: number;
  subtotal: number | string;
  product?: { id: string; currentStock: number; productName: string };
}

export interface CreateChallanData {
  customerId: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
}

export interface SalesChallan {
  id: string;
  challanNumber: string;
  customerId: string;
  totalQuantity: number;
  totalAmount: number | string;
  status: ChallanStatus;
  notes?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    customerName: string;
    businessName: string;
    mobileNumber?: string;
    gstNumber?: string;
    address?: string;
    email?: string;
    customerType?: CustomerType;
  };
  createdBy?: { id: string; name: string; role: Role };
  items?: ChallanItem[];
  _count?: { items: number };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardData {
  stats: {
    totalCustomers: number;
    activeCustomers: number;
    leads: number;
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    draftChallans: number;
    confirmedChallans: number;
    monthlyRevenue: number;
  };
  recentChallans: SalesChallan[];
  recentMovements: StockMovement[];
  upcomingFollowUps: CustomerFollowUp[];
}

// ─── API Responses ────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Query Params ─────────────────────────────────────────────────────────────
export interface CustomerQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
  customerType?: CustomerType;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  stockStatus?: 'healthy' | 'low' | 'out';
}

export interface ChallanQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ChallanStatus;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
}
