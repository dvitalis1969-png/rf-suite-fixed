import React, { useMemo } from 'react';
import { Users, Clock } from 'lucide-react';

interface UserStatus {
  id: string;
  name: string;
  lastSeen: number; // timestamp in ms
  isOnline: boolean;
  isPro?: boolean;
}

const DUMMY_NAMES = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", 
  "Riley", "Quinn", "Skyler", "Avery", "Peyton", 
  "Dakota", "Emerson", "Finley", "Hayden", "Jamie", 
  "Logan", "Parker", "Reese", "Sawyer", "Tatum"
];

const UserPresenceList: React.FC = () => {
  // Generate dummy data once
  const users: UserStatus[] = useMemo(() => {
    const now = Date.now();
    return DUMMY_NAMES.map((name, index) => {
      // First 8 are online, others are recent
      const isOnline = index < 8;
      let lastSeen;
      
      if (isOnline) {
        // Online within last 2 minutes
        lastSeen = now - Math.floor(Math.random() * 120000);
      } else {
        // Offline within last 2 hours (7200000 ms)
        lastSeen = now - Math.floor(Math.random() * 7200000);
      }

      return {
        id: `user-${index}`,
        name,
        lastSeen,
        isOnline,
        isPro: index % 3 === 0 // Make every 3rd user a Pro user for demo purposes
      };
    });
  }, []);

  const onlineUsers = users.filter(u => u.isOnline);
  const recentUsers = users.filter(u => !u.isOnline);

  return (
    <div className="mt-4 border-t border-slate-800 pt-4">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Users className="w-3 h-3 text-indigo-400" />
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Network Presence
        </h4>
      </div>

      <div className="space-y-4 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
        {/* Online Section */}
        <div>
          <div className="text-[9px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
            Active Now ({onlineUsers.length})
          </div>
          <div className="grid grid-cols-2 gap-2">
            {onlineUsers.map(user => (
              <div 
                key={user.id} 
                className="flex items-center gap-2 bg-slate-900/50 border border-slate-800/50 rounded-md px-2 py-1.5 hover:bg-slate-800 transition-colors group cursor-default"
              >
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                    {user.name[0]}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-slate-950" />
                </div>
                <span className="text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                  {user.name}
                </span>
                {user.isPro && (
                  <span className="ml-auto inline-flex items-center px-1 py-0.5 rounded text-[7px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider" title="Pro User">
                    Pro
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Section */}
        <div>
          <div className="text-[9px] font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <Clock className="w-2.5 h-2.5" />
            Recently Active ({recentUsers.length})
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 px-1">
            {recentUsers.map(user => (
              <div key={user.id} className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-slate-400 font-medium">
                  {user.name}
                </span>
                <span className="text-[8px] text-slate-600 italic">
                  {Math.floor((Date.now() - user.lastSeen) / 60000)}m
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}} />
    </div>
  );
};

export default UserPresenceList;
