
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { ChatMessage, MessageSender } from './types';
import { generateContentWithUrlContext, getInitialSuggestions } from './services/geminiService';
import ChatInterface from './components/ChatInterface';

const FIXED_DATA_SOURCE = "https://raw.githubusercontent.com/kemenhajkotagorontalo/chatbotmanasik2026/refs/heads/master/public/dataset_rag_ready.json";

const App: React.FC = () => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [initialQuerySuggestions, setInitialQuerySuggestions] = useState<string[]>([]);
  
  const currentUrlsForChat = [FIXED_DATA_SOURCE];

  useEffect(() => {
    const apiKey = process.env.API_KEY;
    
    let welcomeMessageText = '';
    if (!apiKey) {
      welcomeMessageText = 'ERROR: Gemini API Key is not configured. Please set process.env.API_KEY to use the application.';
    } else {
      welcomeMessageText = `Selamat datang di Chatbot Manasik Haji! Saya telah memuat database manasik haji. Silakan tanya apa saja terkait panduan manasik, atau pilih saran pertanyaan di bawah ini.`;
    }
    
    setChatMessages([{
      id: `system-welcome-${Date.now()}`,
      text: welcomeMessageText,
      sender: MessageSender.SYSTEM,
      timestamp: new Date(),
    }]);
  }, []); 

  const fetchAndSetInitialSuggestions = useCallback(async () => {
    if (!process.env.API_KEY) return;
      
    setIsFetchingSuggestions(true);
    try {
      const response = await getInitialSuggestions(currentUrlsForChat); 
      let suggestionsArray: string[] = [];
      if (response.text) {
        try {
          let jsonStr = response.text.trim();
          const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s; 
          const match = jsonStr.match(fenceRegex);
          if (match && match[2]) {
            jsonStr = match[2].trim();
          }
          const parsed = JSON.parse(jsonStr);
          if (parsed && Array.isArray(parsed.suggestions)) {
            suggestionsArray = parsed.suggestions.filter((s: unknown) => typeof s === 'string');
          }
        } catch (parseError) {
          console.error("Failed to parse suggestions JSON:", parseError);
        }
      }
      setInitialQuerySuggestions(suggestionsArray.slice(0, 4)); 
    } catch (e: any) {
      console.error("Error fetching suggestions:", e);
    } finally {
      setIsFetchingSuggestions(false);
    }
  }, [currentUrlsForChat]); 

  useEffect(() => {
    fetchAndSetInitialSuggestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSendMessage = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const apiKey = process.env.API_KEY;
    if (!apiKey) return;
    
    setIsLoading(true);
    setInitialQuerySuggestions([]); 

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: query,
      sender: MessageSender.USER,
      timestamp: new Date(),
    };
    
    const modelPlaceholderMessage: ChatMessage = {
      id: `model-response-${Date.now()}`,
      text: 'Sedang berpikir...', 
      sender: MessageSender.MODEL,
      timestamp: new Date(),
      isLoading: true,
    };

    setChatMessages(prevMessages => [...prevMessages, userMessage, modelPlaceholderMessage]);

    try {
      const response = await generateContentWithUrlContext(query, currentUrlsForChat);
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === modelPlaceholderMessage.id
            ? { ...modelPlaceholderMessage, text: response.text || "Maaf, saya tidak menerima respon.", isLoading: false, urlContext: response.urlContextMetadata }
            : msg
        )
      );
    } catch (e: any) {
      const errorMessage = e.message || 'Gagal mendapatkan respon dari AI.';
      setChatMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === modelPlaceholderMessage.id
            ? { ...modelPlaceholderMessage, text: `Error: ${errorMessage}`, sender: MessageSender.SYSTEM, isLoading: false } 
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen antialiased bg-gradient-to-br from-[#FFF9E5] via-[#FFF1CC] to-[#FFE499] text-amber-950 flex flex-col md:p-4">
      <div className="max-w-5xl mx-auto w-full h-full">
        <ChatInterface
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          placeholderText="Tanyakan tentang Manasik Haji..."
          initialQuerySuggestions={initialQuerySuggestions}
          onSuggestedQueryClick={handleSendMessage}
          isFetchingSuggestions={isFetchingSuggestions}
        />
      </div>
    </div>
  );
};

export default App;
