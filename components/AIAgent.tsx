import React, { useState, useEffect, useRef } from 'react';
import { Mic, Bot, PhoneOff, Loader2, Volume2 } from 'lucide-react';
import { SettingsService, AppSettings } from '../services/settingsService';
import { MockDB } from '../services/mockDb';
import { KnowledgeBaseItem } from '../types';

export const AIAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking'>('idle');
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<number | null>(null);

  const speak = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window) || !settings) {
      console.error("Speech synthesis not supported or settings not loaded.");
      if (onEnd) onEnd();
      return;
    }

    // Clear any existing timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    window.speechSynthesis.cancel(); // Stop any previous speech
    const utterance = new SpeechSynthesisUtterance(text);

    // Apply custom voice settings from admin
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name === settings.aiAgentSettings.voiceName);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = settings.aiAgentSettings.voiceRate || 1.0;
    utterance.pitch = settings.aiAgentSettings.voicePitch || 1.0;

    const cleanupAndCallback = () => {
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      setStatus('idle');
      if (onEnd) onEnd();
    };

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = cleanupAndCallback;
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      cleanupAndCallback(); // Ensure loop continues even on error
    };
    
    // Fallback timer: If speech doesn't end in 10s, force it.
    speechTimeoutRef.current = window.setTimeout(cleanupAndCallback, 10000);

    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current && status !== 'listening') {
      try {
        setStatus('listening');
        recognitionRef.current.start();
      } catch(e) {
        console.error("Speech recognition could not start:", e);
        setStatus('idle');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && status === 'listening') {
      recognitionRef.current.stop();
      setStatus('idle');
    }
  };
  
  useEffect(() => {
    const loadData = async () => {
        const s = await SettingsService.getSettings();
        const kb = await MockDB.getKnowledgeBase();
        setSettings(s);
        setKnowledgeBase(kb);
    };
    loadData();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onend = () => {
        if (status === 'listening') {
            setStatus('idle');
        }
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleUserQuery(transcript);
      };
    }
  }, []);

  useEffect(() => {
    if (isOpen && status === 'connecting' && settings) {
      // Small delay to ensure voices are loaded
      setTimeout(() => {
          speak(settings.aiAgentSettings.welcomeMessage, () => {
            startListening();
          });
      }, 200);
    }
  }, [isOpen, status, settings]);

  const findAnswer = (query: string): string => {
    const lowerQuery = query.toLowerCase().trim();
    
    // Prioritize exact or near-exact matches
    for (const item of knowledgeBase) {
      if (lowerQuery.includes(item.question.toLowerCase().trim())) {
        return item.answer;
      }
    }

    // Keyword matching as fallback
    for (const item of knowledgeBase) {
      const keywords = item.question.toLowerCase().split(' ').filter(k => k.length > 3); // Simple keyword filter
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return item.answer;
      }
    }

    return "I'm not sure how to answer that. For complex issues, I will connect you to a live support agent shortly.";
  };

  const handleUserQuery = (text: string) => {
    setStatus('thinking');
    const answer = findAnswer(text);
    setTimeout(() => {
        speak(answer, () => {
            // After speaking, go back to listening
            startListening();
        });
    }, 500);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setStatus('connecting');
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsOpen(false);
    setStatus('idle');
  };

  const StatusIndicator = () => {
    switch (status) {
      case 'connecting':
        return <><Loader2 size={20} className="animate-spin" /> Connecting...</>;
      case 'listening':
        return <><Mic size={20} /> Listening...</>;
      case 'speaking':
        return <><Volume2 size={20} /> JadanPay Speaking...</>;
      case 'thinking':
        return <><Loader2 size={20} className="animate-spin" /> Thinking...</>;
      default:
        return 'Ready';
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-[9999] w-16 h-16 bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center animate-bounce hover:animate-none hover:bg-green-700 transition-all"
        aria-label="Open AI Voice Assistant"
      >
        <Bot size={32} />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-lg flex items-center justify-center animate-fade-in">
      <div className="w-full max-w-sm h-[90vh] max-h-[600px] bg-gray-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-gray-700">
        
        <header className="p-6 text-center border-b border-gray-700/50">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-400 mb-2">
                <Bot size={32} />
            </div>
            <h3 className="font-bold text-white text-lg">JadanPay AI Agent</h3>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'listening' ? 'bg-green-500/20' : 'bg-gray-800'}`}>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'listening' ? 'bg-green-500/30' : 'bg-gray-700'}`}>
                   <Mic size={48} className={`transition-colors duration-300 ${status === 'listening' ? 'text-green-300' : 'text-gray-500'}`} />
                </div>
            </div>
            <div className={`mt-6 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${status === 'speaking' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800 text-gray-400'}`}>
                <StatusIndicator />
            </div>
        </main>
        
        <footer className="p-6 border-t border-gray-700/50">
            <button
            onClick={handleClose}
            className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
                <PhoneOff size={20} />
                End Call
            </button>
        </footer>
      </div>
    </div>
  );
};