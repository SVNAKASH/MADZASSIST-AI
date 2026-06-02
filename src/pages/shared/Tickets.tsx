import React, { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { ticketService, Ticket, TicketStatus, TicketPriority } from "../../services/ticketService";
import { userService, User } from "../../services/userService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket as TicketIcon, Clock, Plus, User as UserIcon, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  
  // Create Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("Medium");

  // Admin/Employee lists
  const [employees, setEmployees] = useState<User[]>([]);

  useEffect(() => {
    if (!user) return;
    loadTickets();
    if (user.role === "admin") {
       setEmployees(userService.getAll().filter(u => u.role === "employee" || u.role === "admin"));
    }
  }, [user]);

  const [search, setSearch] = useState("");

  const loadTickets = () => {
    let loadedTickets = [];
    if (user?.role === 'customer') {
      loadedTickets = ticketService.getByOwner(user.id);
    } else if (user?.role === 'employee') {
      loadedTickets = ticketService.getByAssignee(user.id);
    } else {
      loadedTickets = ticketService.getAll();
    }
    setTickets(loadedTickets.sort((a,b) => b.createdAt - a.createdAt));
  };

  const filteredTickets = tickets.filter(t => {
     if (!search) return true;
     const s = search.toLowerCase();
     return t.title.toLowerCase().includes(s) || 
            t.id.toLowerCase().includes(s) || 
            (t.customerName?.toLowerCase() || '').includes(s) || 
            (t.customerEmail?.toLowerCase() || '').includes(s) ||
            t.status.toLowerCase().includes(s) ||
            t.priority.toLowerCase().includes(s);
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !description.trim()) return;

    ticketService.create({
      title,
      description,
      priority,
      ownerId: user.id,
      customerName: user.name,
      customerEmail: user.email,
    });

    setTitle("");
    setDescription("");
    setPriority("Medium");
    setIsCreateOpen(false);
    loadTickets();
  };

  const handleUpdateStatus = (ticketId: string, status: TicketStatus) => {
    ticketService.update(ticketId, { status });
    loadTickets();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket({ ...selectedTicket, status });
    }
  };
  
  const handleAssign = (ticketId: string, assignedToId: string) => {
    ticketService.update(ticketId, { assignedToId });
    loadTickets();
    if (selectedTicket?.id === ticketId) {
       setSelectedTicket({ ...selectedTicket, assignedToId });
    }
  };

  const handleUpdateNotes = (ticketId: string, notes: string) => {
    ticketService.update(ticketId, { resolutionNotes: notes });
    loadTickets();
    if (selectedTicket?.id === ticketId) {
       setSelectedTicket({ ...selectedTicket, resolutionNotes: notes });
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch(status) {
      case 'Open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'In Progress': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'Resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Closed': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      default: return 'bg-primary/10 text-primary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
          <p className="text-muted-foreground">Manage and track support tickets.</p>
        </div>
        <div className="flex items-center gap-4">
        {(user?.role === 'admin' || user?.role === 'employee') && (
          <Input 
             placeholder="Search by ID, name, email, status..." 
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="w-64 bg-white/5 border-white/10"
          />
        )}
        {user?.role === 'customer' && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={<Button className="accent-gradient" />}>
               <><Plus className="h-4 w-4 mr-2" /> Create Ticket</>
            </DialogTrigger>
            <DialogContent className="glass-card border-none text-white sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input 
                    required 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Brief summary of issue" 
                    className="bg-black/30 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v: TicketPriority) => setPriority(v)}>
                    <SelectTrigger className="bg-black/30 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    required 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Detailed description..." 
                    className="h-32 bg-black/30 border-white/10"
                  />
                </div>
                <Button type="submit" className="w-full accent-gradient">Submit Ticket</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-1 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
          {filteredTickets.length === 0 ? (
            <Card className="border-dashed bg-black/10 border-white/10">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <TicketIcon className="h-8 w-8 mb-4 opacity-20" />
                <p>No tickets found.</p>
              </CardContent>
            </Card>
          ) : (
            filteredTickets.map(ticket => (
              <Card 
                key={ticket.id} 
                onClick={() => setSelectedTicket(ticket)}
                className={`cursor-pointer transition-colors border-white/5 ${selectedTicket?.id === ticket.id ? 'bg-white/10 border-white/20' : 'bg-black/20 hover:bg-white/5'}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                       <h3 className="font-medium text-sm line-clamp-1">{ticket.id}: {ticket.title}</h3>
                       <Badge variant="outline" className={`text-[10px] items-center px-1.5 py-0 ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                       </Badge>
                    </div>
                    {user?.role !== 'customer' && ticket.customerName && (
                       <div className="text-xs text-muted-foreground">{ticket.customerName}</div>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                       <span>{ticket.priority}</span>
                       <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="md:col-span-2">
           {selectedTicket ? (
             <Card className="glass-card border-none h-full flex flex-col">
               <CardContent className="p-6 flex-1 space-y-6">
                 <div className="flex items-start justify-between border-b border-white/10 pb-6">
                   <div className="space-y-1">
                     <h2 className="text-2xl font-bold">{selectedTicket.id}: {selectedTicket.title}</h2>
                     <div className="flex items-center gap-3 text-sm text-muted-foreground">
                       <Badge variant="outline" className={`uppercase tracking-wider ${getStatusColor(selectedTicket.status)}`}>
                         {selectedTicket.status}
                       </Badge>
                       <Badge variant="outline" className="border-white/10 bg-white/5">
                         {selectedTicket.priority}
                       </Badge>
                       <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                     </div>
                   </div>
                 </div>

                 {(user?.role === 'admin' || user?.role === 'employee') && (
                    <div className="bg-black/20 p-4 rounded-lg border border-white/5 space-y-2">
                       <h4 className="text-sm font-semibold text-indigo-400 flex items-center gap-2"><UserIcon className="h-4 w-4" /> Customer Details</h4>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Name</p>
                            <p>{selectedTicket.customerName || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Email</p>
                            <p>{selectedTicket.customerEmail || 'Unknown'}</p>
                          </div>
                          {selectedTicket.customerPhone && (
                             <div>
                               <p className="text-muted-foreground text-xs">Phone</p>
                               <p>{selectedTicket.customerPhone}</p>
                             </div>
                          )}
                          {selectedTicket.category && (
                             <div>
                               <p className="text-muted-foreground text-xs">Category</p>
                               <p>{selectedTicket.category}</p>
                             </div>
                          )}
                       </div>
                    </div>
                 )}

                 <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Description</h4>
                      <p className="text-sm whitespace-pre-wrap bg-black/20 p-4 rounded-lg border border-white/5">{selectedTicket.description}</p>
                    </div>
                    
                    {(user?.role === 'admin' || user?.role === 'employee') && (
                      <div className="pt-6 border-t border-white/10 space-y-4">
                         <h4 className="text-sm font-medium text-muted-foreground">Management Controls</h4>
                         <div className="flex items-center gap-4">
                           <div className="flex-1 space-y-1.5">
                             <Label className="text-xs">Update Status</Label>
                             <Select 
                                value={selectedTicket.status} 
                                onValueChange={(v: TicketStatus) => handleUpdateStatus(selectedTicket.id, v)}
                              >
                                <SelectTrigger className="bg-black/30 border-white/10">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Open">Open</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Resolved">Resolved</SelectItem>
                                  <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                           </div>
                           
                           {user?.role === 'admin' && (
                             <div className="flex-1 space-y-1.5">
                               <Label className="text-xs">Assign To</Label>
                               <Select 
                                  value={selectedTicket.assignedToId || "unassigned"} 
                                  onValueChange={(v) => handleAssign(selectedTicket.id, v === "unassigned" ? "" : v)}
                                >
                                  <SelectTrigger className="bg-black/30 border-white/10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {employees.map(emp => (
                                      <SelectItem key={emp.id} value={emp.id}>{emp.name} ({emp.role})</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                             </div>
                           )}
                         </div>
                         
                         <div className="space-y-1.5">
                            <Label className="text-xs">Resolution Notes (Visible to Customer)</Label>
                            <Textarea 
                               className="bg-black/30 border-white/10 min-h-[100px]"
                               placeholder="Add notes..."
                               value={selectedTicket.resolutionNotes || ""}
                               onChange={e => setSelectedTicket({ ...selectedTicket, resolutionNotes: e.target.value })}
                               onBlur={e => handleUpdateNotes(selectedTicket.id, e.target.value)}
                            />
                         </div>
                      </div>
                    )}

                    {user?.role === 'customer' && selectedTicket.resolutionNotes && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-indigo-400 mb-2 flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Message from Support</h4>
                        <p className="text-sm whitespace-pre-wrap bg-indigo-500/10 p-4 rounded-lg border border-indigo-500/20 text-indigo-100">{selectedTicket.resolutionNotes}</p>
                      </div>
                    )}
                 </div>
               </CardContent>
             </Card>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-xl bg-white/5 min-h-[400px]">
                <TicketIcon className="h-12 w-12 mb-4 opacity-20" />
                <p>Select a ticket to view details</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
