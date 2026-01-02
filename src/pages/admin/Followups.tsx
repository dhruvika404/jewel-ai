import { useEffect } from "react";
import { usePageHeader } from "@/contexts/PageHeaderProvider";

export default function Followups() {
  const { setHeader } = usePageHeader();

  useEffect(() => {
    setHeader({
      title: "Follow Ups",
    });
  }, []);

  return <div className="p-6 space-y-8">Follow Ups</div>;
}
