
import React, { useEffect, useState } from 'react';
import { getNews, incrementNewsView } from './api';
import { NewsPost } from './types';
import VotingSystem from './VotingSystem';
import CommentSection from './CommentSection';

const NewsFeed = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await getNews('All');
      setPosts(data.filter(p => p.status === 'published'));
      setLoading(false);
    };
    fetch();
  }, []);

  const handleRead = (id: string) => {
    incrementNewsView(id);
    setOpenComments(openComments === id ? null : id);
  };

  const categories = ['All', 'General', 'Exam', 'Result', 'Scholarship', 'Admission'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 font-sans">
      <div className="container mx-auto px-4 max-w-5xl space-y-12">
        
        {/* Header */}
        <div className="text-center">
           <h1 className="text-4xl font-bold text-gray-900 mb-2">Campus News & Community</h1>
           <p className="text-gray-500">Latest updates, polls, and discussions.</p>
        </div>

        {/* --- VOTING SECTION --- */}
        <VotingSystem />

        {/* --- NEWS SECTION --- */}
        <div>
           <div className="flex overflow-x-auto space-x-2 mb-6 pb-2 no-scrollbar">
              {categories.map(cat => (
                 <button 
                   key={cat}
                   onClick={() => setActiveCategory(cat)}
                   className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeCategory === cat ? 'bg-blue-600 text-white shadow-lg' : 'bg-white border text-gray-600 hover:bg-gray-100'}`}
                 >
                   {cat}
                 </button>
              ))}
           </div>

           {loading ? (
              <div className="text-center py-10">Loading...</div>
           ) : (
              <div className="space-y-8">
                 {posts.filter(p => activeCategory === 'All' || p.category === activeCategory).map(post => (
                    <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                       {/* Post Header */}
                       <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                                   {post.authorName.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-bold text-gray-900 text-sm">{post.authorName}</p>
                                   <p className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleDateString()}</p>
                                </div>
                             </div>
                             <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{post.category}</span>
                          </div>

                          <h3 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h3>
                          <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                          
                          {post.featuredImage && (
                             <img src={post.featuredImage} className="w-full h-64 object-cover rounded-xl mt-4" alt="Featured" />
                          )}
                       </div>

                       {/* Action Bar */}
                       <div className="bg-gray-50 px-6 py-3 border-t flex justify-between items-center text-sm text-gray-600">
                          <div className="flex space-x-6">
                             <span className="flex items-center"><i className="far fa-eye mr-2"></i> {post.views}</span>
                             <button onClick={() => handleRead(post.id)} className="flex items-center hover:text-blue-600 font-bold transition">
                                <i className="far fa-comment-alt mr-2"></i> Discuss
                             </button>
                          </div>
                          <button className="hover:text-blue-600"><i className="fas fa-share-alt"></i></button>
                       </div>

                       {/* Comments (Collapsible) */}
                       {openComments === post.id && (
                          <div className="border-t p-6 bg-gray-50/50">
                             <CommentSection targetId={post.id} title="Comments" />
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default NewsFeed;
