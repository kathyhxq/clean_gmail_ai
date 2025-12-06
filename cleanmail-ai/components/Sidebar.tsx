import React from 'react';
import { Inbox, Star, Trash2, Send, AlertOctagon } from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  totalEmails: number;
  unreadCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, unreadCount }) => {
  const items: { id: string; label: string; icon: any; count?: number }[] = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: unreadCount },
    { id: 'important', label: 'Important', icon: Star },
    { id: 'sent', label: 'Sent', icon: Send },
    { id: 'spam', label: 'Spam', icon: AlertOctagon },
    { id: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <nav className="mt-6 flex flex-col gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => setView(item.id as ViewMode)}
          className={`
            flex items-center justify-between px-4 py-2.5 mx-2 rounded-lg text-sm font-medium transition-colors
            ${currentView === item.id 
              ? 'bg-blue-50 text-blue-700' 
              : 'text-gray-600 hover:bg-gray-100'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-blue-600' : 'text-gray-400'}`} />
            {item.label}
          </div>
          {item.count !== undefined && item.count > 0 && (
            <span className={`
              text-xs font-bold px-2 py-0.5 rounded-full
              ${currentView === item.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'}
            `}>
              {item.count}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};