import React, { useState } from 'react';
import { X, Sparkles, Trash2, Copy, Check, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { Email, GeminiFilterResponse } from '../types';
import { analyzeFilterIntent, applyLocalFilter } from '../services/gemini';
import { EmailList } from './EmailList';
import { BACKEND_URL } from '../config';

interface SmartCleanerProps {
  onClose: () => void;
  allEmails: Email[];
  onDelete: (ids: string[]) => void;
}

const QUICK_FILTERS = [
  { label: "🧹 Clean Primary Clutter", prompt: "Find non-important emails in my Primary inbox that are NOT spam (e.g., newsletters, automated notifications, terms updates). Exclude anything marked important." },
  { label: "📅 Old Newsletters", prompt: "Find newsletters older than 3 months" },
  { label: "🔔 Social Notifications", prompt: "Delete all social notifications" },
];

export const SmartCleaner: React.FC<SmartCleanerProps> = ({ onClose, allEmails, onDelete }) => {
  const [prompt, setPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    aiResponse: GeminiFilterResponse;
    matchedEmails: Email[];
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRunningOnGmail, setIsRunningOnGmail] = useState(false);
  const [gmailResultMessage, setGmailResultMessage] = useState<string | null>(null);

  const handleAnalyze = async (textToAnalyze: string = prompt) => {
    if (!textToAnalyze.trim()) return;
    setIsAnalyzing(true);
    setResult(null);

    try {
      const aiResponse = await analyzeFilterIntent(textToAnalyze);
      const matchedEmails = applyLocalFilter(allEmails, aiResponse.localFilterCriteria);
      setResult({ aiResponse, matchedEmails });
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const handleRunOnGmail = async () => {
    if (!prompt.trim()) return;

    setIsRunningOnGmail(true);
    setGmailResultMessage(null);

    try {
      const res = await fetch(`${BACKEND_URL}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPrompt: prompt }),
      });

      const data = await res.json();

      if (data.error) {
        setGmailResultMessage(`Backend error: ${data.error}`);
      } else {
        setGmailResultMessage(
          `Cleaned ${data.previewCount ?? data.affectedEmails?.length ?? 0} emails in your real Gmail matching: ${data.gmailQuery}`
        );
      }
    } catch (err) {
      console.error('Error calling backend /clean', err);
      setGmailResultMessage(`Failed to reach backend at ${BACKEND_URL}, Is it running?`);
    } finally {
      setIsRunningOnGmail(false);
    }
  };
  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.aiResponse.gmailQuery);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirmDelete = () => {
    if (result) {
      onDelete(result.matchedEmails.map(e => e.id));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Smart Cleaner AI</h2>
              <p className="text-blue-100 text-sm">Describe what you want to clean, and I'll help you.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Backend Gmail clean result */}
          {gmailResultMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-sm border border-emerald-200 animate-fade-in">
              {gmailResultMessage}
            </div>
          )}
          {/* Input Section */}
          <div className="mb-8">
             <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
               What would you like to remove?
             </label>
             <div className="relative">
               <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze(prompt)}
                  placeholder="e.g., 'Delete all newsletters older than 1 month' or 'Remove notifications from Uber'"
                  className="w-full text-lg p-4 pr-32 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  autoFocus
               />
               <button 
                 onClick={() => handleAnalyze(prompt)}
                 disabled={isAnalyzing || !prompt.trim()}
                 className={`
                    absolute right-2 top-2 bottom-2 px-6 rounded-lg font-medium text-white transition-all flex items-center gap-2
                    ${isAnalyzing || !prompt.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}
                 `}
               >
                 {isAnalyzing ? (
                   <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   <>
                     Analyze <ArrowRight className="w-4 h-4" />
                   </>
                 )}
               </button>
             </div>
             
             {/* Quick Filters */}
             <div className="flex flex-wrap gap-2 mt-3">
               {QUICK_FILTERS.map(f => (
                 <button
                    key={f.label}
                    onClick={() => { setPrompt(f.prompt); handleAnalyze(f.prompt); }}
                    className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                 >
                   {f.label}
                 </button>
               ))}
             </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-6 animate-fade-in">
              
              {/* AI Explanation & Query Card */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
                 <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                       <h3 className="font-bold text-gray-900 text-lg">Analysis Complete</h3>
                       <p className="text-gray-600 mb-4">{result.aiResponse.explanation}</p>
                       
                       <div className="bg-gray-900 rounded-lg p-4 flex items-center justify-between group relative overflow-hidden">
                          <code className="text-green-400 font-mono text-sm break-all">
                            {result.aiResponse.gmailQuery}
                          </code>
                          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          <button 
                            onClick={handleCopy}
                            className="ml-4 p-2 text-gray-400 hover:text-white transition-colors"
                            title="Copy to clipboard"
                          >
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                          </button>
                       </div>
                    </div>
                 </div>
                 
                 {/* How to use Guide */}
                 <div className="mt-6 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <ExternalLink className="w-4 h-4" />
                      How to apply to your real Gmail
                    </h4>
                    <ol className="space-y-2 text-sm text-blue-800">
                      <li className="flex gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                        <span>Click the <strong>Copy</strong> icon above to get the smart filter.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                        <span>Open Gmail and paste it into the <strong>Search bar</strong> at the top.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">3</span>
                        <span>Click the <strong>Select All</strong> checkbox (top left of email list).</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">4</span>
                        <span>If visible, click <strong>"Select all conversations that match this search"</strong>.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">5</span>
                        <span>Click the <strong>Trash icon</strong> to delete them.</span>
                      </li>
                    </ol>
                 </div>
              </div>

              {/* Preview List */}
              <div>
                 <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                       Simulated Preview 
                       <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                         {result.matchedEmails.length} found
                       </span>
                    </h3>
                 </div>
                 
                 <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-white">
                   <EmailList emails={result.matchedEmails} />
                 </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunOnGmail}
              disabled={!prompt.trim() || isRunningOnGmail}
              className={`
                px-6 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all
                ${!prompt.trim() || isRunningOnGmail
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-95'}
              `}
            >
              {isRunningOnGmail ? 'Running on Gmail…' : 'Run on real Gmail'}
            </button>

            <button 
              disabled={!result || result.matchedEmails.length === 0}
              onClick={handleConfirmDelete}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white shadow-lg transition-all
                ${!result || result.matchedEmails.length === 0 
                  ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                  : 'bg-red-500 hover:bg-red-600 hover:shadow-red-500/30 active:scale-95'
                }
              `}
            >
              <Trash2 className="w-5 h-5" />
              Simulate Delete ({result ? result.matchedEmails.length : 0})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};