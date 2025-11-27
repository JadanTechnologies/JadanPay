
import React, { useState, useRef } from 'react';
import { Camera, Upload, X, CheckCircle, Loader2, AlertCircle, FileText } from 'lucide-react';
import { User } from '../types';
import { MockDB } from '../services/mockDb';
import { playNotification } from '../utils/audio';

interface VerificationModalProps {
    user: User;
    onClose: () => void;
    onSuccess: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ user, onClose, onSuccess }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [docType, setDocType] = useState('NIN');
    const [docNumber, setDocNumber] = useState('');
    const [docFile, setDocFile] = useState<File | null>(null);
    const [faceImage, setFaceImage] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setDocFile(e.target.files[0]);
        }
    };

    const startCamera = async () => {
        setIsCameraOpen(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            alert("Could not access camera. Please upload a photo instead.");
            setIsCameraOpen(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
            setFaceImage(canvas.toDataURL('image/jpeg'));
            
            // Stop stream
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            setIsCameraOpen(false);
        }
    };

    const handleSubmit = async () => {
        if (!docFile || !faceImage) return;
        if ((docType === 'NIN' || docType === 'BVN') && !docNumber) {
            alert(`Please enter your ${docType} number.`);
            return;
        }

        setIsSubmitting(true);
        try {
            // Simulate uploads
            await new Promise(r => setTimeout(r, 1500));
            const docUrl = URL.createObjectURL(docFile);
            
            await MockDB.submitKyc(user.id, docType, docUrl, faceImage, docNumber);
            
            playNotification("Verification is pending admin approval.");
            
            onSuccess();
            alert("Verification submitted successfully! Admin will review shortly.");
            onClose();
        } catch (e) {
            playNotification("Verification failed, please try again.", "error");
            alert("Submission failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">Verify Identity</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400"/></button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* Progress Steps */}
                    <div className="flex justify-between mb-8 px-4 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                                {s}
                            </div>
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <h4 className="font-bold text-center text-gray-800 dark:text-white">Document Selection</h4>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Document Type</label>
                                <select 
                                    value={docType} 
                                    onChange={(e) => setDocType(e.target.value)}
                                    className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-green-500"
                                >
                                    <option value="NIN">NIN (National ID)</option>
                                    <option value="BVN">BVN (Bank Verification)</option>
                                    <option value="PVC">Voter's Card</option>
                                    <option value="DL">Driver's License</option>
                                    <option value="IP">International Passport</option>
                                </select>
                            </div>

                            {(docType === 'NIN' || docType === 'BVN') && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Enter {docType} Number</label>
                                    <input 
                                        type="text"
                                        value={docNumber}
                                        onChange={(e) => setDocNumber(e.target.value.replace(/\D/g,''))}
                                        placeholder={`Enter 11-digit ${docType}`}
                                        className="w-full p-3 border dark:border-gray-700 rounded-xl bg-white dark:bg-gray-950 text-gray-900 dark:text-white outline-none focus:border-green-500 font-mono tracking-wider"
                                        maxLength={11}
                                    />
                                </div>
                            )}
                            
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-800 relative hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"/>
                                {docFile ? (
                                    <div className="text-green-600 dark:text-green-400 flex flex-col items-center">
                                        <CheckCircle size={32} className="mb-2"/>
                                        <p className="text-sm font-medium">{docFile.name}</p>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 flex flex-col items-center">
                                        <Upload size={32} className="mb-2"/>
                                        <p className="text-sm font-medium">Upload Supporting Document</p>
                                        <p className="text-[10px] mt-1 opacity-70">Image / Slip / Card</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => {
                                    if((docType === 'NIN' || docType === 'BVN') && docNumber.length < 11) {
                                        alert(`Please enter a valid ${docType} number`);
                                        return;
                                    }
                                    if(!docFile) {
                                        alert("Please upload a document image");
                                        return;
                                    }
                                    setStep(2);
                                }} 
                                className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next Step
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-fade-in text-center">
                            <h4 className="font-bold text-gray-800 dark:text-white">Face Capture</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Please position your face in the frame.</p>

                            <div className="w-full h-64 bg-black rounded-2xl overflow-hidden relative flex items-center justify-center border-2 border-gray-800">
                                {faceImage ? (
                                    <img src={faceImage} alt="Capture" className="w-full h-full object-cover"/>
                                ) : isCameraOpen ? (
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
                                ) : (
                                    <div className="text-gray-500 flex flex-col items-center">
                                        <Camera size={48} className="opacity-50 mb-2"/>
                                        <p>Camera Off</p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {faceImage ? (
                                    <button onClick={() => setFaceImage(null)} className="py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-bold text-sm">Retake</button>
                                ) : isCameraOpen ? (
                                    <button onClick={capturePhoto} className="py-2 bg-white text-black rounded-lg font-bold text-sm">Capture</button>
                                ) : (
                                    <button onClick={startCamera} className="py-2 bg-blue-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 col-span-2"><Camera size={16}/> Start Camera</button>
                                )}
                                
                                {faceImage && (
                                    <button onClick={() => setStep(3)} className="py-2 bg-green-600 text-white rounded-lg font-bold text-sm">Next</button>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-fade-in text-center">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                                <CheckCircle size={32}/>
                            </div>
                            <h4 className="font-bold text-gray-800 dark:text-white text-xl">Ready to Submit</h4>
                            
                            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 text-left text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Type:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{docType}</span>
                                </div>
                                {docNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Number:</span>
                                        <span className="font-mono font-bold text-gray-900 dark:text-white">{docNumber}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-500 dark:text-gray-400">Face Capture:</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">Completed</span>
                                </div>
                            </div>

                            <button 
                                onClick={handleSubmit} 
                                disabled={isSubmitting}
                                className="w-full py-3 bg-green-700 text-white rounded-xl font-bold hover:bg-green-800 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin"/> : "Submit Verification"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
