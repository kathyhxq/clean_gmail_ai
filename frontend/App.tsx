import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { EmailList } from './components/EmailList';
import { SmartCleaner } from './components/SmartCleaner';
import { Stats } from './components/Stats';
import { Email, ViewMode } from './types';
import { generateMockEmails } from './utils/mockData';
import { Menu, Search, Filter, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [showSmartCleaner, setShowSmartCleaner] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize mock data
  useEffect(() => {
    fetch("http://localhost:8000/emails")
      .then(res => res.json())
      .then(data => setEmails(data));
  }, []);

  const handleDeleteEmails = useCallback((idsToDelete: string[]) => {
    setEmails(prev => prev.filter(email => !idsToDelete.includes(email.id)));
  }, []);

  const filteredEmails = emails.filter(email => {
    // 1. View filtering
    if (viewMode === 'inbox' && (email.isTrash || email.isSpam)) return false;
    if (viewMode === 'trash' && !email.isTrash) return false;
    if (viewMode === 'spam' && !email.isSpam) return false;
    if (viewMode === 'important' && (!email.isImportant || email.isTrash)) return false;
    
    // 2. Search filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        email.subject.toLowerCase().includes(q) ||
        email.sender.toLowerCase().includes(q) ||
        email.snippet.toLowerCase().includes(q)
      );
    }
    
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-30 w-64 h-full bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 flex flex-col
      `}>
        <div className="p-4 h-16 flex items-center border-b border-gray-100">
           <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
             <Filter className="w-6 h-6" />
             <span>CleanMail AI</span>
           </div>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => setShowSmartCleaner(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Smart Clean
          </button>
        </div>

        <Sidebar 
          currentView={viewMode} 
          setView={setViewMode} 
          totalEmails={emails.length}
          unreadCount={emails.filter(e => !e.isRead && !e.isTrash).length}
        />
        
        <div className="mt-auto p-4 border-t border-gray-100">
          <Stats emails={emails} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="relative flex-1 max-w-2xl group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text"
                placeholder="Search mail"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 focus:bg-white border-none rounded-lg pl-10 pr-4 py-2.5 outline-none ring-2 ring-transparent focus:ring-blue-100 transition-all placeholder:text-gray-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-4">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold shadow-md">
               AI
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white/50">
          <div className="max-w-5xl mx-auto h-full">
             <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800 capitalize">
                  {viewMode === 'inbox' ? 'Primary Inbox' : viewMode}
                </h1>
                <span className="text-gray-500 text-sm">
                  {filteredEmails.length} messages
                </span>
             </div>
             
             <EmailList emails={filteredEmails} />
          </div>
        </main>
      </div>

      {/* Smart Cleaner Modal */}
      {showSmartCleaner && (
        <SmartCleaner 
          onClose={() => setShowSmartCleaner(false)}
          allEmails={emails}
          onDelete={handleDeleteEmails}
        />
      )}
    </div>
  );
};

export default App;