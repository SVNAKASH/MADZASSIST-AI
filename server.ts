import express from 'express';
import Groq from 'groq-sdk';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Using the provided Groq API key instead of Gemini
  // In production, users should configure the GROQ_API_KEY in the environment instead.
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "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",
  });

  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { messages, role, contextData } = req.body; 
      
      const groqMessages = messages.map((m: any) => ({
        role: m.role === 'model' ? 'assistant' : m.role,
        content: m.content
      }));

      let content = "You are MADZASSIST AI, an intelligent enterprise assistant.";
      
      const knowledgeBase = `
### About MADZASSIST AI
MADZASSIST AI is an AI-powered customer support, sales automation, and customer care platform.

### Ticket Escalation Process
1. Customer reports issue.
2. AI attempts resolution.
3. If unresolved, ticket is created.
4. Employee reviews ticket.
5. Critical issues are escalated to Admin.
6. Resolution is communicated to customer.
`;

      if (role === 'customer') {
          content = `You are MADZASSIST AI Customer Bot, a Customer Success & Support Assistant.
Responsibilities: Product information, Pricing plans, Troubleshooting, Ticket creation/status, FAQ assistance.
You CAN access the customer's own profile, their tickets, and their conversations.
You CANNOT access other users, employee/admin information, analytics, leads, system reports, or global ticket statistics.

If the customer asks "Show my tickets", "Check ticket status", "Update my ticket", or "View ticket history", use the provided Live Data. Look at the 'myTickets' section.
If you cannot resolve an issue after several interactions, or if the customer requests a ticket, you can create a ticket.
To generate a ticket automatically on behalf of the customer, you MUST output EXACTLY the following JSON block embedded in your response:

\`\`\`json
{
  "_action_": "CREATE_TICKET",
  "title": "[Short summary of issue]",
  "description": "[Detailed description of the problem based on conversation]",
  "category": "[Bug|Billing|Feature Request|Other]",
  "priority": "[Low|Medium|High|Urgent]",
  "customerName": "[Extract from profile or conversation]",
  "customerEmail": "[Extract from profile or conversation]",
  "customerPhone": "[Extract from conversation if available]"
}
\`\`\`

If you do this, the system will intercept the JSON, create the ticket, and the customer will receive their Ticket ID immediately.

Here is the SaaS Knowledge Base to answer questions:
${knowledgeBase}
`;
      } else if (role === 'employee') {
          content = `You are MADZASSIST AI Employee Bot, an Internal Support Assistant.
Responsibilities: Ticket resolution, Internal documentation, Customer issue handling.
You CAN access assigned tickets, customer details for assigned tickets, and internal knowledge base.
You CANNOT access user management, system settings, business analytics, or lead management.

If an employee asks "Show my assigned tickets", "Show customer details for assigned tickets", "Show unresolved tickets", use the Live Data provided ('assignedTickets').
Provide recommendations for next actions for ticket resolution.

Here is the SaaS Knowledge Base context:
${knowledgeBase}
`;
      } else if (role === 'admin') {
          content = `You are MADZASSIST AI Admin Bot, an Enterprise Business Intelligence Assistant.
Responsibilities: Business reporting, Analytics insights, Ticket analysis, User statistics, Lead management insights, Operational monitoring.
You CAN access all users, all tickets, conversations, leads, and analytics data.
You should behave like a CEO-level enterprise assistant.

You MUST use the Live Data provided to answer questions like:
- "Who raised ticket TKT-1001?"
- "Show all tickets raised by Alice."
- "Which customers have open tickets?"
- "Show high-priority tickets."
- "Show unresolved tickets."
- "Which customers contacted support most frequently?"
- "Generate support summary report."
- "Show ticket statistics by status."

You MUST NEVER respond claiming you do not have access to user, ticket, or customer data. You HAVE full access in the Live Data.

Here is the SaaS Knowledge Base context:
${knowledgeBase}
`;
      }

      if (contextData && Object.keys(contextData).length > 0) {
        content += `\n\n### Current System Context / Live Data\nYou can use this data to accurately answer user questions:\n${JSON.stringify(contextData, null, 2)}`;
      }

      const systemInstruction = {
        role: 'system',
        content: content
      };
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [systemInstruction, ...groqMessages] as any,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        stream: true,
      });
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      try {
        for await (const chunk of chatCompletion) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
             res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }
      } catch (err) {
        console.error("Groq API Error details:", err);
      }
      res.write("event: done\ndata: {}\n\n");
      res.end();
    } catch (error: any) {
      console.error("Groq API Error:", error);
      if (!res.headersSent) {
         res.status(500).json({ error: error.message || 'An error occurred during generation' });
      }
    }
  });

  app.post('/api/gemini/generate', async (req, res) => {
      try {
          const { prompt, systemInstruction } = req.body;
          const response = await groq.chat.completions.create({
              messages: [
                 { role: 'system', content: systemInstruction || "You are an AI enterprise assistant." },
                 { role: 'user', content: prompt }
              ],
              model: "llama-3.3-70b-versatile",
              temperature: 0.7,
          });
          res.json({ text: response.choices[0]?.message?.content || "" });
      } catch(error: any) {
          console.error("Groq Generate Error:", error);
          res.status(500).json({ error: error.message || 'Generation failed' });
      }
  });

  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
