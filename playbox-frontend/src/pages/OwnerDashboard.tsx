import type { DailyRevenueDashboard, Transaction } from "@/types";
import {
    BarChart3,
    Calendar,
    CreditCard,
    Download,
    Eye,
    Filter,
    IndianRupee,
    Minus,
    Plus,
    RefreshCw,
    User,
    UserPlus,
    Users
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import TransactionFilters from "../components/transactions/TransactionFilters";
import TransactionTable from "../components/transactions/TransactionTable";
import "../css/OwnerDashboard.css";
import { dashboardApi, transactionApi } from "../utils/api";
import { exportToCSV } from "../utils/export";

// Define filter type matching your Transaction type
interface FilterState {
  startDate?: string;
  endDate?: string;
  type?: 'ADD' | 'DEDUCT' | 'NEW_USER';
  userId?: number;
  adminName?: string;
}

export default function OwnerDashboard() {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<FilterState>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'warning' }>({
    text: "Ready to filter transactions",
    type: "info"
  });
  const [data, setData] = useState<DailyRevenueDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardApi.getTodayRevenue()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Load initial data
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await transactionApi.getAll();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (err: any) {
      console.error("Failed to load transactions:", err);
      setError(err.message || "Failed to load transactions");
      // Fallback to mock data for demo
      const mockData = getMockTransactions();
      setTransactions(mockData);
      setFilteredTransactions(mockData);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics - memoized for performance
  const stats = useMemo(() => {
    if (!filteredTransactions.length) {
      return {
        totalAdd: 0,
        totalDeduct: 0,
        totalNewUser: 0,
        netBalance: 0,
        totalTransactions: 0,
        uniqueUsers: 0,
        avgTransaction: 0,
        topAdmins: [] as { name: string; count: number; amount: number }[]
      };
    }

    const totalAdd = filteredTransactions
      .filter(t => t.type === "ADD")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalDeduct = filteredTransactions
      .filter(t => t.type === "DEDUCT")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalNewUser = filteredTransactions
      .filter(t => t.type === "NEW_USER")
      .length;

    const uniqueUserIds = new Set(
      filteredTransactions.map(t => t.userId).filter(Boolean)
    );

    // Top admins
    const adminMap = new Map();
    filteredTransactions.forEach(t => {
      if (t.adminName) {
        const current = adminMap.get(t.adminName) || { count: 0, amount: 0 };
        adminMap.set(t.adminName, {
          count: current.count + 1,
          amount: current.amount + (t.amount || 0)
        });
      }
    });

    const topAdmins = Array.from(adminMap.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalAdd,
      totalDeduct,
      totalNewUser,
      netBalance: totalAdd - totalDeduct,
      totalTransactions: filteredTransactions.length,
      uniqueUsers: uniqueUserIds.size,
      avgTransaction: (totalAdd + totalDeduct) / filteredTransactions.length,
      topAdmins
    };
  }, [filteredTransactions]);

  // Handle filtering
  // In OwnerDashboard.tsx
const handleFilter = useCallback(async (filters: FilterState) => {
    try {
      setIsLoading(true);
      setActiveFilters(filters);
      
      console.log('Applying filters:', filters);
      
      // If no filters, show all
      if (Object.keys(filters).length === 0) {
        setFilteredTransactions(transactions);
        return;
      }
      
      // Prepare API filters (excluding type since backend doesn't support it)
      const apiFilters = {
        userId: filters.userId,
        adminName: filters.adminName,
        startDate: filters.startDate,
        endDate: filters.endDate
      };
      
      // Remove undefined values
      Object.keys(apiFilters).forEach(key => {
        if (apiFilters[key as keyof typeof apiFilters] === undefined) {
          delete apiFilters[key as keyof typeof apiFilters];
        }
      });
      
      // Call backend API
      const data = await transactionApi.filter(apiFilters);
      
      // Apply type filter on frontend if specified
      let filteredData = data;
      if (filters.type) {
        filteredData = data.filter(transaction => transaction.type === filters.type);
      }
      
      setFilteredTransactions(filteredData);
      setStatus({ 
        text: `Found ${filteredData.length} transactions`, 
        type: "success" 
      });
      
    } catch (err: any) {
      console.error("Filter error:", err);
      
      // Fallback to client-side filtering
      console.log("Falling back to client-side filtering");
      const filtered = transactions.filter(transaction => {
        // Date filtering
        if (filters.startDate && transaction.timestamp) {
          const transDate = new Date(transaction.timestamp);
          const startDate = new Date(filters.startDate);
          startDate.setHours(0, 0, 0, 0);
          if (transDate < startDate) return false;
        }
        
        if (filters.endDate && transaction.timestamp) {
          const transDate = new Date(transaction.timestamp);
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (transDate > endDate) return false;
        }
        
        // Type filtering
        if (filters.type && transaction.type !== filters.type) {
          return false;
        }
        
        // User ID filtering
        if (filters.userId && transaction.userId !== filters.userId) {
          return false;
        }
        
        // Admin name filtering
        if (filters.adminName) {
          const transactionAdmin = transaction.adminName?.toLowerCase() ?? '';
          const filterAdmin = filters.adminName.toLowerCase();
          if (!transactionAdmin.includes(filterAdmin)) {
            return false;
          }
        }
        
        return true;
      });
      
      setFilteredTransactions(filtered);
      setStatus({ 
        text: `Found ${filtered.length} transactions (using client-side filter)`, 
        type: filtered.length > 0 ? "info" : "warning" 
      });
      
    } finally {
      setIsLoading(false);
    }
  }, [transactions]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = transactions.filter(transaction => 
      transaction.userName?.toLowerCase().includes(lowerQuery) ||
      transaction.adminName?.toLowerCase().includes(lowerQuery) ||
      transaction.description?.toLowerCase().includes(lowerQuery) ||
      transaction.id.toString().includes(query) ||
      transaction.userId.toString().includes(query)
    );
    setFilteredTransactions(filtered);
  }, [transactions]);

  // Export to CSV
  const handleExport = () => {
    exportToCSV(filteredTransactions, `transactions_${new Date().toISOString().split('T')[0]}`);
  };

  // Reset filters
  const handleReset = () => {
    setActiveFilters({});
    setSearchQuery("");
    setFilteredTransactions(transactions);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ADD': return <Plus size={16} />;
      case 'DEDUCT': return <Minus size={16} />;
      case 'NEW_USER': return <UserPlus size={16} />;
      default: return <CreditCard size={16} />;
    }
  };

  // Get transaction color based on type
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'ADD': return '#10b981';
      case 'DEDUCT': return '#ef4444';
      case 'NEW_USER': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  return (
    <div className="owner-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">
            <BarChart3 className="header-icon" size={28} />
            Owner Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Monitor all transactions and financial activities
          </p>
        </div>

        
        
        <div className="header-actions">
        <button 
    onClick={() => navigate('/users')}
    className="btn btn-outline"
  >
    <Users size={18} />
    View All Users
  </button>
          <button 
            onClick={loadTransactions}
            disabled={isLoading}
            className="btn btn-outline refresh-btn"
            title="Refresh data"
          >
            <RefreshCw size={18} className={isLoading ? "spinning" : ""} />
            {isLoading ? "Loading..." : "Refresh"}
          </button>
          
          <button 
            onClick={handleExport}
            className="btn btn-primary export-btn"
            disabled={!filteredTransactions.length}
          >
            <Download size={18} />
            Export CSV
          </button>

          <div className="view-toggle">
            <button
              onClick={() => setViewMode("table")}
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              title="Table View"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`view-btn ${viewMode === "cards" ? "active" : ""}`}
              title="Card View"
            >
              <CreditCard size={18} />
            </button>
          </div>
        </div>
      </div>
      {/* TODAY STATS */}

      <div className="dashboard-section">
  <div className="dashboard-section-header">
    <h2 className="dashboard-section-title">
      📅 Today Stats
    </h2>
    <p className="dashboard-section-subtitle">
      Real-time performance & activity summary
    </p>
  </div>
  
      
{data && (
  <div className="stats-grid today">
    <div className="stat-card add">
      <div className="stat-icon"><Plus size={22} /></div>
      <div className="stat-content">
        <h3>Today Deposits</h3>
        <p className="stat-value">{formatCurrency(data.totalDeposited)}</p>
      </div>
    </div>

    <div className="stat-card deduct">
      <div className="stat-icon"><Minus size={22} /></div>
      <div className="stat-content">
        <h3>Today Deductions</h3>
        <p className="stat-value">{formatCurrency(data.totalDeducted)}</p>
      </div>
    </div>

    <div className="stat-card net">
      <div className="stat-icon"><IndianRupee size={22} /></div>
      <div className="stat-content">
        <h3>Today Net Cashflow</h3>
        <p className="stat-value">{formatCurrency(data.netCashflow)}</p>
        <p className="stat-sub">
          {data.netCashflow >= 0 ? "Profit" : "Loss"}
        </p>
      </div>
    </div>
  </div>
)}
{data?.mostActiveStaff?.length ? (
  <div className="stats-grid today">
    {data.mostActiveStaff.slice(0, 3).map((staff, index) => (
      <div key={index} className="stat-card users">
        <div className="stat-icon">
          <Users size={22} />
        </div>
        <div className="stat-content">
          <h3>Top Staff #{index + 1}</h3>
          <p className="stat-value">
            {staff.name || "Unknown"}
          </p>
          <p className="stat-sub">
            {staff.count} transactions
          </p>
        </div>
      </div>
    ))}
  </div>
) : null}

