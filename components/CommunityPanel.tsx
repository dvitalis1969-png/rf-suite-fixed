import React, { useState, useRef, useEffect } from 'react';
import { Minus, Maximize2, GripVertical, MessageCircle } from 'lucide-react';
import ChatWidget from './ChatWidget';
import PresenceIndicator from './PresenceIndicator';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../src/lib/firebase';

const CommunityPanel: React.FC<{ projectId: string | number }> = ({ projectId }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 16, y: 16 });
  const [unreadDMs, setUnreadDMs] = useState<Record<string, boolean>>({});
  const panelRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      
      setPosition(prev => ({
        x: prev.x - deltaX,
        y: prev.y - deltaY
      }));
      
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'users', auth.currentUser.uid, 'unread_dms'));
    const unsub = onSnapshot(q, (snap) => {
      const unread: Record<string, boolean> = {};
      snap.forEach(doc => {
        if (doc.data().hasUnread) unread[doc.id] = true;
      });
      setUnreadDMs(unread);
    });
    return () => unsub();
  }, []);

  const totalUnread = Object.keys(unreadDMs).length;

  return (
    <div 
      ref={panelRef}
      style={{ 
        position: 'fixed', 
        right: `${position.x}px`, 
        bottom: `${position.y}px`,
        zIndex: 100
      }}
      className={`w-80 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-4 transition-all duration-300 ${isMinimized ? 'h-14' : 'h-auto'}`}
    >
      <div className="flex justify-between items-center mb-2 cursor-grab" onMouseDown={handleMouseDown}>
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-slate-600" />
          <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
            Community Hub
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {totalUnread}
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <PresenceIndicator projectId={projectId} />
          <button onClick={() => setIsMinimized(!isMinimized)} className="text-slate-500 hover:text-white">
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div className={isMinimized ? 'hidden' : 'block'}>
        <ChatWidget projectId={projectId} unreadDMs={unreadDMs} />
      </div>
    </div>
  );
};

export default CommunityPanel;
