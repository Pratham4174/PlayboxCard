import { useState } from "react";

const BACKEND_URL = "http://localhost:8080";

interface ScanResponse {
  status: "NEW_CARD" | "EXISTING_USER";
  name?: string;
  balance?: number;
}

interface PlayBoxUser {
  id: number;
  name: string;
  cardUid: string;
  balance: number;
}

export default function App() {
  const [cardUid, setCardUid] = useState("");
  const [activeUid, setActiveUid] = useState("");
  const [name, setName] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [status, setStatus] = useState<{ text: string; type: "info" | "success" | "error" | "warning" }>({
    text: "Waiting for RFID scan...",
    type: "info"
  });
  const [amount, setAmount] = useState<number>(500);
  const [isNewUser, setIsNewUser] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isTxnLoading, setIsTxnLoading] = useState(false);
  

  const handleScan = async (uid: string) => {
    if (!uid.trim()) return;

    setStatus({ text: "Scanning card...", type: "info" });

    try {
      const res = await fetch(`${BACKEND_URL}/api/rfid/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardUid: uid }),
      });

      const data: ScanResponse = await res.json();
      setActiveUid(uid);

      if (data.status === "NEW_CARD") {
        setName(null);
        setBalance(null);
        setIsNewUser(true);
        setStatus({ text: "New RFID card detected. Please create user profile.", type: "warning" });
      } else {
        setName(data.name || "");
        setBalance(data.balance ?? 0);
        setIsNewUser(false);
        setStatus({ text: "User found successfully!", type: "success" });
      }
    } catch {
      setStatus({ text: "Backend connection error", type: "error" });
    } finally {
      setCardUid("");
    }
  };

  const createUser = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      setStatus({ text: "Name & phone are required", type: "error" });
      return;
    }

    setStatus({ text: "Creating user...", type: "info" });

    try {
      const res = await fetch(`${BACKEND_URL}/api/users/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardUid: activeUid,
          name: newName,
          phone: newPhone,
          email: newEmail || null,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setStatus({ text: msg || "User creation failed", type: "error" });
        return;
      }

      const user: PlayBoxUser = await res.json();
      setName(user.name);
      setBalance(user.balance);
      setIsNewUser(false);

      setNewName("");
      setNewPhone("");
      setNewEmail("");

      setStatus({ text: "User created successfully!", type: "success" });
    } catch {
      setStatus({ text: "Backend error while creating user", type: "error" });
    }
  };

  const addAmount = async () => {
    if (amount < 500) {
      setStatus({ text: "Minimum add amount is ₹500", type: "error" });
      return;
    }

    setIsTxnLoading(true);
    setStatus({ text: "Adding amount...", type: "info" });

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/users/add?cardUid=${activeUid}&amount=${amount}`,
        { method: "POST" }
      );

      const user: PlayBoxUser = await res.json();
      setBalance(user.balance);
      setStatus({ text: `₹${amount} added successfully!`, type: "success" });
    } catch {
      setStatus({ text: "Failed to add balance", type: "error" });
    } finally {
      setIsTxnLoading(false);
    }
  };

  const deductAmount = async () => {
    if (amount <= 0) {
      setStatus({ text: "Enter a valid amount", type: "error" });
      return;
    }

    setIsTxnLoading(true);
    setStatus({ text: "Deducting amount...", type: "info" });

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/users/deduct?cardUid=${activeUid}&amount=${amount}`,
        { method: "POST" }
      );

      if (!res.ok) throw new Error();

      const user: PlayBoxUser = await res.json();
      setBalance(user.balance);
      setStatus({ text: `₹${amount} deducted successfully!`, type: "success" });
    } catch {
      setStatus({ text: "Insufficient balance", type: "error" });
    } finally {
      setIsTxnLoading(false);
    }
  };

  const getStatusColor = () => {
    switch (status.type) {
      case "success": return "#10b981";
      case "error": return "#ef4444";
      case "warning": return "#f59e0b";
      default: return "#3b82f6";
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🎮 PlayBox Sports Arena</h1>
        <p style={styles.subtitle}>Tap RFID card to begin transaction</p>
      </header>

      <div style={styles.main}>
        <div style={styles.card}>
          {/* RFID Scanner Section */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>RFID Scanner</h2>
            <div style={styles.scannerContainer}>
              <div style={styles.scannerIcon}>📱</div>
              <input
                autoFocus
                placeholder="Enter RFID UID or tap card"
                value={cardUid}
                onChange={(e) => setCardUid(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleScan(cardUid)}
                style={styles.scannerInput}
              />
              <button
                onClick={() => handleScan(cardUid)}
                style={{
                  ...styles.scanButton,
                  opacity: cardUid.trim() ? 1 : 0.6,
                  cursor: cardUid.trim() ? "pointer" : "not-allowed"
                }}
                disabled={!cardUid.trim()}
              >
                Scan
              </button>
            </div>
            
            {activeUid && (
              <div style={styles.rfidInfo}>
                <span style={styles.rfidLabel}>RFID UID:</span>
                <code style={styles.rfidCode}>{activeUid}</code>
              </div>
            )}
          </div>

          {/* Status Display */}
          <div style={{
            ...styles.statusCard,
            borderColor: getStatusColor(),
            backgroundColor: `${getStatusColor()}15`
          }}>
            <div style={{
              ...styles.statusIcon,
              backgroundColor: getStatusColor()
            }}>
              {status.type === "success" ? "✓" : 
               status.type === "error" ? "✗" : 
               status.type === "warning" ? "⚠" : "⏳"}
            </div>
            <span style={{ color: getStatusColor(), fontWeight: 500 }}>
              {status.text}
            </span>
          </div>

          {/* Dynamic Content Area - This was missing! */}
          <div style={styles.dynamicContent}>
            {/* User Profile Section */}
            {name && !isNewUser ? (
              <div style={styles.userCard}>
                <div style={styles.userHeader}>
                  <div style={styles.avatar}>
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.userInfo}>
                    <h2 style={styles.userName}>{name}</h2>
                    <div style={styles.balanceContainer}>
                      <span style={styles.balanceLabel}>Current Balance</span>
                      <div style={styles.balanceAmount}>₹{balance?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                <div style={styles.transactionSection}>
                  <h3 style={styles.sectionTitle}>Transaction</h3>
                  <div style={styles.amountInputContainer}>
                    <span style={styles.currencySymbol}>₹</span>
                    <input
                      type="number"
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      style={styles.amountInput}
                      placeholder="Enter amount"
                    />
                    <div style={styles.amountHint}>Minimum ₹500 for deposit</div>
                  </div>

                  <div style={styles.buttonGroup}>
                    <button
                      onClick={addAmount}
                      disabled={isTxnLoading}
                      style={{
                        ...styles.primaryButton,
                        opacity: isTxnLoading ? 0.7 : 1,
                        cursor: isTxnLoading ? "not-allowed" : "pointer"
                      }}
                    >
                      {isTxnLoading ? (
                        <>
                          <div style={styles.spinner}></div>
                          Processing...
                        </>
                      ) : (
                        "➕ Add Balance"
                      )}
                    </button>
                    <button
                      onClick={deductAmount}
                      disabled={isTxnLoading}
                      style={{
                        ...styles.secondaryButton,
                        opacity: isTxnLoading ? 0.7 : 1,
                        cursor: isTxnLoading ? "not-allowed" : "pointer"
                      }}
                    >
                      {isTxnLoading ? (
                        <>
                          <div style={styles.spinner}></div>
                          Processing...
                        </>
                      ) : (
                        "➖ Deduct Balance"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : isNewUser ? (
              <div style={styles.newUserCard}>
                <h2 style={styles.sectionTitle}>Create New User</h2>
                
                <div style={styles.rfidDisplay}>
                  <span style={styles.rfidLabel}>RFID UID:</span>
                  <code style={styles.rfidCode}>{activeUid}</code>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    placeholder="Enter full name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone Number *</label>
                  <input
                    placeholder="Enter phone number"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email (Optional)</label>
                  <input
                    placeholder="Enter email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={styles.input}
                    type="email"
                  />
                </div>

                <button
                  onClick={createUser}
                  style={{
                    ...styles.createButton,
                    opacity: (!newName.trim() || !newPhone.trim()) ? 0.6 : 1,
                    cursor: (!newName.trim() || !newPhone.trim()) ? "not-allowed" : "pointer"
                  }}
                  disabled={!newName.trim() || !newPhone.trim()}
                >
                  ✅ Create User Profile
                </button>
              </div>
            ) : (
              // Empty state when no card is scanned
              <div style={styles.emptyState}>
                <div style={styles.emptyStateIcon}>🎮</div>
                <p style={styles.emptyStateText}>
                  Scan an RFID card to view user details or create a new profile
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer style={styles.footer}>
        <p style={styles.footerText}>
          PlayBox RFID System v1.0 • Ensure RFID reader is connected
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: 'flex',
    flexDirection: 'column' as const,
  } as React.CSSProperties,
  
  header: {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '2rem 1rem',
    textAlign: 'center' as const,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
  
  title: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 700,
  },
  
  subtitle: {
    margin: '0.5rem 0 0 0',
    opacity: 0.9,
    fontSize: '1rem',
  },
  
  main: {
    flex: 1,
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem 1rem',
    width: '100%',
  } as React.CSSProperties,
  
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
    overflow: 'hidden',
    minHeight: '400px', // Ensures card has minimum height
  },
  
  section: {
    padding: '2rem',
    borderBottom: '1px solid #e5e7eb',
  },
  
  sectionTitle: {
    margin: '0 0 1rem 0',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#1f2937',
  },
  
  scannerContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  
  scannerIcon: {
    fontSize: '2rem',
  },
  
  scannerInput: {
    flex: 1,
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  
  scanButton: {
    padding: '0.875rem 2rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'all 0.2s',
  } as React.CSSProperties,
  
  rfidInfo: {
    marginTop: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  rfidLabel: {
    color: '#6b7280',
    fontSize: '0.875rem',
  },
  
  rfidCode: {
    backgroundColor: '#f3f4f6',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    color: '#374151',
  },
  
  statusCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem 2rem',
    margin: '0 2rem',
    borderRadius: '8px',
    border: '2px solid',
  } as React.CSSProperties,
  
  statusIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '0.75rem',
  },
  
  dynamicContent: {
    padding: '2rem',
  },
  
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    textAlign: 'center' as const,
  },
  
  emptyStateIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  
  emptyStateText: {
    color: '#6b7280',
    fontSize: '1.125rem',
    lineHeight: 1.6,
  },
  
  userCard: {
    // All content is now inside dynamicContent
  },
  
  userHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    marginBottom: '2rem',
  },
  
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: 600,
  },
  
  userInfo: {
    flex: 1,
  },
  
  userName: {
    margin: '0 0 0.5rem 0',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#1f2937',
  },
  
  balanceContainer: {
    marginTop: '0.5rem',
  },
  
  balanceLabel: {
    fontSize: '0.875rem',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  
  balanceAmount: {
    fontSize: '3rem',
    fontWeight: 800,
    color: '#10b981',
    marginTop: '0.25rem',
  },
  
  transactionSection: {
    backgroundColor: '#f9fafb',
    padding: '1.5rem',
    borderRadius: '8px',
  },
  
  amountInputContainer: {
    position: 'relative' as const,
    marginBottom: '1rem',
  },
  
  currencySymbol: {
    position: 'absolute' as const,
    left: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#4f46e5',
  },
  
  amountInput: {
    width: '100%',
    padding: '1rem 1rem 1rem 3rem',
    fontSize: '1.5rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    textAlign: 'right' as const,
  } as React.CSSProperties,
  
  amountHint: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginTop: '0.5rem',
    textAlign: 'right' as const,
  },
  
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1.5rem',
  },
  
  primaryButton: {
    flex: 1,
    padding: '1rem',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  
  secondaryButton: {
    flex: 1,
    padding: '1rem',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  } as React.CSSProperties,
  
  newUserCard: {
    // All content is now inside dynamicContent
  },
  
  rfidDisplay: {
    backgroundColor: '#f3f4f6',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  
  formGroup: {
    marginBottom: '1.5rem',
  },
  
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#374151',
  },
  
  input: {
    width: '100%',
    padding: '0.875rem 1rem',
    fontSize: '1rem',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  
  createButton: {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 600,
    marginTop: '1rem',
    transition: 'all 0.2s',
  } as React.CSSProperties,
  
  footer: {
    textAlign: 'center' as const,
    padding: '1.5rem',
    color: '#6b7280',
    fontSize: '0.875rem',
    backgroundColor: '#f1f5f9',
  },
  
  footerText: {
    margin: 0,
  },
};

// Add CSS animation for spinner
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);