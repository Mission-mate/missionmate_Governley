import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare } from 'lucide-react';

export default function HelpChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      content: "Hi there! 👋 How can we help you today? Send a message and our team will follow up by email.",
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    setSending(true);

    await base44.entities.SupportTicket.create({
      subject: text.slice(0, 60),
      category: 'Other',
      description: text,
      status: 'open',
      submitter_name: user?.full_name || '',
      submitter_email: user?.email || '',
    });

    setMessages((m) => [
      ...m,
      {
        role: 'agent',
        content: "Thanks for your message — we've logged it and our team will reach out to you by email shortly.",
      },
    ]);
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
          <MessageSquare className="w-4.5 h-4.5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Support Chat</h3>
          <p className="text-xs text-emerald-600 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-secondary text-foreground rounded-bl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3 flex items-center gap-2">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !sending && handleSend()}
        />
        <Button size="icon" disabled={!input.trim() || sending} onClick={handleSend}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}