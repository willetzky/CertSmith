import React, { useState } from 'react';
import { createPFX, readFileAsText, binaryStringToUint8Array } from '../utils/cryptoUtils';
import { Button } from './ui/Button';
import { TextArea } from './ui/TextArea';
import { Download, Lock, FilePlus, AlertCircle } from 'lucide-react';

export const PFXGenerator: React.FC = () => {
  const [keyPem, setKeyPem] = useState('');
  const [certPem, setCertPem] = useState('');
  const [caPem, setCaPem] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const text = await readFileAsText(e.target.files[0]);
        setter(text);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleGenerate = async () => {
    if (!keyPem || !certPem) {
      setError("Private Key and Certificate are required.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // UI flush
      
      const p12DerString = createPFX(keyPem, certPem, caPem || null, password);
      const p12Bytes = binaryStringToUint8Array(p12DerString);
      
      const blob = new Blob([p12Bytes], { type: 'application/x-pkcs12' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificate.pfx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      setError(err.message || "Failed to generate PFX.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <FilePlus className="w-5 h-5 text-green-400" />
          Create PFX/P12 Bundle
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inputs Column */}
          <div className="space-y-6">
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-300">Private Key (PEM)</label>
                <input 
                  type="file" 
                  className="hidden" 
                  id="key-upload"
                  onChange={(e) => handleFileUpload(e, setKeyPem)}
                />
                <label htmlFor="key-upload" className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                  Upload .key file
                </label>
              </div>
              <TextArea 
                label="" 
                placeholder="-----BEGIN PRIVATE KEY-----..." 
                rows={4} 
                value={keyPem}
                onChange={(e) => setKeyPem(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-300">Certificate (PEM)</label>
                <input 
                  type="file" 
                  className="hidden" 
                  id="cert-upload"
                  onChange={(e) => handleFileUpload(e, setCertPem)}
                />
                <label htmlFor="cert-upload" className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                  Upload .crt file
                </label>
              </div>
              <TextArea 
                label="" 
                placeholder="-----BEGIN CERTIFICATE-----..." 
                rows={4} 
                value={certPem}
                onChange={(e) => setCertPem(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-300">CA Bundle (Optional)</label>
                 <input 
                  type="file" 
                  className="hidden" 
                  id="ca-upload"
                  onChange={(e) => handleFileUpload(e, setCaPem)}
                />
                <label htmlFor="ca-upload" className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                  Upload .ca-bundle file
                </label>
              </div>
              <TextArea 
                label="" 
                placeholder="-----BEGIN CERTIFICATE-----..." 
                rows={4} 
                value={caPem}
                onChange={(e) => setCaPem(e.target.value)}
              />
            </div>
          </div>

          {/* Settings Column */}
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 p-6 rounded-lg border border-slate-700 h-full">
              <h3 className="text-lg font-medium text-white mb-4">Export Settings</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-2">Export Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a strong password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                   This password will be required to import the PFX file into Windows or other servers.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="mt-auto">
                <Button 
                  variant="primary" 
                  className="w-full !bg-green-600 hover:!bg-green-500"
                  onClick={handleGenerate}
                  isLoading={isProcessing}
                >
                  <Download className="w-4 h-4" /> Generate PFX
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
