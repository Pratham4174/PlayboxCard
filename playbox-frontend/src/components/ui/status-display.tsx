import { AlertCircle, AlertTriangle, CheckCircle, Info } from "lucide-react";
import type { StatusType } from "../../types";
import { Alert, AlertDescription } from "../ui/alert";

interface StatusDisplayProps {
  status: StatusType;
}

export function StatusDisplay({ status }: StatusDisplayProps) {
  const getIcon = () => {
    switch (status.type) {
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getVariant = () => {
    switch (status.type) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      case "warning":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Alert variant={getVariant()}>
      {getIcon()}
      <AlertDescription>{status.text}</AlertDescription>
    </Alert>
  );
}