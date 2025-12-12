export interface ScanResponse {
    status: "NEW_CARD" | "EXISTING_USER";
    name?: string;
    balance?: number;
  }
  
  export interface PlayBoxUser {
    id: number;
    name: string;
    phone: string;
    email?: string;
    cardUid: string;
    balance: number;
  }
  
  export interface StatusType {
    text: string;
    type: "info" | "success" | "error" | "warning";
  }

  export interface DashboardStats {
    totalUsers: number;
    totalBalance: number;
    todayTransactions: number;
    activeToday: number;
    revenueToday: number;
  }
  
  export interface Transaction {
    id: number;
    userId: number;
    userName: string;
    type: 'ADD' | 'DEDUCT' | 'NEW_USER';
    amount: number;
    previousBalance: number;
    newBalance: number;
    timestamp: string;
    adminName?: string;
  }