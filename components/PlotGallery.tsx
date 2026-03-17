import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../src/lib/firebase';
import Card, { CardTitle } from './Card';
import { Search, MessageSquare, Send } from 'lucide-react';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

interface Plot {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  projectId: string;
  imageData: string;
  description: string;
  location?: string;
  festival?: string;
  stage?: string;
  notes?: string;
  comments?: Comment[];
}

const PlotGallery: React.FC = () => {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [plotToDelete, setPlotToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const q = query(collection(db, 'plots'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plotsData: Plot[] = [];
      snapshot.forEach((doc) => {
        plotsData.push({ id: doc.id, ...doc.data() } as Plot);
      });
      setPlots(plotsData);
    });
    return () => unsubscribe();
  }, []);

  const confirmDelete = async () => {
    if (!plotToDelete) return;
    try {
      await deleteDoc(doc(db, 'plots', plotToDelete));
    } catch (error) {
      console.error('Error deleting plot:', error);
    } finally {
      setPlotToDelete(null);
    }
  };

  const handleAddComment = async (plotId: string) => {
    const text = commentInputs[plotId];
    if (!auth.currentUser || !text?.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anonymous',
      text: text.trim(),
      timestamp: Date.now()
    };

    try {
      await updateDoc(doc(db, 'plots', plotId), {
        comments: arrayUnion(newComment)
      });
      setCommentInputs(prev => ({ ...prev, [plotId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const filteredPlots = plots.filter(plot => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      plot.description?.toLowerCase().includes(q) ||
      plot.location?.toLowerCase().includes(q) ||
      plot.festival?.toLowerCase().includes(q) ||
      plot.stage?.toLowerCase().includes(q) ||
      plot.notes?.toLowerCase().includes(q) ||
      plot.userName?.toLowerCase().includes(q) ||
      new Date(plot.timestamp).toLocaleDateString().includes(q)
    );
  });

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <CardTitle className="!mb-0">Plot Gallery</CardTitle>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by location, festival, stage, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-emerald-500 outline-none transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlots.map((plot) => (
          <div key={plot.id} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col relative group">
            <div className="relative h-48 bg-black">
              <img src={plot.imageData} alt={plot.description} className="w-full h-full object-contain" />
              {auth.currentUser?.uid === plot.userId && (
                <button
                  onClick={() => setPlotToDelete(plot.id)}
                  className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Delete Plot"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-emerald-400 text-sm">{plot.userName}</h4>
                <span className="text-[10px] text-slate-500 font-mono">{new Date(plot.timestamp).toLocaleString()}</span>
              </div>
              
              <div className="space-y-1 mb-3">
                {plot.festival && <p className="text-xs text-white"><span className="text-slate-500">Event:</span> {plot.festival}</p>}
                {plot.location && <p className="text-xs text-white"><span className="text-slate-500">Location:</span> {plot.location}</p>}
                {plot.stage && <p className="text-xs text-white"><span className="text-slate-500">Stage:</span> {plot.stage}</p>}
                <p className="text-xs text-slate-400 mt-1">{plot.description}</p>
                {plot.notes && <p className="text-xs text-slate-300 italic mt-1">"{plot.notes}"</p>}
              </div>

              <div className="mt-auto pt-3 border-t border-slate-800">
                <button 
                  onClick={() => setExpandedComments(prev => ({ ...prev, [plot.id]: !prev[plot.id] }))}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors mb-3"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {plot.comments?.length || 0} Comments
                </button>

                {expandedComments[plot.id] && (
                  <div className="space-y-3 mb-3 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                    {plot.comments?.map(comment => (
                      <div key={comment.id} className="bg-slate-800/50 rounded p-2">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-[10px] font-bold text-emerald-500">{comment.userName}</span>
                          <span className="text-[8px] text-slate-500">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-300">{comment.text}</p>
                      </div>
                    ))}
                    {(!plot.comments || plot.comments.length === 0) && (
                      <p className="text-xs text-slate-500 italic text-center py-2">No comments yet</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <input 
                    type="text"
                    placeholder="Add a comment..."
                    value={commentInputs[plot.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [plot.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment(plot.id)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                  />
                  <button 
                    onClick={() => handleAddComment(plot.id)}
                    disabled={!commentInputs[plot.id]?.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-1.5 rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {filteredPlots.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No scans found matching your search.
          </div>
        )}
      </div>

      {plotToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Delete Plot?</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to delete this plot? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPlotToDelete(null)} 
                className="px-4 py-2 rounded-lg text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 rounded-lg text-sm font-bold bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PlotGallery;
