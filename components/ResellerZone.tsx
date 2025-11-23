import React, { useState } from 'react';
import { Upload, FileText, Check } from 'lucide-react';

export const ResellerZone: React.FC = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const processBulk = () => {
    if (!csvFile) return;
    setStatus('processing');
    setTimeout(() => {
        setStatus('done');
    }, 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">Reseller Zone</h2>
        <p className="text-purple-200 text-sm">Bulk Top-up & Sub-account Management</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Upload size={20} className="text-purple-600"/>
            Bulk Airtime Top-up (CSV)
        </h3>
        
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors relative">
            <input 
                type="file" 
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {csvFile ? (
                <div className="flex flex-col items-center text-green-600">
                    <FileText size={32} className="mb-2" />
                    <p className="font-medium">{csvFile.name}</p>
                </div>
            ) : (
                <div className="flex flex-col items-center text-gray-400">
                    <Upload size={32} className="mb-2" />
                    <p className="text-sm">Drag & Drop or Click to Upload CSV</p>
                    <p className="text-xs mt-1">Format: phone, amount, network</p>
                </div>
            )}
        </div>

        {csvFile && status !== 'done' && (
             <button 
                onClick={processBulk}
                disabled={status === 'processing'}
                className="w-full mt-4 py-3 bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-200"
             >
                {status === 'processing' ? 'Processing...' : 'Execute Batch'}
             </button>
        )}

        {status === 'done' && (
            <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-3">
                <Check size={24} />
                <div>
                    <p className="font-bold">Batch Completed</p>
                    <p className="text-xs">All numbers have been topped up.</p>
                </div>
            </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
         <h3 className="font-bold text-gray-800 mb-4">Sub-Accounts</h3>
         <p className="text-gray-500 text-sm italic">No sub-accounts created yet.</p>
         <button className="mt-4 px-4 py-2 border border-purple-600 text-purple-600 rounded-lg text-sm font-medium">
            + Create Sub-account
         </button>
      </div>
    </div>
  );
};