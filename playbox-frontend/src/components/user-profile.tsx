import { User } from "lucide-react";

import { TransactionSection } from "./transaction-section";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";

interface UserProfileProps {
  name: string;
  balance: number;
  activeUid: string;
  onAddBalance: (amount: number) => Promise<void>;
  onDeductBalance: (amount: number) => Promise<void>;
}

export function UserProfile({
  name,
  balance,
  activeUid,
  onAddBalance,
  onDeductBalance,
}: UserProfileProps) {
  return (
    <div className="space-y-6">
      {/* User Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold">{name}</h2>
                <Badge variant="outline" className="font-mono text-xs">
                  {activeUid}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <div className="text-4xl font-bold text-green-600">
                  ₹{balance.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Section */}
      <TransactionSection
        onAddBalance={onAddBalance}
        onDeductBalance={onDeductBalance}
      />
    </div>
  );
}