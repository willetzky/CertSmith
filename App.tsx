
import React, { useState } from 'react';
import { PFXExtractor } from './components/PFXExtractor';
import { PFXGenerator } from './components/PFXGenerator';
import { MatchChecker } from './components/MatchChecker';
import { CertificateAnalyzer } from './components/CertificateAnalyzer';
import { AppMode } from './types';
import { ShieldCheck, FileInput, FileOutput, BrainCircuit, ShieldQuestion } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.PFX_TO_PEM);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  CertSmith
                </h1>
                <p className="text-xs text-slate-500 font-medium">Secure Client-Side Crypto</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center space-x-4 text-sm text-slate-500">
                    <span>Ubuntu 24.04 Ready</span>
                </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-xl border border-slate-800 w-fit mx-auto md:mx-0">
          <button
            onClick={() => setMode(AppMode.PFX_TO_PEM)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === AppMode.PFX_TO_PEM 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileInput className="w-4 h-4" />
            Extract PFX/P7B
          </button>
          
          <button
            onClick={() => setMode(AppMode.PEM_TO_PFX)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === AppMode.PEM_TO_PFX 
                ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileOutput className="w-4 h-4" />
            Create PFX/P7B
          </button>

          <button
            onClick={() => setMode(AppMode.MATCH_CHECKER)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === AppMode.MATCH_CHECKER 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldQuestion className="w-4 h-4" />
            Match Checker
          </button>

          <button
            onClick={() => setMode(AppMode.AI_ANALYSIS)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === AppMode.AI_ANALYSIS 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            AI Analysis
          </button>
        </div>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {mode === AppMode.PFX_TO_PEM && <PFXExtractor />}
          {mode === AppMode.PEM_TO_PFX && <PFXGenerator />}
          {mode === AppMode.MATCH_CHECKER && <MatchChecker />}
          {mode === AppMode.AI_ANALYSIS && <CertificateAnalyzer />}
        </div>

      </main>

      <footer className="border-t border-slate-800 mt-12 py-8 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-600 text-sm">
              <p>&copy; {new Date().getFullYear()} CertSmith. All cryptographic operations performed locally in your browser.</p>
              <div className="mt-2 flex justify-center gap-4">
                  <a href="#" className="hover:text-blue-400">Documentation</a>
                  <a href="#" className="hover:text-blue-400">Privacy Policy</a>
              </div>
          </div>
      </footer>
    </div>
  );
};

export default App;
