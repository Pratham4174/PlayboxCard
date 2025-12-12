import { Scan } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

interface ScannerSectionProps {
  cardUid: string;
  activeUid: string;
  onCardUidChange: (uid: string) => void;
  onScan: (uid: string) => void;
}

export function ScannerSection({
  cardUid,
  activeUid,
  onCardUidChange,
  onScan,
}: ScannerSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          RFID Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter RFID UID or tap card"
            value={cardUid}
            onChange={(e) => onCardUidChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onScan(cardUid)}
            className="flex-1"
          />
          <Button
            onClick={() => onScan(cardUid)}
            disabled={!cardUid.trim()}
          >
            Scan
          </Button>
        </div>

        {activeUid && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">RFID UID:</span>
            <Badge variant="secondary" className="font-mono text-sm">
              {activeUid}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}