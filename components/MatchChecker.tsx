
import React, { useState } from 'react';
import { verifyCertKeyMatch, readFileAsText } from '../utils/cryptoUtils';
import { Button } from './ui/Button';
import { TextArea } from './ui/TextArea';
// Added AlertCircle to the imports
import { CheckCircle2, XCircle, ShieldQuestion, Lock, Upload, KeyRound, FileText, AlertCircle } from 'lucide-react';

export const MatchChecker: React.FC = () => {
  const [certPem, setCertPem] = useState('');
  const [keyPem, setKeyPem] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'match' | 'mismatch' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const text = await readFileAsText(e.target.files[0]);
        setter(text);
        setStatus('idle');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleVerify = async () => {
    if (!certPem || !keyPem) return;
    
    setIsVerifying(true);
    setErrorMsg(null);
    setStatus('idle');

    try {
      await new Promise(resolve => setTimeout(resolve, 400)); // Smooth UX
      const isMatch = verifyCertKeyMatch(certPem, keyPem, password || undefined);
      setStatus(isMatch ? 'match' : 'mismatch');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || "Failed to verify certificate and key pair.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
          <ShieldQuestion className="w-5 h-5 text-orange-400" />
          Verify Cert & Key Match
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Certificate Input */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    Public Certificate (PEM)
                </label>
                <label className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, setCertPem)} />
                    Upload File
                </label>
            </div>
            <TextArea 
              label="" 
              placeholder="-----BEGIN CERTIFICATE-----..." 
              rows={10} 
              value={certPem}
              onChange={(e) => {setCertPem(e.target.value); setStatus('idle');}}
            />
          </div>

          {/* Key Input */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-yellow-400" />
                    Private Key (PEM)
                </label>
                <label className="text-xs text-yellow-400 cursor-pointer hover:text-yellow-300">
                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, setKeyPem)} />
                    Upload File
                </label>
            </div>
            <TextArea 
              label="" 
              placeholder="-----BEGIN RSA PRIVATE KEY-----..." 
              rows={10} 
              value={keyPem}
              onChange={(e) => {setKeyPem(e.target.value); setStatus('idle');}}
            />
            
            <div className="pt-2">
                <label className="block text-sm font-medium text-slate-400 mb-2">Key Password (if encrypted)</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => {setPassword(e.target.value); setStatus('idle');}}
                        placeholder="Enter password to decrypt key"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                </div>
            </div>
          </div>
        </div>

        {/* Verification Area */}
        <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-xl border border-slate-700 border-dashed">
            {status === 'idle' && (
                <div className="text-center space-y-4">
                    <Button 
                        onClick={handleVerify} 
                        disabled={!certPem || !keyPem} 
                        isLoading={isVerifying}
                        className="!bg-orange-600 hover:!bg-orange-500 px-8 py-3 text-lg"
                    >
                        Verify Pair Match
                    </Button>
                    <p className="text-slate-500 text-sm">Compare the public key of the certificate against the private key's parameters.</p>
                </div>
            )}

            {status === 'match' && (
                <div className="text-center animate-bounce-in">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-400">Match Confirmed!</h3>
                    <p className="text-slate-400 mt-2">The certificate and private key form a valid cryptographic pair.</p>
                    <Button variant="ghost" onClick={() => setStatus('idle')} className="mt-4 text-xs">Reset</Button>
                </div>
            )}

            {status === 'mismatch' && (
                <div className="text-center animate-shake">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-red-400">Mismatch Detected</h3>
                    <p className="text-slate-400 mt-2">This private key does not belong to the provided certificate.</p>
                    <Button variant="ghost" onClick={() => setStatus('idle')} className="mt-4 text-xs">Try again</Button>
                </div>
            )}

            {status === 'error' && (
                <div className="text-center text-red-400 space-y-2">
                    <AlertCircle className="w-12 h-12 mx-auto" />
                    <p className="font-medium">Verification Error</p>
                    <p className="text-sm opacity-80">{errorMsg}</p>
                    <Button variant="ghost" onClick={() => setStatus('idle')} className="mt-4 text-xs">Reset</Button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
