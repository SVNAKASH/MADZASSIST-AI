import { storage } from './storage';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  ownerId: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

const CONVERSATIONS_KEY = 'madzassist_conversations';

export const conversationService = {
  getAll: (): Conversation[] => storage.get(CONVERSATIONS_KEY) || [],

  getByOwner: (ownerId: string): Conversation[] => {
    return conversationService.getAll().filter(c => c.ownerId === ownerId);
  },

  getById: (id: string): Conversation | undefined => {
    return conversationService.getAll().find(c => c.id === id);
  },

  create: (ownerId: string, title: string, initialMessage?: ChatMessage): Conversation => {
    const conversations = conversationService.getAll();
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      ownerId,
      messages: initialMessage ? [initialMessage] : [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.set(CONVERSATIONS_KEY, [...conversations, newConversation]);
    return newConversation;
  },

  addMessage: (conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Conversation => {
    const conversations = conversationService.getAll();
    const index = conversations.findIndex(c => c.id === conversationId);
    if (index === -1) throw new Error("Conversation not found");
    
    const newMsg: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    conversations[index].messages.push(newMsg);
    conversations[index].updatedAt = Date.now();
    storage.set(CONVERSATIONS_KEY, conversations);
    return conversations[index];
  }
};
