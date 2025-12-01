import React, { useState, useEffect, useRef } from 'react';
import { Mic, Bot, PhoneOff, Loader2, Volume2, PhoneForwarded } from 'lucide-react';
import { SettingsService, AppSettings } from '../services/settingsService';
import { MockDB } from '../services/mockDb';
import { KnowledgeBaseItem } from '../types';

// Helper function to process text into a set of keywords
const stopWords = new Set([
    'a', 'an', 'the', 'is', 'what', 'how', 'do', 'i', 'to', 'for', 'of', 'in', 'on', 'can', 'my', 'your', 'about', 'pay',
    'jadanpay', 'me', 'tell', 'want', 'please', 'and'
]);

const getKeywords = (text: string): Set<string> => {
    if (!text) return new Set();
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .split(/\s+/)
        .filter(word => !stopWords.has(word) && word.length > 2); // remove stop words and short words
    return new Set(words);
};


export const AIAgent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'thinking' | 'handoff'>('idle');
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

    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

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
      if (status !== 'handoff') {
          setStatus('idle');
      }
      if (onEnd) onEnd();
    };

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = cleanupAndCallback;
    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      cleanupAndCallback();
    };
    
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
  
  const findAnswer = (query: string): string => {
    if (!query || !knowledgeBase.length) {
        return "HANDOFF_TO_AGENT";
    }

    const queryKeywords = getKeywords(query);
    if (queryKeywords.size === 0) {
        return "I'm sorry, I didn't quite understand that. Could you please rephrase your question?";
    }
    
    let bestMatch = {
      score: 0,
      answer: "HANDOFF_TO_AGENT"
    };

    for (const item of knowledgeBase) {
      const kbQuestionKeywords = getKeywords(item.question);
      if (kbQuestionKeywords.size === 0) continue;
      
      const intersection = new Set([...queryKeywords].filter(x => kbQuestionKeywords.has(x)));
      const union = new Set([...queryKeywords, ...kbQuestionKeywords]);
      
      const score = union.size > 0 ? intersection.size / union.size : 0;
      
      if (score > bestMatch.score) {
        bestMatch = { score, answer: item.answer };
      }
    }
    
    const CONFIDENCE_THRESHOLD = 0.20; 

    if (bestMatch.score >= CONFIDENCE_THRESHOLD) {
      return bestMatch.answer;
    } else {
      return "HANDOFF_TO_AGENT";
    }
  };
  
  const handleLiveAgentHandoff = () => {
      setStatus('handoff');
      const handoffMessage = "I'm sorry, I couldn't find a clear answer for that. Let me connect you to a live support agent who can help.";
      speak(handoffMessage, () => {
          if (settings?.supportPhone) {
              window.location.href = `tel:${settings.supportPhone}`;
              // Close the agent window after initiating the call
              setTimeout(() => handleClose(), 500);
          } else {
              console.warn("No support phone number configured for agent handoff.");
              startListening(); // Go back to listening if no number is set
          }
      });
  };

  const handleUserQuery = (text: string) => {
    setStatus('thinking');
    const answerOrAction = findAnswer(text);
    
    setTimeout(() => {
        if (answerOrAction === "HANDOFF_TO_AGENT") {
            handleLiveAgentHandoff();
        } else {
            speak(answerOrAction, () => {
                startListening();
            });
        }
    }, 500);
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
      setTimeout(() => {
          speak(settings.aiAgentSettings.welcomeMessage, () => {
            startListening();
          });
      }, 200);
    }
  }, [isOpen, status, settings]);

  const handleOpen = () => {
    setIsOpen(true);
    setStatus('connecting');
  };

  const handleClose = () => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      recognitionRef.current.abort();
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
      case 'handoff':
        return <><PhoneForwarded size={20} /> Connecting to Agent...</>;
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
            <div className={`mt-6 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                status === 'speaking' ? 'bg-blue-500/20 text-blue-300' :
                status === 'handoff' ? 'bg-yellow-500/20 text-yellow-300' :
                'bg-gray-800 text-gray-400'
            }`}>
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