{data?.mostActiveUsers?.length ? (
  <div className="stats-grid today">
    {data.mostActiveUsers.slice(0, 3).map((user, index) => (
      <div key={index} className="stat-card net">
        <div className="stat-icon">
          <User size={22} />
        </div>
        <div className="stat-content">
          <h3>Top User #{index + 1}</h3>
          <p className="stat-value">
            {user.name || "Unknown"}
          </p>
          <p className="stat-sub">
            {user.count} transactions
          </p>
        </div>
      </div>
    ))}
  </div>
) : null}
</div>

      {/* Search Bar
      <div className="search-container">
        <div className="search-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by user name, admin name, description, or ID..."
            className="search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => handleSearch("")}
              className="clear-search"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="search-stats">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      </div> */}

      {/* Statistics Cards */}
      <div className="dashboard-section">
  <div className="dashboard-section-header">
    <h2 className="dashboard-section-title">
      📅 Overall Stats
    </h2>
    <p className="dashboard-section-subtitle">
      Real-time performance & activity summary
    </p>
  </div>
      <div className="stats-grid">
        <div className="stat-card add">
          <div className="stat-icon">
            <Plus size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Total Added</h3>
            <p className="stat-value">{formatCurrency(stats.totalAdd)}</p>
            <p className="stat-change">
              {stats.totalAdd > 0 
                ? `${Math.round((stats.totalAdd / (stats.totalAdd + stats.totalDeduct)) * 100)}% of total`
                : 'No additions'
              }
            </p>
          </div>
        </div>

        <div className="stat-card deduct">
          <div className="stat-icon">
            <Minus size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Total Deducted</h3>
            <p className="stat-value">{formatCurrency(stats.totalDeduct)}</p>
            <p className="stat-change">
              {stats.totalDeduct > 0 
                ? `${Math.round((stats.totalDeduct / (stats.totalAdd + stats.totalDeduct)) * 100)}% of total`
                : 'No deductions'
              }
            </p>
          </div>
        </div>

        <div className="stat-card net">
          <div className="stat-icon">
            <IndianRupee size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Net Balance</h3>
            <p className="stat-value">{formatCurrency(stats.netBalance)}</p>
            <p className="stat-change">
              {stats.netBalance >= 0 ? 'In Profit' : 'In Loss'}
            </p>
          </div>
        </div>

        <div className="stat-card users">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">New Users</h3>
            <p className="stat-value">{stats.totalNewUser}</p>
            <p className="stat-change">
              {stats.uniqueUsers} unique users
            </p>
          </div>
        </div>
      </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-header">
          <h3 className="section-title">
            <Filter size={20} />
            Filter Transactions
          </h3>
          {Object.keys(activeFilters).length > 0 && (
            <button 
              onClick={handleReset}
              className="btn btn-text reset-filters"
            >
              Clear Filters
            </button>
          )}
        </div>
        <TransactionFilters onFilter={handleFilter} />
      </div>

      {/* Top Admins
      {stats.topAdmins.length > 0 && (
        <div className="admins-section">
          <h3 className="section-title">Top Admins by Activity</h3>
          <div className="admins-grid">
            {stats.topAdmins.map((admin, index) => (
              <div key={admin.name} className="admin-card">
                <div className="admin-rank">{index + 1}</div>
                <div className="admin-content">
                  <h4 className="admin-name">{admin.name}</h4>
                  <div className="admin-stats">
                    <span className="admin-count">
                      {admin.count} {admin.count === 1 ? 'transaction' : 'transactions'}
                    </span>
                    <span className="admin-amount">
                      {formatCurrency(admin.amount)}
                    </span>
                  </div>
                  <div className="admin-progress">
                    <div 
                      className="progress-bar"
                      style={{
                        width: `${(admin.count / stats.totalTransactions) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Transactions Section */}
      <div className="transactions-section">
        <div className="section-header">
          <h3 className="section-title">
            <CreditCard size={20} />
            Recent Transactions
            {stats.totalTransactions > 0 && (
              <span className="badge count-badge">
                {filteredTransactions.length}
              </span>
            )}
          </h3>
          <div className="time-range">
            <Calendar size={16} />
            {transactions.length > 0 && (
              <span>
                {formatDate(transactions[transactions.length - 1]?.timestamp)} - {formatDate(transactions[0]?.timestamp)}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="error-alert">
            <p>{error}</p>
            <button onClick={loadTransactions}>Retry</button>
          </div>
        )}

        {isLoading ? (
          <div className="loading-spinner">
            <RefreshCw size={32} className="spinning" />
            <p>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} className="empty-icon" />
            <h4>No transactions found</h4>
            <p>Try adjusting your filters or search criteria</p>
            <button onClick={handleReset} className="btn btn-primary">
              Reset Filters
            </button>
          </div>
        ) : viewMode === "table" ? (
          <div className="table-container">
            <TransactionTable transactions={filteredTransactions} />
          </div>
        ) : (
          <div className="cards-grid">
            {filteredTransactions.slice(0, 12).map(transaction => (
                
              <div key={transaction.id} className="transaction-card">
                <div 
                  className="card-header"
                  style={{ backgroundColor: `${getTransactionColor(transaction.type)}15` }}
                >
                  <div className="card-type">
                    {getTransactionIcon(transaction.type)}
                    <span className="type-label">{transaction.type.replace('_', ' ')}</span>
                  </div>
                  <span className="card-badge" style={{ color: getTransactionColor(transaction.type) }}>
                    {transaction.type === 'ADD' ? '+' : transaction.type === 'DEDUCT' ? '-' : ''}₹{transaction.amount}
                  </span>
                </div>
                <div className="card-body">
                  <h4 className="card-user">{transaction.userName || "Unknown User"}</h4>
                  <p className="card-meta">
                    <span>User ID: {transaction.userId}</span>
                    {transaction.adminName && (
                      <span>• Admin: {transaction.adminName}</span>
                    )}
                  </p>
                  {transaction.description && (
                    <p className="card-desc">{transaction.description}</p>
                  )}
                  {transaction.previousBalance !== undefined && transaction.balanceAfter !== undefined && (
                    <div className="balance-info">
                      <span className="balance-old">₹{transaction.previousBalance}</span>
                      <span className="balance-arrow">→</span>
                      <span className="balance-new">₹{transaction.balanceAfter}</span>
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <span className="card-id">ID: {transaction.id}</span>
                  <span className="card-date">
                    {formatDate(transaction.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="footer-stats">
        <div className="footer-stat">
          <span className="stat-label">Average Transaction:</span>
          <span className="stat-value">{formatCurrency(stats.avgTransaction)}</span>
        </div>
        <div className="footer-stat">
          <span className="stat-label">Filtered Amount:</span>
          <span className="stat-value">
            {formatCurrency(stats.totalAdd + stats.totalDeduct)}
          </span>
        </div>
        <div className="footer-stat">
          <span className="stat-label">Date Range:</span>
          <span className="stat-value">
            {activeFilters.startDate ? formatDate(activeFilters.startDate) : "All"} - {activeFilters.endDate ? formatDate(activeFilters.endDate) : "All"}
          </span>
        </div>
      </div>
    </div>
  );
}

// Mock data function (fallback)
function getMockTransactions(): Transaction[] {
  const admins = ["John Admin", "Jane Manager", "Bob Supervisor", "Alice Staff"];
  const users = ["John Doe", "Jane Smith", "Bob Wilson", "Alice Johnson", "Charlie Brown"];
  
  return Array.from({ length: 15 }, (_, i) => {
    const types: ('ADD' | 'DEDUCT' | 'NEW_USER')[] = ['ADD', 'DEDUCT', 'NEW_USER'];
    const type = types[i % 3];
    
    return {
      id: 1000 + i,
      userId: 100 + (i % 5),
      userName: users[i % users.length],
      type: type,
      amount: type === 'NEW_USER' ? 0 : Math.floor(Math.random() * 5000) + 500,
      description: type === 'ADD' ? 'Balance added via cash' : 
                   type === 'DEDUCT' ? 'Activity charge' : 
                   'New user registration',
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
      adminName: admins[i % admins.length],
      previousBalance: type === 'ADD' ? Math.floor(Math.random() * 10000) : undefined,
      newBalance: type === 'ADD' ? Math.floor(Math.random() * 15000) : undefined
    };
  });
}