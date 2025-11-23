import React, { useEffect, useState } from 'react';
import { Ticket } from '../types';
import { MockDB } from '../services/mockDb';
import { MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminSupport: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    const data = await MockDB.getTickets();
    setTickets(data);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText) return;
    
    await MockDB.replyTicket(selectedTicket.id, replyText, true);
    setReplyText('');
    await loadTickets();
    // Refresh selected ticket
    const updated = await MockDB.getTickets();
    const current = updated.find(t => t.id === selectedTicket.id);
    if(current) setSelectedTicket(current);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6 animate-fade-in">
        {/* Ticket List */}
        <div className="w-1/3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-800">Support Tickets</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
                {tickets.map(ticket => (
                    <div 
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-green-50/50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                ticket.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {ticket.priority}
                            </span>
                            <span className="text-xs text-gray-400">{new Date(ticket.date).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-bold text-sm text-gray-800 truncate mb-1">{ticket.subject}</h3>
                        <p className="text-xs text-gray-500 truncate">{ticket.messages[ticket.messages.length - 1].text}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            {selectedTicket ? (
                <>
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <div>
                            <h3 className="font-bold text-gray-800">{selectedTicket.subject}</h3>
                            <p className="text-xs text-gray-500">Ticket ID: #{selectedTicket.id}</p>
                        </div>
                        <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold uppercase text-green-600">
                            {selectedTicket.status}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedTicket.messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                                    msg.isAdmin 
                                    ? 'bg-green-600 text-white rounded-br-none' 
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}>
                                    <p>{msg.text}</p>
                                    <p className={`text-[10px] mt-1 text-right ${msg.isAdmin ? 'text-green-200' : 'text-gray-400'}`}>
                                        {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleReply} className="p-4 border-t border-gray-100 flex gap-2">
                        <input 
                            type="text" 
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Type your reply..." 
                            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                        />
                        <button type="submit" className="p-3 bg-green-700 text-white rounded-xl hover:bg-green-800">
                            <Send size={20} />
                        </button>
                    </form>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <MessageSquare size={48} className="mb-4 opacity-20" />
                    <p>Select a ticket to view conversation</p>
                </div>
            )}
        </div>
    </div>
  );
};