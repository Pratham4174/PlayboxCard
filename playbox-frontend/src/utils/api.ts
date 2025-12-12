import type { DashboardStats, PlayBoxUser, ScanResponse, Transaction } from "../types";

const BACKEND_URL = "http://localhost:8080";

export const api = {
  scanCard: async (cardUid: string): Promise<ScanResponse> => {
    const res = await fetch(`${BACKEND_URL}/api/rfid/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardUid }),
    });
    return await res.json();
  },

  createUser: async (userData: {
    cardUid: string;
    name: string;
    phone: string;
    email?: string;
  }): Promise<PlayBoxUser> => {
    const res = await fetch(`${BACKEND_URL}/api/users/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw new Error("User creation failed");
    return await res.json();
  },

  addBalance: async (cardUid: string, amount: number): Promise<PlayBoxUser> => {
    const res = await fetch(
      `${BACKEND_URL}/api/users/add?cardUid=${cardUid}&amount=${amount}`,
      { method: "POST" }
    );
    return await res.json();
  },

  deductBalance: async (cardUid: string, amount: number): Promise<PlayBoxUser> => {
    const res = await fetch(
      `${BACKEND_URL}/api/users/deduct?cardUid=${cardUid}&amount=${amount}`,
      { method: "POST" }
    );
    if (!res.ok) throw new Error("Deduction failed");
    return await res.json();
  },

  getAllUsers: async (): Promise<PlayBoxUser[]> => {
    const res = await fetch(`${BACKEND_URL}/api/users/all`);
    return await res.json();
  },

  searchByPhone: async (phone: string): Promise<PlayBoxUser> => {
    const res = await fetch(`${BACKEND_URL}/api/users/phone/${phone}`);
    if (!res.ok) throw new Error("User not found");
    return await res.json();
  },

  // Dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${BACKEND_URL}/api/dashboard/stats`);
    return await res.json();
  },

  // Recent transactions
  getRecentTransactions: async (limit = 10): Promise<Transaction[]> => {
    const res = await fetch(`${BACKEND_URL}/api/transactions/recent?limit=${limit}`);
    return await res.json();
  },

  // If backend doesn't have these endpoints, we can simulate them
  getMockDashboardStats: (users: PlayBoxUser[]): DashboardStats => {
    const totalUsers = users.length;
    const totalBalance = users.reduce((sum, user) => sum + user.balance, 0);
    
    return {
      totalUsers,
      totalBalance,
      todayTransactions: Math.floor(Math.random() * 20) + 5, // Mock data
      activeToday: Math.floor(Math.random() * totalUsers * 0.7) + 1,
      revenueToday: Math.floor(Math.random() * 5000) + 1000,
    };
  },

  getMockTransactions: (users: PlayBoxUser[]): Transaction[] => {
    const transactions: Transaction[] = [];
    const types: ('ADD' | 'DEDUCT' | 'NEW_USER')[] = ['ADD', 'DEDUCT', 'NEW_USER'];
    
    users.slice(0, 10).forEach((user, index) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = type === 'NEW_USER' ? 0 : Math.floor(Math.random() * 1000) + 100;
      
      transactions.push({
        id: index + 1,
        userId: user.id,
        userName: user.name,
        type,
        amount,
        previousBalance: user.balance - (type === 'ADD' ? amount : -amount),
        newBalance: user.balance,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(), // Last 24 hours
        adminName: ['Admin', 'Manager', 'System'][Math.floor(Math.random() * 3)]
      });
    });
    
    return transactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
};