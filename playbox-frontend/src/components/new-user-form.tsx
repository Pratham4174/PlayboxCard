import { CreditCard, Loader2, Mail, Phone, User, UserPlus } from "lucide-react";
import { useState } from "react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface NewUserFormProps {
  activeUid: string;
  onCreateUser: (data: {
    name: string;
    phone: string;
    email?: string;
  }) => Promise<void>;
}

export function NewUserForm({ activeUid, onCreateUser }: NewUserFormProps) {
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newName.trim() || !newPhone.trim()) return;
    
    setLoading(true);
    try {
      await onCreateUser({
        name: newName,
        phone: newPhone,
        email: newEmail || undefined,
      });
      
      // Reset form on success
      setNewName("");
      setNewPhone("");
      setNewEmail("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create New User
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* RFID Display */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">RFID UID:</span>
          </div>
          <Badge variant="secondary" className="font-mono">
            {activeUid}
          </Badge>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Full Name *
            </Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="phone"
              placeholder="Enter phone number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email (Optional)
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !newName.trim() || !newPhone.trim()}
          size="lg"
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating User...
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User Profile
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}