import { ArrowLeft, Search, Users } from "lucide-react";
import { useState } from "react";
import type { PlayBoxUser } from "../types";
import { api } from "../utils/api";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";

interface AdminPanelProps {
  onSelectUser: (user: PlayBoxUser) => void;
  onClose: () => void;
}

export function AdminPanel({ onSelectUser, onClose }: AdminPanelProps) {
  const [searchPhone, setSearchPhone] = useState("");
  const [adminUsers, setAdminUsers] = useState<PlayBoxUser[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const users = await api.getAllUsers();
      setAdminUsers(users);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchPhone.trim()) return;
    
    try {
      setLoading(true);
      const user = await api.searchByPhone(searchPhone);
      onSelectUser(user);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Admin Panel
          </CardTitle>
          <Button variant="outline" onClick={onClose} size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to RFID
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Section */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone number"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !searchPhone.trim()}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button
            onClick={loadAllUsers}
            variant="outline"
            disabled={loading}
          >
            <Users className="h-4 w-4 mr-2" />
            Load All Users
          </Button>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>RFID</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => {
                    onSelectUser(user);
                    onClose();
                  }}
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {user.cardUid}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{user.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {adminUsers.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No users found. Click "Load All Users" to display users.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}