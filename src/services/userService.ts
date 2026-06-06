import { storage } from './storage';

export type UserRole = 'customer' | 'employee' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}

const USERS_KEY = 'madzassist_users';

export const userService = {
  getAll: (): User[] => {
    return storage.get(USERS_KEY) || [];
  },
  
  getById: (id: string): User | undefined => {
    return userService.getAll().find((u: User) => u.id === id);
  },

  getByEmail: (email: string): User | undefined => {
    return userService.getAll().find((u: User) => u.email === email);
  },

  create: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
    const users = userService.getAll();
    if (users.some(u => u.email === user.email)) {
      throw new Error("Email already exists");
    }
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.set(USERS_KEY, [...users, newUser]);
    return newUser;
  },

  update: (id: string, updates: Partial<Omit<User, 'id' | 'createdAt' | 'role'>>): User => {
    const users = userService.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");
    
    users[index] = { ...users[index], ...updates, updatedAt: Date.now() };
    storage.set(USERS_KEY, users);
    return users[index];
  },
  
  updateRole: (id: string, role: UserRole): User => {
    const users = userService.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");
    
    users[index] = { ...users[index], role, updatedAt: Date.now() };
    storage.set(USERS_KEY, users);
    return users[index];
  },
  
  delete: (id: string): void => {
    const users = userService.getAll();
    const newUsers = users.filter((u: User) => u.id !== id);
    storage.set(USERS_KEY, newUsers);
  }
};
