import { useState, useEffect } from "react";
import { useAuth } from "../../lib/auth";
import { userService, User, UserRole } from "../../services/userService";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Clock, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function UsersManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
    // Auto refresh
    const interval = setInterval(loadUsers, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadUsers = () => {
    setUsers(userService.getAll());
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    userService.updateRole(userId, newRole);
    loadUsers();
  };

  const handleDeleteUser = (userId: string) => {
    userService.delete(userId);
    loadUsers();
  };

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">Manage system users (Admin, Employee, Customer).</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input 
          placeholder="Search by name or email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <UserIcon className="h-8 w-8 mb-4 opacity-20" />
              <p>No users found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map(userItem => (
            <Card key={userItem.id} className="hover:bg-white/5 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden shrink-0">
                       <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{userItem.name}</h3>
                        {currentUser?.id === userItem.id && (
                          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 text-[10px]">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{userItem.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {new Date(userItem.createdAt).toLocaleDateString()}</span>
                    </div>
                    <Select 
                      value={userItem.role} 
                      onValueChange={(val: UserRole) => handleRoleChange(userItem.id, val)}
                      disabled={currentUser?.id === userItem.id} // Prevents admin from changing their own role easily
                    >
                      <SelectTrigger className="w-[130px]">
                         <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {currentUser?.id !== userItem.id && (
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => handleDeleteUser(userItem.id)}
                        className="bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
