import React, { useEffect, useState } from 'react';
import { User, Ticket } from '../types';
import { MockDB } from '../services/mockDb';
import { MessageSquare, Send, Plus, X, LifeBuoy, Zap, ShieldAlert, Paperclip, FileText } from 'lucide-react';
import { playNotification } from '../utils/audio';

interface SupportProps {
  user: User;
}

export const Support: React.FC<SupportProps> = ({ user }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Create Ticket State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSuperTicket, setIsSuperTicket] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAttachment, setNewAttachment] = useState<File | null>(null);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  
  // Agent Status Simulation
  const [isAgentOnline, setIsAgentOnline] = useState(false);

  useEffect(() => {
    // Simulate agent status toggling every 5 seconds for a "live" feel
    const interval = setInterval(() => {
      setIsAgentOnline(Math.random() > 0.4); // More likely to be online
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user?.id) {
        loadTickets();
    }
  }, [user.id]);

  const loadTickets = async () => {
    setLoading(true);
    try {
        const data = await MockDB.getTickets(user.id);
        setTickets(data || []); // Ensure data is array
    } catch (e) {
        console.error("Failed to load tickets", e);
        setTickets([]);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newMessage) return;
    
    setIsSubmitting(true);
    try {
        // If Super Ticket, force high priority and tag subject
        const finalSubject = isSuperTicket ? `[SUPER] ${newSubject}` : newSubject;
        const finalPriority = isSuperTicket ? 'high' : newPriority;

        let attachUrl = undefined;
        let attachName = undefined;
        if (newAttachment) {
            attachUrl = URL.createObjectURL(newAttachment);
            attachName = newAttachment.name;
        }

        const ticket = await MockDB.createTicket(user.id, finalSubject, newMessage, finalPriority, attachUrl, attachName);
        
        if (isSuperTicket) {
            playNotification("Super Ticket created! An agent will be with you shortly.");
        } else {
            playNotification("Support ticket created successfully.");
        }

        setShowCreateModal(false);
        setNewSubject('');
        setNewMessage('');
        setNewAttachment(null);
        setIsSuperTicket(false);
        setNewPriority('medium');
        
        // Refresh and select
        await loadTickets();
        setSelectedTicket(ticket);
    } catch (error) {
        alert("Failed to create ticket");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText) return;

    try {
        let attachUrl = undefined;
        let attachName = undefined;
        if (replyAttachment) {
            attachUrl = URL.createObjectURL(replyAttachment);
            attachName = replyAttachment.name;
        }

        await MockDB.replyTicket(selectedTicket.id, replyText, false, attachUrl, attachName);
        setReplyText('');
        setReplyAttachment(null);
        
        // Refresh local data
        const updated = await MockDB.getTickets(user.id);
        setTickets(updated);
        const current = updated.find(t => t.id === selectedTicket.id);
        if(current) setSelectedTicket(current);
        
    } catch (error) {
        alert("Failed to send reply");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isReply: boolean) => {
      if (e.target.files && e.target.files[0]) {
          if (isReply) {
              setReplyAttachment(e.target.files[0]);
          } else {
              setNewAttachment(e.target.files[0]);
          }
      }
  };

  // Helper to safely get last message with defensive check
  const getLastMessage = (ticket: Ticket) => {
      if (ticket && ticket.messages && Array.isArray(ticket.messages) && ticket.messages.length > 0) {
          return ticket.messages[ticket.messages.length - 1].text;
      }
      return 'No messages';
  };

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex gap-6">
       
       {/* Left: Ticket List */}
       <div className={`w-full md:w-1/3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden transition-colors ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
           <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
               <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                   <LifeBuoy size={18} className="text-green-600 dark:text-green-400"/> My Tickets
               </h2>
               <button 
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm active:scale-95 transition-transform"
                  title="Create New Ticket"
               >
                   <Plus size={16}/>
               </button>
           </div>
           
           <div className="flex-1 overflow-y-auto">
               {tickets.length === 0 && !loading ? (
                   <div className="p-8 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center justify-center h-full">
                       <MessageSquare size={48} className="mb-2 opacity-20"/>
                       <p className="text-sm font-medium">No tickets yet.</p>
                       <p className="text-xs opacity-60 mb-4">Need help? Create a ticket.</p>
                       <button 
                            onClick={() => setShowCreateModal(true)} 
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-green-700 dark:text-green-400 font-bold text-xs rounded-lg hover:bg-green-50 dark:hover:bg-gray-600"
                        >
                            Create Ticket
                       </button>
                   </div>
               ) : (
                   tickets.map(t => (
                       <div 
                           key={t.id}
                           onClick={() => setSelectedTicket(t)}
                           className={`p-4 border-b border-gray-50 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${selectedTicket?.id === t.id ? 'bg-green-50/50 dark:bg-green-900/20 border-green-100 dark:border-green-800' : ''}`}
                       >
                           <div className="flex justify-between items-start mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    t.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                    t.status === 'open' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 
                                    t.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}>
                                    {t.priority === 'high' ? 'High' : t.status}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{new Date(t.date).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center gap-1.5">
                               {t.subject.includes('[SUPER]') && <Zap size={12} className="text-yellow-500 fill-current" />}
                               <h3 className="font-bold text-sm text-gray-800 dark:text-white truncate">{t.subject.replace('[SUPER] ', '')}</h3>
                           </div>
                           <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                               {getLastMessage(t)}
                           </p>
                       </div>
                   ))
               )}
               {loading && (
                   <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                       <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                       <p className="text-xs">Loading tickets...</p>
                   </div>
               )}
           </div>
       </div>

       {/* Right: Conversation */}
       <div className={`w-full md:w-2/3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col overflow-hidden transition-colors ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
            {selectedTicket ? (
                <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                        <div className="flex items-center gap-2">
                             <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 mr-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"><X size={16}/></button>
                             <div>
                                 <h3 className="font-bold text-gray-800 dark:text-white line-clamp-1 flex items-center gap-2">
                                     {selectedTicket.subject.includes('[SUPER]') && <Zap size={16} className="text-yellow-500 fill-current" />}
                                     {selectedTicket.subject.replace('[SUPER] ', '')}
                                 </h3>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">Ticket #{selectedTicket.id}</p>
                             </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            {selectedTicket.subject.includes('[SUPER]') && (
                                <div className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isAgentOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                    <span className={`text-xs font-bold transition-colors ${isAgentOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                        Agent {isAgentOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                            )}
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                selectedTicket.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                selectedTicket.priority === 'medium' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                             }`}>
                                 {selectedTicket.priority}
                             </span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-gray-900/30">
                        {selectedTicket.messages && selectedTicket.messages.map(msg => (
                            <div key={msg.id} className={`flex ${!msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                    !msg.isAdmin 
                                    ? 'bg-green-600 text-white rounded-br-none' 
                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-none'
                                }`}>
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    {msg.attachmentUrl && (
                                        <div className="mt-2 p-2 bg-black/10 dark:bg-black/20 rounded flex items-center gap-2 text-xs">
                                            <Paperclip size={14}/>
                                            <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[150px] text-white">
                                                {msg.attachmentName || 'Attachment'}
                                            </a>
                                        </div>
                                    )}
                                    <p className={`text-[9px] mt-1 text-right ${!msg.isAdmin ? 'text-green-200' : 'text-gray-400 dark:text-gray-300'}`}>
                                        {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Reply Box */}
                    {selectedTicket.status !== 'closed' ? (
                        <form onSubmit={handleReply} className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                            {replyAttachment && (
                                <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                        <FileText size={14}/>
                                        <span className="truncate max-w-[200px]">{replyAttachment.name}</span>
                                    </div>
                                    <button type="button" onClick={() => setReplyAttachment(null)}><X size={14} className="text-gray-400"/></button>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <label className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                                    <Paperclip size={20}/>
                                    <input type="file" className="hidden" onChange={(e) => handleFileChange(e, true)}/>
                                </label>
                                <input 
                                    type="text" 
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Type your reply here..." 
                                    className="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                />
                                <button type="submit" disabled={!replyText.trim()} className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-200 dark:shadow-none">
                                    <Send size={20}/>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-4 bg-gray-100 dark:bg-gray-900 text-center text-xs text-gray-500 dark:text-gray-400 font-bold uppercase border-t border-gray-200 dark:border-gray-700">
                            This ticket is closed. Please create a new ticket for further assistance.
                        </div>
                    )}
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                        <MessageSquare size={32} className="opacity-30" />
                    </div>
                    <p className="font-medium">Select a ticket to view conversation</p>
                    <p className="text-sm opacity-60">Or create a new one to get help.</p>
                </div>
            )}
       </div>

       {/* Create Modal */}
       {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">New Support Ticket</h3>
                        <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"><X size={20} className="text-gray-400"/></button>
                    </div>
                    
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                        
                        {/* Super Ticket Toggle */}
                        <div 
                            onClick={() => setIsSuperTicket(!isSuperTicket)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                                isSuperTicket 
                                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 dark:border-yellow-600' 
                                : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                            }`}
                        >
                            <div className={`p-2 rounded-full ${isSuperTicket ? 'bg-yellow-400 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400'}`}>
                                <Zap size={20} className={isSuperTicket ? "fill-current" : ""}/>
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-bold ${isSuperTicket ? 'text-yellow-800 dark:text-yellow-300' : 'text-gray-600 dark:text-gray-300'}`}>Super Ticket</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Priority attention for urgent issues.</p>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSuperTicket ? 'border-yellow-500 bg-yellow-500 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                {isSuperTicket && <Plus size={14} className="rotate-45"/>}
                            </div>
                        </div>

                        {!isSuperTicket && (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Priority Level</label>
                                <div className="flex gap-2">
                                    {['low', 'medium', 'high'].map(p => (
                                        <button
                                            type="button"
                                            key={p}
                                            onClick={() => setNewPriority(p as any)}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                                                newPriority === p 
                                                ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                                : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Subject</label>
                            <input 
                                type="text"
                                value={newSubject}
                                onChange={e => setNewSubject(e.target.value)}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="E.g. Payment not reflected"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Message</label>
                            <textarea 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none transition-all text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="Describe your issue in detail so we can help you faster..."
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Attachment (Optional)</label>
                            <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <Paperclip size={18} className="text-gray-400"/>
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 truncate">{newAttachment ? newAttachment.name : "Choose a file..."}</span>
                                <input type="file" className="hidden" onChange={(e) => handleFileChange(e, false)}/>
                            </label>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 ${isSuperTicket ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200 dark:shadow-none' : 'bg-green-700 hover:bg-green-800 shadow-green-200 dark:shadow-none'}`}
                            >
                                {isSubmitting ? 'Creating...' : isSuperTicket ? <><Zap size={16} fill="currentColor"/> Create Super Ticket</> : <><Send size={16}/> Submit Ticket</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
       )}
    </div>
  );
};