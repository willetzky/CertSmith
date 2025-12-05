import React, { useState } from 'react';
import { analyzeCertificate } from '../services/geminiService';
import { Button } from './ui/Button';
import { TextArea } from './ui/TextArea';
import { Bot, AlertTriangle, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const CertificateAnalyzer: React.FC = () => {
  const [pem, setPem] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!pem.trim()) return;
    
    setLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeCertificate(pem);
      setAnalysis(result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
          <Bot className="w-6 h-6 text-purple-400" />
          AI Certificate Analysis
        </h2>
        
        <div className="mb-4 bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
                <h4 className="text-yellow-500 font-medium text-sm">Security Warning</h4>
                <p className="text-yellow-200/70 text-sm mt-1">
                    Only paste <strong>Certificates (public keys)</strong> here. 
                    <br/>
                    <strong>NEVER</strong> paste your Private Key into this or any other AI tool. 
                    The analysis runs on Google Gemini servers.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
                <TextArea 
                    label="Paste Certificate (PEM)" 
                    placeholder="-----BEGIN CERTIFICATE-----..."
                    rows={15}
                    value={pem}
                    onChange={(e) => setPem(e.target.value)}
                />
                <Button 
                    onClick={handleAnalyze} 
                    isLoading={loading}
                    disabled={!pem.trim()}
                    className="w-full !bg-purple-600 hover:!bg-purple-500"
                >
                    <Bot className="w-4 h-4 mr-2" />
                    Analyze with Gemini
                </Button>
            </div>

            <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 min-h-[400px]">
                {!analysis && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Terminal className="w-12 h-12 mb-3 opacity-30" />
                        <p>Analysis results will appear here.</p>
                    </div>
                )}
                
                {loading && (
                    <div className="h-full flex flex-col items-center justify-center text-purple-400 animate-pulse">
                        <Bot className="w-12 h-12 mb-3" />
                        <p>Gemini is thinking...</p>
                    </div>
                )}

                {analysis && (
                    <div className="prose prose-invert prose-sm max-w-none overflow-y-auto h-full pr-2">
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
