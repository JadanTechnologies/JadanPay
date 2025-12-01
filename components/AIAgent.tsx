import React, { useState, useEffect, useRef } from 'react';
import { Mic, Bot, Send, X, Loader2, Volume2 } from 'lucide-react';
import { SettingsService } from '../services/settingsService';
import { MockDB } from '../services/mockDb';
import { KnowledgeBaseItem } from '../types';

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export const AIAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem[]>([]);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
        const settings = await SettingsService.getSettings();
        const kb = await MockDB.getKnowledgeBase();
        setKnowledgeBase(kb);
        if (settings.aiAgentSettings?.welcomeMessage) {
            setMessages([{ text: settings.aiAgentSettings.welcomeMessage, sender: 'bot' }]);
        }
    };
    loadData();

    // Setup speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleUserMessage(transcript);
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const findAnswer = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    for (const item of knowledgeBase) {
      const keywords = item.question.toLowerCase().split(' ');
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return item.answer;
      }
    }
    return "I'm not sure how to answer that. I will connect you to a live support agent shortly.";
  };

  const handleUserMessage = (text: string) => {
    setMessages(prev => [...prev, { text, sender: 'user' }]);
    const answer = findAnswer(text);
    setTimeout(() => {
        setMessages(prev => [...prev, { text: answer, sender: 'bot' }]);
        speak(answer);
    }, 500);
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce hover:animate-none hover:bg-green-700 transition-all"
        aria-label="Open AI Assistant"
      >
        <Bot size={32} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-[9999] w-full sm:w-96 h-full sm:h-[600px] bg-white dark:bg-gray-900 rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-gray-200 dark:border-gray-800">
      <header className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">AI Assistant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
      </header>
      
      <main className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'bot' ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none' : 'bg-green-600 text-white rounded-br-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      <footer className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleListen}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors ${
            isListening
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isListening ? (
            <>
              <Loader2 size={20} className="animate-spin" /> Listening...
            </>
          ) : (
            <>
              <Mic size={20} /> Ask a Question
            </>
          )}
        </button>
      </footer>
    </div>
  );
};
