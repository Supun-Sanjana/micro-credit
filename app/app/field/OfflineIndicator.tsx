"use client";
import { useEffect, useState } from "react";

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    setIsOffline(!navigator.onLine);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-[#fce8e6] text-[#c5221f] border-b border-[#f9d2ce] text-[13px] font-medium text-center py-2 px-4 w-full z-50 flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[#c5221f] animate-pulse" />
      Working Offline - Data will sync automatically when online
    </div>
  );
}
