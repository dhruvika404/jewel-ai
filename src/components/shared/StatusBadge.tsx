import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase();

  const getStatusColor = () => {
    switch (normalizedStatus) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-orange-100 text-orange-700";
      case "active":
        return "bg-blue-100 text-blue-700";
      case "inactive":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "text-[10px] px-1.5 py-0.5";
      case "md":
        return "text-xs px-2 py-0.5";
      case "lg":
        return "text-sm px-2.5 py-1";
      default:
        return "text-xs px-2 py-0.5";
    }
  };

  return (
    <Badge className={`${getStatusColor()} ${getSizeClass()} font-medium rounded`}>
      {status}
    </Badge>
  );
}
