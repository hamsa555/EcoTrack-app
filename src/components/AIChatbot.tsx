import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm your EcoTrack AI assistant. How can I help you today with your sustainability journey?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          systemInstruction: "You are the EcoTrack AI Assistant, an expert in sustainability, eco-friendly living, and environmental impact. Your goal is to help users find ways to reduce their carbon footprint, explain the science of climate change in simple terms, and encourage them in their journey. Be positive, scientific, and practical."
        })
      });

      if (!response.ok) throw new Error("Chat failed");
      
      const data = await response.json();
      const aiResponse = data.text || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error: any) {
      console.error("Gemini Error:", error);
      let errorMessage = "I encountered an error connecting to my eco-brain. Please try again later.";
      
      if (error?.message?.includes("429") || error?.status === 429 || error?.message?.includes("RESOURCE_EXHAUSTED")) {
        errorMessage = "I'm currently a bit overwhelmed with requests! Please give me a moment to breathe and try again shortly.";
      }
      
      setMessages(prev => [...prev, { role: 'model', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 right-6 z-40 w-14 h-14 bg-eco-primary text-white rounded-full shadow-xl shadow-eco-primary/30 flex items-center justify-center border-2 border-white pointer-events-auto"
      >
        <MessageSquare size={24} />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"
        />
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed inset-x-6 bottom-24 top-24 z-50 bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col pointer-events-auto max-w-md mx-auto"
          >
            {/* Header */}
            <div className="bg-eco-dark p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-eco-primary rounded-xl flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-display font-black text-sm tracking-tight leading-none uppercase">Eco AI</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 bg-eco-primary rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Always Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-grow p-6 overflow-y-auto space-y-4 bg-eco-bg/30"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "flex gap-3 max-w-[85%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm",
                    msg.role === 'user' ? "bg-white text-eco-dark" : "bg-eco-primary text-white"
                  )}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={cn(
                    "p-4 text-xs font-medium leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-white text-gray-900 rounded-[1.5rem] rounded-tr-none border border-gray-100" 
                      : "bg-eco-dark text-white rounded-[1.5rem] rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-eco-primary text-white flex items-center justify-center animate-pulse">
                    <RefreshCw size={14} className="animate-spin" />
                  </div>
                  <div className="bg-eco-dark/10 p-4 rounded-[1.5rem] rounded-tl-none">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-eco-primary rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-eco-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-eco-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-gray-100 flex gap-3">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-grow bg-eco-bg border border-gray-100 rounded-[1.5rem] px-5 py-3 text-xs font-semibold outline-none focus:ring-2 focus:ring-eco-primary/20 transition-all shadow-inner"
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="w-12 h-12 bg-eco-primary text-white rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-eco-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
            
            {/* Suggestions */}
            <div className="px-6 pb-6 bg-white flex gap-2 overflow-x-auto">
              {['Reduce usage?', 'CO2 explain?', 'Eco tips?'].map(tip => (
                <button 
                  key={tip}
                  onClick={() => setInput(tip)}
                  className="whitespace-nowrap px-4 py-1.5 bg-eco-bg/50 border border-gray-100 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest hover:border-eco-primary/30 transition-colors"
                >
                  <Sparkles size={10} className="inline mr-1" />
                  {tip}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
