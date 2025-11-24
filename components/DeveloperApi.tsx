
import React, { useState } from 'react';
import { User } from '../types';
import { Code2, Copy, Check, Server, Shield, Book, Globe, Terminal } from 'lucide-react';

interface DeveloperApiProps {
  user: User;
}

export const DeveloperApi: React.FC<DeveloperApiProps> = ({ user }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'endpoints'>('overview');

  const handleCopyKey = () => {
      if (user.apiKey) {
          navigator.clipboard.writeText(user.apiKey);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const baseUrl = window.location.origin + "/api/v1"; // Mock URL

  const EndpointCard = ({ method, path, desc, params, example }: any) => (
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden mb-4 bg-white dark:bg-gray-900">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-[10px] font-bold text-white uppercase ${method === 'GET' ? 'bg-blue-600' : 'bg-green-600'}`}>
                  {method}
              </span>
              <code className="text-sm font-mono text-gray-700 dark:text-gray-300">{path}</code>
          </div>
          <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{desc}</p>
              
              {params && (
                  <div className="mb-4">
                      <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Parameters</h4>
                      <div className="bg-gray-50 dark:bg-gray-950 rounded-lg p-3 text-xs font-mono">
                          {params.map((p: any) => (
                              <div key={p.name} className="flex justify-between py-1">
                                  <span className="text-purple-600 dark:text-purple-400">{p.name}</span>
                                  <span className="text-gray-500">{p.type}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <h4 className="text-xs font-bold uppercase text-gray-500 mb-2">Example Response</h4>
              <pre className="bg-black text-green-400 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                  {JSON.stringify(example, null, 2)}
              </pre>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-black dark:to-gray-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 rounded-lg"><Terminal size={24}/></div>
                    <h2 className="text-2xl font-bold">Developer API</h2>
                </div>
                <p className="text-slate-300 max-w-xl mb-8">
                    Integrate our VTU services directly into your own website or application. High speed, reliable endpoints for Airtime, Data, and Bill Payments.
                </p>

                <div className="bg-black/30 border border-white/10 rounded-xl p-4 max-w-md">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Your API Key</p>
                    <div className="flex items-center justify-between">
                        <code className="font-mono text-green-400 tracking-wide text-sm truncate mr-4">
                            {user.apiKey || "Contact Admin to Upgrade Account"}
                        </code>
                        {user.apiKey && (
                            <button onClick={handleCopyKey} className="text-white hover:text-green-400 transition-colors">
                                {copied ? <Check size={18}/> : <Copy size={18}/>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
            <button 
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'overview' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
                Overview
            </button>
            <button 
                onClick={() => setActiveTab('endpoints')}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'endpoints' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
                Endpoints
            </button>
        </div>

        {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <Globe className="text-blue-600 mb-4" size={32}/>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Restful API</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Standard HTTP methods (GET, POST) responding in JSON format.</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <Shield className="text-green-600 mb-4" size={32}/>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">Secure</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">All requests must be authenticated via Bearer Token (API Key).</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <Server className="text-purple-600 mb-4" size={32}/>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">99.9% Uptime</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reliable infrastructure ensuring your transactions always go through.</p>
                </div>
                
                <div className="col-span-full bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Authentication</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Include your API key in the <code>Authorization</code> header of every request.
                    </p>
                    <div className="bg-gray-900 text-gray-300 p-4 rounded-lg font-mono text-sm">
                        Authorization: Bearer {user.apiKey || 'YOUR_API_KEY'}
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'endpoints' && (
            <div>
                <EndpointCard 
                    method="GET" 
                    path="/user/balance" 
                    desc="Get your current wallet balance."
                    example={{ status: "success", balance: 5420.00, currency: "NGN" }}
                />
                <EndpointCard 
                    method="POST" 
                    path="/topup/airtime" 
                    desc="Purchase airtime for a phone number."
                    params={[
                        {name: 'network', type: 'string (MTN, GLO...)'},
                        {name: 'phone', type: 'string'},
                        {name: 'amount', type: 'number'}
                    ]}
                    example={{ status: "success", reference: "REF-829384", message: "Airtime sent successfully" }}
                />
                <EndpointCard 
                    method="POST" 
                    path="/topup/data" 
                    desc="Purchase data bundle."
                    params={[
                        {name: 'network', type: 'string'},
                        {name: 'phone', type: 'string'},
                        {name: 'plan_id', type: 'string'}
                    ]}
                    example={{ status: "success", reference: "REF-DATA-112", message: "Data sent successfully" }}
                />
            </div>
        )}
    </div>
  );
};
