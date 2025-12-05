import React, { useState, useRef } from 'react';
import { extractFromPFX, extractFromP7B, readFileAsArrayBuffer } from '../utils/cryptoUtils';
import { ParsedPFX } from '../types';
import { Button } from './ui/Button';
import { TextArea } from './ui/TextArea';
import { Download, Upload, Lock, FileKey, AlertCircle, KeyRound, FileCheck } from 'lucide-react';

export const PFXExtractor: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [outputPassword, setOutputPassword] = useState('');
  const [result, setResult] = useState<ParsedPFX | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setError(null);
      setResult(null);
      // Update the hidden input if possible, though not strictly required for processing
      if (fileInputRef.current) {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(droppedFile);
          fileInputRef.current.files = dataTransfer.files;
      }
    }
  };

  const isP7B = (filename: string) => {
      const lower = filename.toLowerCase();
      return lower.endsWith('.p7b') || lower.endsWith('.p7c');
  }

  const handleConvert = async () => {
    setError(null);

    if (!file) {
      setError("Please select a file first.");
      return;
    }

    const fileName = file.name.toLowerCase();
    const isP7bFile = isP7B(fileName);

    // Validation
    if (!fileName.endsWith('.pfx') && !fileName.endsWith('.p12') && !isP7bFile) {
      setError("Invalid file type. Supported formats: .pfx, .p12, .p7b, .p7c");
      return;
    }

    // Password validation only for PFX
    if (!isP7bFile && !password) {
      setError("Please enter the PFX password.");
      return;
    }

    setIsProcessing(true);

    try {
      // Small delay to allow UI to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const buffer = await readFileAsArrayBuffer(file);
      
      let extracted: ParsedPFX;
      if (isP7bFile) {
          extracted = extractFromP7B(buffer);
      } else {
          extracted = extractFromPFX(buffer, password, outputPassword || undefined);
      }
      
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

  const getBaseFileName = () => {
      if (!file) return 'certificate';
      // Remove extension case insensitive
      return file.name.replace(/\.(pfx|p12|p7b|p7c)$/i, '');
  };

  const baseFileName = getBaseFileName();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-400" />
          Import PFX/P12 or P7B File
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            
            {/* Drag and Drop Area */}
            <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 
                    text-center flex flex-col items-center justify-center cursor-pointer group min-h-[200px]
                    ${isDragging 
                        ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-xl shadow-blue-900/20' 
                        : error 
                            ? 'border-red-500/50 bg-red-900/10 hover:border-red-500/80' 
                            : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                    }
                `}
            >
                <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".pfx,.p12,.p7b,.p7c"
                    onChange={handleFileChange}
                    className="hidden" 
                />
                
                <div className="pointer-events-none">
                    {file ? (
                        <div className="animate-fade-in flex flex-col items-center">
                            <div className="bg-green-500/20 p-3 rounded-full mb-3">
                                <FileCheck className="w-8 h-8 text-green-400" />
                            </div>
                            <p className="text-lg text-white font-medium truncate max-w-[250px]">{file.name}</p>
                            <p className="text-sm text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            <p className="text-xs text-blue-400 mt-3 group-hover:underline">Click or drag to replace</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className={`p-3 rounded-full mb-3 transition-colors ${isDragging ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
                                <Upload className={`w-8 h-8 transition-colors ${isDragging ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                            </div>
                            <p className="text-lg text-slate-300 font-medium">Drag & Drop file here</p>
                            <p className="text-sm text-slate-500 mt-1">or click to browse</p>
                            <div className="mt-6 flex gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                <span className="bg-slate-900/50 border border-slate-700 px-2 py-1 rounded">PFX</span>
                                <span className="bg-slate-900/50 border border-slate-700 px-2 py-1 rounded">P12</span>
                                <span className="bg-slate-900/50 border border-slate-700 px-2 py-1 rounded">P7B</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className={`transition-all duration-300 ${file && isP7B(file.name) ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
              <label className="block text-sm font-medium text-slate-400 mb-1">PFX Password (Input)</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error === "Please enter the PFX password.") setError(null);
                  }}
                  placeholder={file && isP7B(file.name) ? "Not required for P7B" : "Enter password to unlock PFX"}
                  disabled={!!(file && isP7B(file.name))}
                  className={`w-full bg-slate-800 border rounded-lg pl-9 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none ${error === "Please enter the PFX password." ? 'border-red-500' : 'border-slate-700'}`}
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
                  disabled={!!(file && isP7B(file.name))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-600 disabled:opacity-50"
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
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
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
            {/* Private Key Section - Only show if present (not for P7B) */}
           {result.key ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    Private Key (.key) 
                    {outputPassword && <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-800">Encrypted</span>}
                </h3>
                <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => result.key && downloadText(`${baseFileName}.key`, result.key)}
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
                value={result.key || ""} 
                />
            </div>
           ) : (
             <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-blue-200 text-sm">
                 No Private Key found (Normal for P7B files).
             </div>
           )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-white">Certificate (.crt)</h3>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => result.cert && downloadText(`${baseFileName}.crt`, result.cert)}
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
               <h3 className="text-lg font-medium text-white">CA Bundle (.ca.crt)</h3>
               <Button 
                 variant="secondary" 
                 size="sm"
                 onClick={() => result.ca && downloadText(`${baseFileName}.ca.crt`, result.ca)}
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