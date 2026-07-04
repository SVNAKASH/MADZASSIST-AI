import { useState, useRef, useEffect } from "react";
import { useAuth } from "../lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User as UserIcon, Mic, MicOff } from "lucide-react";
import { userService } from "../services/userService";
import { ticketService } from "../services/ticketService";
import { leadService } from "../services/leadService";

interface Message {
  role: "user" | "model" | "system";
  content: string;
}

export function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
  };

  useEffect(() => {
    if (messagesEndRef.current && isAtBottom) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const customerPrompts = [
    "I have an issue with my recent order",
    "How do I reset my password?",
    "Where can I find documentation?",
    "I need to talk to support"
  ];

  const employeePrompts = [
    "Summarize recent tickets",
    "Find KB article for reset error",
    "Draft a reply to customer",
    "List assigned tasks"
  ];

  const adminPrompts = [
    "How many active users do we have?",
    "How many open tickets exist?",
    "What are the most common support issues?",
    "Generate executive summary report."
  ];

  const presetPrompts = user?.role === 'customer' 
    ? customerPrompts 
    : user?.role === 'employee' 
      ? employeePrompts 
      : adminPrompts;

  const botName = user?.role === 'customer' 
    ? "Customer Support Bot" 
    : user?.role === 'employee' 
      ? "Employee Assistant" 
      : "Admin Co-Pilot";

  const sendMessage = async (overrideInput?: string) => {
    const text = overrideInput || input;
    if (!text.trim() || loading) return;
    
    setInput("");
    setLoading(true);
    
    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);

    try {
      // Gather local context data for the AI to answer role-specific questions
      const contextData: any = {};
      
      if (user?.role === 'admin') {
         contextData.usersCount = userService.getAll().length;
         contextData.ticketsCount = ticketService.getAll().length;
         contextData.leadsCount = leadService.getAll().length;
         contextData.users = userService.getAll();
         contextData.tickets = ticketService.getAll();
         contextData.leads = leadService.getAll();
      } else if (user?.role === 'employee') {
         contextData.assignedTickets = ticketService.getByAssignee(user.id);
      } else if (user?.role === 'customer') {
         contextData.myTickets = ticketService.getByOwner(user.id);
         contextData.myProfile = { name: user.name, email: user.email, id: user.id };
      }

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Optionally attach the role so the backend can respond differently
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
            } catch (e) {
              // ignore parse errors for chunks
            }
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

  return (
    <div className="flex-1 w-full h-full flex flex-col space-y-4 max-w-5xl mx-auto min-h-0">
      <div className="flex flex-col space-y-2 shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">{botName}</h2>
        <p className="text-muted-foreground">Your dedicated {user?.role} Enterprise AI Assistant.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl glass-card border-none min-h-0">
         <div 
          className="flex-1 p-4 overflow-y-auto"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-6 h-full min-h-[400px] text-center">
                <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center">
                    <Bot className="h-8 w-8 text-primary" />
                </div>
                <div>
                   <h3 className="text-lg font-medium">How can I help you today?</h3>
                   <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2">Select a suggestion below or type your own request to get started.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                    {presetPrompts.map(p => (
                        <button key={p} className="p-3 text-sm text-left rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors" onClick={() => sendMessage(p)}>
                            {p}
                        </button>
                    ))}
                </div>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "accent-gradient text-white" : "bg-white/10"}`}>
                    {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm max-w-[80%] whitespace-pre-wrap ${m.role === "user" ? "bg-indigo-500/20 text-indigo-100 rounded-tr-none text-right" : "bg-white/5 text-slate-300 rounded-tl-none"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== "model" && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-white/10">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/5 text-slate-300 rounded-tl-none text-sm animate-pulse border border-indigo-500/20">
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
                placeholder={`Ask ${botName} anything (or use your voice)...`} 
                className="w-full bg-black/40 border border-white/10 rounded-full text-white px-5 h-14 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 transition-all pr-12"
            />
            <div className="absolute right-1.5 top-1.5 flex gap-1">
              <Button type="submit" size="icon" className="rounded-full accent-gradient h-9 w-9" disabled={!input.trim() || loading}>
                  <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

