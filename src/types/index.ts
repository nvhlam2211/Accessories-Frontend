export type Role = "SUPER_ADMIN" | "ADMIN" | "CUSTOMER";

export type PageAdminAccount = {
  id: string;
  name: string;
  email: string;
  ownerNote: string | null;
  role: "ADMIN";
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  hasPassword?: boolean;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  active: boolean;
  productCount?: number;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  discountPercent?: string | null;
  stock: number;
  imageUrl: string;
  active: boolean;
  categoryId?: number | null;
  category?: Category | null;
};

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};

export type RevenueReport = {
  today: string;
  year: number;
  month: number;
  todayRevenue: number;
  monthRevenue: number;
  daily: { date: string; revenue: number; unitsSold: number }[];
  monthly: { month: string; revenue: number; unitsSold: number }[];
};

export type SaleAudit = {
  id: number;
  action: "EDIT" | "VOID";
  reason: string;
  before: { quantity: number; unitPrice: string; status: "COMPLETED" | "VOIDED" };
  after: { quantity: number; unitPrice: string; status: "COMPLETED" | "VOIDED" };
  adminName?: string | null;
  createdAt: string;
};

export type SaleRecord = {
  id: number;
  productId: number | null;
  productName: string;
  quantity: number;
  unitPrice: string;
  soldAt: string;
  status: "COMPLETED" | "VOIDED";
  voidReason: string | null;
  audits: SaleAudit[];
};

export type SaleHistoryPage = {
  data: SaleRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    totalCompleted: number;
    totalVoided: number;
  };
};

export type ApiList<T> = {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
};
