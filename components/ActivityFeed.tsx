import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../src/lib/firebase';
import { User } from '../types';
import { handleFirestoreError, OperationType } from '../src/utils/firestoreErrorHandler';

interface Post {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    imageUrl?: string;
    plotData?: any;
    createdAt: any;
    likes: string[];
    comments: Comment[];
}

interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: any;
}

interface Plot {
    id: string;
    imageData: string;
    description: string;
}

export const ActivityFeed: React.FC<{ user: User | null; theme?: 'light' | 'dark' }> = ({ user, theme = 'dark' }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [commentContent, setCommentContent] = useState<Record<string, string>>({});
    
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showPlotSelector, setShowPlotSelector] = useState(false);
    const [userPlots, setUserPlots] = useState<Plot[]>([]);
    const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
    const [error, setError] = useState<Error | null>(null);

    const isDark = theme === 'dark';

    useEffect(() => {
        if (!user) return;
        const q = query(collection(db, 'feed_posts'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Post[];
            setPosts(fetchedPosts);
        }, (err) => {
            try {
                handleFirestoreError(err, OperationType.GET, 'feed_posts');
            } catch (e) {
                setError(e as Error);
            }
        });
        return () => unsubscribe();
    }, [user]);

    const fetchUserPlots = async () => {
        if (!user) return;
        try {
            const q = query(collection(db, 'plots'), where('userId', '==', user.id), orderBy('timestamp', 'desc'));
            const snapshot = await getDocs(q);
            const plotsData: Plot[] = [];
            snapshot.forEach((doc) => {
                plotsData.push({ id: doc.id, ...doc.data() } as Plot);
            });
            setUserPlots(plotsData);
            setShowPlotSelector(true);
        } catch (err) {
            try {
                handleFirestoreError(err, OperationType.GET, 'plots');
            } catch (e) {
                setError(e as Error);
            }
        }
    };

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.onerror = (error) => reject(error);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        setIsUploading(true);
        try {
            const compressedDataUrl = await compressImage(file);
            setAttachedImage(compressedDataUrl);
            setSelectedPlot(null); // Clear plot if image is selected
        } catch (error) {
            console.error('Error compressing image:', error);
            alert('Failed to process image.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handlePost = async () => {
        if ((!newPostContent.trim() && !attachedImage && !selectedPlot) || !user) return;
        setIsPosting(true);
        try {
            const postData: any = {
                authorId: user.id,
                authorName: user.name,
                content: newPostContent,
                createdAt: serverTimestamp(),
                likes: [],
                comments: []
            };

            if (attachedImage) {
                postData.imageUrl = attachedImage;
            } else if (selectedPlot) {
                postData.plotData = {
                    id: selectedPlot.id,
                    imageData: selectedPlot.imageData,
                    description: selectedPlot.description
                };
            }

            await addDoc(collection(db, 'feed_posts'), postData);
            
            setNewPostContent('');
            setAttachedImage(null);
            setSelectedPlot(null);
        } catch (err) {
            console.error("Error posting:", err);
            try {
                handleFirestoreError(err, OperationType.CREATE, 'feed_posts');
            } catch (e) {
                setError(e as Error);
            }
        } finally {
            setIsPosting(false);
        }
    };

    const handleLike = async (postId: string, likes: string[]) => {
        if (!user) return;
        try {
            const postRef = doc(db, 'feed_posts', postId);
            if (likes.includes(user.id)) {
                await updateDoc(postRef, { likes: arrayRemove(user.id) });
            } else {
                await updateDoc(postRef, { likes: arrayUnion(user.id) });
            }
        } catch (err) {
            try {
                handleFirestoreError(err, OperationType.UPDATE, `feed_posts/${postId}`);
            } catch (e) {
                setError(e as Error);
            }
        }
    };

    const handleComment = async (postId: string) => {
        if (!user || !commentContent[postId]?.trim()) return;
        try {
            const postRef = doc(db, 'feed_posts', postId);
            const newComment = {
                id: Date.now().toString(),
                authorId: user.id,
                authorName: user.name,
                content: commentContent[postId],
                createdAt: new Date()
            };
            await updateDoc(postRef, { comments: arrayUnion(newComment) });
            setCommentContent(prev => ({ ...prev, [postId]: '' }));
        } catch (err) {
            try {
                handleFirestoreError(err, OperationType.UPDATE, `feed_posts/${postId}`);
            } catch (e) {
                setError(e as Error);
            }
        }
    };

    if (error) {
        return (
            <div className="p-8 text-center bg-slate-900 rounded-xl border border-red-500/50">
                <h2 className="text-xl font-bold text-white mb-2">Activity Feed Error</h2>
                <div className="text-slate-400 mb-4 text-sm">
                    {error.message.includes('permission') 
                        ? "You don't have permission to view the activity feed. Please check your Firebase security rules."
                        : error.message}
                </div>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-colors"
                >
                    Reload App
                </button>
            </div>
        );
    }

    if (!user) {
        return <div className="p-8 text-center text-slate-400">Please sign in to view the Activity Feed.</div>;
    }

    return (
        <div className={`h-full flex flex-col ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <div className={`p-4 border-b ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200'}`}>
                <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share an update, ask a question, or post a plot..."
                    className={`w-full border rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500 resize-none min-h-[100px] transition-all ${
                        isDark ? 'bg-slate-950/50 border-white/10 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                />
                
                {/* Attachments Preview */}
                {attachedImage && (
                    <div className="relative mt-4 inline-block">
                        <img src={attachedImage} alt="Attachment" className="max-h-48 rounded-lg border border-white/10" />
                        <button 
                            onClick={() => setAttachedImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                        >
                            ×
                        </button>
                    </div>
                )}
                
                {selectedPlot && (
                    <div className="relative mt-4 inline-block bg-slate-800 p-2 rounded-lg border border-indigo-500/50">
                        <div className="text-xs text-indigo-400 font-bold mb-1 uppercase tracking-wider">Attached Plot</div>
                        <img src={selectedPlot.imageData} alt="Plot" className="max-h-48 rounded border border-white/10" />
                        <div className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{selectedPlot.description}</div>
                        <button 
                            onClick={() => setSelectedPlot(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading || !!selectedPlot}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                        >
                            <span>📷</span> {isUploading ? 'Compressing...' : 'Image'}
                        </button>
                        <button
                            onClick={fetchUserPlots}
                            disabled={!!attachedImage}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 border ${isDark ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200'}`}
                        >
                            <span>📈</span> Share Plot
                        </button>
                    </div>
                    <button
                        onClick={handlePost}
                        disabled={isPosting || (!newPostContent.trim() && !attachedImage && !selectedPlot)}
                        className={`px-6 py-2 font-bold rounded-xl transition-colors disabled:opacity-50 ${isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'}`}
                    >
                        {isPosting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </div>

            {/* Plot Selector Modal */}
            {showPlotSelector && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest">Select a Plot</h2>
                            <button onClick={() => setShowPlotSelector(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2">
                            {userPlots.length === 0 ? (
                                <div className="text-center text-slate-500 py-10">You haven't saved any plots yet.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {userPlots.map(plot => (
                                        <div 
                                            key={plot.id} 
                                            onClick={() => {
                                                setSelectedPlot(plot);
                                                setAttachedImage(null);
                                                setShowPlotSelector(false);
                                            }}
                                            className="bg-slate-800 border border-white/5 hover:border-indigo-500 rounded-xl p-2 cursor-pointer transition-all hover:scale-[1.02]"
                                        >
                                            <img src={plot.imageData} alt="Plot" className="w-full h-32 object-cover rounded-lg mb-2" />
                                            <div className="text-xs text-slate-300 truncate">{plot.description || 'Untitled Plot'}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {posts.map(post => (
                    <div key={post.id} className={`border rounded-2xl p-5 backdrop-blur-xl ${isDark ? 'bg-slate-900/50 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${isDark ? 'bg-gradient-to-br from-indigo-500 to-cyan-500' : 'bg-indigo-600'}`}>
                                {post.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{post.authorName}</div>
                                <div className="text-xs text-slate-500">
                                    {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Just now'}
                                </div>
                            </div>
                        </div>
                        
                        {post.content && <p className={`whitespace-pre-wrap mb-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{post.content}</p>}
                        
                        {post.imageUrl && (
                            <img src={post.imageUrl} alt="Post attachment" className={`max-w-full rounded-xl border mb-4 ${isDark ? 'border-white/10' : 'border-slate-200'}`} />
                        )}
                        
                        {post.plotData && (
                            <div className={`border rounded-xl p-3 mb-4 ${isDark ? 'bg-slate-950/50 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'}`}>
                                <div className="flex items-center gap-2 mb-2 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                                    <span>📈</span> Shared Plot
                                </div>
                                <img src={post.plotData.imageData} alt="Shared Plot" className={`w-full rounded-lg border ${isDark ? 'border-white/5' : 'border-slate-200'}`} />
                                <div className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{post.plotData.description}</div>
                            </div>
                        )}
                        
                        <div className={`flex items-center gap-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                            <button 
                                onClick={() => handleLike(post.id, post.likes || [])}
                                className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.likes?.includes(user?.id || '') ? 'text-rose-500' : 'text-slate-400 hover:text-white'}`}
                            >
                                <span>{post.likes?.includes(user?.id || '') ? '❤️' : '🤍'}</span>
                                {post.likes?.length || 0} Likes
                            </button>
                            <div className="text-sm font-medium text-slate-400">
                                💬 {post.comments?.length || 0} Comments
                            </div>
                        </div>

                        {/* Comments Section */}
                        <div className="mt-4 space-y-3">
                            {post.comments?.map(comment => (
                                <div key={comment.id} className={`rounded-xl p-3 text-sm ${isDark ? 'bg-slate-950/50' : 'bg-slate-50'}`}>
                                    <span className={`font-bold mr-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{comment.authorName}</span>
                                    <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{comment.content}</span>
                                </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                                <input
                                    type="text"
                                    value={commentContent[post.id] || ''}
                                    onChange={(e) => setCommentContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    placeholder="Write a comment..."
                                    className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${isDark ? 'bg-slate-950/50 border-white/10 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'}`}
                                    onKeyDown={(e) => e.key === 'Enter' && handleComment(post.id)}
                                />
                                <button
                                    onClick={() => handleComment(post.id)}
                                    disabled={!commentContent[post.id]?.trim()}
                                    className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    Reply
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {posts.length === 0 && (
                    <div className="text-center text-slate-500 py-10">
                        No activity yet. Be the first to post!
                    </div>
                )}
            </div>
        </div>
    );
};
