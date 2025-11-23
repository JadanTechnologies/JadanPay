
import React, { useEffect, useState } from 'react';
import { User, Ticket } from '../types';
import { MockDB } from '../services/mockDb';
import { MessageSquare, Send, Plus, X, AlertCircle, LifeBuoy } from 'lucide-react';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (user?.id) {
        loadTickets();
    }
  }, [user.id]);

  const loadTickets = async () => {
    setLoading(true);
    try {
        const data = await MockDB.getTickets(user.id);
        setTickets(data);
    } catch (e) {
        console.error("Failed to load tickets", e);
    } finally {
        setLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newMessage) return;
    
    setIsSubmitting(true);
    try {
        await MockDB.createTicket(user.id, newSubject, newMessage, newPriority);
        playNotification("Support ticket created successfully.");
        setShowCreateModal(false);
        setNewSubject('');
        setNewMessage('');
        await loadTickets();
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
        await MockDB.replyTicket(selectedTicket.id, replyText, false);
        setReplyText('');
        
        // Refresh local data
        const updated = await MockDB.getTickets(user.id);
        setTickets(updated);
        const current = updated.find(t => t.id === selectedTicket.id);
        if(current) setSelectedTicket(current);
        
    } catch (error) {
        alert("Failed to send reply");
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
       <div className={`w-full md:w-1/3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
           <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h2 className="font-bold text-gray-800 flex items-center gap-2">
                   <LifeBuoy size={18} className="text-green-600"/> My Tickets
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
                   <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                       <MessageSquare size={48} className="mb-2 opacity-20"/>
                       <p className="text-sm font-medium">No tickets yet.</p>
                       <p className="text-xs opacity-60 mb-4">Need help? Create a ticket.</p>
                       <button 
                            onClick={() => setShowCreateModal(true)} 
                            className="px-4 py-2 bg-gray-100 text-green-700 font-bold text-xs rounded-lg hover:bg-green-50"
                        >
                            Create Ticket
                       </button>
                   </div>
               ) : (
                   tickets.map(t => (
                       <div 
                           key={t.id}
                           onClick={() => setSelectedTicket(t)}
                           className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === t.id ? 'bg-green-50/50 border-green-100' : ''}`}
                       >
                           <div className="flex justify-between items-start mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    t.status === 'open' ? 'bg-green-100 text-green-700' : 
                                    t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                    {t.status}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">{new Date(t.date).toLocaleDateString()}</span>
                           </div>
                           <h3 className="font-bold text-sm text-gray-800 truncate">{t.subject}</h3>
                           <p className="text-xs text-gray-500 truncate mt-1">
                               {getLastMessage(t)}
                           </p>
                       </div>
                   ))
               )}
               {loading && (
                   <div className="p-8 text-center text-gray-400">
                       <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                       <p className="text-xs">Loading tickets...</p>
                   </div>
               )}
           </div>
       </div>

       {/* Right: Conversation */}
       <div className={`w-full md:w-2/3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden ${!selectedTicket ? 'hidden md:flex' : 'flex'}`}>
            {selectedTicket ? (
                <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-2">
                             <button onClick={() => setSelectedTicket(null)} className="md:hidden p-2 mr-1 bg-white rounded-full border border-gray-200 text-gray-500"><X size={16}/></button>
                             <div>
                                 <h3 className="font-bold text-gray-800 line-clamp-1">{selectedTicket.subject}</h3>
                                 <p className="text-xs text-gray-500 font-mono">Ticket #{selectedTicket.id}</p>
                             </div>
                        </div>
                        <div className="flex gap-2">
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                selectedTicket.priority === 'high' ? 'bg-red-100 text-red-700' :
                                selectedTicket.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                                'bg-blue-100 text-blue-700'
                             }`}>
                                 {selectedTicket.priority}
                             </span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
                        {selectedTicket.messages && selectedTicket.messages.map(msg => (
                            <div key={msg.id} className={`flex ${!msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                    !msg.isAdmin 
                                    ? 'bg-green-600 text-white rounded-br-none' 
                                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                }`}>
                                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    <p className={`text-[9px] mt-1 text-right ${!msg.isAdmin ? 'text-green-200' : 'text-gray-400'}`}>
                                        {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Reply Box */}
                    {selectedTicket.status !== 'closed' ? (
                        <form onSubmit={handleReply} className="p-4 border-t border-gray-100 bg-white">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Type your reply here..." 
                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                                <button type="submit" disabled={!replyText.trim()} className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-green-200">
                                    <Send size={20}/>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-4 bg-gray-100 text-center text-xs text-gray-500 font-bold uppercase border-t border-gray-200">
                            This ticket is closed. Please create a new ticket for further assistance.
                        </div>
                    )}
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
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
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-gray-900">New Support Ticket</h3>
                        <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20} className="text-gray-400"/></button>
                    </div>
                    
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority Level</label>
                            <div className="flex gap-2">
                                {['low', 'medium', 'high'].map(p => (
                                    <button
                                        type="button"
                                        key={p}
                                        onClick={() => setNewPriority(p as any)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold capitalize border transition-all ${
                                            newPriority === p 
                                            ? 'bg-green-600 text-white border-green-600 shadow-md' 
                                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subject</label>
                            <input 
                                type="text"
                                value={newSubject}
                                onChange={e => setNewSubject(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                placeholder="E.g. Payment not reflected"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
                            <textarea 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-32 resize-none transition-all"
                                placeholder="Describe your issue in detail so we can help you faster..."
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 transition-colors shadow-lg shadow-green-200 disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? 'Creating...' : <><Send size={16}/> Submit Ticket</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
       )}
    </div>
  );
};
