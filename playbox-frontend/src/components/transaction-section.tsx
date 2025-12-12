import { Loader2, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface TransactionSectionProps {
  onAddBalance: (amount: number) => Promise<void>;
  onDeductBalance: (amount: number) => Promise<void>;
}

export function TransactionSection({
  onAddBalance,
  onDeductBalance,
}: TransactionSectionProps) {
  const [amount, setAmount] = useState<number>(500);
  const [isTxnLoading, setIsTxnLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<"add" | "deduct" | null>(null);

  const handleAdd = async () => {
    if (amount < 500) return;
    setIsTxnLoading(true);
    setActiveAction("add");
    try {
      await onAddBalance(amount);
    } finally {
      setIsTxnLoading(false);
      setActiveAction(null);
    }
  };

  const handleDeduct = async () => {
    if (amount <= 0) return;
    setIsTxnLoading(true);
    setActiveAction("deduct");
    try {
      await onDeductBalance(amount);
    } finally {
      setIsTxnLoading(false);
      setActiveAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-2xl font-semibold text-primary">
              ₹
            </span>
            <Input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="pl-10 text-right text-lg py-6"
              placeholder="Enter amount"
            />
          </div>
          <p className="text-sm text-muted-foreground text-right">
            Minimum ₹500 for deposit
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={handleAdd}
            disabled={isTxnLoading || amount < 500}
            size="lg"
            className="h-14"
            variant="default"
          >
            {isTxnLoading && activeAction === "add" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Balance
              </>
            )}
          </Button>
          <Button
            onClick={handleDeduct}
            disabled={isTxnLoading || amount <= 0}
            size="lg"
            className="h-14"
            variant="destructive"
          >
            {isTxnLoading && activeAction === "deduct" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Minus className="h-4 w-4 mr-2" />
                Deduct Balance
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}