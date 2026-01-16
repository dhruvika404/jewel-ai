import { formatDisplayDate, getFollowUpColor } from "@/lib/utils";

interface FollowUpSummary {
  uuid: string;
  clientCode: string;
  status: string;
  nextFollowUpDate: string;
  lastFollowUpDate: string;
  lastFollowUpMsg: string;
}

interface FollowUpCellProps {
  data?: FollowUpSummary;
  variant?: "default" | "compact";
}

export function FollowUpCell({ data, variant = "default" }: FollowUpCellProps) {
  if (!data || data.status === "completed") {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  const colorClass = getFollowUpColor(data.nextFollowUpDate);

  if (variant === "compact") {
    return (
      <div className={`flex flex-col gap-0.5 p-1.5 rounded ${colorClass}`}>
        <span className="text-xs font-medium text-gray-700 line-clamp-1">
          {data.lastFollowUpMsg}
        </span>
        <span className="text-[10px] text-gray-500">
          Next: {formatDisplayDate(data.nextFollowUpDate)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 min-w-[200px] p-2 rounded ${colorClass}`}>
      <div className="flex items-start gap-1">
        <span
          className="text-sm font-medium text-gray-700 line-clamp-2"
          title={data.lastFollowUpMsg}
        >
          {data.lastFollowUpMsg}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-gray-500">
        {data.lastFollowUpDate && (
          <span className="whitespace-nowrap">
            Last Follow up: {formatDisplayDate(data.lastFollowUpDate)}
          </span>
        )}
        {data.nextFollowUpDate && (
          <span className="whitespace-nowrap font-medium text-blue-600">
            Next Follow up: {formatDisplayDate(data.nextFollowUpDate)}
          </span>
        )}
      </div>
    </div>
  );
}
