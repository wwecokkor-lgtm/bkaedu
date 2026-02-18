
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Comment, UserRole } from './types';
import { subscribeToComments, addComment, deleteComment, toggleCommentLike } from './api';

interface CommentSectionProps {
  targetId: string;
  title?: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ targetId, title = "Discussion" }) => {
  const { userProfile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToComments(targetId, (data) => {
      setComments(data);
    });
    return () => unsubscribe();
  }, [targetId]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || !userProfile) return;
    
    setLoading(true);
    await addComment({
      targetId,
      text: text.trim(),
      userId: userProfile.uid,
      userName: userProfile.displayName,
      userPhoto: userProfile.photoURL,
      userRole: userProfile.role,
      parentId: replyTo || undefined
    });
    setText('');
    setReplyTo(null);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this comment?")) {
      await deleteComment(id);
    }
  };

  const handleLike = (id: string) => {
    if (userProfile) toggleCommentLike(id, userProfile.uid);
  };

  // Helper to render a single comment
  const CommentItem: React.FC<{ comment: Comment, isReply?: boolean }> = ({ comment, isReply = false }) => {
    const isOwner = userProfile?.uid === comment.userId;
    const isAdmin = userProfile?.role === UserRole.ADMIN;
    
    return (
      <div className={`flex space-x-3 ${isReply ? 'ml-10 mt-3 border-l-2 border-gray-100 pl-3' : 'mt-4'}`}>
        <img 
          src={comment.userPhoto || 'https://via.placeholder.com/40'} 
          className={`rounded-full object-cover border border-gray-200 ${isReply ? 'w-8 h-8' : 'w-10 h-10'}`} 
          alt="User" 
        />
        <div className="flex-grow">
          <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm relative group">
             <div className="flex justify-between items-start">
               <div>
                 <span className="font-bold text-gray-900 text-sm">{comment.userName}</span>
                 {comment.userRole === UserRole.ADMIN && (
                   <span className="ml-2 bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">ADMIN</span>
                 )}
                 <p className="text-gray-700 text-sm mt-1 whitespace-pre-wrap">{comment.text}</p>
               </div>
               {(isOwner || isAdmin) && (
                 <button onClick={() => handleDelete(comment.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                   <i className="fas fa-trash text-xs"></i>
                 </button>
               )}
             </div>
          </div>
          
          <div className="flex items-center space-x-4 mt-1 ml-2 text-xs text-gray-500 font-medium">
             <span>{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             <button onClick={() => handleLike(comment.id)} className={`hover:text-blue-600 flex items-center space-x-1 transition`}>
                <i className="far fa-heart"></i>
                <span>{comment.likes || 0}</span>
             </button>
             {!isReply && (
               <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} className="hover:text-blue-600">Reply</button>
             )}
          </div>

          {/* Reply Input */}
          {replyTo === comment.id && (
             <div className="mt-2 ml-2 flex items-center space-x-2 animate-fade-in-up">
                <input 
                  autoFocus
                  type="text" 
                  className="bg-white border border-gray-300 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-blue-500 w-full"
                  placeholder="Write a reply..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
                <button onClick={() => handleSubmit()} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full">
                   <i className="fas fa-paper-plane"></i>
                </button>
             </div>
          )}
        </div>
      </div>
    );
  };

  // Group comments into threads
  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (parentId: string) => comments.filter(c => c.parentId === parentId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center">
        <i className="fas fa-comments text-blue-600 mr-2"></i> {title} ({comments.length})
      </h3>

      {/* Main Input */}
      {userProfile ? (
        <div className="flex space-x-3 mb-8">
           <img src={userProfile.photoURL || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full border" />
           <div className="flex-grow relative">
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm resize-none"
                placeholder="Share your thoughts..."
                rows={2}
                value={replyTo ? '' : text} // Bind to text only if not replying
                onChange={e => !replyTo && setText(e.target.value)}
              ></textarea>
              <button 
                onClick={() => handleSubmit()} 
                disabled={loading || (!text && !replyTo)}
                className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Comment
              </button>
           </div>
        </div>
      ) : (
        <div className="bg-blue-50 p-3 rounded text-center text-sm text-blue-800 mb-6">
           Please <a href="/login" className="font-bold underline">login</a> to join the discussion.
        </div>
      )}

      {/* Comment List */}
      <div className="space-y-2">
         {rootComments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No comments yet. Be the first!</p>
         ) : (
            rootComments.map(comment => (
               <div key={comment.id}>
                  <CommentItem comment={comment} />
                  {/* Render Replies */}
                  {getReplies(comment.id).map(reply => (
                     <CommentItem key={reply.id} comment={reply} isReply={true} />
                  ))}
               </div>
            ))
         )}
      </div>
    </div>
  );
};

export default CommentSection;
