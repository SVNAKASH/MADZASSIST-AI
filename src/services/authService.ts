import { storage } from './storage';
import { userService, User } from './userService';

const CURRENT_USER_KEY = 'madzassist_current_user_id';
const AUTH_STORE_KEY = 'madzassist_auth';

// Basic mock hashing function to satisfy "no plain text passwords" requirement mentally
// In production with Firebase Auth, this is entirely handled by Firebase.
const hashMock = async (str: string) => {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const authRecords = storage.get(AUTH_STORE_KEY) || {};
    const hashedPassword = await hashMock(password);
    
    if (authRecords[email] === hashedPassword) {
      const user = userService.getByEmail(email);
      if (user) {
        storage.set(CURRENT_USER_KEY, user.id);
        return user;
      }
    }
    throw new Error('Invalid email or password');
  },

  register: async (email: string, password: string, name: string): Promise<User> => {
    // Check if user already exists
    if (userService.getByEmail(email)) {
      throw new Error('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashMock(password);
    const authRecords = storage.get(AUTH_STORE_KEY) || {};
    authRecords[email] = hashedPassword;
    storage.set(AUTH_STORE_KEY, authRecords);

    // Create user (defaults to Customer)
    let role: 'customer' | 'employee' | 'admin' = 'customer';
    
    // For demo purposes, we create an admin if it's the very first user
    // Otherwise it's impossible to test admin features, but we don't hardcode logic strictly based on emails
    // We just check if any users exist
    const users = userService.getAll();
    if (users.length === 0) {
      role = 'admin';
    }

    const newUser = userService.create({ email, name, role });
    storage.set(CURRENT_USER_KEY, newUser.id);
    return newUser;
  },

  logout: () => {
    storage.remove(CURRENT_USER_KEY);
  },

  getCurrentUser: (): User | null => {
    const userId = storage.get(CURRENT_USER_KEY);
    if (!userId) return null;
    return userService.getById(userId) || null;
  }
};
