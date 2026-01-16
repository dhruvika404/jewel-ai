import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export function LoadingState({
  message = "Loading...",
  size = "md",
  fullScreen = false,
}: LoadingStateProps) {
  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "w-4 h-4";
      case "md":
        return "w-6 h-6";
      case "lg":
        return "w-8 h-8";
      default:
        return "w-6 h-6";
    }
  };

  const containerClass = fullScreen
    ? "flex h-screen items-center justify-center bg-gray-50"
    : "flex items-center justify-center py-8";

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className={`${getSizeClass()} animate-spin text-primary`} />
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}
