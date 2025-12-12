import { ArrowUpDown, Filter, Search } from "lucide-react";
import type { PlayBoxUser } from "../types";

interface EnhancedSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterBalance: 'ALL' | 'LOW' | 'HIGH';
  onFilterChange: (filter: 'ALL' | 'LOW' | 'HIGH') => void;
  sortBy: 'NAME' | 'BALANCE' | 'RECENT';
  onSortChange: (sort: 'NAME' | 'BALANCE' | 'RECENT') => void;
  users: PlayBoxUser[];
  filteredUsers: PlayBoxUser[];
  onUserClick: (user: PlayBoxUser) => void;
}

export function EnhancedSearch({
  searchTerm,
  onSearchChange,
  filterBalance,
  onFilterChange,
  sortBy,
  onSortChange,
  users,
  filteredUsers,
  onUserClick
}: EnhancedSearchProps) {
  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            placeholder="Search by name, phone, or RFID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterBalance}
              onChange={(e) => onFilterChange(e.target.value as 'ALL' | 'LOW' | 'HIGH')}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
            >
              <option value="ALL">All Balances</option>
              <option value="LOW">Low Balance (&lt; ₹500)</option>
              <option value="HIGH">High Balance (&gt; ₹1000)</option>
            </select>
          </div>
          
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as 'NAME' | 'BALANCE' | 'RECENT')}
              className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
            >
              <option value="RECENT">Most Recent</option>
              <option value="NAME">Name A-Z</option>
              <option value="BALANCE">Balance High-Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Search Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {filteredUsers.length} of {users.length} users
          {searchTerm && (
            <span className="ml-2">
              for "<span className="font-medium">{searchTerm}</span>"
            </span>
          )}
        </div>
        <div className="space-x-4">
          <span>Filter: {filterBalance === 'ALL' ? 'All' : filterBalance}</span>
          <span>Sort: {sortBy.replace('_', ' ')}</span>
        </div>
      </div>

      {/* Filtered Results Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RFID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No users found matching your criteria
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onUserClick(user)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    {user.email && (
                      <div className="text-sm text-gray-500">{user.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-gray-900">{user.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                      {user.cardUid}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">
                      ₹{user.balance.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.balance < 500
                        ? 'bg-red-100 text-red-800'
                        : user.balance > 1000
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.balance < 500 ? 'Low' : user.balance > 1000 ? 'High' : 'Medium'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-700">{filteredUsers.length}</div>
          <div className="text-sm text-blue-600">Users Found</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-700">
            ₹{filteredUsers.reduce((sum, user) => sum + user.balance, 0).toLocaleString()}
          </div>
          <div className="text-sm text-green-600">Total Balance</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-700">
            {filteredUsers.filter(u => u.balance < 500).length}
          </div>
          <div className="text-sm text-purple-600">Low Balance</div>
        </div>
      </div>
    </div>
  );
}