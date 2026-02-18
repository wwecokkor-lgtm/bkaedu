import React, { useState, useEffect } from 'react';
import { NewsPost, NewsCategory } from './types';
import { getNews, addNews, updateNews, deleteNews, togglePinNews } from './api';
import { useAuth } from './AuthContext';

// --- PROFESSIONAL IMAGE COMPRESSION UTILITY ---
const compressAndConvertToBase64 = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
        } else {
            reject(new Error("Canvas context failed"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const AdminNews = () => {
  const { userProfile } = useAuth();
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(false);

  // Editor State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NewsCategory>('General');
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [featuredImage, setFeaturedImage] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    refreshNews();
  }, []);

  const refreshNews = async () => {
    setLoading(true);
    const data = await getNews('All');
    setPosts(data);
    setLoading(false);
  };

  const handleEdit = (post: NewsPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setContent(post.content);
    setCategory(post.category);
    setTags(post.tags.join(', '));
    setStatus(post.status);
    setFeaturedImage(post.featuredImage || '');
    setView('editor');
  };

  const handleCreate = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('General');
    setTags('');
    setStatus('published');
    setFeaturedImage('');
    setView('editor');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) return alert("File too large (Max 5MB)");
      
      setImageLoading(true);
      try {
        const base64 = await compressAndConvertToBase64(file, 800, 0.8);
        setFeaturedImage(base64);
      } catch (err) {
        console.error(err);
        alert("Image processing failed");
      } finally {
        setImageLoading(false);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setLoading(true);

    const postData: Partial<NewsPost> = {
      title,
      content,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(t => t),
      status,
      featuredImage,
      authorId: userProfile.uid,
      authorName: userProfile.displayName,
      updatedAt: Date.now()
    };

    if (editingId) {
      await updateNews(editingId, postData);
    } else {
      await addNews({
        ...postData,
        timestamp: Date.now(),
        views: 0,
        likes: 0,
        isPinned: false
      });
    }

    setLoading(false);
    setView('list');
    refreshNews();
  };

  const handleDelete = async (id: string) => {
    if(confirm("Are you sure?")) {
        await deleteNews(id);
        refreshNews();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      {view === 'list' && (
        <div className="space-y-6">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">News & Blog Manager</h2>
              <button onClick={handleCreate} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 shadow flex items-center w-full md:w-auto justify-center">
                 <i className="fas fa-plus mr-2"></i> New Post
              </button>
           </div>

           <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                      <tr>
                         <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Post Info</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                         <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Stats</th>
                         <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                      {posts.map(post => (
                         <tr key={post.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                               <div className="flex items-center">
                                  <div className="h-10 w-10 rounded object-cover mr-3 bg-gray-100 flex-shrink-0 overflow-hidden">
                                     {post.featuredImage ? (
                                       <img src={post.featuredImage} className="w-full h-full object-cover" />
                                     ) : (
                                       <div className="w-full h-full flex items-center justify-center text-gray-300"><i className="fas fa-image"></i></div>
                                     )}
                                  </div>
                                  <div className="max-w-[150px] md:max-w-xs">
                                     <div className="text-sm font-bold text-gray-900 truncate" title={post.title}>{post.title}</div>
                                     <div className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleDateString()}</div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="bg-blue-50 text-blue-700 py-1 px-2 rounded text-xs font-bold">{post.category}</span>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {post.status}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500">
                               <span className="mr-3 whitespace-nowrap"><i className="far fa-eye"></i> {post.views || 0}</span>
                               <span className="whitespace-nowrap"><i className="far fa-heart"></i> {post.likes || 0}</span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                               <button onClick={() => togglePinNews(post.id, !post.isPinned)} className={`text-xs p-1 ${post.isPinned ? 'text-yellow-500' : 'text-gray-400'}`} title="Pin">
                                  <i className="fas fa-thumbtack"></i>
                               </button>
                               <button onClick={() => handleEdit(post)} className="text-blue-600 hover:text-blue-900"><i className="fas fa-edit"></i></button>
                               <button onClick={() => handleDelete(post.id)} className="text-red-600 hover:text-red-900"><i className="fas fa-trash"></i></button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {view === 'editor' && (
         <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Edit Post' : 'Create New Post'}</h3>
               <button onClick={() => setView('list')} className="text-gray-600 hover:text-red-600"><i className="fas fa-times"></i></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Title</label>
                        <input className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500" value={title} onChange={e => setTitle(e.target.value)} required />
                     </div>
                     
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Content (Markdown/HTML)</label>
                        <textarea className="w-full border p-2 rounded h-64 font-mono text-sm" value={content} onChange={e => setContent(e.target.value)} required placeholder="# Heading..."></textarea>
                     </div>
                  </div>

                  <div className="space-y-4">
                     {/* Image Uploader */}
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Featured Image</label>
                        <div className="border-2 border-dashed rounded-xl p-4 text-center relative group hover:bg-gray-50 transition bg-white">
                           {imageLoading ? (
                              <div className="h-32 flex items-center justify-center">
                                 <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
                              </div>
                           ) : featuredImage ? (
                              <div className="relative">
                                 <img src={featuredImage} className="w-full h-32 object-cover rounded-lg shadow-sm" alt="Featured" />
                                 <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition rounded-lg">
                                    <span className="text-white font-bold text-xs"><i className="fas fa-camera mr-1"></i> Change</span>
                                 </div>
                              </div>
                           ) : (
                              <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                                 <i className="fas fa-image text-3xl mb-2"></i>
                                 <span className="text-xs">Upload Image</span>
                              </div>
                           )}
                           
                           <input 
                             type="file" 
                             accept="image/png, image/jpeg, image/jpg"
                             className="absolute inset-0 opacity-0 cursor-pointer"
                             onChange={handleImageUpload}
                           />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 text-center">Recommended: 800x450px</p>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Publish Status</label>
                        <select className="w-full border p-2 rounded bg-white" value={status} onChange={e => setStatus(e.target.value as any)}>
                           <option value="published">Published</option>
                           <option value="draft">Draft</option>
                        </select>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Category</label>
                        <select className="w-full border p-2 rounded bg-white" value={category} onChange={e => setCategory(e.target.value as any)}>
                           {['General', 'Exam', 'Result', 'Scholarship', 'Admission', 'Blog', 'Announcement'].map(c => (
                              <option key={c} value={c}>{c}</option>
                           ))}
                        </select>
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tags</label>
                        <input className="w-full border p-2 rounded" value={tags} onChange={e => setTags(e.target.value)} placeholder="news, update, 2024" />
                     </div>
                  </div>
               </div>

               <div className="border-t pt-4 flex justify-end">
                  <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 w-full md:w-auto shadow-lg">
                     {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i> Saving...</> : 'Save Post'}
                  </button>
               </div>
            </form>
         </div>
      )}
    </div>
  );
};

export default AdminNews;