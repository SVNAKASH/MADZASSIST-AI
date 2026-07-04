import { useState } from "react";
import { useAuth } from "../../lib/auth";
import { userService } from "../../services/userService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Phone, Mail } from "lucide-react";

export function Profile() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    if (!user) return;
    userService.update(user.id, { name, phone });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    // Force a reload so context is updated
    window.location.reload();
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="glass-card border-none shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-primary" />
            Profile Settings
          </CardTitle>
          <CardDescription>Update your basic information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email (Read Only)</label>
            <div className="flex relative">
              <Mail className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <Input value={user.email} disabled className="pl-10 bg-white/5 border-white/10" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <div className="flex relative">
              <UserIcon className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <Input 
                 value={name} 
                 onChange={e => setName(e.target.value)} 
                 className="pl-10 bg-black/20 border-white/10 focus-visible:ring-indigo-500" 
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <div className="flex relative">
              <Phone className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <Input 
                 value={phone} 
                 onChange={e => setPhone(e.target.value)} 
                 className="pl-10 bg-black/20 border-white/10 focus-visible:ring-indigo-500" 
                 placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
          
          <Button onClick={handleSave} className="w-full h-12 mt-6 accent-gradient border-0 text-white font-medium hover:opacity-90">
            Save Changes
          </Button>

          {success && (
            <div className="p-3 bg-green-500/20 text-green-200 border border-green-500/30 rounded-lg text-sm text-center">
              Profile updated successfully! Reloading...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
