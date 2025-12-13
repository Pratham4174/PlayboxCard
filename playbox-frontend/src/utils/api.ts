import type { PlayBoxUser, ScanResponse, Transaction } from "../types";

// const BACKEND_URL = "http://localhost:8080/playbox";
const BACKEND_URL = "https://playboxcardbackend-production.up.railway.app/playbox";

export const api = {
  // ====================
  // ADMIN AUTHENTICATION
  // ====================
  login: async (username: string, password: string): Promise<any> => {
    const res = await fetch(`${BACKEND_URL}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Login failed");
    }
    
    return await res.json();
  },

  logout: () => {
    localStorage.removeItem("isAdminLoggedIn");
    localStorage.removeItem("admin");
  },

  getAdminInfo: (): any => {
    const adminData = localStorage.getItem("admin");
    return adminData ? JSON.parse(adminData) : null;
  },

  // ====================
  // RFID SCANNER
  // ====================
  scanCard: async (cardUid: string): Promise<ScanResponse> => {
    const res = await fetch(`${BACKEND_URL}/api/rfid/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardUid }),
    });
    
    if (!res.ok) throw new Error("Scan failed");
    return await res.json();
  },

  // ====================
  // USER MANAGEMENT
  // ====================
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

  addBalance: async (cardUid: string, amount: number, adminName?: string): Promise<PlayBoxUser> => {
    const res = await fetch(`${BACKEND_URL}/api/users/add?cardUid=${cardUid}&amount=${amount}&adminName=${adminName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cardUid,
        amount,
        adminName: adminName || "Unknown Admin"
      })
    });
    
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || "Add balance failed");
    }
    return await res.json();
  },

  deductBalance: async (
    cardUid: string,
    amount: number,
    deductor: string,
    description: string
  ): Promise<PlayBoxUser> => {
    const res = await fetch(
      `${BACKEND_URL}/api/users/deduct?cardUid=${cardUid}&amount=${amount}&deductor=${encodeURIComponent(deductor)}&description=${encodeURIComponent(description)}`,
      { method: "POST" }
    );
  
    if (!res.ok) throw new Error("Deduction failed");
    return await res.json();
  },
  
  getAllUsers: async (): Promise<PlayBoxUser[]> => {
    const res = await fetch(`${BACKEND_URL}/api/users/all`);
    if (!res.ok) throw new Error("Failed to fetch users");
    return await res.json();
  },

  searchByPhone: async (phone: string): Promise<PlayBoxUser> => {
    const res = await fetch(`${BACKEND_URL}/api/users/phone/${phone}`);
    if (!res.ok) throw new Error("User not found");
    return await res.json();
  },

  // ====================
  // DASHBOARD
  // ====================


  getRecentTransactions: async (limit = 10): Promise<Transaction[]> => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/transactions/recent?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return await res.json();
    } catch {
      // If endpoint doesn't exist, return mock data
      const users = await api.getAllUsers();
      return api.getMockTransactions(users);
    }
  },

  // ====================
  // MOCK DATA FALLBACKS
  // ====================
 

  getMockTransactions: (users: PlayBoxUser[]): Transaction[] => {
    const transactions: Transaction[] = [];
    const types: ('ADD' | 'DEDUCT' | 'NEW_USER')[] = ['ADD', 'DEDUCT', 'NEW_USER'];
    const activities = ['Swimming Pool', 'Cricket', 'Pool', 'PlayStation', 'Pickleball'];
    const admins = ['Admin', 'Manager', 'Staff'];
    
    users.slice(0, 10).forEach((user, index) => {
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = type === 'NEW_USER' ? 0 : Math.floor(Math.random() * 1000) + 100;
      const description = type === 'DEDUCT' 
        ? activities[Math.floor(Math.random() * activities.length)]
        : type === 'ADD' ? 'Balance added' : 'New user created';
      
      transactions.push({
        id: index + 1,
        userId: user.id,
        userName: user.name,
        type,
        amount,
        description,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        adminName: admins[Math.floor(Math.random() * admins.length)]
      });
    });
    
    return transactions.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },
};
// utils/api.ts - Update the mapTransaction function
const mapTransaction = (item: any): Transaction => ({
    id: item.id,
    userId: item.userId,
    userName: item.userName || `User ${item.userId}`, // Map from backend
    type: item.type,
    amount: item.amount,
    description: item.description,
    timestamp: item.timestamp,
    adminName: item.adminName,
    previousBalance: item.previousBalance,
    balanceAfter: item.balanceAfter, // Map balanceAfter to newBalance
  });
export const transactionApi = {
    // Get all transactions
    getAll: async (): Promise<Transaction[]> => {
      const response = await fetch(`${BACKEND_URL}/api/transactions/all`);
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      const data = await response.json();
      
      // Map backend fields to frontend Transaction type
      return data.map((item: any) => ({
        id: item.id,
        userId: item.userId,
        userName: item.userName || `User ${item.userId}`,
        type: item.type, // Should be 'ADD' | 'DEDUCT' | 'NEW_USER'
        amount: item.amount || 0,
        description: item.description,
        timestamp: item.instant || item.timestamp || item.createdAt,
        adminName: item.adminName,
        previousBalance: item.previousBalance,
        balanceAfter: item.balanceAfter
      }));
    },
  
    // Filter transactions - matches your Java controller
    filter: async (filters: {
      userId?: number;
      adminName?: string;
      startDate?: string;
      endDate?: string;
      type?: string;
    }): Promise<Transaction[]> => {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.userId) params.append('userId', filters.userId.toString());
      if (filters.adminName) params.append('adminName', filters.adminName);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      // Note: Your Java controller doesn't have 'type' parameter
      // If you need type filtering, you'll need to add it to the backend
      
      const url = `${BACKEND_URL}/api/transactions/filter?${params.toString()}`;
      console.log('Filter URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to filter transactions: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Map backend fields to frontend Transaction type
      return data.map((item: any) => ({
        id: item.id,
        userId: item.userId,
        userName: item.userName || `User ${item.userId}`,
        type: item.type,
        amount: item.amount || 0,
        description: item.description,
        timestamp: item.timestamp || item.createdAt,
        adminName: item.adminName,
        previousBalance: item.previousBalance,
        newBalance: item.newBalance
      }));
    }
  };