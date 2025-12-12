import { History, Minus, Plus, UserPlus } from "lucide-react";
import type { Transaction } from "../types";

interface RecentTransactionsProps {
  transactions: Transaction[];
  onUserClick?: (userId: number) => void;
}

export function RecentTransactions({ transactions, onUserClick }: RecentTransactionsProps) {
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'ADD':
        return <Plus className="h-4 w-4" />;
      case 'DEDUCT':
        return <Minus className="h-4 w-4" />;
      case 'NEW_USER':
        return <UserPlus className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'ADD':
        return 'text-green-600 bg-green-100';
      case 'DEDUCT':
        return 'text-red-600 bg-red-100';
      case 'NEW_USER':
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getTransactionText = (type: Transaction['type']) => {
    switch (type) {
      case 'ADD':
        return 'Balance added';
      case 'DEDUCT':
        return 'Balance deducted';
      case 'NEW_USER':
        return 'New user created';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No transactions yet</p>
            </div>
          ) : (
            transactions.map((txn) => (
              <div 
                key={txn.id} 
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getTransactionColor(txn.type)}`}>
                    {getTransactionIcon(txn.type)}
                  </div>
                  <div>
                    <button
                      onClick={() => onUserClick?.(txn.userId)}
                      className="font-medium text-gray-800 hover:text-blue-600 text-left"
                    >
                      {txn.userName}
                    </button>
                    <p className="text-sm text-gray-500">
                      {getTransactionText(txn.type)}
                      {txn.adminName && ` by ${txn.adminName}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getTransactionColor(txn.type)}`}>
                    {txn.type === 'ADD' ? '+' : txn.type === 'DEDUCT' ? '-' : ''}₹{txn.amount}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(txn.timestamp)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}