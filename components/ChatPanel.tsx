import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageSquareText, Send, User, Sparkles, Trash2, StopCircle, ArrowLeftToLine } from 'lucide-react';
import { streamChat } from '../services/geminiService';

interface ChatPanelProps {
  activeFileContent: string;
  onApplyCode: (code: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ activeFileContent, onApplyCode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hi! I'm Star 975 Copilot. I can help you write, debug, and explain your Python code. How can I assist you today?",
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'user',
      text: inputValue.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    const botMsgId = Math.random().toString(36).substr(2, 9);
    // Create placeholder for bot message
    setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '',
        timestamp: Date.now()
    }]);

    // Prepare history for API (exclude the welcome message if you want, but including it is fine)
    // Map internal ChatMessage to API format
    const history = messages.map(m => ({ role: m.role, text: m.text }));

    try {
        let currentText = "";
        await streamChat(history, activeFileContent, userMsg.text, (delta) => {
            currentText += delta;
            setMessages(prev => prev.map(msg => 
                msg.id === botMsgId ? { ...msg, text: currentText } : msg
            ));
        });
    } catch (e) {
        console.error(e);
    }

    setIsLoading(false);
  };

  const handleClear = () => {
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: "Chat cleared. How can I help?",
      timestamp: Date.now()
    }]);
  };

  const renderMessageContent = (text: string) => {
    // Simple parser to separate code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, idx) => {
        if (part.startsWith('```')) {
            // Extract language and code
            const lines = part.split('\n');
            const lang = lines[0].replace('```', '');
            const code = lines.slice(1, -1).join('\n'); // remove first and last line
            if (!code.trim()) return null;
            return (
                <div key={idx} className="my-2 bg-slate-950 rounded border border-slate-800 overflow-hidden group/code">
                    <div className="px-3 py-1 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
                        <span>{lang || 'code'}</span>
                        <button 
                            onClick={() => onApplyCode(code)}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 opacity-0 group-hover/code:opacity-100 transition-opacity"
                            title="Apply to Editor"
                        >
                            <ArrowLeftToLine size={12} />
                            <span>Apply</span>
                        </button>
                    </div>
                    <div className="p-3 overflow-x-auto font-mono text-xs text-slate-300 whitespace-pre">
                        {code}
                    </div>
                </div>
            );
        }
        return <span key={idx} className="whitespace-pre-wrap">{part}</span>;
    });
  };

  return (
    <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col h-full shadow-xl z-20">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-slate-100 font-semibold flex items-center gap-2">
          <Sparkles size={18} className="text-purple-400" />
          Copilot
        </h2>
        <button onClick={handleClear} className="text-slate-500 hover:text-white" title="Clear Chat">
            <Trash2 size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-purple-600'
            }`}>
                {msg.role === 'user' ? <User size={14} className="text-white"/> : <Sparkles size={14} className="text-white"/>}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-lg p-3 text-sm ${
                    msg.role === 'user' 
                    ? 'bg-blue-600/10 border border-blue-500/30 text-slate-200' 
                    : 'bg-slate-800 border border-slate-700 text-slate-300'
                }`}>
                    {renderMessageContent(msg.text)}
                    {msg.role === 'model' && msg.text === '' && isLoading && (
                        <div className="flex gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                        </div>
                    )}
                </div>
                <span className="text-[10px] text-slate-600 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <form onSubmit={handleSend} className="relative">
            <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                    }
                }}
                placeholder="Ask Copilot..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3 pr-10 py-3 text-sm text-slate-200 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 resize-none h-12 min-h-[48px] max-h-32"
                style={{ scrollbarWidth: 'none' }}
            />
            <button 
                type="submit" 
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:bg-slate-700 transition-colors"
            >
                {isLoading ? <StopCircle size={14} /> : <Send size={14} />}
            </button>
        </form>
        <div className="text-[10px] text-slate-600 mt-2 text-center flex items-center justify-center gap-1">
            <Sparkles size={10} />
            <span>AI responses may be inaccurate.</span>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;