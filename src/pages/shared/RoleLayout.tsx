import React from "react";
import { useAuth } from "../../lib/auth";
import { Navigate } from "react-router-dom";
import { Sidebar } from "../../components/Sidebar";
import { MobileSidebar } from "../../components/MobileSidebar";
import { LayoutDashboard, MessageSquare, Ticket, FileText, Settings, Users, Briefcase } from "lucide-react";
import { UserRole } from "../../services/userService";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatSlidebar } from "./ChatSlidebar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function RoleLayout({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: UserRole[] }) {
  const { user, loading, logout } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/access-denied" />;

  let sidebarItems: any[] = [];
  
  if (user.role === 'customer') {
    sidebarItems = [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Customer Bot", url: "/chat", icon: MessageSquare },
      { title: "My Tickets", url: "/tickets", icon: Ticket },
      { title: "My Conversations", url: "/conversations", icon: MessageSquare },
      { title: "Profile", url: "/profile", icon: Settings },
    ];
  } else if (user.role === 'employee') {
    sidebarItems = [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Employee Bot", url: "/chat", icon: MessageSquare },
      { title: "Assigned Tickets", url: "/tickets", icon: Ticket },
      { title: "Assigned Leads", url: "/leads", icon: Briefcase },
      { title: "Knowledge Base", url: "/kb", icon: FileText },
      { title: "Support Workspace", url: "/workspace", icon: Briefcase },
    ];
  } else if (user.role === 'admin') {
    sidebarItems = [
      { title: "Admin Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Admin Bot", url: "/chat", icon: MessageSquare },
      { title: "User Management", url: "/users", icon: Users },
      { title: "Lead Management", url: "/leads", icon: Briefcase },
      { title: "Ticket Management", url: "/tickets", icon: Ticket },
      { title: "Conversations", url: "/conversations", icon: MessageSquare },
      { title: "Profile", url: "/profile", icon: Settings },
    ];
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      <Sidebar items={sidebarItems} />
      <div className="flex-1 flex flex-col md:pl-64 h-full relative z-10 w-full overflow-hidden">
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/10 bg-[#070708]/50 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <MobileSidebar items={sidebarItems} />
            <h1 className="font-semibold text-lg hidden sm:block">MADZASSIST AI - {user.role.toUpperCase()}</h1>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-primary/20 hover:ring-primary/50 transition-all">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-semibold">{user.name}</div>
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">{user.email}</div>
                <DropdownMenuItem onClick={logout} className="text-red-500 mt-2 cursor-pointer">
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 flex flex-col relative min-h-0">
          {children}
        </main>
        <ChatSlidebar />
      </div>
    </div>
  );
}
