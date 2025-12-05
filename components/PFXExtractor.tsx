import React, { useState } from 'react';
import { extractFromPFX, readFileAsArrayBuffer } from '../utils/cryptoUtils';
import { ParsedPFX } from '../types';
import { Button } from './ui/Button';
import { TextArea } from './ui/TextArea';
import { Download, Upload, Lock, FileKey, AlertCircle, KeyRound } from 'lucide-react';

export const PFXExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [outputPassword, setOutputPassword] = useState('');
  const [result, setResult] = useState<ParsedPFX | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please select a PFX file first.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const buffer = await readFileAsArrayBuffer(file);
      const extracted = extractFromPFX(buffer, password, outputPassword || undefined);
      setResult(extracted);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred during conversion.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadText = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-400" />
          Import PFX/P12 File
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-400 mb-1">Select File</label>
              <input 
                type="file" 
                accept=".pfx,.p12"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-500
                  cursor-pointer bg-slate-800 rounded-lg border border-slate-700
                "
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">PFX Password (Input)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password to unlock PFX"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-700/50">
              <label className="block text-sm font-medium text-slate-400 mb-1">Private Key Password (Output)</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={outputPassword}
                  onChange={(e) => setOutputPassword(e.target.value)}
                  placeholder="Optional: Encrypt the .key file"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Leave blank for unencrypted key.</p>
            </div>

            <Button 
              onClick={handleConvert} 
              disabled={!file} 
              isLoading={isProcessing}
              className="w-full"
            >
              Convert to PEM
            </Button>

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex flex-col items-center justify-center text-center text-slate-500">
            <FileKey className="w-12 h-12 mb-2 opacity-50" />
            <p className="text-sm">
              Your files are processed securely in your browser.<br/>
              Private keys never leave this device.
            </p>
          </div>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 gap-6 animate-fade-in-up">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                Private Key (.key) 
                {outputPassword && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-800">Encrypted</span>}
              </h3>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => result.key && downloadText('private.key', result.key)}
                disabled={!result.key}
                className="text-xs"
              >
                <Download className="w-4 h-4" /> Download
              </Button>
            </div>
            <TextArea 
              label="" 
              readOnly 
              rows={6} 
              value={result.key || "No private key found."} 
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Certificate (.crt)</h3>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => result.cert && downloadText('certificate.crt', result.cert)}
                disabled={!result.cert}
                className="text-xs"
              >
                <Download className="w-4 h-4" /> Download
              </Button>
            </div>
            <TextArea 
              label="" 
              readOnly 
              rows={6} 
              value={result.cert || "No certificate found."} 
            />
          </div>

          {result.ca && (
             <div className="space-y-2">
             <div className="flex justify-between items-center">
               <h3 className="text-lg font-medium text-white">CA Bundle (.ca-bundle)</h3>
               <Button 
                 variant="secondary" 
                 size="sm"
                 onClick={() => result.ca && downloadText('ca-bundle.crt', result.ca)}
                 disabled={!result.ca}
                 className="text-xs"
               >
                 <Download className="w-4 h-4" /> Download
               </Button>
             </div>
             <TextArea 
               label="" 
               readOnly 
               rows={6} 
               value={result.ca} 
             />
           </div>
          )}
        </div>
      )}
    </div>
  );
};