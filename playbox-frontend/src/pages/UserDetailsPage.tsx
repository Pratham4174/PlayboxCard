import { formatCurrency } from '@/utils/formatters';
import {
    Activity,
    ArrowLeft,
    BarChart3,
    Calendar,
    CreditCard,
    Download,
    IndianRupee,
    Mail,
    Phone,
    Printer,
    Receipt,
    RefreshCw,
    TrendingUp,
    User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TransactionTable from '../components/transactions/TransactionTable';
import type { UserDetails } from '../types';
import { userApi } from '../utils/api';


export default function UserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'history'>('overview');

  useEffect(() => {
    loadUserDetails();
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!userId) throw new Error('User ID is required');
      
      const userData = await userApi.getUserDetails(parseInt(userId));
      setUser(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to load user details');
      console.error('Error loading user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExport = () => {
    if (!user) return;
    
    const csvData = [
      ['User ID', 'Name', 'Total Recharge', 'Total Deduction', 'Balance', 'Visits', 'Last Visit'],
      [
        user.id.toString(),
        user.name,
        user.totalRecharge.toString(),
        user.totalDeduction.toString(),
        user.currentBalance.toString(),
        user.totalVisits.toString(),
        user.lastVisit || 'N/A'
      ]
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_${user.id}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="user-details-page loading">
        <div className="loading-spinner">
          <RefreshCw size={32} className="spinning" />
          <p>Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="user-details-page error">
        <div className="error-alert">
          <h3>Error Loading User</h3>
          <p>{error || 'User not found'}</p>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-details-page">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="btn btn-text back-btn">
          <ArrowLeft size={20} />
          Back to Users
        </button>
        
        <div className="header-actions">
          <button onClick={handleExport} className="btn btn-outline">
            <Download size={18} />
            Export
          </button>
          <button onClick={() => window.print()} className="btn btn-outline">
            <Printer size={18} />
            Print
          </button>
          <button onClick={loadUserDetails} className="btn btn-primary">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="user-profile-card">
        <div className="profile-header">
          <div className="avatar">
            <User size={40} />
          </div>
          <div className="profile-info">
            <h1 className="user-name">{user.name}</h1>
            <div className="user-meta">
              <span className="user-id">ID: {user.id}</span>
              {user.phone && (
                <span className="user-phone">
                  <Phone size={14} />
                  {user.phone}
                </span>
              )}
              {user.email && (
                <span className="user-email">
                  <Mail size={14} />
                  {user.email}
                </span>
              )}
            </div>
            <div className="user-status">
              <span className={`status-badge ${user.status}`}>
                {user.status.toUpperCase()}
              </span>
              <span className="registration-date">
                <Calendar size={14} />
                Joined: {formatDate(user.registrationDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card recharge">
            <div className="stat-icon">
              <TrendingUp size={22} />
            </div>
            <div className="stat-content">
              <h3>Lifetime Recharge</h3>
              <p className="stat-value">{formatCurrency(user.totalRecharge)}</p>
              <p className="stat-sub">
                {user.lastRechargeDate 
                  ? `Last: ${formatDate(user.lastRechargeDate)}`
                  : 'No recharge history'}
              </p>
            </div>
          </div>

          <div className="stat-card deduction">
            <div className="stat-icon">
              <Receipt size={22} />
            </div>
            <div className="stat-content">
              <h3>Lifetime Deduction</h3>
              <p className="stat-value">{formatCurrency(user.totalDeduction)}</p>
              <p className="stat-sub">
                Avg per visit: {formatCurrency(user.avgVisitAmount)}
              </p>
            </div>
          </div>

          <div className="stat-card balance">
            <div className="stat-icon">
              <IndianRupee size={22} />
            </div>
            <div className="stat-content">
              <h3>Current Balance</h3>
              <p className="stat-value">{formatCurrency(user.currentBalance)}</p>
              <p className="stat-sub">
                Net: {formatCurrency(user.totalRecharge - user.totalDeduction)}
              </p>
            </div>
          </div>

          <div className="stat-card visits">
            <div className="stat-icon">
              <Activity size={22} />
            </div>
            <div className="stat-content">
              <h3>Total Visits</h3>
              <p className="stat-value">{user.totalVisits}</p>
              <p className="stat-sub">
                {user.lastVisit 
                  ? `Last: ${formatDate(user.lastVisit)}`
                  : 'Never visited'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BarChart3 size={18} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <CreditCard size={18} />
          Recent Transactions
          <span className="badge">{user.recentTransactions.length}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <TrendingUp size={18} />
          Recharge History
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="chart-container">
              <h3>Recharge History Graph</h3>
              {user.rechargeHistory.length > 0 ? (
                <div className="history-chart">
                  {/* Simple bar chart for recharge history */}
                  <div className="chart-bars">
                    {user.rechargeHistory.map((item, index) => (
                      <div key={index} className="chart-bar-container">
                        <div 
                          className="chart-bar"
                          style={{
                            height: `${(item.amount / Math.max(...user.rechargeHistory.map(h => h.amount))) * 100}%`
                          }}
                          title={`${formatDate(item.date)}: ${formatCurrency(item.amount)}`}
                        />
                        <span className="chart-label">
                          {new Date(item.date).toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short' 
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="no-data">No recharge history available</p>
              )}
            </div>

            <div className="quick-stats">
              <h3>Quick Stats</h3>
              <div className="stats-list">
                <div className="stat-item">
                  <span className="stat-label">Average Recharge:</span>
                  <span className="stat-value">
                    {formatCurrency(user.totalRecharge / Math.max(user.rechargeHistory.length, 1))}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Utilization Rate:</span>
                  <span className="stat-value">
                    {user.totalRecharge > 0 
                      ? `${((user.totalDeduction / user.totalRecharge) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Days Since Last Visit:</span>
                  <span className="stat-value">
                    {user.lastVisit 
                      ? `${Math.floor((Date.now() - new Date(user.lastVisit).getTime()) / (1000 * 60 * 60 * 24))} days`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-tab">
            <div className="section-header">
              <h3>Last 10 Transactions</h3>
              <span className="badge">{user.recentTransactions.length} transactions</span>
            </div>
            {user.recentTransactions.length > 0 ? (
              <TransactionTable transactions={user.recentTransactions} />
            ) : (
              <p className="no-data">No recent transactions</p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <div className="section-header">
              <h3>Detailed Recharge History</h3>
            </div>
            {user.rechargeHistory.length > 0 ? (
              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Cumulative</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.rechargeHistory.map((item, index) => {
                      const cumulative = user.rechargeHistory
                        .slice(0, index + 1)
                        .reduce((sum, h) => sum + h.amount, 0);
                      
                      return (
                        <tr key={index}>
                          <td>{formatDate(item.date)}</td>
                          <td className="amount">{formatCurrency(item.amount)}</td>
                          <td className="cumulative">{formatCurrency(cumulative)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="no-data">No recharge history available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}