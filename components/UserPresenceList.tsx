import React, { useState, useEffect } from 'react';
import { Users, Clock } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

interface UserStatus {
  id: string;
  name: string;
  lastSeen: any; // Firestore Timestamp
  isOnline: boolean;
  isPro?: boolean;
}

const UserPresenceList: React.FC = () => {
  const [users, setUsers] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'presence', 'global', 'users'),
      orderBy('lastSeen', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const fetchedUsers = snapshot.docs.map(doc => {
        const data = doc.data();
        const lastSeenMillis = data.lastSeen?.toMillis() || 0;
        // Consider online if seen in last 2 minutes
        const isOnline = now - lastSeenMillis < 120000;
        
        return {
          id: doc.id,
          name: data.name || 'Anonymous',
          lastSeen: lastSeenMillis,
          isOnline,
          isPro: data.isPro || false
        } as UserStatus;
      });
      setUsers(fetchedUsers);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching presence:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const onlineUsers = users.filter(u => u.isOnline);
  const recentUsers = users.filter(u => !u.isOnline);

  if (loading && users.length === 0) {
    return (
      <div className="mt-4 border-t border-slate-800 pt-4 animate-pulse">
        <div className="h-4 w-24 bg-slate-800 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-8 w-full bg-slate-800 rounded" />
          <div className="h-8 w-full bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

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
        {onlineUsers.length > 0 ? (
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
        ) : (
          <div className="text-[10px] text-slate-600 italic px-1">No users online</div>
        )}

        {/* Recent Section */}
        {recentUsers.length > 0 && (
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
                    {user.lastSeen ? `${Math.floor((Date.now() - user.lastSeen) / 60000)}m` : 'unknown'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
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
