
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { ChatMessage, MessageSender } from '../types';
import { BookOpen } from 'lucide-react';

// Configure marked
marked.setOptions({
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
} as any);

interface MessageItemProps {
  message: ChatMessage;
}

const SenderAvatar: React.FC<{ sender: MessageSender }> = ({ sender }) => {
  let icon = null;
  let bgColorClass = '';

  if (sender === MessageSender.USER) {
    icon = <span className="text-[10px] font-black">SAYA</span>;
    bgColorClass = 'bg-amber-900';
  } else if (sender === MessageSender.MODEL) {
    icon = <span className="text-[10px] font-black">AI</span>;
    bgColorClass = 'bg-amber-600';
  } else {
    icon = <span className="text-[10px] font-black">INFO</span>;
    bgColorClass = 'bg-gray-600';
  }

  return (
    <div className={`w-10 h-10 rounded-xl ${bgColorClass} text-white flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-white/30`}>
      {icon}
    </div>
  );
};

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;
  const isModel = message.sender === MessageSender.MODEL;

  const renderMessageContent = () => {
    let text = message.text || "";
    let extractedReference = "";

    const refMatch = text.match(/REFERENSI:\s*([\s\S]*?)$/i);
    if (refMatch) {
      extractedReference = refMatch[1].trim();
      text = text.replace(/REFERENSI:\s*[\s\S]*?$/i, "").trim();
    }

    if (isModel && !message.isLoading) {
      const rawMarkup = marked.parse(text) as string;
      return (
        <div className="w-full">
          <div className="prose prose-amber max-w-none mb-4 text-amber-950" dangerouslySetInnerHTML={{ __html: rawMarkup }} />
          
          {extractedReference && (
            <div className="mt-5 pt-4 border-t-2 border-amber-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-700">
              <div className="p-2 bg-amber-600/10 rounded-xl text-amber-700 flex-shrink-0 border border-amber-600/20">
                <BookOpen size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-800/40 uppercase tracking-[0.15em] mb-1">Referensi Dokumen</p>
                <p className="text-sm md:text-base text-amber-900 font-bold italic leading-relaxed bg-amber-50/50 p-2 rounded-lg">
                  {extractedReference}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return <div className={`whitespace-pre-wrap text-base md:text-lg leading-relaxed font-medium ${isUser ? 'text-white' : 'text-amber-950'}`}>{text}</div>;
  };
  
  let bubbleClasses = "p-5 rounded-[24px] shadow-sm w-full transition-all ";

  if (isUser) {
    bubbleClasses += "bg-gradient-to-br from-amber-700 to-amber-800 text-white rounded-br-none ml-auto shadow-amber-900/20 border border-amber-900/20";
  } else if (isModel) {
    bubbleClasses += "bg-white border border-amber-100/50 rounded-bl-none shadow-lg shadow-amber-900/5";
  } else {
    bubbleClasses += "bg-orange-50/80 text-orange-950 rounded-bl-none border border-orange-200 italic shadow-inner";
  }

  return (
    <div className={`flex mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-3 duration-400`}>
      <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse max-w-[88%]' : 'max-w-[92%]'}`}>
        <SenderAvatar sender={message.sender} />
        <div className={bubbleClasses}>
          {message.isLoading ? (
            <div className="flex items-center space-x-3 py-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"></div>
              <span className="text-xs font-black text-amber-700/60 uppercase ml-3 tracking-widest">Membaca Kitab...</span>
            </div>
          ) : (
            renderMessageContent()
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
