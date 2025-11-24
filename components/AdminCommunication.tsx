
import React, { useState, useEffect } from 'react';
import { MockDB } from '../services/mockDb';
import { Announcement, CommunicationTemplate } from '../types';
import { Megaphone, Mail, MessageSquare, Bell, Plus, Trash2, Edit2, Send, Save, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export const AdminCommunication: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'announcements' | 'templates'>('broadcast');
  
  // Announcement State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState<Partial<Announcement>>({ type: 'info', audience: 'all', isActive: true });

  // Template State
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<CommunicationTemplate>>({ channel: 'sms', variables: [] });

  // Broadcast State
  const [broadcastAudience, setBroadcastAudience] = useState('all');
  const [broadcastChannel, setBroadcastChannel] = useState('email');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
      loadData();
  }, []);

  const loadData = async () => {
      setAnnouncements(await MockDB.getAnnouncements());
      setTemplates(await MockDB.getTemplates());
  };

  // --- Announcement Handlers ---
  const handleSaveAnnouncement = async () => {
      if(!newAnnouncement.title || !newAnnouncement.message) return;
      
      const ann: Announcement = {
          id: Math.random().toString(36).substr(2, 9),
          title: newAnnouncement.title,
          message: newAnnouncement.message,
          type: newAnnouncement.type as any,
          audience: newAnnouncement.audience as any,
          isActive: newAnnouncement.isActive || true,
          date: new Date().toISOString()
      };
      
      await MockDB.addAnnouncement(ann);
      setShowAnnounceModal(false);
      setNewAnnouncement({ type: 'info', audience: 'all', isActive: true });
      loadData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
      if(window.confirm('Delete this announcement?')) {
          await MockDB.deleteAnnouncement(id);
          loadData();
      }
  };

  // --- Template Handlers ---
  const handleSaveTemplate = async () => {
      if(!editingTemplate.name || !editingTemplate.body) return;

      const t: CommunicationTemplate = {
          id: editingTemplate.id || Math.random().toString(36).substr(2, 9),
          name: editingTemplate.name,
          channel: editingTemplate.channel as any,
          subject: editingTemplate.subject,
          body: editingTemplate.body,
          variables: editingTemplate.variables || []
      };

      await MockDB.saveTemplate(t);
      setShowTemplateModal(false);
      setEditingTemplate({ channel: 'sms', variables: [] });
      loadData();
  };

  const handleEditTemplate = (t: CommunicationTemplate) => {
      setEditingTemplate(t);
      setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (id: string) => {
      if(window.confirm('Delete this template?')) {
          await MockDB.deleteTemplate(id);
          loadData();
      }
  };

  // --- Broadcast Handler ---
  const handleSendBroadcast = () => {
      if(!broadcastMessage) return;
      setSending(true);
      
      setTimeout(() => {
          setSending(false);
          alert(`Broadcast sent via ${broadcastChannel} to ${broadcastAudience} successfully!`);
          setBroadcastMessage('');
          setBroadcastSubject('');
      }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-24">
        
        {/* Header / Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Megaphone size={24} className="text-green-600 dark:text-green-400"/> Communication Hub
            </h2>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                {[
                    { id: 'broadcast', label: 'Broadcast', icon: Send },
                    { id: 'announcements', label: 'Announcements', icon: Bell },
                    { id: 'templates', label: 'Templates', icon: Edit2 },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white dark:bg-gray-600 shadow text-green-700 dark:text-green-300' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                        }`}
                    >
                        <tab.icon size={16}/> {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* --- BROADCAST TAB --- */}
        {activeTab === 'broadcast' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
                        <h3 className="font-bold text-gray-800 dark:text-white mb-6">Compose Message</h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Target Audience</label>
                                 <select 
                                    value={broadcastAudience} 
                                    onChange={(e) => setBroadcastAudience(e.target.value)}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
                                 >
                                     <option value="all">All Users</option>
                                     <option value="resellers">Resellers Only</option>
                                     <option value="staff">Staff Members</option>
                                     <option value="active">Active Users (Last 30 days)</option>
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Channel</label>
                                 <select 
                                    value={broadcastChannel} 
                                    onChange={(e) => setBroadcastChannel(e.target.value)}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
                                 >
                                     <option value="email">Email</option>
                                     <option value="sms">SMS</option>
                                     <option value="push">Push Notification</option>
                                     <option value="in-app">In-App Notification</option>
                                 </select>
                             </div>
                        </div>

                        {(broadcastChannel === 'email' || broadcastChannel === 'push') && (
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Subject</label>
                                <input 
                                    type="text" 
                                    value={broadcastSubject}
                                    onChange={(e) => setBroadcastSubject(e.target.value)}
                                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
                                    placeholder="e.g., Important Update regarding prices"
                                />
                            </div>
                        )}

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Message Body</label>
                            <textarea 
                                value={broadcastMessage}
                                onChange={(e) => setBroadcastMessage(e.target.value)}
                                className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-gray-900 dark:text-white transition-colors"
                                placeholder="Type your message here..."
                            ></textarea>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500 dark:text-gray-400">{'{name}'}</span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500 dark:text-gray-400">{'{balance}'}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleSendBroadcast}
                            disabled={sending || !broadcastMessage}
                            className="w-full py-3 bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 dark:shadow-green-900/20 hover:bg-green-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {sending ? 'Sending...' : <><Send size={18}/> Send Broadcast</>}
                        </button>
                     </div>
                </div>

                <div className="lg:col-span-1">
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200">
                         <h4 className="font-bold mb-2 flex items-center gap-2"><Info size={18}/> Quick Tips</h4>
                         <ul className="text-sm space-y-2 opacity-80 list-disc pl-4">
                             <li>Use <strong>SMS</strong> for urgent alerts (downtime, security).</li>
                             <li>Use <strong>Email</strong> for detailed newsletters and receipts.</li>
                             <li>Avoid sending broadcasts between 10PM and 6AM.</li>
                             <li>Variables like {'{name}'} will be replaced automatically.</li>
                         </ul>
                     </div>
                </div>
            </div>
        )}

        {/* --- ANNOUNCEMENTS TAB --- */}
        {activeTab === 'announcements' && (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button 
                        onClick={() => setShowAnnounceModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 shadow-md"
                    >
                        <Plus size={18}/> New Announcement
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {announcements.map(ann => (
                        <div key={ann.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex justify-between items-center transition-colors">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${
                                    ann.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                                    ann.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' :
                                    ann.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                                    'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                }`}>
                                    <Bell size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800 dark:text-white">{ann.title}</h3>
                                        {ann.isActive ? (
                                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-[10px] font-bold uppercase rounded-full">Active</span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] font-bold uppercase rounded-full">Inactive</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">{ann.message}</p>
                                    <div className="flex gap-3 mt-2 text-xs text-gray-400">
                                        <span>Audience: <span className="capitalize">{ann.audience}</span></span>
                                        <span>•</span>
                                        <span>Created: {new Date(ann.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteAnnouncement(ann.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={20}/>
                            </button>
                        </div>
                    ))}
                    {announcements.length === 0 && (
                        <div className="text-center py-10 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">No announcements found.</div>
                    )}
                </div>
            </div>
        )}

        {/* --- TEMPLATES TAB --- */}
        {activeTab === 'templates' && (
            <div className="space-y-6">
                 <div className="flex justify-end">
                    <button 
                        onClick={() => { setEditingTemplate({channel: 'sms', variables: []}); setShowTemplateModal(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 shadow-md"
                    >
                        <Plus size={18}/> New Template
                    </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(t => (
                        <div key={t.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative group transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${
                                    t.channel === 'email' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                                    t.channel === 'sms' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' :
                                    'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                }`}>
                                    {t.channel}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEditTemplate(t)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><Edit2 size={14}/></button>
                                    <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-800 dark:text-white mb-2">{t.name}</h3>
                            {t.subject && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2"><strong>Subject:</strong> {t.subject}</p>}
                            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg text-xs text-gray-600 dark:text-gray-300 font-mono h-20 overflow-y-auto border border-gray-100 dark:border-gray-700">
                                {t.body}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- MODALS --- */}
        
        {/* Announcement Modal */}
        {showAnnounceModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">New Announcement</h3>
                    <div className="space-y-4">
                        <input 
                            className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-green-500"
                            placeholder="Title" 
                            value={newAnnouncement.title || ''}
                            onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                        />
                         <textarea 
                            className="w-full p-3 border dark:border-gray-700 rounded-xl h-24 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-green-500"
                            placeholder="Message Content" 
                            value={newAnnouncement.message || ''}
                            onChange={e => setNewAnnouncement({...newAnnouncement, message: e.target.value})}
                        />
                        <div className="grid grid-cols-2 gap-4">
                             <select 
                                className="p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-green-500"
                                value={newAnnouncement.type}
                                onChange={e => setNewAnnouncement({...newAnnouncement, type: e.target.value as any})}
                             >
                                 <option value="info">Info (Blue)</option>
                                 <option value="warning">Warning (Yellow)</option>
                                 <option value="success">Success (Green)</option>
                                 <option value="promo">Promo (Purple)</option>
                             </select>
                             <select 
                                className="p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-green-500"
                                value={newAnnouncement.audience}
                                onChange={e => setNewAnnouncement({...newAnnouncement, audience: e.target.value as any})}
                             >
                                 <option value="all">All Users</option>
                                 <option value="resellers">Resellers</option>
                                 <option value="staff">Staff</option>
                             </select>
                        </div>
                        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <input 
                                type="checkbox" 
                                checked={newAnnouncement.isActive}
                                onChange={e => setNewAnnouncement({...newAnnouncement, isActive: e.target.checked})}
                            />
                            <span className="text-sm">Set as Active immediately</span>
                        </label>
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowAnnounceModal(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Cancel</button>
                            <button onClick={handleSaveAnnouncement} className="flex-1 py-2 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Template Modal */}
        {showTemplateModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up border dark:border-gray-700">
                    <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">{editingTemplate.id ? 'Edit' : 'New'} Template</h3>
                    <div className="space-y-4">
                        <input 
                            className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-green-500"
                            placeholder="Template Name (e.g. Welcome Email)" 
                            value={editingTemplate.name || ''}
                            onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})}
                        />
                        <select 
                            className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-green-500"
                            value={editingTemplate.channel}
                            onChange={e => setEditingTemplate({...editingTemplate, channel: e.target.value as any})}
                        >
                                <option value="email">Email</option>
                                <option value="sms">SMS</option>
                                <option value="push">Push</option>
                        </select>
                        {editingTemplate.channel !== 'sms' && (
                            <input 
                                className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-green-500"
                                placeholder="Subject Line" 
                                value={editingTemplate.subject || ''}
                                onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                            />
                        )}
                        <textarea 
                            className="w-full p-3 border dark:border-gray-700 rounded-xl h-32 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-green-500"
                            placeholder="Body content... Use {name} for variables." 
                            value={editingTemplate.body || ''}
                            onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})}
                        />
                        <div className="flex gap-3 mt-4">
                            <button onClick={() => setShowTemplateModal(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300">Cancel</button>
                            <button onClick={handleSaveTemplate} className="flex-1 py-2 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800">Save</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
