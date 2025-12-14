import { formatCurrency } from '@/utils/formatters';
import {
    Activity,
    ArrowUpRight,
    Calendar,
    Filter,
    IndianRupee,
    RefreshCw,
    Search,
    TrendingUp,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../css/UserPages.css";
import type { User, UserStats } from '../types';
import { userApi } from '../utils/api';


export default function UsersListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'recharge' | 'visits'>('name');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchQuery, statusFilter, sortBy]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        userApi.getAllUsers(),
        userApi.getUserStats()
      ]);
      setUsers(usersData);
      setFilteredUsers(usersData);
      setStats(statsData);
    } catch (err: any) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.id.toString().includes(query) ||
        user.phone?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'balance':
          return b.currentBalance - a.currentBalance;
        case 'recharge':
          return b.totalRecharge - a.totalRecharge;
        case 'visits':
          return b.totalVisits - a.totalVisits;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredUsers(filtered);
  };

  const handleUserClick = (userId: number) => {
    navigate(`/users/${userId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="users-list-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">
            <Users size={28} />
            All Users
          </h1>
          <p className="page-subtitle">Manage and view all registered users</p>
        </div>
        <div className="header-actions">
          <button onClick={loadUsers} className="btn btn-outline">
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="stats-overview">
          <div className="stat-card total">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Users</h3>
              <p className="stat-value">{stats.totalUsers}</p>
              <p className="stat-sub">
                <span className="active-count">{stats.activeUsers} active</span>
                <span> • {stats.newUsersToday} new today</span>
              </p>
            </div>
          </div>

          <div className="stat-card recharge">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="stat-content">
              <h3>Total Recharge</h3>
              <p className="stat-value">{formatCurrency(stats.totalRecharge)}</p>
              <p className="stat-sub">
                Avg: {formatCurrency(stats.totalRecharge / stats.totalUsers)}
              </p>
            </div>
          </div>

          <div className="stat-card balance">
            <div className="stat-icon">
              <IndianRupee size={24} />
            </div>
            <div className="stat-content">
              <h3>Avg Balance</h3>
              <p className="stat-value">{formatCurrency(stats.avgBalance)}</p>
              <p className="stat-sub">
                Total: {formatCurrency(stats.totalRecharge - stats.totalDeduction)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-container">
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, ID, phone, or email..."
              className="search-input"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="clear-search"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="statusFilter">
              <Filter size={16} />
              Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="filter-select"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="sortBy">Sort By</label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="filter-select"
            >
              <option value="name">Name (A-Z)</option>
              <option value="balance">Balance (High to Low)</option>
              <option value="recharge">Total Recharge</option>
              <option value="visits">Total Visits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="loading-spinner">
          <RefreshCw size={32} className="spinning" />
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <Users size={48} className="empty-icon" />
          <h4>No users found</h4>
          <p>Try adjusting your search or filters</p>
          <button onClick={() => { setSearchQuery(''); setStatusFilter('all'); }} className="btn btn-primary">
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="users-count">
            Showing {filteredUsers.length} of {users.length} users
          </div>
          <div className="users-grid">
            {filteredUsers.map(user => (
              <div 
                key={user.id} 
                className="user-card"
                onClick={() => handleUserClick(user.id)}
              >
                <div className="card-header">
                  <div className="user-avatar">
                    <Users size={24} />
                  </div>
                  <div className="user-header-info">
                    <h3 className="user-name">{user.name}</h3>
                    <span className="user-id">ID: {user.id}</span>
                    <span className={`status-badge ${user.status}`}>
                      {user.status.toUpperCase()}
                    </span>
                  </div>
                  <ArrowUpRight size={18} className="view-icon" />
                </div>

                <div className="card-body">
                  <div className="user-stats">
                    <div className="stat-item">
                      <IndianRupee size={14} />
                      <span className="stat-label">Balance:</span>
                      <span className="stat-value">{formatCurrency(user.currentBalance)}</span>
                    </div>
                    <div className="stat-item">
                      <TrendingUp size={14} />
                      <span className="stat-label">Recharge:</span>
                      <span className="stat-value">{formatCurrency(user.totalRecharge)}</span>
                    </div>
                    <div className="stat-item">
                      <Activity size={14} />
                      <span className="stat-label">Visits:</span>
                      <span className="stat-value">{user.totalVisits}</span>
                    </div>
                  </div>

                  {user.lastVisit && (
                    <div className="last-visit">
                      <Calendar size={14} />
                      <span>Last visit: {formatDate(user.lastVisit)}</span>
                    </div>
                  )}

                  <div className="user-meta">
                    {user.phone && <span className="meta-item">📱 {user.phone}</span>}
                    {user.email && <span className="meta-item">✉️ {user.email}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}