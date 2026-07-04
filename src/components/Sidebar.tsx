import { LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarDemoProps {
  items: { title: string; url: string; icon: LucideIcon }[];
}

export function Sidebar({ items }: SidebarDemoProps) {
  const location = useLocation();

  return (
    <div className="w-64 border-r border-white/10 bg-sidebar hidden md:flex flex-col h-screen fixed inset-y-0 left-0 z-50">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg accent-gradient flex items-center justify-center font-bold text-white">M</div>
        <h1 className="text-xl font-bold tracking-tight text-white">MADZASSIST</h1>
      </div>
      <div className="px-4 py-2 flex-1">
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 transition-all hover:bg-white/5 hover:text-white relative",
                location.pathname === item.url
                  ? "bg-indigo-500/15 text-indigo-400 font-medium"
                  : "text-slate-400"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
              {location.pathname === item.url && (
                <div className="absolute inset-y-0 right-0 w-[3px] rounded-l-md bg-indigo-500" />
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
