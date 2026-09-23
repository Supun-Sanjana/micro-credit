import { ReactNode } from "react";
import { Home, MapPin, History, FileText } from "lucide-react";
import Link from "next/link";
import { OfflineIndicator } from "./OfflineIndicator";

export default function FieldLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col relative pb-16">
      <OfflineIndicator />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-200 flex justify-around p-3 text-gray-500">
        <Link href="/app/field" className="flex flex-col items-center">
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/app/field/centres" className="flex flex-col items-center">
          <MapPin className="w-6 h-6" />
          <span className="text-xs">Centres</span>
        </Link>
        <Link href="/app/field/history" className="flex flex-col items-center">
          <History className="w-6 h-6" />
          <span className="text-xs">History</span>
        </Link>
      </nav>
    </div>
  );
}
