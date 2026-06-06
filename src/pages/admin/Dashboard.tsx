import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Ticket, MessageSquare, Briefcase, IndianRupee, TrendingUp, Award, Slash, Target } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { userService } from "../../services/userService";
import { ticketService } from "../../services/ticketService";
import { leadService } from "../../services/leadService";

export function AdminDashboard() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({
    users: 0,
    tickets: 0,
    leads: 0,
    newLeads: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
    lostLeads: 0,
    conversionRate: "0.0",
    totalPotentialRevenue: 0,
    monthlyLeadGrowth: "0.0"
  });

  useEffect(() => {
    // We could listen to storage events or just grab on mount and interval
    const updateStats = async () => {
      // For now keep leadService synchronous if it hasn't been migrated
      const allLeads = leadService.getAll();
      const wonLeadsInfo = allLeads.filter(l => l.status === 'Won');
      const wonLeads = wonLeadsInfo.length;
      const lostLeads = allLeads.filter(l => l.status === 'Lost').length;
      const convertedOrLost = wonLeads + lostLeads;
      const conversionRate = convertedOrLost > 0 ? ((wonLeads / convertedOrLost) * 100).toFixed(1) : "0.0";
      
      const totalPotentialRevenue = allLeads.filter(l => l.status !== 'Lost').reduce((sum, l) => sum + (l.budget || 0), 0);
      
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;
      
      const leadsThisMonth = allLeads.filter(l => l.createdAt > thirtyDaysAgo).length;
      const leadsLastMonth = allLeads.filter(l => l.createdAt > sixtyDaysAgo && l.createdAt <= thirtyDaysAgo).length;
      
      let monthlyLeadGrowth = "0.0";
      if (leadsLastMonth > 0) {
        monthlyLeadGrowth = (((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100).toFixed(1);
      } else if (leadsThisMonth > 0) {
        monthlyLeadGrowth = "100.0";
      }

      const users = userService.getAll();
      const tickets = ticketService.getAll();

      setStats({
        users: users.length,
        tickets: tickets.length,
        leads: allLeads.length,
        newLeads: allLeads.filter(l => l.status === 'New').length,
        qualifiedLeads: allLeads.filter(l => l.status === 'Qualified').length,
        wonLeads,
        lostLeads,
        conversionRate,
        totalPotentialRevenue,
        monthlyLeadGrowth,
      });
    };
    
    updateStats();
    
    // Auto update periodically to keep stats fresh
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.name}. System overview.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tickets}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leads}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col space-y-2 mt-8">
        <h3 className="text-xl font-semibold tracking-tight">Lead Analytics</h3>
      </div>
      
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-indigo-500/10 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-400">Total Potential Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-100">₹{stats.totalPotentialRevenue.toLocaleString('en-IN')}</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/10 border-emerald-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-400">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-100">{stats.conversionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Leads</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Qualified Leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qualifiedLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Won Leads</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.wonLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lost Leads</CardTitle>
            <Slash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lostLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyLeadGrowth}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

