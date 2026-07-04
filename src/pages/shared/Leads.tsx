import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { leadService, Lead, LeadStatus } from "../../services/leadService";
import { userService, User } from "../../services/userService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Clock, Plus, IndianRupee, Search, MoreVertical, LayoutGrid, Target, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function LeadsManagement() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "All">("All");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");
  const [budget, setBudget] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  
  // Admin only
  const [employees, setEmployees] = useState<User[]>([]);

  useEffect(() => {
    if (!user) return;
    loadLeads();
    if (user.role === "admin") {
      setEmployees(userService.getAll().filter(u => u.role === "employee" || u.role === "admin"));
    }
  }, [user]);

  const loadLeads = () => {
    let allLeads: Lead[] = [];
    if (user?.role === 'employee') {
      allLeads = leadService.getByAssignee(user.id);
    } else {
      allLeads = leadService.getAll();
    }
    setLeads(allLeads.sort((a,b) => b.createdAt - a.createdAt));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim() || !email.trim() || !company.trim()) return;

    leadService.create({
      name,
      email,
      phone,
      company,
      industry,
      budget: budget ? parseInt(budget) : undefined,
      source,
      notes,
    });

    setName("");
    setEmail("");
    setPhone("");
    setCompany("");
    setIndustry("");
    setBudget("");
    setSource("");
    setNotes("");
    setIsCreateOpen(false);
    loadLeads();
  };

  const handleUpdateStatus = (leadId: string, status: LeadStatus) => {
    leadService.update(leadId, { status });
    loadLeads();
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, status });
  };
  
  const handleAssign = (leadId: string, assignedToId: string) => {
    leadService.update(leadId, { assignedToId });
    loadLeads();
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, assignedToId });
  };

  const handleUpdateNotes = (leadId: string, updatedNotes: string) => {
    leadService.update(leadId, { notes: updatedNotes });
    loadLeads();
    if (selectedLead?.id === leadId) setSelectedLead({ ...selectedLead, notes: updatedNotes });
  };

  const handleDelete = (leadId: string) => {
    leadService.delete(leadId);
    loadLeads();
    if (selectedLead?.id === leadId) setSelectedLead(null);
  };

  const filteredLeads = leads.filter(l => {
     let matchesSearch = true;
     if (search) {
       matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) || 
                       l.company.toLowerCase().includes(search.toLowerCase()) || 
                       l.email.toLowerCase().includes(search.toLowerCase());
     }
     let matchesStatus = true;
     if (statusFilter !== "All") {
       matchesStatus = l.status === statusFilter;
     }
     return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: LeadStatus) => {
    switch(status) {
      case 'New': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Contacted': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Qualified': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'Demo Scheduled': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'Proposal Sent': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'Negotiation': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Won': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Lost': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-primary/10 text-primary';
    }
  };

  // Prevent customer access - fallback if router doesn't catch
  if (user?.role === 'customer') return <div className="p-4">Access Denied</div>;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Lead Management</h2>
          <p className="text-muted-foreground">Manage leads, track deals and monitor sales pipeline.</p>
        </div>
        
        {user?.role === 'admin' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={<Button className="accent-gradient" />}>
               <><Plus className="h-4 w-4 mr-2" /> Add Lead</>
            </DialogTrigger>
            <DialogContent className="glass-card border-none text-white sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Lead</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input required value={name} onChange={e => setName(e.target.value)} className="bg-black/30 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-black/30 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-black/30 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <Input required value={company} onChange={e => setCompany(e.target.value)} className="bg-black/30 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Input value={industry} onChange={e => setIndustry(e.target.value)} className="bg-black/30 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Budget (₹)</Label>
                    <Input type="number" placeholder="e.g. 500000" value={budget} onChange={e => setBudget(e.target.value)} className="bg-black/30 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Input placeholder="e.g. Website, LinkedIn" value={source} onChange={e => setSource(e.target.value)} className="bg-black/30 border-white/10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Initial Notes</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="h-20 bg-black/30 border-white/10" />
                </div>
                <Button type="submit" className="w-full accent-gradient">Save Lead</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <div className="flex items-center gap-4 shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search leads by name or company..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border-white/10 pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v: LeadStatus | "All") => setStatusFilter(v)}>
          <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
             <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Contacted">Contacted</SelectItem>
            <SelectItem value="Qualified">Qualified</SelectItem>
            <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
            <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
            <SelectItem value="Negotiation">Negotiation</SelectItem>
            <SelectItem value="Won">Won</SelectItem>
            <SelectItem value="Lost">Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-3 flex-1 min-h-0">
        <div className="md:col-span-1 space-y-3 overflow-y-auto pr-2 pb-4">
          {filteredLeads.length === 0 ? (
            <Card className="border-dashed bg-black/10 border-white/10 mt-4">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Target className="h-8 w-8 mb-4 opacity-20" />
                <p>No leads found matching criteria.</p>
              </CardContent>
            </Card>
          ) : (
            filteredLeads.map(lead => (
              <Card 
                key={lead.id} 
                onClick={() => setSelectedLead(lead)}
                className={`cursor-pointer transition-colors border-white/5 ${selectedLead?.id === lead.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-black/20 hover:bg-white/5'}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                       <h3 className="font-semibold text-sm line-clamp-1">{lead.company}</h3>
                       <Badge variant="outline" className={`text-[10px] items-center px-1.5 py-0 whitespace-nowrap ${getStatusColor(lead.status)}`}>
                          {lead.status}
                       </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-1">{lead.name}</div>
                    <div className="flex items-center justify-between mt-1">
                       <div className="flex items-center text-xs font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {lead.budget ? lead.budget.toLocaleString('en-IN') : '--'}
                       </div>
                       <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                         <Clock className="h-3 w-3" /> {new Date(lead.createdAt).toLocaleDateString()}
                       </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="md:col-span-2 relative min-h-[400px]">
           {selectedLead ? (
             <Card className="glass-card border-none h-full flex flex-col absolute inset-0">
               <CardContent className="p-6 flex-1 flex flex-col overflow-hidden">
                 <div className="flex items-start justify-between border-b border-white/10 pb-6 shrink-0">
                   <div className="space-y-1 w-full">
                     <div className="flex items-start justify-between">
                       <h2 className="text-2xl font-bold">{selectedLead.company}</h2>
                       <Badge variant="outline" className={`uppercase tracking-wider px-2 py-1 ${getStatusColor(selectedLead.status)}`}>
                         {selectedLead.status}
                       </Badge>
                     </div>
                     <div className="text-slate-400 text-sm flex items-center gap-2">
                        <span>{selectedLead.name}</span>
                        <span>•</span>
                        <a href={`mailto:${selectedLead.email}`} className="text-indigo-400 hover:underline">{selectedLead.email}</a>
                        {selectedLead.phone && (
                          <>
                            <span>•</span>
                            <span>{selectedLead.phone}</span>
                          </>
                        )}
                     </div>
                   </div>
                 </div>

                 <div className="flex-1 overflow-y-auto py-4 space-y-6 pr-2">
                    <div className="grid grid-cols-2 gap-6 bg-black/20 p-4 rounded-xl border border-white/5">
                       <div>
                         <Label className="text-xs text-muted-foreground">Industry</Label>
                         <p className="text-sm font-medium">{selectedLead.industry || '--'}</p>
                       </div>
                       <div>
                         <Label className="text-xs text-muted-foreground">Lead Source</Label>
                         <p className="text-sm font-medium">{selectedLead.source || '--'}</p>
                       </div>
                       <div>
                         <Label className="text-xs text-muted-foreground">Budget Estimate</Label>
                         <div className="flex items-center font-bold text-emerald-400">
                           <IndianRupee className="h-4 w-4" />
                           {selectedLead.budget ? selectedLead.budget.toLocaleString('en-IN') : 'Not Specified'}
                         </div>
                       </div>
                       <div>
                         <Label className="text-xs text-muted-foreground">Created</Label>
                         <p className="text-sm">{new Date(selectedLead.createdAt).toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="space-y-4 pt-2">
                         <h4 className="text-sm font-semibold flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-indigo-400" /> Pipeline Controls</h4>
                         <div className="flex items-center gap-4 bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/10">
                           <div className="flex-1 space-y-1.5">
                             <Label className="text-xs">Lead Stage</Label>
                             <Select 
                                value={selectedLead.status} 
                                onValueChange={(v: LeadStatus) => handleUpdateStatus(selectedLead.id, v)}
                              >
                                <SelectTrigger className="bg-black/30 border-white/10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="New">New</SelectItem>
                                  <SelectItem value="Contacted">Contacted</SelectItem>
                                  <SelectItem value="Qualified">Qualified</SelectItem>
                                  <SelectItem value="Demo Scheduled">Demo Scheduled</SelectItem>
                                  <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                                  <SelectItem value="Won">Won</SelectItem>
                                  <SelectItem value="Lost">Lost</SelectItem>
                                </SelectContent>
                              </Select>
                           </div>
                           
                           {user?.role === 'admin' && (
                             <div className="flex-1 space-y-1.5">
                               <Label className="text-xs">Assigned Rep</Label>
                               <Select 
                                  value={selectedLead.assignedToId || "unassigned"} 
                                  onValueChange={(v) => handleAssign(selectedLead.id, v === "unassigned" ? "" : v)}
                                >
                                  <SelectTrigger className="bg-black/30 border-white/10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {employees.map(emp => (
                                      <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                             </div>
                           )}
                           
                           {user?.role === 'admin' && (
                             <div className="flex-none pt-5">
                               <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedLead.id)} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300">
                                  Delete
                               </Button>
                             </div>
                           )}
                         </div>
                    </div>
                    
                    <div className="space-y-2">
                       <Label className="text-sm font-semibold flex items-center gap-2"><Edit className="h-4 w-4 text-indigo-400" /> Internal Notes & History</Label>
                       <Textarea 
                          className="bg-black/20 border-white/10 min-h-[150px] font-medium leading-relaxed"
                          placeholder="Log meeting notes, calls, and updates here..."
                          value={selectedLead.notes || ""}
                          onChange={e => setSelectedLead({ ...selectedLead, notes: e.target.value })}
                          onBlur={e => handleUpdateNotes(selectedLead.id, e.target.value)}
                       />
                       <p className="text-[10px] text-muted-foreground text-right mt-1">Changes are saved automatically when clicking outside.</p>
                    </div>
                 </div>
               </CardContent>
             </Card>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5 absolute inset-0">
                <Briefcase className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a lead from the pipeline to view details.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
