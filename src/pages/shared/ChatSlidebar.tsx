import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User as UserIcon, MessageSquare } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { userService } from "../../services/userService";
import { ticketService } from "../../services/ticketService";
import { conversationService } from "../../services/conversationService";
import { leadService } from "../../services/leadService";

interface Message {
  role: "user" | "model" | "system";
  content: string;
}

export function ChatSlidebar() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // user is considered at bottom if they are within 50px of the bottom
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
  };

  useEffect(() => {
    if (messagesEndRef.current && open && isAtBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const botName = user?.role === 'customer' 
    ? "Customer Support Bot" 
    : user?.role === 'employee' 
      ? "Employee Assistant" 
      : "Admin Co-Pilot";

  const sendMessage = async () => {
    const text = input;
    if (!text.trim() || loading) return;
    
    setInput("");
    setLoading(true);
    
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);

    try {
      const contextData: any = {};
      
      if (user?.role === 'admin') {
         contextData.usersCount = userService.getAll().length;
         contextData.ticketsCount = ticketService.getAll().length;
         contextData.conversationsCount = conversationService.getAll().length;
         contextData.leadsCount = leadService.getAll().length;
         contextData.users = userService.getAll();
         contextData.tickets = ticketService.getAll();
         contextData.conversations = conversationService.getAll();
         contextData.leads = leadService.getAll();
      } else if (user?.role === 'employee') {
         contextData.assignedTickets = ticketService.getByAssignee(user.id);
      } else if (user?.role === 'customer') {
         contextData.myTickets = ticketService.getByOwner(user.id);
         contextData.myConversations = conversationService.getByOwner(user.id);
         contextData.myProfile = { name: user.name, email: user.email, id: user.id };
      }

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, role: user?.role, contextData })
      });
      
      if (!response.ok) throw new Error("Failed to chat");
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      
      if (!reader) return;
      
      let botMessage = "";
      setMessages([...newMessages, { role: "model", content: "" }]);
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "");
            if (dataStr === "{}") continue;
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                botMessage += data.text;
                setMessages(prev => {
                   const updated = [...prev];
                   updated[updated.length - 1].content = botMessage;
                   return updated;
                });
              }
            } catch (e) {}
          }
        }
      }

      // Check if message contains CREATE_TICKET
      if (botMessage.includes('"_action_": "CREATE_TICKET"')) {
         try {
           const match = botMessage.match(/```json\n([\s\S]*?)\n```/);
           if (match && match[1]) {
             const jsonCommand = JSON.parse(match[1]);
             if (jsonCommand._action_ === "CREATE_TICKET") {
                const newTicket = ticketService.create({
                   title: jsonCommand.title || "Support Ticket",
                   description: jsonCommand.description || "No description provided",
                   category: jsonCommand.category || "Other",
                   priority: jsonCommand.priority || "Medium",
                   ownerId: user?.id || "unknown",
                   customerName: jsonCommand.customerName || user?.name,
                   customerEmail: jsonCommand.customerEmail || user?.email,
                   customerPhone: jsonCommand.customerPhone
                });
                
                // Replace the json block with a clean message
                botMessage = botMessage.replace(/```json\n[\s\S]*?\n```/, `✅ **Ticket Created Successfully!**\nYour Ticket ID is: **${newTicket.id}**\n\nOur team will review it shortly.`);
                
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1].content = botMessage;
                  return updated;
                });
             }
           }
         } catch (e) {
           console.error("Failed to parse CREATE_TICKET json", e);
         }
      }

    } catch (error: any) {
        setMessages([...newMessages, { role: "system", content: "Error: " + error.message }]);
    } finally {
        setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={
        <Button size="icon" className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl accent-gradient z-50" />
      }>
        <MessageSquare className="h-6 w-6 text-white" />
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full border-l border-white/10 glass-card">
        <SheetHeader className="p-4 border-b border-white/5 bg-black/20 shrink-0">
          <SheetTitle className="flex items-center gap-2">
             <Bot className="h-5 w-5 text-indigo-400" />
             {botName}
          </SheetTitle>
        </SheetHeader>
        
        <div 
          className="flex-1 p-4 overflow-y-auto"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 h-[300px] text-center text-muted-foreground">
                <Bot className="h-10 w-10 text-white/20" />
                <p className="text-sm">Hi {user.name}, how can I help you today?</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "accent-gradient text-white" : "bg-white/10"}`}>
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[80%] whitespace-pre-wrap ${m.role === "user" ? "bg-indigo-500/20 text-indigo-100 rounded-tr-none text-right" : "bg-white/5 text-slate-300 rounded-tl-none"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== "model" && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-white/10">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-white/5 text-slate-300 rounded-tl-none text-sm animate-pulse border border-indigo-500/20">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/5 bg-[#0d0d0f]/50 shrink-0">
          <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2 relative">
            <Input 
                value={input} 
                onChange={e => setInput(e.target.value)} 
                placeholder="Type a message..." 
                className="w-full bg-black/40 border border-white/10 rounded-full text-white px-4 h-12 text-sm pr-12 focus-visible:ring-indigo-500"
            />
            <Button type="submit" size="icon" className="absolute right-1 top-1 h-10 w-10 rounded-full accent-gradient" disabled={!input.trim() || loading}>
                <Send className="h-4 w-4 text-white" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
