
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageSender } from '../types'; 
import MessageItem from './MessageItem';
import { Send, Bot, FileText } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => void;
  isLoading: boolean;
  placeholderText?: string;
  initialQuerySuggestions?: string[];
  onSuggestedQueryClick?: (query: string) => void;
  isFetchingSuggestions?: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  isLoading, 
  placeholderText,
  initialQuerySuggestions,
  onSuggestedQueryClick,
  isFetchingSuggestions,
}) => {
  const [userQuery, setUserQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = () => {
    if (userQuery.trim() && !isLoading) {
      onSendMessage(userQuery.trim());
      setUserQuery('');
    }
  };

  const showSuggestions = initialQuerySuggestions && initialQuerySuggestions.length > 0 && messages.filter(m => m.sender !== MessageSender.SYSTEM).length <= 1;

  return (
    <div className="flex flex-col h-full bg-white/95 md:rounded-2xl shadow-2xl border border-amber-200/50 overflow-hidden backdrop-blur-md">
      <div className="p-5 border-b border-amber-200/50 flex justify-between items-center bg-gradient-to-r from-amber-600 to-amber-700">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner border border-white/10">
            <Bot size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white leading-tight tracking-tight">Chatbot Manasik Haji</h2>
            <p className="text-xs text-amber-100 font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,1)]"></span> Kemenhaj Kota Gorontalo
            </p>
          </div>
        </div>
        
        <a 
          href="https://drive.google.com/file/d/1rltTrE0lNa_XHFO9L-UkcQoTIywCHAPU/view" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 text-white hover:bg-white/10 p-2 rounded-xl transition-all group"
          title="Download/View Softcopy Tuntunan"
        >
          <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
            <FileText size={20} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Softcopy</span>
        </a>
      </div>

      <div className="flex-grow p-4 md:p-6 overflow-y-auto chat-container bg-[#FFFDF5]/70">
        <div className="max-w-3xl mx-auto w-full">
          {messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} />
          ))}
          
          {isFetchingSuggestions && (
              <div className="flex justify-center items-center p-6">
                  <div className="flex items-center space-x-2 text-amber-700">
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      <span className="text-sm uppercase font-black tracking-widest ml-3">Menganalisa Database...</span>
                  </div>
              </div>
          )}

          {showSuggestions && onSuggestedQueryClick && (
            <div className="my-8 px-1 animate-in fade-in slide-in-from-bottom-3 duration-700">
              <p className="text-xs text-amber-900/50 mb-4 font-black uppercase tracking-[0.2em] text-center">Topik Populer</p>
              <div className="flex flex-wrap gap-3 justify-center">
                {initialQuerySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestedQueryClick(suggestion)}
                    className="bg-white border-2 border-amber-200 text-amber-950 px-5 py-3 rounded-2xl text-sm md:text-base font-medium hover:bg-amber-100 hover:border-amber-400 hover:shadow-md transition-all active:scale-95 text-center"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 md:p-6 border-t border-amber-100 bg-white shadow-[0_-8px_20px_-10px_rgba(217,119,6,0.15)]">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder={placeholderText || "Tulis pertanyaan Anda..."}
            className="flex-grow min-h-[56px] max-h-48 py-4 px-5 border-2 border-amber-100 bg-amber-50/20 text-amber-950 placeholder-amber-900/30 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all resize-none text-base md:text-lg outline-none leading-relaxed"
            rows={1}
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !userQuery.trim()}
            className="h-[56px] w-[56px] bg-amber-600 hover:bg-amber-500 text-white rounded-2xl transition-all disabled:bg-gray-200 disabled:text-gray-400 flex items-center justify-center flex-shrink-0 shadow-lg active:scale-90"
            aria-label="Kirim"
          >
            {isLoading ? 
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> 
              : <Send size={24} />
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
