import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Gamepad2,
  Info,
  Loader2,
  LogOut,
  Minus,
  Plus,
  Scan,
  Search,
  Settings,
  User,
  UserPlus,
  Users
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/main.css"; // Custom CSS
import "./index.css"; // Tailwind
import type { PlayBoxUser, StatusType } from "./types";
import { api } from "./utils/api";

export default function App() {
  const [cardUid, setCardUid] = useState("");
  const [activeUid, setActiveUid] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [status, setStatus] = useState<StatusType>({
    text: "Waiting for RFID scan...",
    type: "info"
  });
  const [isNewUser, setIsNewUser] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [adminUsers, setAdminUsers] = useState<PlayBoxUser[]>([]);
  const [searchPhone, setSearchPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState<number>(500);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isTxnLoading, setIsTxnLoading] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [deductorName, setDeductorName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  useEffect(() => {
    // Focus scanner input when switching from admin view
    if (!isAdminView && scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [isAdminView]);
  useEffect(() => {
    if (showDeductModal) {
      const admin = localStorage.getItem("admin");
      if (admin) {
        try {
          const parsedAdmin = JSON.parse(admin);
          setDeductorName(parsedAdmin.name || parsedAdmin.username || "");
        } catch (error) {
          console.error("Error parsing admin data:", error);
        }
      }
    }
  }, [showDeductModal]);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = () => {
      try {
        const loggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
        const adminData = localStorage.getItem("admin");
        
        setIsLoggedIn(loggedIn);
        if (adminData) {
          const parsedAdmin = JSON.parse(adminData);
          setAdminInfo(parsedAdmin);
          setDeductorName(parsedAdmin.username || "");
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      // Clear ALL localStorage items related to the app
      localStorage.removeItem("isAdminLoggedIn");
      localStorage.removeItem("admin");
      
      // Optional: Clear any other app-specific localStorage items
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("playbox_") || key?.includes("admin")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Reset all state
      setIsLoggedIn(false);
      setAdminInfo(null);
      setIsAdminView(false);
      
      // Clear other state if needed
      setCardUid("");
      setActiveUid("");
      setName(null);
      setBalance(null);
      setStatus({
        text: "Waiting for RFID scan...",
        type: "info"
      });
      setIsNewUser(false);
      setAdminUsers([]);
      setSearchPhone("");
      setAmount(500);
      setApiError(null);
      
      // Redirect to login page
      navigate("/login", { replace: true });
    }
  };

  const handleScan = async (uid: string) => {
    if (!uid.trim()) return;

    setStatus({ text: "Scanning card...", type: "info" });

    try {
      const data = await api.scanCard(uid);
      setActiveUid(uid);

      if (data.status === "NEW_CARD") {
        setName(null);
        setBalance(null);
        setIsNewUser(true);
        setStatus({ 
          text: "New RFID card detected. Please create user profile.", 
          type: "warning" 
        });
      } else {
        setName(data.name || "");
        setBalance(data.balance ?? 0);
        setIsNewUser(false);
        setStatus({ 
          text: "User found successfully!", 
          type: "success" 
        });
      }
    } catch (error: any) {
      setStatus({ 
        text: `Error: ${error.message || "Backend connection error"}`, 
        type: "error" 
      });
    } finally {
      setCardUid("");
    }
  };

  const handleCreateUser = async () => {
    if (!activeUid || !newName.trim() || !newPhone.trim()) {
      setStatus({ text: "Name & phone are required", type: "error" });
      return;
    }

    setStatus({ text: "Creating user...", type: "info" });

    try {
      const user = await api.createUser({
        cardUid: activeUid,
        name: newName,
        phone: newPhone,
        email: newEmail || undefined,
      });

      setName(user.name);
      setBalance(user.balance);
      setIsNewUser(false);

      setNewName("");
      setNewPhone("");
      setNewEmail("");

      setStatus({ 
        text: "User created successfully!", 
        type: "success" 
      });
    } catch (error: any) {
      setStatus({ 
        text: `Error: ${error.message || "Backend error while creating user"}`, 
        type: "error" 
      });
    }
  };

  const handleAddBalance = async () => {
    if (!activeUid || amount < 500) {
      setStatus({ text: "Minimum add amount is ₹500", type: "error" });
      return;
    }
  
    setIsTxnLoading(true);
    setStatus({ text: "Adding amount...", type: "info" });
  
    try {
      // Get admin name from adminInfo or localStorage
      const adminName = adminInfo?.username || 
                       deductorName || 
                       localStorage.getItem('admin') || 
                       'Unknown Admin';
      
      // Pass adminName as the third parameter
      const user = await api.addBalance(activeUid, amount, adminName);
      
      setBalance(user.balance);
      
      // Update status message to show who added the balance
      setStatus({ 
        text: `₹${amount} added by ${adminName} successfully!`, 
        type: "success" 
      });
      
    } catch (error: any) {
      setStatus({ 
        text: `Error: ${error.message || "Failed to add balance"}`, 
        type: "error" 
      });
    } finally {
      setIsTxnLoading(false);
    }
  };
  const handleDeductBalance = async () => {
    if (!deductorName.trim() || !description.trim()) {
      setStatus({ text: "Deductor name & description required", type: "warning" });
      return;
    }
  
    setIsTxnLoading(true);
    setStatus({ text: "Deducting amount...", type: "info" });
  
    try {
      const user = await api.deductBalance(
        activeUid,
        amount,
        deductorName,
        description
      );
  
      setBalance(user.balance);
      setStatus({
        text: `₹${amount} deducted by ${deductorName}`,
        type: "success",
      });
  
      // reset modal
      setShowDeductModal(false);
      setDeductorName("");
      setDescription("");
    } catch (error: any) {
      setStatus({ text: `Error: ${error.message || "Insufficient balance"}`, type: "error" });
    } finally {
      setIsTxnLoading(false);
    }
  };
  
  // UPDATED: loadAllUsers with better error handling
  const loadAllUsers = async () => {
    try {
      console.log("Starting to load all users...");
      setLoading(true);
      setApiError(null);
      
      const users = await api.getAllUsers();
      console.log("API response received:", users);
      
      if (Array.isArray(users)) {
        setAdminUsers(users);
        setStatus({ 
          text: `Successfully loaded ${users.length} users`, 
          type: "success" 
        });
      } else {
        throw new Error("Invalid response format from API");
      }
    } catch (error: any) {
      console.error("Failed to load users:", error);
      setApiError(error.message || "Failed to load users");
      setStatus({ 
        text: `Error: ${error.message || "Failed to load users"}`, 
        type: "error" 
      });
      
      // Add mock data for testing if API fails
      const mockUsers: PlayBoxUser[] = [
        { 
          id: 1, 
          name: "John Doe", 
          phone: "9876543210", 
          cardUid: "ABC123DEF456", 
          balance: 1500,
          email: "john@example.com"
        },
        { 
          id: 2, 
          name: "Jane Smith", 
          phone: "9876543211", 
          cardUid: "DEF456GHI789", 
          balance: 2500,
          email: "jane@example.com"
        },
        { 
          id: 3, 
          name: "Bob Wilson", 
          phone: "9876543212", 
          cardUid: "GHI789JKL012", 
          balance: 500,
          email: "bob@example.com"
        },
      ];
      setAdminUsers(mockUsers);
      setStatus({ 
        text: "Using demo data (API failed)", 
        type: "warning" 
      });
    } finally {
      setLoading(false);
      console.log("Finished loading users");
    }
  };

  const searchByPhone = async () => {
    if (!searchPhone.trim()) return;

    try {
      setLoading(true);
      const user = await api.searchByPhone(searchPhone);
      setName(user.name);
      setBalance(user.balance);
      setActiveUid(user.cardUid);
      setIsNewUser(false);
      setIsAdminView(false);
      setStatus({ text: "User loaded via phone search ✅", type: "success" });
    } catch (error: any) {
      setStatus({ text: `Error: ${error.message || "No user found"}`, type: "warning" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: PlayBoxUser) => {
    setActiveUid(user.cardUid);
    setName(user.name);
    setBalance(user.balance);
    setIsNewUser(false);
    setIsAdminView(false);
    setStatus({ text: "User loaded from Admin Panel ✅", type: "success" });
  };

  const getStatusColor = () => {
    switch (status.type) {
      case "success": return "#10b981";
      case "error": return "#ef4444";
      case "warning": return "#f59e0b";
      default: return "#3b82f6";
    }
  };

  const StatusIcon = () => {
    const iconProps = { size: 20, className: "status-icon" };
    switch (status.type) {
      case "success": return <CheckCircle {...iconProps} />;
      case "error": return <AlertCircle {...iconProps} />;
      case "warning": return <AlertTriangle {...iconProps} />;
      default: return <Info {...iconProps} />;
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <div className="logo-icon">
              <Gamepad2 size={24} />
            </div>
            <div>
              <h1 className="app-title">🎮 PlayBox Sports Arena</h1>
              <p className="app-subtitle">
                {adminInfo ? `Logged in as ${adminInfo.username} (${adminInfo.role})` : "Tap RFID card to begin transaction"}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAdminView(!isAdminView);
              if (!isAdminView) {
                console.log("Switching to admin view, loading users...");
                loadAllUsers();
              }
            }}
            className="btn btn-outline"
            style={{
              backgroundColor: isAdminView ? "#4f46e5" : "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
            }}
          >
            <Settings size={16} className="btn-icon" />
            {isAdminView ? "Back to RFID" : "Find Users"}
          </button>
          {adminInfo?.role === "Owner" && (
  <button
    onClick={() => navigate("/owner")}
    className="btn btn-outline"
    style={{
      border: "1px solid rgba(255,255,255,0.3)",
      color: "white",
      marginLeft: "8px"
    }}
  >
    Owner Dashboard
  </button>
)}

          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="btn btn-outline logout-btn"
              style={{
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                marginLeft: '8px'
              }}
            >
              <LogOut size={16} className="btn-icon" />
              Logout
            </button>
            
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="content-container">
          {/* Scanner Section */}
          {!isAdminView && (
            <div className="card section">
              <div className="section-header">
                <Scan size={20} className="btn-icon" />
                <h2 className="section-title">RFID Scanner</h2>
              </div>
              <div className="scanner-container">
                <input
                  ref={scannerInputRef} // Add this line
                  autoFocus
                  placeholder="Enter RFID UID or tap card"
                  value={cardUid}
                  onChange={(e) => setCardUid(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan(cardUid)}
                  className="input-field scanner-input"
                />
                <button
                  onClick={() => handleScan(cardUid)}
                  disabled={!cardUid.trim()}
                  className="btn btn-primary scan-button"
                >
                  Scan
                </button>
              </div>
              
              {activeUid && (
                <div className="rfid-info">
                  <span className="rfid-label">RFID UID:</span>
                  <code className="rfid-code">{activeUid}</code>
                </div>
              )}
            </div>
          )}

          {/* Status Display */}
          <div 
            className="status-card"
            style={{
              borderColor: getStatusColor(),
              backgroundColor: `${getStatusColor()}15`
            }}
          >
            <div 
              className="status-icon"
              style={{ backgroundColor: getStatusColor() }}
            >
              <StatusIcon />
            </div>
            <span style={{ color: getStatusColor(), fontWeight: 500 }}>
              {status.text}
            </span>
          </div>

          {/* Admin Panel */}
          {isAdminView ? (
            <div className="card admin-panel">
              <div className="section-header">
                <Users size={20} className="btn-icon" />
                <h2 className="section-title">Admin Panel</h2>
              </div>
              
              {/* Debug Info */}
              {apiError && (
                <div className="debug-info" style={{
                  padding: '12px',
                  marginBottom: '16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#991b1b'
                }}>
                  <strong>API Error:</strong> {apiError}
                </div>
              )}
              
              {/* Search Section */}
              <div className="search-container">
                <div style={{ position: 'relative', flex: 1 }}>
                  <div className="search-icon-wrapper">
                    <Search size={16} color="#6b7280" />
                  </div>
                  <input
                    placeholder="Search by phone number"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchByPhone()}
                    className="input-field"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
                <button
                  onClick={searchByPhone}
                  disabled={loading || !searchPhone.trim()}
                  className="btn btn-primary"
                  style={{ marginLeft: 8 }}
                >
                  <Search size={16} className="btn-icon" />
                  Search
                </button>
                <button
                  onClick={loadAllUsers}
                  disabled={loading}
                  className="btn btn-outline"
                  style={{ marginLeft: 8 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spinner btn-icon" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Users size={16} className="btn-icon" />
                      Load All Users
                    </>
                  )}
                </button>
              </div>

              {/* Loading State */}
              {loading && (
                <div style={{ 
                  padding: '40px', 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px'
                }}>
                  <Loader2 size={32} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ color: '#6b7280' }}>Loading users...</p>
                </div>
              )}

              {/* Users Table */}
              {!loading && adminUsers.length > 0 && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr className="table-header">
                        <th className="table-header-cell">Name</th>
                        <th className="table-header-cell">Phone</th>
                        <th className="table-header-cell">RFID</th>
                        <th className="table-header-cell" style={{ textAlign: 'right' }}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="table-row"
                          onClick={() => handleSelectUser(user)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="table-cell">{user.name}</td>
                          <td className="table-cell">{user.phone}</td>
                          <td className="table-cell">
                            <span className="badge">
                              {user.cardUid}
                            </span>
                          </td>
                          <td className="table-cell" style={{ textAlign: 'right', fontWeight: 600 }}>
                            ₹{user.balance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && adminUsers.length === 0 && (
                <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
                  <Users size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
                  <p style={{ color: '#6b7280', marginBottom: 16 }}>
                    No users found. Click "Load All Users" to display users.
                  </p>
                  <button
                    onClick={() => {
                      console.log("Adding test user...");
                      const testUser: PlayBoxUser = {
                        id: Date.now(),
                        name: "Test User",
                        phone: "1234567890",
                        cardUid: "TEST123",
                        balance: 1000,
                        email: "test@example.com"
                      };
                      setAdminUsers([testUser]);
                    }}
                    className="btn btn-outline"
                  >
                    Add Test User
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Main Content Area */
            <>
              {name && !isNewUser ? (
                <div style={{ width: '100%' }}>
                  {/* User Info Card */}
                  <div className="card" style={{ marginBottom: 24 }}>
                    <div style={{ padding: 24 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                        <div className="avatar">
                          <User size={32} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                            <h2 className="user-name">{name}</h2>
                            <span className="badge rfid-badge">
                              {activeUid}
                            </span>
                          </div>
                          <div style={{ marginTop: 8 }}>
                            <span className="balance-label">Current Balance</span>
                            <div className="balance-amount">₹{balance?.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Card */}
                  <div className="card">
                    <div style={{ padding: 24 }}>
                      <h3 className="section-title" style={{ marginBottom: 16 }}>Transaction</h3>
                      
                      <div style={{ marginBottom: 16 }}>
                        <label className="label">Amount</label>
                        <div style={{ position: 'relative' }}>
                          <span className="currency-symbol">₹</span>
                          <input
                            type="number"
                            min={1}
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="input-field"
                            style={{ paddingLeft: 40, fontSize: '1.25rem', textAlign: 'right' }}
                            placeholder="Enter amount"
                          />
                        </div>
                        <p className="hint">Minimum ₹500 for deposit</p>
                      </div>

                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          onClick={handleAddBalance}
                          disabled={isTxnLoading || amount < 500}
                          className="btn btn-primary"
                          style={{ flex: 1, height: 48 }}
                        >
                          {isTxnLoading ? (
                            <>
                              <Loader2 size={16} className="spinner btn-icon" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Plus size={16} className="btn-icon" />
                              Add Balance
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setShowDeductModal(true)}
                          disabled={isTxnLoading || amount <= 0}
                          className="btn btn-destructive"
                          style={{ flex: 1, height: 48 }}
                        >
                          {isTxnLoading ? (
                            <>
                              <Loader2 size={16} className="spinner btn-icon" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Minus size={16} className="btn-icon" />
                              Deduct Balance
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isNewUser ? (
                <div className="card">
                  <div style={{ padding: 24 }}>
                    <div className="section-header">
                      <UserPlus size={20} className="btn-icon" />
                      <h2 className="section-title">Create New User</h2>
                    </div>
                    
                    {/* RFID Display */}
                    <div className="rfid-display">
                      <CreditCard size={20} style={{ marginRight: 8, color: '#6b7280' }} />
                      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>RFID UID:</span>
                      <code className="rfid-code">{activeUid}</code>
                    </div>

                    {/* Form */}
                    <div style={{ marginTop: 24 }}>
                      <div className="form-group">
                        <label className="label">Full Name *</label>
                        <input
                          placeholder="Enter full name"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="input-field"
                        />
                      </div>

                      <div className="form-group">
                        <label className="label">Phone Number *</label>
                        <input
                          placeholder="Enter phone number"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          className="input-field"
                        />
                      </div>

                      <div className="form-group">
                        <label className="label">Email (Optional)</label>
                        <input
                          type="email"
                          placeholder="Enter email address"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="input-field"
                        />
                      </div>

                      <button
                        onClick={handleCreateUser}
                        disabled={!newName.trim() || !newPhone.trim()}
                        className="btn btn-primary"
                        style={{ width: '100%', height: 48, marginTop: 8 }}
                      >
                        <UserPlus size={16} className="btn-icon" />
                        Create User Profile
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div style={{ padding: 48, textAlign: 'center' }}>
                    <div className="empty-icon">
                      <Gamepad2 size={40} />
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1f2937', marginBottom: 8 }}>
                        Ready to Scan
                      </h3>
                      <p style={{ color: '#6b7280', maxWidth: 400, margin: '0 auto' }}>
                        Scan an RFID card to view user details or create a new profile
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Deduct Modal */}
        {showDeductModal && (
          <div className="modal-overlay" onClick={() => setShowDeductModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div style={{ position: 'relative' }}>
                <h2 className="modal-title">Confirm Deduction</h2>
                <button 
                  onClick={() => setShowDeductModal(false)}
                  className="modal-close"
                >
                  ✕
                </button>
              </div>

              {/* Amount Preview */}
              <div className="amount-preview">
                <span className="amount-label">Deduction Amount</span>
                <div className="amount-value">₹{amount}</div>
              </div>

              {/* Activity Select */}
              <div className="form-group">
                <label className="label">Select Activity *</label>
                <select
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 12px' }}
                  required
                >
                  <option value="">Select Activity</option>
                  <option value="Swimming Pool">Swimming Pool</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Pool">Pool</option>
                  <option value="PlayStation">PlayStation</option>
                  <option value="Pickleball">Pickleball</option>
                </select>
              </div>

              {/* Deductor Name - READONLY */}
              <div className="form-group">
                <label className="label">Deducted By *</label>
                <div className="deductor-display">
                  <div className="deductor-info">
                    <div className="deductor-name">{adminInfo?.username || deductorName}</div>
                    <div className="deductor-role">({adminInfo?.role || 'Staff'})</div>
                  </div>
                  <input
                    type="hidden"
                    value={adminInfo?.username || deductorName}
                    onChange={(e) => setDeductorName(e.target.value)}
                  />
                </div>
                <p className="hint" style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6b7280' }}>
                  This field cannot be changed
                </p>
              </div>

              {/* Modal Actions */}
              <div className="modal-actions">
                <button
                  onClick={() => setShowDeductModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '12px' }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeductBalance}
                  className="btn btn-destructive"
                  disabled={isTxnLoading || !description.trim()}
                  style={{ flex: 1, padding: '12px' }}
                >
                  {isTxnLoading ? (
                    <>
                      <Loader2 size={16} className="spinner btn-icon" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Deduction"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p className="footer-text">
          PlayBox RFID System v1.0 • Ensure RFID reader is connected
        </p>
      </footer>
    </div>
  );
}