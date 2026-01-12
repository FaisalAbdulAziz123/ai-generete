import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { ensureApiKey, sendChatMessage } from '../services/geminiService';

interface SmartChatProps {
    history: ChatMessage[];
    setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const SmartChat: React.FC<SmartChatProps> = ({ history, setHistory }) => {
  // Use props for persistence
  const messages = history;
  const setMessages = setHistory;

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        setMessages(prev => [...prev, { role: 'model', text: "Please select an API Key to continue." }]);
        setIsLoading(false);
        return;
      }

      // Pass history excluding the message we just added (to avoid double adding if logic changes) 
      // OR pass the updated array. Gemini needs history + new message separately usually, 
      // but our service function constructs history.
      const responseText = await sendChatMessage(messages, userMsg.text);
      
      const aiMsg: ChatMessage = { role: 'model', text: responseText };
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
        return;
    }

    if (isListening) {
        setIsListening(false);
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'id-ID'; // Default to Indonesian
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
    };

    recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const clearChat = () => {
      setMessages([]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto mb-12 animate-fade-in">
      
      {/* Title */}
      <div className="flex items-center justify-between mb-4 px-2">
         <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg shadow-lg shadow-purple-500/20">
                <Sparkles size={18} className="text-white" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">PLOW AI Assistant</h2>
                <p className="text-[10px] text-zinc-400">Powered by Gemini 3 Flash • Multi-Language • Smart Reasoning</p>
            </div>
         </div>
         {messages.length > 0 && (
             <button onClick={clearChat} className="p-2 text-zinc-600 hover:text-red-400 transition-colors" title="Clear Chat">
                 <Trash2 size={16} />
             </button>
         )}
      </div>

      {/* Chat Container */}
      <div className="flex flex-col h-[500px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth">
              {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
                      <Bot size={48} className="mb-4" />
                      <p className="text-sm">Ask me anything about coding, writing, or ideas.</p>
                      <p className="text-xs mt-2">"Bantu aku ide bisnis 2025"</p>
                  </div>
              )}

              {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'model' && (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot size={16} className="text-white" />
                          </div>
                      )}
                      
                      <div className={`relative px-5 py-3.5 max-w-[85%] text-sm leading-relaxed rounded-2xl ${
                          msg.role === 'user' 
                          ? 'bg-zinc-800 text-white rounded-tr-sm' 
                          : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-sm shadow-sm'
                      }`}>
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                      </div>

                      {msg.role === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
                              <User size={16} className="text-zinc-300" />
                          </div>
                      )}
                  </div>
              ))}
              
              {isLoading && (
                  <div className="flex gap-4 justify-start">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot size={16} className="text-zinc-500" />
                      </div>
                      <div className="bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-100"></span>
                          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce delay-200"></span>
                      </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800">
              <div className="relative flex items-end gap-2 bg-zinc-950 border border-zinc-800 rounded-2xl p-2 focus-within:ring-1 focus-within:ring-zinc-700 transition-all shadow-inner">
                  
                  {/* Voice Button */}
                  <button 
                    onClick={handleVoiceInput}
                    className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                        isListening 
                        ? 'bg-red-500/20 text-red-500 animate-pulse' 
                        : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title="Voice Input"
                  >
                      <Mic size={20} />
                  </button>

                  <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message or use voice..."
                      className="flex-1 bg-transparent text-white placeholder-zinc-600 text-sm p-3 max-h-32 min-h-[48px] resize-none focus:outline-none scrollbar-hide"
                      disabled={isLoading}
                      rows={1}
                  />

                  <button 
                      onClick={handleSend}
                      disabled={isLoading || !input.trim()}
                      className={`p-3 rounded-xl transition-all flex-shrink-0 ${
                          input.trim() 
                          ? 'bg-white text-black hover:bg-zinc-200 shadow-lg shadow-white/10' 
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                  >
                      {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
              </div>
              <div className="text-center mt-2">
                  <p className="text-[10px] text-zinc-600">PLOW AI can make mistakes. Please check important info.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default SmartChat;