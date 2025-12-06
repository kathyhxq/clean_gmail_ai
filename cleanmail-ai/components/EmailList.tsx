import React from 'react';
import { Email } from '../types';
import { Star, MoreVertical } from 'lucide-react';

interface EmailListProps {
  emails: Email[];
}

export const EmailList: React.FC<EmailListProps> = ({ emails }) => {
  if (emails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <InboxIcon className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-lg font-medium">No emails found</p>
        <p className="text-sm">Your inbox is clean or no matches found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {emails.map((email) => (
        <div 
          key={email.id} 
          className={`
            group flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors
            ${!email.isRead ? 'bg-blue-50/30' : ''}
          `}
        >
          {/* Avatar/Icon */}
          <div className="flex-shrink-0">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
               {email.sender.charAt(0)}
             </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
             <div className={`col-span-12 md:col-span-3 font-medium truncate ${!email.isRead ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                {email.sender}
             </div>
             <div className="col-span-12 md:col-span-7 flex items-center gap-2 min-w-0">
                <span className={`truncate text-sm ${!email.isRead ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                  {email.subject}
                </span>
                <span className="hidden sm:inline text-gray-400 text-sm truncate">
                   - {email.snippet}
                </span>
             </div>
             <div className="col-span-12 md:col-span-2 text-right text-xs text-gray-500 font-medium whitespace-nowrap">
                {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(email.date)}
             </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-yellow-500">
              <Star className={`w-4 h-4 ${email.isImportant ? 'fill-yellow-500 text-yellow-500' : ''}`} />
            </button>
            <button className="p-2 hover:bg-gray-200 rounded-full text-gray-400">
               <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

const InboxIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
);