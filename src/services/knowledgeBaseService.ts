import { storage } from './storage';

export interface KBArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  ownerId: string;
  createdAt: number;
  updatedAt: number;
}

const KB_KEY = 'madzassist_kb';

export const knowledgeBaseService = {
  getAll: (): KBArticle[] => storage.get(KB_KEY) || [],

  create: (data: Omit<KBArticle, 'id' | 'createdAt' | 'updatedAt'>): KBArticle => {
    const articles = knowledgeBaseService.getAll();
    const newArticle: KBArticle = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    storage.set(KB_KEY, [...articles, newArticle]);
    return newArticle;
  },

  update: (id: string, updates: Partial<KBArticle>): KBArticle => {
    const articles = knowledgeBaseService.getAll();
    const index = articles.findIndex(a => a.id === id);
    if (index === -1) throw new Error("Article not found");
    
    articles[index] = { ...articles[index], ...updates, updatedAt: Date.now() };
    storage.set(KB_KEY, articles);
    return articles[index];
  },
  
  delete: (id: string): void => {
    const articles = knowledgeBaseService.getAll();
    storage.set(KB_KEY, articles.filter(a => a.id !== id));
  }
};
