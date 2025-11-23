
import React, { useEffect, useState } from 'react';
import { User, Ticket } from '../types';
import { MockDB } from '../services/mockDb';
import { MessageSquare, Send, Plus, X, AlertCircle } from 'lucide-react';
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
    loadTickets();
  }, [user.id]);

  const loadTickets = async () => {
    setLoading(true);
    const data = await MockDB.getTickets(user.id);
    setTickets(data);
    setLoading(false);
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
        loadTickets();
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

  return (
    <div className="space-y-6 animate-fade-in h-[calc(100vh-140px)] flex gap-6">
       
       {/* Left: Ticket List */}
       <div className={`w-full md:w-1/3 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
           <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
               <h2 className="font-bold text-gray-800">My Tickets</h2>
               <button 
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-sm"
               >
                   <Plus size={16}/>
               </button>
           </div>
           
           <div className="flex-1 overflow-y-auto">
               {tickets.length === 0 && !loading ? (
                   <div className="p-8 text-center text-gray-400">
                       <MessageSquare size={32} className="mx-auto mb-2 opacity-30"/>
                       <p className="text-sm">No tickets yet.</p>
                       <button onClick={() => setShowCreateModal(true)} className="mt-2 text-green-600 font-bold text-xs">Create Ticket</button>
                   </div>
               ) : (
                   tickets.map(t => (
                       <div 
                           key={t.id}
                           onClick={() => setSelectedTicket(t)}
                           className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === t.id ? 'bg-green-50/50' : ''}`}
                       >
                           <div className="flex justify-between items-start mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    t.status === 'open' ? 'bg-green-100 text-green-700' : 
                                    t.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-500'
                                }`}>
                                    {t.status}
                                </span>
                                <span className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString()}</span>
                           </div>
                           <h3 className="font-bold text-sm text-gray-800 truncate">{t.subject}</h3>
                           <p className="text-xs text-gray-500 truncate mt-1">
                               {t.messages[t.messages.length - 1].text}
                           </p>
                       </div>
                   ))
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
                             <button onClick={() => setSelectedTicket(null)} className="md:hidden p-1 mr-2 bg-white rounded-full border"><X size={16}/></button>
                             <div>
                                 <h3 className="font-bold text-gray-800">{selectedTicket.subject}</h3>
                                 <p className="text-xs text-gray-500">Ticket #{selectedTicket.id}</p>
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
                        {selectedTicket.messages.map(msg => (
                            <div key={msg.id} className={`flex ${!msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                                    !msg.isAdmin 
                                    ? 'bg-green-600 text-white rounded-br-none' 
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                }`}>
                                    <p>{msg.text}</p>
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
                                    placeholder="Type your message..." 
                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                />
                                <button type="submit" disabled={!replyText} className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50">
                                    <Send size={20}/>
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-4 bg-gray-100 text-center text-xs text-gray-500 font-bold uppercase">
                            This ticket is closed
                        </div>
                    )}
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p>Select a ticket to view conversation</p>
                </div>
            )}
       </div>

       {/* Create Modal */}
       {showCreateModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">New Support Ticket</h3>
                        <button onClick={() => setShowCreateModal(false)}><X size={20} className="text-gray-400"/></button>
                    </div>
                    
                    <form onSubmit={handleCreateTicket} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                            <div className="flex gap-2">
                                {['low', 'medium', 'high'].map(p => (
                                    <button
                                        type="button"
                                        key={p}
                                        onClick={() => setNewPriority(p as any)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold capitalize border transition-all ${
                                            newPriority === p 
                                            ? 'bg-green-600 text-white border-green-600' 
                                            : 'bg-gray-50 text-gray-500 border-gray-200'
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
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Brief description of issue"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Message</label>
                            <textarea 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-32"
                                placeholder="Describe your issue in detail..."
                                required
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"
                            >
                                {isSubmitting ? 'Creating...' : 'Submit Ticket'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
       )}

    </div>
  );
};
